import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_DB_PATH = String.raw`c:\Users\maril\Downloads\lpe_database.db`;
const DEFAULT_PASSWORD = '123456';

function loadEnvFile(path) {
  const env = {};
  if (!fs.existsSync(path)) {
    return env;
  }

  for (const rawLine of fs.readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) {
      continue;
    }

    const idx = line.indexOf('=');
    env[line.slice(0, idx).trim()] = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
  }

  return env;
}

function envValue(name, loaded) {
  return process.env[name] || loaded[name] || null;
}

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

function parseBloodPressure(value) {
  const cleaned = normalizeString(value);
  if (!cleaned) {
    return {
      systolic: null,
      diastolic: null,
    };
  }

  const match = cleaned.match(/(\d+(?:[.,]\d+)?)\s*\/\s*(\d+(?:[.,]\d+)?)/);
  if (!match) {
    return {
      systolic: null,
      diastolic: null,
    };
  }

  return {
    systolic: asNumber(match[1]?.replace(',', '.')),
    diastolic: asNumber(match[2]?.replace(',', '.')),
  };
}

function toDurationMonths(days) {
  const numericDays = asNumber(days);
  if (!numericDays || numericDays <= 0) {
    return 1;
  }

  return Math.max(1, Math.round(numericDays / 30));
}

function mapBillStatus(value) {
  const cleaned = normalizeString(value)?.toLowerCase();
  if (cleaned === 'pago') {
    return 'paid';
  }

  if (cleaned === 'vencido') {
    return 'late';
  }

  return 'pending';
}

function mapFinanceStatus(value) {
  const cleaned = normalizeString(value)?.toLowerCase();
  if (cleaned === 'pago') {
    return 'pago';
  }

  if (cleaned === 'vencido') {
    return 'vencido';
  }

  return 'pendente';
}

function normalizePlanKey(name, price) {
  const cleanedName = normalizeString(name) || '';
  const collapsed = cleanedName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/(\d)\s*x/gi, '$1x')
    .toLowerCase();
  const tokens = collapsed
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .sort();
  return `${tokens.join('|')}::${roundTo(asNumber(price) || 0)}`;
}

function parseArgs(argv) {
  const args = {
    db: DEFAULT_DB_PATH,
    execute: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    const next = argv[index + 1];

    if (current === '--db' && next) {
      args.db = next;
      index += 1;
    } else if (current === '--execute') {
      args.execute = true;
    }
  }

  return args;
}

function preferLegacyValue(legacyValue, currentValue) {
  return legacyValue === null || legacyValue === undefined ? currentValue ?? null : legacyValue;
}

function extractLegacyData(db) {
  const legacyPlans = db.prepare('SELECT * FROM planos ORDER BY id').all();
  const legacyStudents = db.prepare('SELECT * FROM alunos ORDER BY id').all();
  const legacyAvaliacoes = db.prepare('SELECT * FROM avaliacoes_fisicas ORDER BY id').all();
  const legacyAssinaturas = db.prepare('SELECT * FROM assinaturas ORDER BY id').all();
  const legacyPagamentos = db.prepare('SELECT * FROM pagamentos ORDER BY id').all();
  const legacyDespesas = db.prepare('SELECT * FROM despesas ORDER BY id').all();

  const plans = legacyPlans.map((plan) => ({
    legacy_lpe_id: Number(plan.id),
    name: normalizeString(plan.nome) || `Plano legado ${plan.id}`,
    description: normalizeString(plan.descricao),
    price: asNumber(plan.valor) || 0,
    duration_months: toDurationMonths(plan.duracao_dias),
    active: normalizeBool(plan.ativo),
    created_at: asTimestamp(plan.data_criacao),
    updated_at: asTimestamp(plan.data_criacao),
  }));

  const students = legacyStudents.map((student) => {
    const normalizedEmail = normalizeEmail(student.email);
    const validEmail = isValidEmail(normalizedEmail) ? normalizedEmail : null;

    return {
      legacy_lpe_id: Number(student.id),
      name: normalizeString(student.nome) || `Aluno legado ${student.id}`,
      email: validEmail,
      email_issue: validEmail ? null : 'missing_or_invalid_email',
      phone: normalizeString(student.telefone),
      cellphone: normalizeString(student.telefone),
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
      plan_legacy_lpe_id: asNumber(student.plano_id),
    };
  });

  const studentByLegacyId = new Map(students.map((student) => [student.legacy_lpe_id, student]));

  const avaliacoes = legacyAvaliacoes.map((avaliacao) => {
    const peso = asNumber(avaliacao.peso);
    const massaGorda = asNumber(avaliacao.massa_gorda);
    const bloodPressure = parseBloodPressure(avaliacao.pressao_arterial);

    return {
      legacy_lpe_id: Number(avaliacao.id),
      legacy_lpe_student_id: Number(avaliacao.aluno_id),
      student_email: studentByLegacyId.get(Number(avaliacao.aluno_id))?.email || null,
      student_name: studentByLegacyId.get(Number(avaliacao.aluno_id))?.name || null,
      data: asDate(avaliacao.data_avaliacao),
      peso,
      altura: asNumber(avaliacao.altura),
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
      tricipital: asNumber(avaliacao.dobra_triceps),
      subescapular: asNumber(avaliacao.dobra_subescapular),
      supra_iliaca: asNumber(avaliacao.dobra_suprailiaca),
      abdominal: asNumber(avaliacao.dobra_abdominal),
      imc: asNumber(avaliacao.imc),
      percentual_gordura: asNumber(avaliacao.percentual_gordura),
      massa_gorda: massaGorda,
      massa_magra: computeLeanMass(peso, massaGorda),
      soma_dobras: computeSkinfoldSum(avaliacao),
      rcq: asNumber(avaliacao.rcq),
      protocolo: normalizeProtocol(avaliacao.protocolo),
      observacoes: normalizeString(avaliacao.observacoes),
      pressao_arterial_sistolica: bloodPressure.systolic,
      pressao_arterial_diastolica: bloodPressure.diastolic,
      frequencia_cardiaca_repouso: asNumber(avaliacao.frequencia_cardiaca),
      created_at: asTimestamp(avaliacao.data_criacao),
      updated_at: asTimestamp(avaliacao.data_criacao),
    };
  });

  const assinaturas = legacyAssinaturas.map((assinatura) => ({
    legacy_lpe_id: Number(assinatura.id),
    legacy_lpe_student_id: Number(assinatura.aluno_id),
    legacy_lpe_plan_id: asNumber(assinatura.plano_id),
    plan_name: normalizeString(assinatura.plano_nome),
    plan_price: asNumber(assinatura.plano_valor),
    created_at: asTimestamp(assinatura.data_criacao),
    updated_at: asTimestamp(assinatura.data_criacao),
  }));

  const pagamentos = legacyPagamentos.map((pagamento) => ({
    legacy_lpe_id: Number(pagamento.id),
    legacy_lpe_student_id: Number(pagamento.aluno_id),
    amount: asNumber(pagamento.valor) || 0,
    paid_at: asDate(pagamento.data_pagamento),
    due_date: asDate(pagamento.data_vencimento),
    payment_method: normalizeString(pagamento.metodo_pagamento),
    status: mapBillStatus(pagamento.status),
    finance_status: mapFinanceStatus(pagamento.status),
    notes: normalizeString(pagamento.observacoes),
    code: normalizeString(pagamento.numero_boleto) || `LPE-PAG-${pagamento.id}`,
    created_at: asTimestamp(pagamento.data_criacao),
    updated_at: asTimestamp(pagamento.data_criacao),
  }));

  const despesas = legacyDespesas.map((despesa) => ({
    legacy_lpe_id: Number(despesa.id),
    amount: asNumber(despesa.valor) || 0,
    expense_date: asDate(despesa.data_despesa),
    category: normalizeString(despesa.categoria),
    description: normalizeString(despesa.descricao),
    payment_method: normalizeString(despesa.metodo_pagamento),
    record_number: normalizeString(despesa.numero_registro),
    created_at: asTimestamp(despesa.data_criacao),
    updated_at: asTimestamp(despesa.data_criacao),
  }));

  return {
    plans,
    students,
    avaliacoes,
    assinaturas,
    pagamentos,
    despesas,
  };
}

async function listAuthUsersByEmail(admin) {
  const emailMap = new Map();
  let page = 1;
  const perPage = 500;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      throw error;
    }

    const users = data.users || [];
    for (const user of users) {
      const email = normalizeEmail(user.email || '');
      if (email) {
        emailMap.set(email, user.id);
      }
    }

    if (users.length < perPage) {
      break;
    }

    page += 1;
  }

  return emailMap;
}

function buildAvaliacaoPayload(avaliacao, studentId) {
  return {
    legacy_lpe_id: avaliacao.legacy_lpe_id,
    student_id: studentId,
    data: avaliacao.data,
    peso: avaliacao.peso,
    altura: avaliacao.altura,
    ombro: avaliacao.ombro,
    torax: avaliacao.torax,
    cintura: avaliacao.cintura,
    abdome: avaliacao.abdome,
    quadril: avaliacao.quadril,
    braco_direito: avaliacao.braco_direito,
    braco_esquerdo: avaliacao.braco_esquerdo,
    coxa_direita: avaliacao.coxa_direita,
    coxa_esquerda: avaliacao.coxa_esquerda,
    panturrilha_direita: avaliacao.panturrilha_direita,
    panturrilha_esquerda: avaliacao.panturrilha_esquerda,
    tricipital: avaliacao.tricipital,
    subescapular: avaliacao.subescapular,
    supra_iliaca: avaliacao.supra_iliaca,
    abdominal: avaliacao.abdominal,
    pressao_arterial_sistolica: avaliacao.pressao_arterial_sistolica,
    pressao_arterial_diastolica: avaliacao.pressao_arterial_diastolica,
    frequencia_cardiaca_repouso: avaliacao.frequencia_cardiaca_repouso,
    imc: avaliacao.imc,
    percentual_gordura: avaliacao.percentual_gordura,
    gordura_corporal: avaliacao.percentual_gordura,
    massa_gorda: avaliacao.massa_gorda,
    massa_magra: avaliacao.massa_magra,
    soma_dobras: avaliacao.soma_dobras,
    protocolo: avaliacao.protocolo,
    observacoes: avaliacao.observacoes || null,
    medidas: {
      pescoco: avaliacao.pescoco,
      ombro: avaliacao.ombro,
      torax: avaliacao.torax,
      cintura: avaliacao.cintura,
      abdome: avaliacao.abdome,
      quadril: avaliacao.quadril,
      braco_direito: avaliacao.braco_direito,
      braco_esquerdo: avaliacao.braco_esquerdo,
      coxa_direita: avaliacao.coxa_direita,
      coxa_esquerda: avaliacao.coxa_esquerda,
      panturrilha_direita: avaliacao.panturrilha_direita,
      panturrilha_esquerda: avaliacao.panturrilha_esquerda,
      rcq: avaliacao.rcq,
    },
    dobras: {
      tricipital: avaliacao.tricipital,
      subescapular: avaliacao.subescapular,
      supra_iliaca: avaliacao.supra_iliaca,
      abdominal: avaliacao.abdominal,
      soma_dobras: avaliacao.soma_dobras,
    },
    created_at: avaliacao.created_at || null,
    updated_at: avaliacao.updated_at || avaliacao.created_at || null,
  };
}

function buildFinanceDescricaoFromPagamento(pagamento, studentName) {
  const descriptionBase = `Mensalidade legado - ${studentName || 'Aluno sem cadastro'}${
    pagamento.code ? ` (Boleto: ${pagamento.code})` : ''
  }`;
  return pagamento.notes ? `${descriptionBase} - ${pagamento.notes}` : descriptionBase;
}

function buildFinanceDescricaoFromDespesa(despesa) {
  const parts = [despesa.category, despesa.description].filter(Boolean);
  const base = parts.length ? parts.join(' - ') : 'Despesa legado';
  return despesa.record_number ? `${base} (${despesa.record_number})` : base;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const env = loadEnvFile('.env.local');
  const supabaseUrl = envValue('NEXT_PUBLIC_SUPABASE_URL', env) || envValue('SUPABASE_URL', env);
  const serviceRoleKey = envValue('SUPABASE_SERVICE_ROLE_KEY', env);

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorios.');
  }

  const db = new DatabaseSync(args.db, { readonly: true });
  const legacy = extractLegacyData(db);
  db.close();

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const [
    existingStudentsRes,
    existingAvaliacoesRes,
    existingPlansRes,
    existingAssinaturasRes,
    existingBillsRes,
    existingFinanceiroRes,
    authUsersByEmail,
  ] = await Promise.all([
    admin.from('students').select('id, legacy_lpe_id, email, linked_auth_user_id, created_by_auth_user_id, phone, cellphone, cpf, birth_date, gender, profession, zip_code, address, city, emergency_contact, emergency_phone, plan, plan_name, plan_id, join_date, start_date, status, notes, objectives, desired_weight, "group", modality'),
    admin.from('avaliacoes').select('id, legacy_lpe_id'),
    admin.from('plans').select('id, legacy_lpe_id, name, price, active'),
    admin.from('assinaturas').select('id, legacy_lpe_id'),
    admin.from('bills').select('id, legacy_lpe_id'),
    admin.from('financeiro').select('id, legacy_lpe_source, legacy_lpe_id'),
    listAuthUsersByEmail(admin),
  ]);

  for (const result of [
    existingStudentsRes,
    existingAvaliacoesRes,
    existingPlansRes,
    existingAssinaturasRes,
    existingBillsRes,
    existingFinanceiroRes,
  ]) {
    if (result.error) {
      throw result.error;
    }
  }

  const existingStudents = existingStudentsRes.data || [];
  const existingAvaliacoes = existingAvaliacoesRes.data || [];
  const existingPlans = existingPlansRes.data || [];
  const existingAssinaturas = existingAssinaturasRes.data || [];
  const existingBills = existingBillsRes.data || [];
  const existingFinanceiro = existingFinanceiroRes.data || [];

  const profileIds = Array.from(new Set(Array.from(authUsersByEmail.values())));
  const profileRoleMap = new Map();
  if (profileIds.length > 0) {
    const { data: profiles, error: profilesError } = await admin
      .from('user_profiles')
      .select('id, role')
      .in('id', profileIds);

    if (profilesError) {
      throw profilesError;
    }

    for (const profile of profiles || []) {
      profileRoleMap.set(profile.id, profile.role);
    }
  }

  const result = {
    mode: args.execute ? 'execute' : 'dry-run',
    default_password: DEFAULT_PASSWORD,
    source_totals: {
      plans: legacy.plans.length,
      students: legacy.students.length,
      students_with_valid_email: legacy.students.filter((student) => student.email).length,
      students_without_valid_email: legacy.students.filter((student) => !student.email).length,
      avaliacoes: legacy.avaliacoes.length,
      assinaturas: legacy.assinaturas.length,
      pagamentos: legacy.pagamentos.length,
      despesas: legacy.despesas.length,
    },
    target_before: {
      students: existingStudents.length,
      avaliacoes: existingAvaliacoes.length,
      plans: existingPlans.length,
      assinaturas: existingAssinaturas.length,
      bills: existingBills.length,
      financeiro: existingFinanceiro.length,
    },
    plans: {
      adopted_existing: 0,
      created: 0,
      updated: 0,
    },
    students: {
      created_auth_users: 0,
      reused_auth_users: 0,
      created: 0,
      updated: 0,
      created_without_auth: 0,
      updated_without_auth: 0,
      role_conflicts: [],
    },
    avaliacoes: {
      created: 0,
      updated: 0,
      skipped_missing_student: [],
    },
    assinaturas: {
      created: 0,
      updated: 0,
      skipped_missing_student: [],
    },
    bills: {
      created: 0,
      updated: 0,
      skipped_missing_student: [],
    },
    financeiro: {
      created: 0,
      updated: 0,
    },
  };

  const studentByLegacyId = new Map();
  const studentByEmail = new Map();
  for (const student of existingStudents) {
    if (typeof student.legacy_lpe_id === 'number') {
      studentByLegacyId.set(student.legacy_lpe_id, student);
    }
    const email = normalizeEmail(student.email || '');
    if (email) {
      studentByEmail.set(email, student);
    }
  }

  const avaliacaoByLegacyId = new Map();
  for (const avaliacao of existingAvaliacoes) {
    if (typeof avaliacao.legacy_lpe_id === 'number') {
      avaliacaoByLegacyId.set(avaliacao.legacy_lpe_id, avaliacao);
    }
  }

  const assinaturaByLegacyId = new Map();
  for (const assinatura of existingAssinaturas) {
    if (typeof assinatura.legacy_lpe_id === 'number') {
      assinaturaByLegacyId.set(assinatura.legacy_lpe_id, assinatura);
    }
  }

  const billByLegacyId = new Map();
  for (const bill of existingBills) {
    if (typeof bill.legacy_lpe_id === 'number') {
      billByLegacyId.set(bill.legacy_lpe_id, bill);
    }
  }

  const financeiroByLegacyKey = new Map();
  for (const item of existingFinanceiro) {
    if (item.legacy_lpe_source && typeof item.legacy_lpe_id === 'number') {
      financeiroByLegacyKey.set(`${item.legacy_lpe_source}:${item.legacy_lpe_id}`, item);
    }
  }

  const planByLegacyId = new Map();
  const planCandidatesByKey = new Map();
  for (const plan of existingPlans) {
    if (typeof plan.legacy_lpe_id === 'number') {
      planByLegacyId.set(plan.legacy_lpe_id, plan);
    }
    const key = normalizePlanKey(plan.name, plan.price);
    if (!planCandidatesByKey.has(key)) {
      planCandidatesByKey.set(key, []);
    }
    planCandidatesByKey.get(key).push(plan);
  }

  const existingPlanIds = new Set(existingPlans.map((plan) => plan.id));
  const usedCurrentPlanIds = new Set();
  const resolvedPlanIdByLegacyId = new Map();

  for (const legacyPlan of legacy.plans) {
    let currentPlan = planByLegacyId.get(legacyPlan.legacy_lpe_id) || null;

    if (!currentPlan) {
      const key = normalizePlanKey(legacyPlan.name, legacyPlan.price);
      const candidates = planCandidatesByKey.get(key) || [];
      currentPlan =
        candidates.find((candidate) => !usedCurrentPlanIds.has(candidate.id) && candidate.active === legacyPlan.active) ||
        candidates.find((candidate) => !usedCurrentPlanIds.has(candidate.id)) ||
        null;
    }

    const adoptedExisting = Boolean(
      currentPlan?.id &&
        (currentPlan.legacy_lpe_id === null || currentPlan.legacy_lpe_id === undefined),
    );

    const payload = {
      legacy_lpe_id: legacyPlan.legacy_lpe_id,
      name: legacyPlan.name,
      price: legacyPlan.price,
      duration_months: legacyPlan.duration_months,
      description: legacyPlan.description,
      active: legacyPlan.active,
      created_at: legacyPlan.created_at || null,
      updated_at: legacyPlan.updated_at || legacyPlan.created_at || null,
    };

    let resolvedPlanId = currentPlan?.id || `dry-run-plan-${legacyPlan.legacy_lpe_id}`;

    if (args.execute) {
      if (currentPlan?.id) {
        const { data, error } = await admin
          .from('plans')
          .update(payload)
          .eq('id', currentPlan.id)
          .select('id, legacy_lpe_id, name, price, active')
          .single();

        if (error || !data) {
          throw error || new Error(`Nao foi possivel atualizar o plano ${legacyPlan.name}.`);
        }

        currentPlan = data;
      } else {
        const { data, error } = await admin
          .from('plans')
          .insert([payload])
          .select('id, legacy_lpe_id, name, price, active')
          .single();

        if (error || !data) {
          throw error || new Error(`Nao foi possivel criar o plano ${legacyPlan.name}.`);
        }

        currentPlan = data;
      }

      resolvedPlanId = currentPlan.id;
    }

    if (currentPlan?.id) {
      usedCurrentPlanIds.add(currentPlan.id);
      planByLegacyId.set(legacyPlan.legacy_lpe_id, currentPlan);
    }

    resolvedPlanIdByLegacyId.set(legacyPlan.legacy_lpe_id, resolvedPlanId);

    if (adoptedExisting) {
      result.plans.adopted_existing += 1;
    }

    if (currentPlan?.id && existingPlanIds.has(currentPlan.id)) {
      result.plans.updated += 1;
    } else {
      result.plans.created += 1;
    }
  }

  const legacyPlanById = new Map(legacy.plans.map((plan) => [plan.legacy_lpe_id, plan]));
  const legacyStudentById = new Map(legacy.students.map((student) => [student.legacy_lpe_id, student]));
  const resolvedStudentIdByLegacyId = new Map();

  for (const legacyStudent of legacy.students) {
    const existingStudent =
      studentByLegacyId.get(legacyStudent.legacy_lpe_id) ||
      (legacyStudent.email ? studentByEmail.get(legacyStudent.email) : null) ||
      null;

    let authUserId =
      existingStudent?.linked_auth_user_id ||
      (legacyStudent.email ? authUsersByEmail.get(legacyStudent.email) : null) ||
      null;
    let hasRoleConflict = false;

    if (authUserId) {
      const existingRole = profileRoleMap.get(authUserId);
      if (existingRole && existingRole !== 'aluno') {
        hasRoleConflict = true;
        result.students.role_conflicts.push({
          legacy_lpe_id: legacyStudent.legacy_lpe_id,
          email: legacyStudent.email,
          role: existingRole,
        });
        authUserId = null;
      }

      if (legacyStudent.email && (!existingRole || existingRole === 'aluno')) {
        result.students.reused_auth_users += 1;
      }
    } else if (legacyStudent.email) {
      if (args.execute) {
        const { data: createdUserResult, error: createUserError } = await admin.auth.admin.createUser({
          email: legacyStudent.email,
          password: DEFAULT_PASSWORD,
          email_confirm: true,
          user_metadata: {
            name: legacyStudent.name,
            display_name: legacyStudent.name,
          },
        });

        if (createUserError || !createdUserResult.user?.id) {
          throw createUserError || new Error(`Nao foi possivel criar o auth user de ${legacyStudent.email}.`);
        }

        authUserId = createdUserResult.user.id;
        authUsersByEmail.set(legacyStudent.email, authUserId);
        profileRoleMap.set(authUserId, 'aluno');
      } else {
        authUserId = `dry-run-auth-${legacyStudent.legacy_lpe_id}`;
      }

      result.students.created_auth_users += 1;
    }

    const currentStudent = existingStudent || {};
    const matchedPlanId = legacyStudent.plan_legacy_lpe_id
      ? resolvedPlanIdByLegacyId.get(legacyStudent.plan_legacy_lpe_id)
      : currentStudent.plan_id || null;
    const matchedPlan = legacyStudent.plan_legacy_lpe_id
      ? legacyPlanById.get(legacyStudent.plan_legacy_lpe_id) || null
      : null;

    const effectiveLinkedAuthUserId = hasRoleConflict
      ? null
      : authUserId || currentStudent.linked_auth_user_id || null;

    const studentPayload = {
      legacy_lpe_id: legacyStudent.legacy_lpe_id,
      linked_auth_user_id: effectiveLinkedAuthUserId,
      created_by_auth_user_id: currentStudent.created_by_auth_user_id || null,
      name: legacyStudent.name,
      email: preferLegacyValue(legacyStudent.email, currentStudent.email),
      phone: preferLegacyValue(legacyStudent.phone, currentStudent.phone),
      cellphone: preferLegacyValue(legacyStudent.cellphone, currentStudent.cellphone),
      cpf: preferLegacyValue(legacyStudent.cpf, currentStudent.cpf),
      birth_date: preferLegacyValue(legacyStudent.birth_date, currentStudent.birth_date),
      gender: preferLegacyValue(legacyStudent.gender, currentStudent.gender),
      profession: preferLegacyValue(legacyStudent.profession, currentStudent.profession),
      zip_code: preferLegacyValue(legacyStudent.zip_code, currentStudent.zip_code),
      address: preferLegacyValue(legacyStudent.address, currentStudent.address),
      city: preferLegacyValue(legacyStudent.city, currentStudent.city),
      emergency_contact: preferLegacyValue(legacyStudent.emergency_contact, currentStudent.emergency_contact),
      emergency_phone: preferLegacyValue(legacyStudent.emergency_phone, currentStudent.emergency_phone),
      plan: matchedPlan?.name || preferLegacyValue(legacyStudent.modality, currentStudent.plan),
      plan_name: matchedPlan?.name || currentStudent.plan_name || null,
      plan_id: matchedPlanId || null,
      join_date: preferLegacyValue(legacyStudent.created_at?.slice(0, 10) || null, currentStudent.join_date),
      start_date: preferLegacyValue(legacyStudent.created_at?.slice(0, 10) || null, currentStudent.start_date),
      status: preferLegacyValue(legacyStudent.status, currentStudent.status || 'ativo'),
      notes: preferLegacyValue(legacyStudent.notes, currentStudent.notes),
      objectives: legacyStudent.objectives,
      desired_weight: preferLegacyValue(legacyStudent.desired_weight, currentStudent.desired_weight),
      group: preferLegacyValue(legacyStudent.group, currentStudent.group),
      modality: preferLegacyValue(legacyStudent.modality, currentStudent.modality),
      created_at: preferLegacyValue(legacyStudent.created_at, currentStudent.created_at),
      updated_at: legacyStudent.updated_at || legacyStudent.created_at || currentStudent.updated_at || null,
    };

    if (args.execute && effectiveLinkedAuthUserId && legacyStudent.email && !hasRoleConflict) {
      const { error: profileUpsertError } = await admin.from('user_profiles').upsert({
        id: effectiveLinkedAuthUserId,
        role: 'aluno',
        display_name: legacyStudent.name,
        must_change_password: true,
        is_super_admin: false,
      });

      if (profileUpsertError) {
        throw profileUpsertError;
      }
    }

    let resolvedStudent =
      existingStudent || {
        id: `dry-run-student-${legacyStudent.legacy_lpe_id}`,
        legacy_lpe_id: legacyStudent.legacy_lpe_id,
        email: studentPayload.email,
        linked_auth_user_id: effectiveLinkedAuthUserId,
      };

    if (args.execute) {
      if (existingStudent?.id) {
        const { data, error } = await admin
          .from('students')
          .update(studentPayload)
          .eq('id', existingStudent.id)
          .select('id, legacy_lpe_id, email, linked_auth_user_id')
          .single();

        if (error || !data) {
          throw error || new Error(`Nao foi possivel atualizar o aluno ${legacyStudent.name}.`);
        }

        resolvedStudent = data;
      } else {
        const { data, error } = await admin
          .from('students')
          .insert([studentPayload])
          .select('id, legacy_lpe_id, email, linked_auth_user_id')
          .single();

        if (error || !data) {
          throw error || new Error(`Nao foi possivel criar o aluno ${legacyStudent.name}.`);
        }

        resolvedStudent = data;
      }
    }

    studentByLegacyId.set(legacyStudent.legacy_lpe_id, resolvedStudent);
    if (studentPayload.email) {
      studentByEmail.set(studentPayload.email, resolvedStudent);
    }
    resolvedStudentIdByLegacyId.set(legacyStudent.legacy_lpe_id, resolvedStudent.id);

    if (existingStudent?.id) {
      result.students.updated += 1;
      if (!effectiveLinkedAuthUserId) {
        result.students.updated_without_auth += 1;
      }
    } else {
      result.students.created += 1;
      if (!effectiveLinkedAuthUserId) {
        result.students.created_without_auth += 1;
      }
    }
  }

  for (const legacyAvaliacao of legacy.avaliacoes) {
    const studentId = resolvedStudentIdByLegacyId.get(legacyAvaliacao.legacy_lpe_student_id) || null;
    if (!studentId) {
      result.avaliacoes.skipped_missing_student.push({
        legacy_lpe_id: legacyAvaliacao.legacy_lpe_id,
        legacy_lpe_student_id: legacyAvaliacao.legacy_lpe_student_id,
      });
      continue;
    }

    const existingAvaliacao = avaliacaoByLegacyId.get(legacyAvaliacao.legacy_lpe_id) || null;
    const payload = buildAvaliacaoPayload(legacyAvaliacao, studentId);

    if (args.execute) {
      if (existingAvaliacao?.id) {
        const { error } = await admin.from('avaliacoes').update(payload).eq('id', existingAvaliacao.id);
        if (error) {
          throw error;
        }
      } else {
        const { error } = await admin.from('avaliacoes').insert([payload]);
        if (error) {
          throw error;
        }
      }
    }

    if (existingAvaliacao?.id) {
      result.avaliacoes.updated += 1;
    } else {
      result.avaliacoes.created += 1;
    }
  }

  for (const legacyAssinatura of legacy.assinaturas) {
    const studentId = resolvedStudentIdByLegacyId.get(legacyAssinatura.legacy_lpe_student_id) || null;
    if (!studentId) {
      result.assinaturas.skipped_missing_student.push({
        legacy_lpe_id: legacyAssinatura.legacy_lpe_id,
        legacy_lpe_student_id: legacyAssinatura.legacy_lpe_student_id,
      });
      continue;
    }

    const existingAssinatura = assinaturaByLegacyId.get(legacyAssinatura.legacy_lpe_id) || null;
    const payload = {
      legacy_lpe_id: legacyAssinatura.legacy_lpe_id,
      student_id: studentId,
      plan_id: legacyAssinatura.legacy_lpe_plan_id
        ? resolvedPlanIdByLegacyId.get(legacyAssinatura.legacy_lpe_plan_id) || null
        : null,
      plan_name: legacyAssinatura.plan_name,
      plan_price: legacyAssinatura.plan_price,
      created_at: legacyAssinatura.created_at || null,
      updated_at: legacyAssinatura.updated_at || legacyAssinatura.created_at || null,
    };

    if (args.execute) {
      if (existingAssinatura?.id) {
        const { error } = await admin.from('assinaturas').update(payload).eq('id', existingAssinatura.id);
        if (error) {
          throw error;
        }
      } else {
        const { error } = await admin.from('assinaturas').insert([payload]);
        if (error) {
          throw error;
        }
      }
    }

    if (existingAssinatura?.id) {
      result.assinaturas.updated += 1;
    } else {
      result.assinaturas.created += 1;
    }
  }

  for (const legacyPagamento of legacy.pagamentos) {
    const studentId = resolvedStudentIdByLegacyId.get(legacyPagamento.legacy_lpe_student_id) || null;
    if (!studentId) {
      result.bills.skipped_missing_student.push({
        legacy_lpe_id: legacyPagamento.legacy_lpe_id,
        legacy_lpe_student_id: legacyPagamento.legacy_lpe_student_id,
      });
      continue;
    }

    const existingBill = billByLegacyId.get(legacyPagamento.legacy_lpe_id) || null;
    const billPayload = {
      legacy_lpe_id: legacyPagamento.legacy_lpe_id,
      student_id: studentId,
      amount: legacyPagamento.amount,
      due_date: legacyPagamento.due_date || legacyPagamento.paid_at || null,
      status: legacyPagamento.status,
      code: legacyPagamento.code,
      created_at: legacyPagamento.created_at || null,
      updated_at: legacyPagamento.updated_at || legacyPagamento.created_at || null,
    };

    if (args.execute) {
      if (existingBill?.id) {
        const { error } = await admin.from('bills').update(billPayload).eq('id', existingBill.id);
        if (error) {
          throw error;
        }
      } else {
        const { error } = await admin.from('bills').insert([billPayload]);
        if (error) {
          throw error;
        }
      }
    }

    if (existingBill?.id) {
      result.bills.updated += 1;
    } else {
      result.bills.created += 1;
    }

    const financeKey = `pagamento:${legacyPagamento.legacy_lpe_id}`;
    const existingFinanceiroItem = financeiroByLegacyKey.get(financeKey) || null;
    const studentName = legacyStudentById.get(legacyPagamento.legacy_lpe_student_id)?.name || null;
    const financePayload = {
      legacy_lpe_source: 'pagamento',
      legacy_lpe_id: legacyPagamento.legacy_lpe_id,
      valor: legacyPagamento.amount,
      data_vencimento: legacyPagamento.paid_at || legacyPagamento.due_date || null,
      status: legacyPagamento.finance_status,
      tipo: 'receita',
      descricao: buildFinanceDescricaoFromPagamento(legacyPagamento, studentName),
      forma_pagamento: legacyPagamento.payment_method,
      created_at: legacyPagamento.created_at || null,
      updated_at: legacyPagamento.updated_at || legacyPagamento.created_at || null,
    };

    if (args.execute) {
      if (existingFinanceiroItem?.id) {
        const { error } = await admin.from('financeiro').update(financePayload).eq('id', existingFinanceiroItem.id);
        if (error) {
          throw error;
        }
      } else {
        const { error } = await admin.from('financeiro').insert([financePayload]);
        if (error) {
          throw error;
        }
      }
    }

    if (existingFinanceiroItem?.id) {
      result.financeiro.updated += 1;
    } else {
      result.financeiro.created += 1;
    }
  }

  for (const legacyDespesa of legacy.despesas) {
    const financeKey = `despesa:${legacyDespesa.legacy_lpe_id}`;
    const existingFinanceiroItem = financeiroByLegacyKey.get(financeKey) || null;
    const financePayload = {
      legacy_lpe_source: 'despesa',
      legacy_lpe_id: legacyDespesa.legacy_lpe_id,
      valor: legacyDespesa.amount,
      data_vencimento: legacyDespesa.expense_date,
      status: 'pago',
      tipo: 'despesa',
      descricao: buildFinanceDescricaoFromDespesa(legacyDespesa),
      forma_pagamento: legacyDespesa.payment_method,
      created_at: legacyDespesa.created_at || null,
      updated_at: legacyDespesa.updated_at || legacyDespesa.created_at || null,
    };

    if (args.execute) {
      if (existingFinanceiroItem?.id) {
        const { error } = await admin.from('financeiro').update(financePayload).eq('id', existingFinanceiroItem.id);
        if (error) {
          throw error;
        }
      } else {
        const { error } = await admin.from('financeiro').insert([financePayload]);
        if (error) {
          throw error;
        }
      }
    }

    if (existingFinanceiroItem?.id) {
      result.financeiro.updated += 1;
    } else {
      result.financeiro.created += 1;
    }
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
