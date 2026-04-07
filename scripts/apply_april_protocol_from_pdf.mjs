import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

const WORKOUT_PDF_PATH = 'c:/Users/maril/Downloads/PROTOCOLO ABRIL DE 2026.pdf';
const OBS_PDF_PATH = 'c:/Users/maril/Downloads/OBS PROTOCOLO.pdf';

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  return Object.fromEntries(
    fs
      .readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const splitIndex = line.indexOf('=');
        return [line.slice(0, splitIndex), line.slice(splitIndex + 1)];
      }),
  );
}

const env = {
  ...readEnvFile('.env.local'),
  ...process.env,
};

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function extractPdfText(pdfPath) {
  const bytes = new Uint8Array(fs.readFileSync(pdfPath));
  const document = await pdfjs.getDocument({ data: bytes }).promise;
  const pages = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => item.str).join(' ');

    pages.push({
      page: pageNumber,
      text: pageText,
    });
  }

  await document.destroy();
  return pages;
}

function compactText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function assertPdfContains(workoutPages, obsPages) {
  const workoutText = compactText(workoutPages.map((page) => page.text).join(' '));
  const obsText = compactText(obsPages.map((page) => page.text).join(' '));

  const requiredWorkoutTokens = [
    'PARA QUEM TREINA 5X NA SEMANA',
    'PARA QUEM TREINA 3X NA SEMANA',
    'PARA QUEM TREINA 2X NA SEMANA',
    'TREINO 1 ( ENFASE EM QUADRICEPS)',
    'TREINO 5 ( ENFASE EM POSTERIORES)',
  ];

  const requiredObsTokens = [
    'OBSERVAÇÕES',
    '1º SEMANA',
    '2º SEMANA',
    '3° SEMANA',
    '4° SEMANA',
  ];

  for (const token of requiredWorkoutTokens) {
    if (!workoutText.includes(token)) {
      throw new Error(`PDF de treino sem trecho esperado: ${token}`);
    }
  }

  for (const token of requiredObsTokens) {
    if (!obsText.includes(token)) {
      throw new Error(`PDF de observacoes sem trecho esperado: ${token}`);
    }
  }
}

function e(nome, series, repeticoes, observacoes = '') {
  return {
    nome,
    series,
    repeticoes,
    descanso: '60s',
    carga: '',
    observacoes,
    grupo_muscular: '',
  };
}

const OBS_NOTES = [
  '1 semana: nao aumentar peso e manter 4x em exercicios especificos.',
  '2 semana: aumentar carga e voltar para 5 series nos exercicios padrao.',
  '3 semana: aumentar carga e, se possivel, repetir mais.',
  '4 semana: manter intensidade.',
  'Atencao extra: Daura, Dina, Adenildes, Edilene e Betty (cabelo curto).',
].join('\n');

const ROUTINES = {
  5: {
    planName: 'Rotina semanal 5x',
    objective: 'Protocolo de Abril/26 - 5x na semana',
    workouts: [
      {
        nome: 'Treino 1 - Enfase em quadriceps',
        split_label: 'A',
        day_of_week: 1,
        exercicios: [
          e('Agacha, ajoelha, levanta', 4, '10 cada perna', 'Nao levantar completamente; voltar ao ajoelhar.'),
          e('Cadeira extensora bilateral', 5, '12/10/8', 'Progressao de carga; para novata pode fazer 4x15.'),
          e('Passada com halteres', 4, 'voltas', 'Cada passo desce duas vezes; novata faz passada normal.'),
          e('Agachamento ou leg press', 5, '12~15', 'Com isometria fora do aparelho ao final de cada serie.'),
          e('Abs lateral', 5, '20', 'Trazer cotovelo na direcao do joelho.'),
        ],
      },
      {
        nome: 'Treino 2 - Peito e costas',
        split_label: 'B',
        day_of_week: 2,
        exercicios: [
          e('Pulley no elastico ou na polia', 4, '15~20', 'Se necessario, fazer puxada alta no elastico/polia.'),
          e('Crucifixo inverso com halteres', 4, '12~15', 'Manter posicao de stiff; alternativa remada serrote.'),
          e('Swing (agachamento c/ elevacao de ombros)', 4, '15', 'Agacha, levanta e eleva carga com bracos estendidos.'),
          e('Supino unilateral c/ quadril elevado', 4, '12~15'),
          e('Pullover com anilha ou halteres', 4, '15~20'),
          e('Prancha isometrica', 5, '40s~60s'),
        ],
      },
      {
        nome: 'Treino 3 - Enfase em gluteos',
        split_label: 'C',
        day_of_week: 3,
        exercicios: [
          e('Agachamento lateral (cossac)', 4, '12 cada lado'),
          e('Leg sumo ou levantamento terra sumo ou agachamento sumo', 5, '12~15', 'Variar conforme aptidao e lotacao.'),
          e('Subida no step com afundo', 4, '12', 'Faz afundo e em seguida sobe no step.'),
          e('Elevacao de quadril com barra', 4, '12~15', 'Fazer em banco/pneu/step; novata pode fazer no chao.'),
          e('Abs escalador', 5, '50', '25 cada lado.'),
        ],
      },
      {
        nome: 'Treino 4 - Triceps, biceps e ombros',
        split_label: 'D',
        day_of_week: 4,
        exercicios: [
          e('Prancha dinamica (toque no ombro)', 4, '15~20', 'Em prancha alta, 10 toques cada lado.'),
          e('Bi-set: triceps banco + unilateral no elastico ou frances', 4, '20 + 15'),
          e('Bi-set: rosca martelo + rosca normal', 4, '12', 'Executar martelo/martelo/rosca.'),
          e('Bola na parede + polichinelo', 4, '15 + 30', '15 bola com agachamento + 30 polichinelos.'),
        ],
      },
      {
        nome: 'Treino 5 - Enfase em posteriores',
        split_label: 'E',
        day_of_week: 5,
        exercicios: [
          e('Flexao em pe', 4, '20', 'Segurando no tornozelo, agacha e estende sem levantar.'),
          e('Flexora em pe c/ caneleira c/ isometria', 4, '15', '15 reps + 15s isometria; completa uma perna e depois troca.'),
          e('Cadeira flexora bilateral', 5, '12/10/8', 'Progressao de carga; novata pode fazer 4x15.'),
          e('Leg unilateral ou bulgaro', 4, '12'),
          e('Stiff ou bom dia bilateral', 5, '12~15'),
          e('Abs remador', 5, '20', 'Abracando o joelho.'),
        ],
      },
    ],
  },
  3: {
    planName: 'Rotina semanal 3x',
    objective: 'Protocolo de Abril/26 - 3x na semana',
    workouts: [
      {
        nome: 'Treino 1 - Enfase em quadriceps',
        split_label: 'A',
        day_of_week: 1,
        exercicios: [
          e('Agacha, ajoelha, levanta', 4, '10 cada perna', 'Nao levantar completamente; voltar ao ajoelhar.'),
          e('Cadeira extensora bilateral', 5, '12/10/8', 'Progressao de carga; para novata pode fazer 4x15.'),
          e('Passada com halteres', 4, 'voltas', 'Cada passo desce duas vezes; novata faz passada normal.'),
          e('Agachamento ou leg press', 5, '12~15', 'Com isometria fora do aparelho ao final de cada serie.'),
          e('Abs lateral', 5, '20'),
        ],
      },
      {
        nome: 'Treino 2 - Enfase em superior total',
        split_label: 'B',
        day_of_week: 3,
        exercicios: [
          e('Pulley no elastico ou na polia', 4, '15~20', 'Se necessario, fazer puxada alta no elastico/polia.'),
          e('Crucifixo inverso com halteres', 4, '12~15', 'Manter posicao de stiff; alternativa remada serrote.'),
          e('Supino unilateral c/ quadril elevado', 4, '12~15'),
          e('Pullover com anilha ou halteres', 4, '15~20'),
          e('Triceps banco', 4, '20', 'Circuito: descansa somente ao final de todos exercicios.'),
          e('Rosca martelo', 4, '20', 'Circuito.'),
          e('Bola na parede', 4, '15', 'Circuito.'),
          e('Prancha', 4, '40s~60s', 'Circuito.'),
        ],
      },
      {
        nome: 'Treino 3 - Enfase em posterior e gluteos',
        split_label: 'C',
        day_of_week: 5,
        exercicios: [
          e('Flexao em pe', 4, '20', 'Segurando no tornozelo, agacha e estende sem levantar.'),
          e('Flexora em pe c/ caneleira c/ isometria', 4, '15', '15 reps + 15s isometria; completa uma perna e depois troca.'),
          e('Cadeira flexora bilateral', 5, '12/10/8', 'Progressao de carga; novata pode fazer 4x15.'),
          e('Afundo com subida no step', 4, '12', 'Pe no step, faz afundo e sobe na sequencia.'),
          e('Elevacao de quadril com barra', 4, '12~15', 'Em banco/pneu/step; novata pode fazer no chao.'),
          e('Abs escalador', 5, '50', '25 cada lado.'),
        ],
      },
    ],
  },
  2: {
    planName: 'Rotina semanal 2x',
    objective: 'Protocolo de Abril/26 - 2x na semana',
    workouts: [
      {
        nome: 'Treino 1 - Fullbody',
        split_label: 'A',
        day_of_week: 1,
        exercicios: [
          e('Agacha, ajoelha, levanta', 4, '10 cada perna', 'Nao levantar completamente; voltar ao ajoelhar.'),
          e('Agachamento ou leg press', 5, '12~15', 'Com isometria ao final de cada serie.'),
          e('Passada com halteres', 4, 'voltas', 'Cada passo desce duas vezes; novata faz passada normal.'),
          e('Cadeira extensora bilateral', 5, '12/10/8', 'Progressao de carga; novata pode fazer 4x15.'),
          e('Puxada alta na polia, pulley ou crucifixo inverso', 4, '15~20'),
          e('Supino unilateral c/ quadril elevado', 4, '12~15'),
          e('Abs lateral ou escalador', 5, '40/20 cada lado'),
        ],
      },
      {
        nome: 'Treino 2 - Fullbody',
        split_label: 'B',
        day_of_week: 4,
        exercicios: [
          e('Flexao em pe', 4, '20', 'Segurando no tornozelo, agacha e estende sem levantar.'),
          e('Flexora em pe c/ caneleira c/ isometria', 4, '15', '15 reps + 15s isometria; completa uma perna e depois troca.'),
          e('Cadeira flexora bilateral', 5, '12/10/8', 'Progressao de carga; novata pode fazer 4x15.'),
          e('Triceps banco', 4, '15', 'Circuito: descansa somente ao final de todos exercicios.'),
          e('Rosca martelo', 4, '15', 'Circuito.'),
          e('Bola na parede', 4, '15', 'Circuito.'),
          e('Prancha', 4, '40s~60s', 'Circuito.'),
        ],
      },
    ],
  },
};

async function applyRoutineByFrequency(frequency, routine, obsNotes) {
  const nowIso = new Date().toISOString();

  const { data: planRows, error: planError } = await supabase
    .from('training_plans')
    .select('id, name')
    .eq('weekly_frequency', frequency)
    .eq('active', true)
    .limit(1);

  if (planError) {
    throw new Error(`Erro ao buscar plano ${frequency}x: ${planError.message}`);
  }

  const plan = planRows?.[0];
  if (!plan?.id) {
    throw new Error(`Plano ${frequency}x nao encontrado para substituir.`);
  }

  const planId = plan.id;

  const { error: planUpdateError } = await supabase
    .from('training_plans')
    .update({
      name: routine.planName,
      description: `Atualizado automaticamente via PDF em ${new Date().toLocaleDateString('pt-BR')}.`,
      active: true,
    })
    .eq('id', planId);

  if (planUpdateError) {
    throw new Error(`Erro ao atualizar plano ${frequency}x: ${planUpdateError.message}`);
  }

  const { data: versions, error: versionsError } = await supabase
    .from('training_plan_versions')
    .select('id, version_number')
    .eq('training_plan_id', planId)
    .order('version_number', { ascending: false });

  if (versionsError) {
    throw new Error(`Erro ao ler versoes do plano ${frequency}x: ${versionsError.message}`);
  }

  const nextVersionNumber = (versions?.[0]?.version_number || 0) + 1;

  const { error: deactivateVersionsError } = await supabase
    .from('training_plan_versions')
    .update({ is_active: false })
    .eq('training_plan_id', planId)
    .eq('is_active', true);

  if (deactivateVersionsError) {
    throw new Error(`Erro ao inativar versoes do plano ${frequency}x: ${deactivateVersionsError.message}`);
  }

  const { data: newVersion, error: createVersionError } = await supabase
    .from('training_plan_versions')
    .insert([
      {
        training_plan_id: planId,
        version_number: nextVersionNumber,
        objective: routine.objective,
        level: 'intermediario',
        duration_weeks: 4,
        coach_notes: obsNotes,
        is_active: true,
        published_at: nowIso,
      },
    ])
    .select('id')
    .single();

  if (createVersionError || !newVersion?.id) {
    throw new Error(`Erro ao criar versao do plano ${frequency}x: ${createVersionError?.message || 'sem id'}`);
  }

  const versionId = newVersion.id;

  const { data: existingTreinos, error: existingTreinosError } = await supabase
    .from('treinos')
    .select('id, sort_order')
    .eq('training_plan_id', planId)
    .eq('ativo', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (existingTreinosError) {
    throw new Error(`Erro ao ler treinos do plano ${frequency}x: ${existingTreinosError.message}`);
  }

  const currentTreinos = existingTreinos || [];

  for (let index = 0; index < routine.workouts.length; index += 1) {
    const workout = routine.workouts[index];
    const existing = currentTreinos[index];

    const treinoPayload = {
      student_id: null,
      nome: workout.nome,
      objetivo: routine.objective,
      nivel: 'intermediario',
      duracao_minutos: 60,
      descricao: `${routine.objective} - ${workout.nome}`,
      exercicios: workout.exercicios,
      ativo: true,
      training_plan_id: planId,
      training_plan_version_id: versionId,
      sort_order: index + 1,
      split_label: workout.split_label,
      day_of_week: workout.day_of_week,
      coach_notes: obsNotes,
    };

    if (existing?.id) {
      const { error: updateTreinoError } = await supabase
        .from('treinos')
        .update(treinoPayload)
        .eq('id', existing.id);

      if (updateTreinoError) {
        throw new Error(`Erro ao atualizar treino ${existing.id}: ${updateTreinoError.message}`);
      }
    } else {
      const { error: insertTreinoError } = await supabase
        .from('treinos')
        .insert([treinoPayload]);

      if (insertTreinoError) {
        throw new Error(`Erro ao inserir treino novo ${frequency}x: ${insertTreinoError.message}`);
      }
    }
  }

  const overflowTreinos = currentTreinos.slice(routine.workouts.length);
  for (const treino of overflowTreinos) {
    const { error: deactivateTreinoError } = await supabase
      .from('treinos')
      .update({ ativo: false })
      .eq('id', treino.id);

    if (deactivateTreinoError) {
      throw new Error(`Erro ao inativar treino antigo ${treino.id}: ${deactivateTreinoError.message}`);
    }
  }

  console.log(
    `Plano ${frequency}x atualizado -> plan_id=${planId}, version_id=${versionId}, treinos_ativos=${routine.workouts.length}`,
  );
}

async function main() {
  if (!fs.existsSync(WORKOUT_PDF_PATH)) {
    throw new Error(`PDF de treino nao encontrado: ${WORKOUT_PDF_PATH}`);
  }

  if (!fs.existsSync(OBS_PDF_PATH)) {
    throw new Error(`PDF de observacoes nao encontrado: ${OBS_PDF_PATH}`);
  }

  const workoutPages = await extractPdfText(WORKOUT_PDF_PATH);
  const obsPages = await extractPdfText(OBS_PDF_PATH);
  assertPdfContains(workoutPages, obsPages);

  await applyRoutineByFrequency(5, ROUTINES[5], OBS_NOTES);
  await applyRoutineByFrequency(3, ROUTINES[3], OBS_NOTES);
  await applyRoutineByFrequency(2, ROUTINES[2], OBS_NOTES);

  console.log('Substituicao concluida com sucesso para rotinas 5x, 3x e 2x.');
}

main().catch((error) => {
  console.error('Falha ao aplicar protocolo de abril:', error);
  process.exit(1);
});

