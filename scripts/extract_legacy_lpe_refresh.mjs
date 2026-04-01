import fs from 'node:fs/promises';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const DEFAULT_DB_PATH = String.raw`c:\Users\maril\Downloads\lpe_database.db`;
const DEFAULT_STUDENTS_FILE = 'data/legacy-lpe-refresh-students.json';
const DEFAULT_AVALIACOES_FILE = 'data/legacy-lpe-refresh-avaliacoes.json';
const DEFAULT_REPORT_FILE = 'legacy_lpe_refresh_report.json';

function normalizeString(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const cleaned = String(value).trim();
  return cleaned || null;
}

function normalizeEmail(value) {
  const cleaned = normalizeString(value);
  return cleaned ? cleaned.toLowerCase() : null;
}

function isValidEmail(value) {
  return Boolean(value && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value));
}

function normalizeBool(value) {
  if (typeof value === 'boolean') {
    return value;
  }

  return value === 1 || value === '1' || value === 'true' || value === 'TRUE';
}

function asDate(value) {
  const cleaned = normalizeString(value);
  return cleaned ? cleaned.slice(0, 10) : null;
}

function asTimestamp(value) {
  return normalizeString(value);
}

function asNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundTo(value, digits = 2) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return null;
  }

  return Number(value.toFixed(digits));
}

function parseObjectives(value) {
  const cleaned = normalizeString(value);
  if (!cleaned) {
    return [];
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {}

  return cleaned
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeProtocol(value) {
  const cleaned = normalizeString(value)?.toLowerCase();
  if (!cleaned) {
    return 'faulkner';
  }

  if (cleaned.includes('navy')) {
    return 'navy';
  }

  return 'faulkner';
}

function computeLeanMass(peso, massaGorda) {
  if (peso === null || massaGorda === null) {
    return null;
  }

  return roundTo(peso - massaGorda);
}

function computeSkinfoldSum(record) {
  const values = [
    asNumber(record.dobra_triceps),
    asNumber(record.dobra_subescapular),
    asNumber(record.dobra_suprailiaca),
    asNumber(record.dobra_abdominal),
  ].filter((value) => value !== null);

  if (!values.length) {
    return null;
  }

  return roundTo(values.reduce((total, value) => total + value, 0));
}

function parseArgs(argv) {
  const args = {
    db: DEFAULT_DB_PATH,
    studentsOut: DEFAULT_STUDENTS_FILE,
    avaliacoesOut: DEFAULT_AVALIACOES_FILE,
    reportOut: DEFAULT_REPORT_FILE,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];

    if (current === '--db' && next) {
      args.db = next;
      index += 1;
    } else if (current === '--students-out' && next) {
      args.studentsOut = next;
      index += 1;
    } else if (current === '--avaliacoes-out' && next) {
      args.avaliacoesOut = next;
      index += 1;
    } else if (current === '--report-out' && next) {
      args.reportOut = next;
      index += 1;
    }
  }

  return args;
}

async function ensureParent(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const db = new DatabaseSync(args.db, { readonly: true });

  const legacyStudents = db.prepare('SELECT * FROM alunos ORDER BY id').all();
  const groupedByEmail = new Map();
  const skippedMissingEmail = [];

  for (const student of legacyStudents) {
    const email = normalizeEmail(student.email);
    if (!isValidEmail(email)) {
      skippedMissingEmail.push({
        legacy_lpe_id: Number(student.id),
        name: normalizeString(student.nome) || `Aluno ${student.id}`,
        email: student.email ?? null,
      });
      continue;
    }

    if (!groupedByEmail.has(email)) {
      groupedByEmail.set(email, []);
    }

    groupedByEmail.get(email).push(student);
  }

  const duplicateEmailGroups = [];
  const usableStudents = [];

  for (const [email, items] of groupedByEmail.entries()) {
    if (items.length > 1) {
      duplicateEmailGroups.push({
        email,
        legacy_lpe_ids: items.map((item) => Number(item.id)),
        names: items.map((item) => normalizeString(item.nome) || `Aluno ${item.id}`),
      });
      continue;
    }

    usableStudents.push(items[0]);
  }

  const studentsPayload = usableStudents.map((student) => ({
    legacy_lpe_id: Number(student.id),
    name: normalizeString(student.nome) || `Aluno legado ${student.id}`,
    email: normalizeEmail(student.email),
    phone: normalizeString(student.telefone),
    cpf: normalizeString(student.cpf),
    birth_date: asDate(student.data_nascimento),
    gender: normalizeString(student.genero),
    profession: normalizeString(student.profissao),
    zip_code: normalizeString(student.cep),
    address: normalizeString(student.endereco),
    city: normalizeString(student.cidade),
    emergency_contact: normalizeString(student.contato_emergencia),
    emergency_phone: normalizeString(student.telefone_emergencia),
    notes: normalizeString(student.observacoes),
    status: normalizeBool(student.ativo) ? 'ativo' : 'inativo',
    group: normalizeString(student.grupo),
    modality: normalizeString(student.modalidade),
    objectives: parseObjectives(student.objetivos),
    desired_weight: asNumber(student.peso_desejado),
    created_at: asTimestamp(student.data_cadastro),
    updated_at: asTimestamp(student.data_ultima_atualizacao) || asTimestamp(student.data_cadastro),
  }));

  const usableStudentIds = new Set(studentsPayload.map((student) => student.legacy_lpe_id));
  const studentsById = new Map(studentsPayload.map((student) => [student.legacy_lpe_id, student]));
  const legacyAvaliacoes = db
    .prepare('SELECT * FROM avaliacoes_fisicas ORDER BY id')
    .all();

  const skippedAvaliacoesWithoutStudent = [];
  const avaliacoesPayload = [];

  for (const avaliacao of legacyAvaliacoes) {
    const legacyStudentId = Number(avaliacao.aluno_id);
    if (!usableStudentIds.has(legacyStudentId)) {
      skippedAvaliacoesWithoutStudent.push({
        legacy_lpe_id: Number(avaliacao.id),
        legacy_lpe_student_id: legacyStudentId,
      });
      continue;
    }

    const student = studentsById.get(legacyStudentId);
    const peso = asNumber(avaliacao.peso);
    const altura = asNumber(avaliacao.altura);
    const percentualGordura = asNumber(avaliacao.percentual_gordura);
    const massaGorda = asNumber(avaliacao.massa_gorda);
    const massaMagra = computeLeanMass(peso, massaGorda);
    const tricipital = asNumber(avaliacao.dobra_triceps);
    const subescapular = asNumber(avaliacao.dobra_subescapular);
    const supraIliaca = asNumber(avaliacao.dobra_suprailiaca);
    const abdominal = asNumber(avaliacao.dobra_abdominal);
    const somaDobras = computeSkinfoldSum(avaliacao);

    avaliacoesPayload.push({
      legacy_lpe_id: Number(avaliacao.id),
      legacy_lpe_student_id: legacyStudentId,
      student_email: student?.email ?? null,
      student_name: student?.name ?? null,
      data: asDate(avaliacao.data_avaliacao),
      peso,
      altura,
      pescoco: asNumber(avaliacao.circunferencia_pescoco),
      ombro: asNumber(avaliacao.circunferencia_ombro),
      torax: asNumber(avaliacao.circunferencia_peito),
      cintura: asNumber(avaliacao.circunferencia_cintura),
      abdome: asNumber(avaliacao.circunferencia_abdomen),
      quadril: asNumber(avaliacao.circunferencia_quadril),
      braco_esquerdo: asNumber(avaliacao.circunferencia_braco_esq),
      braco_direito: asNumber(avaliacao.circunferencia_braco_dir),
      coxa_esquerda: asNumber(avaliacao.circunferencia_coxa_esq),
      coxa_direita: asNumber(avaliacao.circunferencia_coxa_dir),
      panturrilha_esquerda: asNumber(avaliacao.circunferencia_panturrilha_esq),
      panturrilha_direita: asNumber(avaliacao.circunferencia_panturrilha_dir),
      tricipital,
      subescapular,
      supra_iliaca: supraIliaca,
      abdominal,
      imc: asNumber(avaliacao.imc),
      percentual_gordura: percentualGordura,
      massa_gorda: massaGorda,
      massa_magra: massaMagra,
      soma_dobras: somaDobras,
      rcq: asNumber(avaliacao.rcq),
      protocolo: normalizeProtocol(avaliacao.protocolo),
      observacoes: normalizeString(avaliacao.observacoes),
      created_at: asTimestamp(avaliacao.data_criacao),
      updated_at: asTimestamp(avaliacao.data_criacao),
    });
  }

  const report = {
    extracted_at: new Date().toISOString(),
    db_path: args.db,
    legacy_students_total: legacyStudents.length,
    students_selected_for_import: studentsPayload.length,
    students_skipped_missing_or_invalid_email: skippedMissingEmail,
    students_skipped_duplicate_email_groups: duplicateEmailGroups,
    legacy_avaliacoes_total: legacyAvaliacoes.length,
    avaliacoes_selected_for_import: avaliacoesPayload.length,
    avaliacoes_skipped_without_student_email: skippedAvaliacoesWithoutStudent,
  };

  await ensureParent(args.studentsOut);
  await ensureParent(args.avaliacoesOut);
  await ensureParent(args.reportOut);

  await fs.writeFile(args.studentsOut, JSON.stringify(studentsPayload, null, 2), 'utf8');
  await fs.writeFile(args.avaliacoesOut, JSON.stringify(avaliacoesPayload, null, 2), 'utf8');
  await fs.writeFile(args.reportOut, JSON.stringify(report, null, 2), 'utf8');

  db.close();

  console.log(
    JSON.stringify(
      {
        students_selected_for_import: studentsPayload.length,
        avaliacoes_selected_for_import: avaliacoesPayload.length,
        skipped_students_missing_email: skippedMissingEmail.length,
        skipped_duplicate_email_groups: duplicateEmailGroups.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
