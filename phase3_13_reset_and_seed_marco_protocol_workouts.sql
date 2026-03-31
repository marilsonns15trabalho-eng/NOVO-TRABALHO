-- ============================================================
-- FASE 3.13 - RESET E CADASTRO DO PROTOCOLO DE MARCO/26
-- Rodar manualmente no SQL Editor do Supabase.
-- Objetivo:
--   * remover os treinos e rotinas semanais atuais
--   * limpar vinculos e historico de treino associados
--   * cadastrar novamente as rotinas 2x, 3x e 5x
--   * deixar os exercicios no formato esperado pelo sistema
--   * adiantar referencias para o fluxo de "Como executar"
-- ============================================================

SET search_path = public;

DO $$
BEGIN
    IF to_regclass('public.training_plans') IS NULL THEN
        RAISE EXCEPTION 'Tabela public.training_plans nao encontrada. Rode phase3_08_training_system.sql antes desta fase.';
    END IF;

    IF to_regclass('public.training_plan_versions') IS NULL THEN
        RAISE EXCEPTION 'Tabela public.training_plan_versions nao encontrada. Rode phase3_09_training_execution_foundation.sql antes desta fase.';
    END IF;

    IF to_regclass('public.treinos') IS NULL THEN
        RAISE EXCEPTION 'Tabela public.treinos nao encontrada.';
    END IF;
END $$;

BEGIN;

-- Remove toda a grade anterior de treinos, seus vinculos e o historico derivado.
DELETE FROM public.treinos;
DELETE FROM public.student_training_plans;
DELETE FROM public.training_plans;

COMMIT;

DO $$
DECLARE
    plan_2x_id UUID;
    plan_3x_id UUID;
    plan_5x_id UUID;
    version_2x_id UUID;
    version_3x_id UUID;
    version_5x_id UUID;
BEGIN
    INSERT INTO public.training_plans (
        name,
        weekly_frequency,
        description,
        active
    )
    VALUES (
        'Rotina semanal 2x',
        2,
        'Estrutura base para alunas que treinam 2x na semana.',
        TRUE
    )
    RETURNING id INTO plan_2x_id;

    INSERT INTO public.training_plans (
        name,
        weekly_frequency,
        description,
        active
    )
    VALUES (
        'Rotina semanal 3x',
        3,
        'Estrutura base para alunas que treinam 3x na semana.',
        TRUE
    )
    RETURNING id INTO plan_3x_id;

    INSERT INTO public.training_plans (
        name,
        weekly_frequency,
        description,
        active
    )
    VALUES (
        'Rotina semanal 5x',
        5,
        'Estrutura base para alunas que treinam 5x na semana.',
        TRUE
    )
    RETURNING id INTO plan_5x_id;

    INSERT INTO public.training_plan_versions (
        training_plan_id,
        version_number,
        objective,
        level,
        duration_weeks,
        coach_notes,
        is_active,
        published_at
    )
    VALUES (
        plan_2x_id,
        1,
        'Estrutura full body para duas sessoes por semana.',
        'intermediario',
        4,
        'Base criada a partir do protocolo de marco/26 para treinos 2x.',
        TRUE,
        NOW()
    )
    RETURNING id INTO version_2x_id;

    INSERT INTO public.training_plan_versions (
        training_plan_id,
        version_number,
        objective,
        level,
        duration_weeks,
        coach_notes,
        is_active,
        published_at
    )
    VALUES (
        plan_3x_id,
        1,
        'Estrutura semanal para quadriceps, superior total e posterior/gluteos.',
        'intermediario',
        4,
        'Base criada a partir do protocolo de marco/26 para treinos 3x.',
        TRUE,
        NOW()
    )
    RETURNING id INTO version_3x_id;

    INSERT INTO public.training_plan_versions (
        training_plan_id,
        version_number,
        objective,
        level,
        duration_weeks,
        coach_notes,
        is_active,
        published_at
    )
    VALUES (
        plan_5x_id,
        1,
        'Estrutura semanal completa para quadriceps, dorsal, gluteos, peitoral/triceps e posteriores.',
        'intermediario',
        4,
        'Base criada a partir do protocolo de marco/26 para treinos 5x.',
        TRUE,
        NOW()
    )
    RETURNING id INTO version_5x_id;

    INSERT INTO public.treinos (
        student_id,
        training_plan_id,
        training_plan_version_id,
        created_by_auth_user_id,
        nome,
        objetivo,
        nivel,
        duracao_minutos,
        descricao,
        exercicios,
        ativo,
        sort_order,
        split_label,
        day_of_week,
        coach_notes
    )
    VALUES
    (
        NULL,
        plan_2x_id,
        version_2x_id,
        NULL,
        'Treino 1 - Full body',
        'Estrutura full body com enfase em quadriceps e combinacoes globais.',
        'intermediario',
        60,
        'Base para quem treina 2x na semana.',
        jsonb_build_array(
            jsonb_build_object('nome', 'Flexao nordica inversa (Joao Bobo)', 'grupo_muscular', 'quadriceps', 'series', 4, 'repeticoes', '15', 'observacoes', 'Manter a postura do tronco ereta e nao parar durante a serie.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'reverse nordic curl', 'biblioteca_titulo', 'Flexao nordica inversa', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Cadeira extensora unilateral', 'grupo_muscular', 'quadriceps', 'series', 4, 'repeticoes', '15', 'observacoes', 'Cada perna sem parar. Se estiver cheio, usar caneleira e fazer extensao em pe.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'single leg extension', 'biblioteca_titulo', 'Cadeira extensora unilateral', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Leg press + triceps frances', 'grupo_muscular', 'full body', 'series', 5, 'repeticoes', '15 + 15', 'observacoes', 'Fazer 15 repeticoes no leg press e em seguida 15 repeticoes de triceps frances.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'leg press', 'biblioteca_titulo', 'Leg press', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Afundo com desenvolvimento', 'grupo_muscular', 'full body', 'series', 5, 'repeticoes', '15', 'observacoes', 'Combinar o afundo com o desenvolvimento de ombros.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'lunge', 'biblioteca_titulo', 'Afundo com desenvolvimento', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Agachamento + biceps', 'grupo_muscular', 'full body', 'series', 5, 'repeticoes', '15', 'observacoes', 'Fazer o agachamento e em seguida o exercicio de biceps.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'squat', 'biblioteca_titulo', 'Agachamento', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Panturrilha em pe', 'grupo_muscular', 'panturrilhas', 'series', 5, 'repeticoes', '20', 'observacoes', 'Executar de forma controlada.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'standing calf raise', 'biblioteca_titulo', 'Panturrilha em pe', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Abs canivete ou com pernas elevadas', 'grupo_muscular', 'abdomen', 'series', 5, 'repeticoes', '20', 'observacoes', 'Escolher a variacao mais adequada para a aluna.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'jackknife sit up', 'biblioteca_titulo', 'Abs canivete', 'biblioteca_tem_demonstracao', TRUE)
        ),
        TRUE,
        1,
        'A',
        1,
        'Base full body do protocolo 2x.'
    ),
    (
        NULL,
        plan_2x_id,
        version_2x_id,
        NULL,
        'Treino 2 - Full body',
        'Estrutura full body com enfase em posteriores, gluteos e puxadas.',
        'intermediario',
        60,
        'Segunda sessao da rotina 2x na semana.',
        jsonb_build_array(
            jsonb_build_object('nome', 'Cadeira flexora unilateral ou flexao de joelhos com caneleira em pe', 'grupo_muscular', 'posteriores', 'series', 4, 'repeticoes', '15', 'observacoes', 'Se for na cadeira, fazer 10 a 15. Se for na caneleira, manter 15 repeticoes.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'standing leg curl', 'biblioteca_titulo', 'Flexora unilateral', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Elevacao de quadril + crucifixo', 'grupo_muscular', 'gluteos', 'series', 4, 'repeticoes', '15 + 15', 'observacoes', 'Fazer a elevacao e em seguida o crucifixo. So conta uma repeticao depois dos dois movimentos.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'hip thrust', 'biblioteca_titulo', 'Elevacao de quadril', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Abducao + coice com caneleira', 'grupo_muscular', 'gluteos', 'series', 5, 'repeticoes', '12', 'observacoes', 'So conta uma repeticao depois que fizer os dois exercicios.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'hip abduction', 'biblioteca_titulo', 'Abducao com caneleira', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Agachamento sumo + remada curvada ou polia baixa', 'grupo_muscular', 'full body', 'series', 5, 'repeticoes', '15', 'observacoes', 'Fazer o agachamento sumo e em seguida a remada, com pausa e atencao a postura.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'sumo squat', 'biblioteca_titulo', 'Agachamento sumo', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Panturrilha em pe', 'grupo_muscular', 'panturrilhas', 'series', 5, 'repeticoes', '20', 'observacoes', 'Executar de forma controlada.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'standing calf raise', 'biblioteca_titulo', 'Panturrilha em pe', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Abs extendendo e flexionando as pernas ou canivete unilateral', 'grupo_muscular', 'abdomen', 'series', 5, 'repeticoes', '15', 'observacoes', 'Escolher a variacao mais adequada para a aluna.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'lying leg raise', 'biblioteca_titulo', 'Abs com pernas elevadas', 'biblioteca_tem_demonstracao', TRUE)
        ),
        TRUE,
        2,
        'B',
        4,
        'Base full body posterior do protocolo 2x.'
    ),
    (
        NULL,
        plan_3x_id,
        version_3x_id,
        NULL,
        'Treino 1 - Enfase em quadriceps',
        'Estrutura com prioridade para quadriceps e abdomen.',
        'intermediario',
        60,
        'Primeiro treino da rotina 3x na semana.',
        jsonb_build_array(
            jsonb_build_object('nome', 'Flexao nordica inversa (Joao Bobo)', 'grupo_muscular', 'quadriceps', 'series', 4, 'repeticoes', '15', 'observacoes', 'Manter a postura do tronco ereta e nao parar durante a serie.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'reverse nordic curl', 'biblioteca_titulo', 'Flexao nordica inversa', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Cadeira extensora unilateral', 'grupo_muscular', 'quadriceps', 'series', 4, 'repeticoes', '10', 'observacoes', 'Cada perna sem parar. Se estiver cheio, usar caneleira e fazer extensao em pe.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'single leg extension', 'biblioteca_titulo', 'Cadeira extensora unilateral', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Agachamento ou leg press', 'grupo_muscular', 'quadriceps', 'series', 5, 'repeticoes', '12-15', 'observacoes', 'Escolher o exercicio disponivel e manter a tecnica.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'barbell squat', 'biblioteca_titulo', 'Agachamento', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Avanco', 'grupo_muscular', 'quadriceps', 'series', 5, 'repeticoes', '12', 'observacoes', 'Executar cada perna sem parar.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'lunge', 'biblioteca_titulo', 'Avanco', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Leg press ou agachamento', 'grupo_muscular', 'quadriceps', 'series', 5, 'repeticoes', '12-15', 'observacoes', 'Alternar a variacao conforme equipamento livre.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'leg press', 'biblioteca_titulo', 'Leg press', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Aducao deitada com caneleira', 'grupo_muscular', 'adutores', 'series', 4, 'repeticoes', '15-20', 'observacoes', 'Executar de forma continua e controlada.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'hip adduction', 'biblioteca_titulo', 'Aducao deitada com caneleira', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Abs canivete ou com pernas elevadas', 'grupo_muscular', 'abdomen', 'series', 4, 'repeticoes', '20', 'observacoes', 'Escolher a variacao mais adequada para a aluna.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'jackknife sit up', 'biblioteca_titulo', 'Abs canivete', 'biblioteca_tem_demonstracao', TRUE)
        ),
        TRUE,
        1,
        'A',
        1,
        'Base quadriceps da rotina 3x.'
    ),
    (
        NULL,
        plan_3x_id,
        version_3x_id,
        NULL,
        'Treino 2 - Superior total',
        'Estrutura de costas, peito, ombros e bracos.',
        'intermediario',
        60,
        'Segundo treino da rotina 3x na semana.',
        jsonb_build_array(
            jsonb_build_object('nome', 'Remada curvada na barra ou polia baixa', 'grupo_muscular', 'costas', 'series', 4, 'repeticoes', '15-20', 'observacoes', 'Quem fizer remada curvada faz puxador no elastico; quem fizer remada baixa faz remada serrote.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'barbell row', 'biblioteca_titulo', 'Remada curvada', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Remada serrote ou puxador unilateral no elastico', 'grupo_muscular', 'costas', 'series', 4, 'repeticoes', '12-15', 'observacoes', 'Controlar a volta do movimento e manter a postura.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'one arm dumbbell row', 'biblioteca_titulo', 'Remada serrote', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Agachamento com desenvolvimento', 'grupo_muscular', 'full body', 'series', 4, 'repeticoes', '15', 'observacoes', 'Manter ritmo continuo e postura estavel.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'thruster', 'biblioteca_titulo', 'Agachamento com desenvolvimento', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Supino com barra ou crucifixo', 'grupo_muscular', 'peito', 'series', 4, 'repeticoes', '15-20', 'observacoes', 'Usar a variacao mais adequada para a sessao.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'bench press', 'biblioteca_titulo', 'Supino com barra', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Triceps frances unilateral', 'grupo_muscular', 'triceps', 'series', 4, 'repeticoes', '12-15', 'observacoes', 'Manter controle no retorno.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'overhead triceps extension', 'biblioteca_titulo', 'Triceps frances unilateral', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Rosca na barra', 'grupo_muscular', 'biceps', 'series', 4, 'repeticoes', '15-20', 'observacoes', 'Executar sem balancar o tronco.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'barbell curl', 'biblioteca_titulo', 'Rosca na barra', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Panturrilha em pe', 'grupo_muscular', 'panturrilhas', 'series', 5, 'repeticoes', '20', 'observacoes', 'Executar com pausa leve no pico.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'standing calf raise', 'biblioteca_titulo', 'Panturrilha em pe', 'biblioteca_tem_demonstracao', TRUE)
        ),
        TRUE,
        2,
        'B',
        3,
        'Base superior total da rotina 3x.'
    ),
    (
        NULL,
        plan_3x_id,
        version_3x_id,
        NULL,
        'Treino 3 - Posterior e gluteos',
        'Estrutura com prioridade para posteriores, gluteos e cadeia posterior.',
        'intermediario',
        60,
        'Terceiro treino da rotina 3x na semana.',
        jsonb_build_array(
            jsonb_build_object('nome', 'Flexora deitada com a bola ou flexora bilateral na cadeira', 'grupo_muscular', 'posteriores', 'series', 5, 'repeticoes', '15', 'observacoes', 'Quem fizer na bola faz na cadeira; quem fizer na cadeira faz a variacao em pe com caneleira.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'leg curl', 'biblioteca_titulo', 'Flexora deitada', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Flexora em pe com caneleira ou unilateral na cadeira', 'grupo_muscular', 'posteriores', 'series', 4, 'repeticoes', '15', 'observacoes', 'Ambas as variacoes sao sem descanso.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'standing leg curl', 'biblioteca_titulo', 'Flexora em pe', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Stiff, bom dia ou leg press', 'grupo_muscular', 'posteriores', 'series', 5, 'repeticoes', '12-15', 'observacoes', 'Escolher a variacao conforme aptidao fisica e quantidade de alunas na aula.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'romanian deadlift', 'biblioteca_titulo', 'Stiff', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Caneleira: abducao + coice', 'grupo_muscular', 'gluteos', 'series', 4, 'repeticoes', '15', 'observacoes', 'So conta uma repeticao depois que fizer os dois exercicios. Se houver dificuldade, separar os movimentos.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'hip abduction', 'biblioteca_titulo', 'Abducao com caneleira', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Elevacao de quadril flexionando as pernas ou unilateral', 'grupo_muscular', 'gluteos', 'series', 5, 'repeticoes', '15', 'observacoes', 'Fazer 15 repeticoes, segurar 15 segundos na isometria e fazer mais 15.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'hip thrust', 'biblioteca_titulo', 'Elevacao de quadril', 'biblioteca_tem_demonstracao', TRUE)
        ),
        TRUE,
        3,
        'C',
        5,
        'Base posterior e gluteos da rotina 3x.'
    ),
    (
        NULL,
        plan_5x_id,
        version_5x_id,
        NULL,
        'Treino 1 - Enfase em quadriceps',
        'Estrutura com prioridade para quadriceps e abdomen.',
        'intermediario',
        60,
        'Primeiro treino da rotina 5x na semana.',
        jsonb_build_array(
            jsonb_build_object('nome', 'Flexao nordica inversa (Joao Bobo)', 'grupo_muscular', 'quadriceps', 'series', 4, 'repeticoes', '15', 'observacoes', 'Manter a postura do tronco ereta e nao parar durante a serie.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'reverse nordic curl', 'biblioteca_titulo', 'Flexao nordica inversa', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Cadeira extensora unilateral', 'grupo_muscular', 'quadriceps', 'series', 4, 'repeticoes', '10', 'observacoes', 'Cada perna sem parar. Se estiver cheio, usar caneleira e fazer extensao em pe.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'single leg extension', 'biblioteca_titulo', 'Cadeira extensora unilateral', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Agachamento ou leg press', 'grupo_muscular', 'quadriceps', 'series', 5, 'repeticoes', '12-15', 'observacoes', 'Escolher o exercicio disponivel e manter a tecnica.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'barbell squat', 'biblioteca_titulo', 'Agachamento', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Avanco', 'grupo_muscular', 'quadriceps', 'series', 5, 'repeticoes', '12', 'observacoes', 'Executar cada perna sem parar.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'lunge', 'biblioteca_titulo', 'Avanco', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Leg press ou agachamento', 'grupo_muscular', 'quadriceps', 'series', 5, 'repeticoes', '12-15', 'observacoes', 'Alternar a variacao conforme equipamento livre.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'leg press', 'biblioteca_titulo', 'Leg press', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Aducao deitada com caneleira', 'grupo_muscular', 'adutores', 'series', 4, 'repeticoes', '15-20', 'observacoes', 'Executar de forma continua e controlada.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'hip adduction', 'biblioteca_titulo', 'Aducao deitada com caneleira', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Abs canivete ou com pernas elevadas', 'grupo_muscular', 'abdomen', 'series', 4, 'repeticoes', '20', 'observacoes', 'Escolher a variacao mais adequada para a aluna.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'jackknife sit up', 'biblioteca_titulo', 'Abs canivete', 'biblioteca_tem_demonstracao', TRUE)
        ),
        TRUE,
        1,
        'A',
        1,
        'Base quadriceps da rotina 5x.'
    ),
    (
        NULL,
        plan_5x_id,
        version_5x_id,
        NULL,
        'Treino 2 - Dorsal, ombros e biceps',
        'Estrutura de costas, ombros e biceps.',
        'intermediario',
        60,
        'Segundo treino da rotina 5x na semana.',
        jsonb_build_array(
            jsonb_build_object('nome', 'Remada curvada na barra ou polia baixa', 'grupo_muscular', 'costas', 'series', 4, 'repeticoes', '15-20', 'observacoes', 'Quem fizer remada curvada faz puxador no elastico; quem fizer remada baixa faz remada serrote.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'barbell row', 'biblioteca_titulo', 'Remada curvada', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Remada serrote ou puxador unilateral no elastico', 'grupo_muscular', 'costas', 'series', 4, 'repeticoes', '12-15', 'observacoes', 'Controlar a volta do movimento e manter a postura.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'one arm dumbbell row', 'biblioteca_titulo', 'Remada serrote', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Elevacao de ombros frontal + lateral (Robozinho)', 'grupo_muscular', 'ombros', 'series', 4, 'repeticoes', '10', 'observacoes', 'Se houver oscilacao na execucao, pedir para fazer 10 para frente e 10 para o lado com pausa.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'front raise', 'biblioteca_titulo', 'Elevacao frontal', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Rosca concentrada sentada', 'grupo_muscular', 'biceps', 'series', 4, 'repeticoes', '12-15', 'observacoes', 'Executar com controle e sem compensar no tronco.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'concentration curl', 'biblioteca_titulo', 'Rosca concentrada', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Rosca na barra', 'grupo_muscular', 'biceps', 'series', 4, 'repeticoes', '15-20', 'observacoes', 'Executar sem balancar o tronco.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'barbell curl', 'biblioteca_titulo', 'Rosca na barra', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Panturrilha em pe', 'grupo_muscular', 'panturrilhas', 'series', 5, 'repeticoes', '20', 'observacoes', 'Executar com pausa leve no pico.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'standing calf raise', 'biblioteca_titulo', 'Panturrilha em pe', 'biblioteca_tem_demonstracao', TRUE)
        ),
        TRUE,
        2,
        'B',
        2,
        'Base dorsal, ombros e biceps da rotina 5x.'
    ),
    (
        NULL,
        plan_5x_id,
        version_5x_id,
        NULL,
        'Treino 3 - Enfase em gluteos',
        'Estrutura com prioridade para gluteos e controle de pelve.',
        'intermediario',
        60,
        'Terceiro treino da rotina 5x na semana.',
        jsonb_build_array(
            jsonb_build_object('nome', 'Agachamento abre/fecha', 'grupo_muscular', 'gluteos', 'series', 4, 'repeticoes', '15 + 15', 'observacoes', 'Fazer 15 repeticoes abrindo e 15 repeticoes fechando.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'sumo squat', 'biblioteca_titulo', 'Agachamento abre/fecha', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Bulgaro', 'grupo_muscular', 'gluteos', 'series', 4, 'repeticoes', '12-15', 'observacoes', 'Executar cada perna com pausa.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'bulgarian split squat', 'biblioteca_titulo', 'Bulgaro', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Elevacao de quadril', 'grupo_muscular', 'gluteos', 'series', 5, 'repeticoes', '15 + 15', 'observacoes', 'Fazer 15 repeticoes, segurar 15 segundos na isometria e fazer mais 15.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'hip thrust', 'biblioteca_titulo', 'Elevacao de quadril', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Caneleira: abducao + coice', 'grupo_muscular', 'gluteos', 'series', 4, 'repeticoes', '15', 'observacoes', 'So conta uma repeticao depois que fizer os dois exercicios.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'hip abduction', 'biblioteca_titulo', 'Abducao com caneleira', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Abs extendendo e flexionando as pernas', 'grupo_muscular', 'abdomen', 'series', 5, 'repeticoes', '15', 'observacoes', 'Prestar atencao na postura e no controle do tronco.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'lying leg raise', 'biblioteca_titulo', 'Abs com pernas elevadas', 'biblioteca_tem_demonstracao', TRUE)
        ),
        TRUE,
        3,
        'C',
        3,
        'Base gluteos da rotina 5x.'
    ),
    (
        NULL,
        plan_5x_id,
        version_5x_id,
        NULL,
        'Treino 4 - Peitoral, ombros e triceps',
        'Estrutura de peitoral, ombros e triceps.',
        'intermediario',
        60,
        'Quarto treino da rotina 5x na semana.',
        jsonb_build_array(
            jsonb_build_object('nome', 'Crucifixo', 'grupo_muscular', 'peito', 'series', 4, 'repeticoes', '15-20', 'observacoes', 'Executar com pausa e controle.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'dumbbell fly', 'biblioteca_titulo', 'Crucifixo', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Supino com barra', 'grupo_muscular', 'peito', 'series', 4, 'repeticoes', '15-20', 'observacoes', 'Executar com pausa e controle.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'bench press', 'biblioteca_titulo', 'Supino com barra', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Agachamento com desenvolvimento', 'grupo_muscular', 'full body', 'series', 4, 'repeticoes', '15', 'observacoes', 'Manter o ritmo e a postura durante a serie.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'thruster', 'biblioteca_titulo', 'Agachamento com desenvolvimento', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Triceps frances unilateral', 'grupo_muscular', 'triceps', 'series', 4, 'repeticoes', '12-15', 'observacoes', 'Executar com controle no retorno.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'overhead triceps extension', 'biblioteca_titulo', 'Triceps frances unilateral', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Triceps polia ou elastico', 'grupo_muscular', 'triceps', 'series', 4, 'repeticoes', '15-20', 'observacoes', 'Usar a variacao disponivel e manter controle do movimento.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'triceps pushdown', 'biblioteca_titulo', 'Triceps polia', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Panturrilha em pe unilateral', 'grupo_muscular', 'panturrilhas', 'series', 5, 'repeticoes', '20', 'observacoes', 'Executar uma perna por vez, com controle.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'standing calf raise', 'biblioteca_titulo', 'Panturrilha em pe', 'biblioteca_tem_demonstracao', TRUE)
        ),
        TRUE,
        4,
        'D',
        4,
        'Base peitoral, ombros e triceps da rotina 5x.'
    ),
    (
        NULL,
        plan_5x_id,
        version_5x_id,
        NULL,
        'Treino 5 - Enfase em posteriores',
        'Estrutura com prioridade para posteriores e cadeia posterior.',
        'intermediario',
        60,
        'Quinto treino da rotina 5x na semana.',
        jsonb_build_array(
            jsonb_build_object('nome', 'Flexora deitada com a bola ou flexora bilateral na cadeira', 'grupo_muscular', 'posteriores', 'series', 5, 'repeticoes', '15', 'observacoes', 'Quem fizer na bola faz na cadeira e quem fizer na cadeira faz a variacao em pe com caneleira. Ambas sem descanso.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'leg curl', 'biblioteca_titulo', 'Flexora deitada', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Flexora em pe com caneleira ou na cadeira unilateral', 'grupo_muscular', 'posteriores', 'series', 4, 'repeticoes', '15', 'observacoes', 'Executar de forma controlada e sem descanso prolongado.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'standing leg curl', 'biblioteca_titulo', 'Flexora em pe', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Stiff ou bom dia', 'grupo_muscular', 'posteriores', 'series', 5, 'repeticoes', '12-15', 'observacoes', 'Se fizer a versao bilateral de um, depois fazer a versao unilateral do outro.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'romanian deadlift', 'biblioteca_titulo', 'Stiff', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Bom dia ou stiff unilateral', 'grupo_muscular', 'posteriores', 'series', 4, 'repeticoes', '12', 'observacoes', 'Executar cada perna separadamente quando a proposta for unilateral.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'good morning', 'biblioteca_titulo', 'Bom dia', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Leg press', 'grupo_muscular', 'pernas', 'series', 5, 'repeticoes', '12-15', 'observacoes', 'Se estiver cheio, pode colocar o leg antes do unilateral.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'leg press', 'biblioteca_titulo', 'Leg press', 'biblioteca_tem_demonstracao', TRUE),
            jsonb_build_object('nome', 'Abs canivete unilateral', 'grupo_muscular', 'abdomen', 'series', 5, 'repeticoes', '15', 'observacoes', 'Executar com controle, cada lado quando aplicavel.', 'biblioteca_origem', 'wger', 'biblioteca_referencia', 'jackknife sit up', 'biblioteca_titulo', 'Abs canivete', 'biblioteca_tem_demonstracao', TRUE)
        ),
        TRUE,
        5,
        'E',
        5,
        'Base posteriores da rotina 5x.'
    );
END $$;

ANALYZE public.training_plans;
ANALYZE public.training_plan_versions;
ANALYZE public.student_training_plans;
ANALYZE public.treinos;
