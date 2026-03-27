-- ============================================================
-- FASE 3.04 - MIGRACAO PARA O PROJETO NOVO
-- Pressupostos:
--   1. As tabelas antigas foram importadas para o schema legacy.
--   2. Os usuarios foram recriados no Auth do projeto novo.
--   3. migration.user_id_map foi preenchida com legacy_user_id -> new_auth_user_id.
--   4. O snapshot antigo ja contem students.linked_auth_user_id e created_by_auth_user_id.
-- ============================================================

SET search_path = public;

DO $$
BEGIN
    IF to_regclass('legacy.students') IS NULL THEN
        RAISE EXCEPTION 'Schema legacy nao preparado. Importe as tabelas antigas para legacy antes da migracao.';
    END IF;

    IF to_regclass('migration.user_id_map') IS NULL THEN
        RAISE EXCEPTION 'Tabela migration.user_id_map nao encontrada. Rode phase3_01_clean_schema.sql antes.';
    END IF;
END $$;

INSERT INTO public.plans (
    id,
    name,
    price,
    duration_months,
    description,
    active,
    created_at,
    updated_at
)
SELECT
    p.id,
    p.name,
    p.price,
    COALESCE(p.duration_months, 1),
    p.description,
    COALESCE(p.active, TRUE),
    COALESCE(p.created_at, NOW()),
    COALESCE(p.created_at, NOW())
FROM legacy.plans p
ON CONFLICT (id) DO UPDATE
SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    duration_months = EXCLUDED.duration_months,
    description = EXCLUDED.description,
    active = EXCLUDED.active,
    updated_at = NOW();

INSERT INTO public.user_profiles (
    id,
    role,
    display_name,
    must_change_password,
    is_super_admin,
    created_at,
    updated_at
)
SELECT
    m.new_auth_user_id,
    COALESCE(up.role, 'aluno'),
    up.display_name,
    FALSE,
    COALESCE(up.is_super_admin, FALSE),
    COALESCE(up.created_at, NOW()),
    COALESCE(up.created_at, NOW())
FROM legacy.user_profiles up
JOIN migration.user_id_map m
  ON m.legacy_user_id = up.id
ON CONFLICT (id) DO UPDATE
SET
    role = EXCLUDED.role,
    display_name = EXCLUDED.display_name,
    is_super_admin = EXCLUDED.is_super_admin,
    updated_at = NOW();

WITH resolved_student_auth AS (
    SELECT
        s.id AS student_id,
        COALESCE(
            m_link_explicit.new_auth_user_id,
            CASE
                WHEN s.linked_auth_user_id IS NULL
                 AND s.user_id IS NOT NULL
                 AND up_user.role = 'aluno'
                 AND COALESCE(up_user.is_super_admin, FALSE) = FALSE
                 AND NOT EXISTS (
                        SELECT 1
                        FROM legacy.students s2
                        WHERE s2.user_id = s.user_id
                          AND s2.id <> s.id
                    )
                THEN m_from_user_id.new_auth_user_id
                ELSE NULL
            END
        ) AS resolved_linked_auth_user_id,
        COALESCE(
            m_creator_explicit.new_auth_user_id,
            CASE
                WHEN s.created_by_auth_user_id IS NULL
                 AND s.user_id IS NOT NULL
                 AND (
                        up_user.role IN ('admin', 'professor')
                     OR COALESCE(up_user.is_super_admin, FALSE) = TRUE
                 )
                THEN m_from_user_id.new_auth_user_id
                ELSE NULL
            END
        ) AS resolved_created_by_auth_user_id
    FROM legacy.students s
    LEFT JOIN legacy.user_profiles up_user
      ON up_user.id = s.user_id
    LEFT JOIN migration.user_id_map m_link_explicit
      ON m_link_explicit.legacy_user_id = s.linked_auth_user_id
    LEFT JOIN migration.user_id_map m_creator_explicit
      ON m_creator_explicit.legacy_user_id = s.created_by_auth_user_id
    LEFT JOIN migration.user_id_map m_from_user_id
      ON m_from_user_id.legacy_user_id = s.user_id
)
INSERT INTO public.students (
    id,
    linked_auth_user_id,
    created_by_auth_user_id,
    name,
    email,
    phone,
    cellphone,
    cpf,
    rg,
    birth_date,
    gender,
    marital_status,
    profession,
    zip_code,
    address,
    number,
    complement,
    bairro,
    city,
    state,
    emergency_contact,
    emergency_phone,
    emergency_relationship,
    plan,
    plan_name,
    plan_id,
    join_date,
    start_date,
    due_day,
    status,
    notes,
    objectives,
    desired_weight,
    amount_paid,
    "group",
    modality,
    created_at,
    updated_at
)
SELECT
    s.id,
    rsa.resolved_linked_auth_user_id,
    rsa.resolved_created_by_auth_user_id,
    s.name,
    s.email,
    s.phone,
    s.cellphone,
    s.cpf,
    s.rg,
    s.birth_date,
    s.gender,
    s.marital_status,
    s.profession,
    s.zip_code,
    s.address,
    s.number,
    s.complement,
    s.bairro,
    s.city,
    s.state,
    s.emergency_contact,
    s.emergency_phone,
    s.emergency_relationship,
    s.plan,
    s.plan_name,
    s.plan_id,
    s.join_date,
    s.start_date,
    s.due_day,
    COALESCE(s.status, 'ativo'),
    s.notes,
    COALESCE(s.objectives, ARRAY[]::TEXT[]),
    s.desired_weight,
    s.amount_paid,
    s."group",
    s.modality,
    COALESCE(s.created_at, NOW()),
    COALESCE(s.created_at, NOW())
FROM legacy.students s
JOIN resolved_student_auth rsa
  ON rsa.student_id = s.id
ON CONFLICT (id) DO UPDATE
SET
    linked_auth_user_id = EXCLUDED.linked_auth_user_id,
    created_by_auth_user_id = EXCLUDED.created_by_auth_user_id,
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    cellphone = EXCLUDED.cellphone,
    cpf = EXCLUDED.cpf,
    rg = EXCLUDED.rg,
    birth_date = EXCLUDED.birth_date,
    gender = EXCLUDED.gender,
    marital_status = EXCLUDED.marital_status,
    profession = EXCLUDED.profession,
    zip_code = EXCLUDED.zip_code,
    address = EXCLUDED.address,
    number = EXCLUDED.number,
    complement = EXCLUDED.complement,
    bairro = EXCLUDED.bairro,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    emergency_contact = EXCLUDED.emergency_contact,
    emergency_phone = EXCLUDED.emergency_phone,
    emergency_relationship = EXCLUDED.emergency_relationship,
    plan = EXCLUDED.plan,
    plan_name = EXCLUDED.plan_name,
    plan_id = EXCLUDED.plan_id,
    join_date = EXCLUDED.join_date,
    start_date = EXCLUDED.start_date,
    due_day = EXCLUDED.due_day,
    status = EXCLUDED.status,
    notes = EXCLUDED.notes,
    objectives = EXCLUDED.objectives,
    desired_weight = EXCLUDED.desired_weight,
    amount_paid = EXCLUDED.amount_paid,
    "group" = EXCLUDED."group",
    modality = EXCLUDED.modality,
    updated_at = NOW();

INSERT INTO public.treinos (
    id,
    student_id,
    nome,
    objetivo,
    nivel,
    duracao_minutos,
    descricao,
    exercicios,
    ativo,
    created_at,
    updated_at
)
SELECT
    t.id,
    t.student_id,
    t.nome,
    t.objetivo,
    t.nivel,
    t.duracao_minutos,
    t.descricao,
    COALESCE(t.exercicios, '[]'::JSONB),
    COALESCE(t.ativo, TRUE),
    COALESCE(t.created_at, NOW()),
    COALESCE(t.created_at, NOW())
FROM legacy.treinos t
WHERE t.student_id IS NOT NULL
ON CONFLICT (id) DO UPDATE
SET
    student_id = EXCLUDED.student_id,
    nome = EXCLUDED.nome,
    objetivo = EXCLUDED.objetivo,
    nivel = EXCLUDED.nivel,
    duracao_minutos = EXCLUDED.duracao_minutos,
    descricao = EXCLUDED.descricao,
    exercicios = EXCLUDED.exercicios,
    ativo = EXCLUDED.ativo,
    updated_at = NOW();

INSERT INTO public.avaliacoes (
    id,
    student_id,
    data,
    peso,
    altura,
    ombro,
    torax,
    braco_direito,
    braco_esquerdo,
    antebraco_direito,
    antebraco_esquerdo,
    cintura,
    abdome,
    quadril,
    coxa_direita,
    coxa_esquerda,
    panturrilha_direita,
    panturrilha_esquerda,
    tricipital,
    subescapular,
    supra_iliaca,
    abdominal,
    pressao_arterial_sistolica,
    pressao_arterial_diastolica,
    frequencia_cardiaca_repouso,
    observacoes,
    imc,
    percentual_gordura,
    gordura_corporal,
    massa_gorda,
    massa_magra,
    soma_dobras,
    protocolo,
    medidas,
    dobras,
    created_at,
    updated_at
)
SELECT
    a.id,
    a.student_id,
    a.data,
    a.peso,
    a.altura,
    a.ombro,
    a.torax,
    a.braco_direito,
    a.braco_esquerdo,
    a.antebraco_direito,
    a.antebraco_esquerdo,
    a.cintura,
    a.abdome,
    a.quadril,
    a.coxa_direita,
    a.coxa_esquerda,
    a.panturrilha_direita,
    a.panturrilha_esquerda,
    a.tricipital,
    a.subescapular,
    a.supra_iliaca,
    a.abdominal,
    a.pressao_arterial_sistolica,
    a.pressao_arterial_diastolica,
    a.frequencia_cardiaca_repouso,
    a.observacoes,
    a.imc,
    a.percentual_gordura,
    COALESCE(a.gordura_corporal, a.percentual_gordura),
    a.massa_gorda,
    a.massa_magra,
    a.soma_dobras,
    a.protocolo,
    COALESCE(a.medidas, '{}'::JSONB),
    COALESCE(a.dobras, '{}'::JSONB),
    COALESCE(a.created_at, NOW()),
    COALESCE(a.created_at, NOW())
FROM legacy.avaliacoes a
WHERE a.student_id IS NOT NULL
ON CONFLICT (id) DO UPDATE
SET
    student_id = EXCLUDED.student_id,
    data = EXCLUDED.data,
    peso = EXCLUDED.peso,
    altura = EXCLUDED.altura,
    ombro = EXCLUDED.ombro,
    torax = EXCLUDED.torax,
    braco_direito = EXCLUDED.braco_direito,
    braco_esquerdo = EXCLUDED.braco_esquerdo,
    antebraco_direito = EXCLUDED.antebraco_direito,
    antebraco_esquerdo = EXCLUDED.antebraco_esquerdo,
    cintura = EXCLUDED.cintura,
    abdome = EXCLUDED.abdome,
    quadril = EXCLUDED.quadril,
    coxa_direita = EXCLUDED.coxa_direita,
    coxa_esquerda = EXCLUDED.coxa_esquerda,
    panturrilha_direita = EXCLUDED.panturrilha_direita,
    panturrilha_esquerda = EXCLUDED.panturrilha_esquerda,
    tricipital = EXCLUDED.tricipital,
    subescapular = EXCLUDED.subescapular,
    supra_iliaca = EXCLUDED.supra_iliaca,
    abdominal = EXCLUDED.abdominal,
    observacoes = EXCLUDED.observacoes,
    percentual_gordura = EXCLUDED.percentual_gordura,
    gordura_corporal = EXCLUDED.gordura_corporal,
    massa_gorda = EXCLUDED.massa_gorda,
    massa_magra = EXCLUDED.massa_magra,
    soma_dobras = EXCLUDED.soma_dobras,
    protocolo = EXCLUDED.protocolo,
    medidas = EXCLUDED.medidas,
    dobras = EXCLUDED.dobras,
    updated_at = NOW();

INSERT INTO public.anamneses (
    id,
    student_id,
    data,
    data_anamnese,
    peso,
    altura,
    objetivo_nutricional,
    restricoes_alimentares,
    alergias,
    medicamentos,
    historico_familiar,
    habitos_alimentares,
    consumo_agua,
    atividade_fisica,
    observacoes,
    circunferencia_abdominal,
    circunferencia_quadril,
    medidas_corpo,
    doencas_cronicas,
    problemas_saude,
    cirurgias,
    condicoes_hormonais,
    acompanhamento_psicologico,
    disturbios_alimentares,
    gravida_amamentando,
    acompanhamento_previo,
    frequencia_refeicoes,
    horarios_refeicoes,
    consumo_fastfood,
    consumo_doces,
    consumo_bebidas_acucaradas,
    consumo_alcool,
    gosta_cozinhar,
    preferencia_alimentos,
    consumo_cafe,
    uso_suplementos,
    frequencia_atividade_fisica,
    objetivos_treino,
    rotina_sono,
    nivel_estresse,
    tempo_sentado,
    dificuldade_dietas,
    lanches_fora,
    come_emocional,
    beliscar,
    compulsao_alimentar,
    fome_fora_horario,
    estrategias_controle_peso,
    alimentos_preferidos,
    alimentos_evitados,
    meta_peso_medidas,
    disposicao_mudancas,
    preferencia_dietas,
    expectativas,
    created_at,
    updated_at
)
SELECT
    a.id,
    a.student_id,
    COALESCE(a.data, a.data_anamnese),
    COALESCE(a.data_anamnese, a.data),
    a.peso,
    a.altura,
    a.objetivo_nutricional,
    a.restricoes_alimentares,
    a.alergias,
    a.medicamentos,
    a.historico_familiar,
    a.habitos_alimentares,
    a.consumo_agua,
    a.atividade_fisica,
    a.observacoes,
    a.circunferencia_abdominal,
    a.circunferencia_quadril,
    a.medidas_corpo,
    a.doencas_cronicas,
    a.problemas_saude,
    a.cirurgias,
    a.condicoes_hormonais,
    a.acompanhamento_psicologico,
    a.disturbios_alimentares,
    a.gravida_amamentando,
    a.acompanhamento_previo,
    a.frequencia_refeicoes,
    a.horarios_refeicoes,
    a.consumo_fastfood,
    a.consumo_doces,
    a.consumo_bebidas_acucaradas,
    a.consumo_alcool,
    a.gosta_cozinhar,
    a.preferencia_alimentos,
    a.consumo_cafe,
    a.uso_suplementos,
    a.frequencia_atividade_fisica,
    a.objetivos_treino,
    a.rotina_sono,
    a.nivel_estresse,
    a.tempo_sentado,
    a.dificuldade_dietas,
    a.lanches_fora,
    a.come_emocional,
    a.beliscar,
    a.compulsao_alimentar,
    a.fome_fora_horario,
    a.estrategias_controle_peso,
    a.alimentos_preferidos,
    a.alimentos_evitados,
    a.meta_peso_medidas,
    a.disposicao_mudancas,
    a.preferencia_dietas,
    a.expectativas,
    COALESCE(a.created_at, NOW()),
    COALESCE(a.created_at, NOW())
FROM legacy.anamneses a
WHERE a.student_id IS NOT NULL
  AND COALESCE(a.data, a.data_anamnese) IS NOT NULL
ON CONFLICT (id) DO UPDATE
SET
    student_id = EXCLUDED.student_id,
    data = EXCLUDED.data,
    data_anamnese = EXCLUDED.data_anamnese,
    peso = EXCLUDED.peso,
    altura = EXCLUDED.altura,
    objetivo_nutricional = EXCLUDED.objetivo_nutricional,
    restricoes_alimentares = EXCLUDED.restricoes_alimentares,
    alergias = EXCLUDED.alergias,
    medicamentos = EXCLUDED.medicamentos,
    historico_familiar = EXCLUDED.historico_familiar,
    habitos_alimentares = EXCLUDED.habitos_alimentares,
    consumo_agua = EXCLUDED.consumo_agua,
    atividade_fisica = EXCLUDED.atividade_fisica,
    observacoes = EXCLUDED.observacoes,
    updated_at = NOW();

INSERT INTO public.financeiro (
    id,
    valor,
    data_vencimento,
    status,
    tipo,
    descricao,
    forma_pagamento,
    created_at,
    updated_at
)
SELECT
    f.id,
    f.valor,
    f.data_vencimento,
    f.status,
    f.tipo,
    f.descricao,
    f.forma_pagamento,
    COALESCE(f.created_at, NOW()),
    COALESCE(f.created_at, NOW())
FROM legacy.financeiro f
ON CONFLICT (id) DO UPDATE
SET
    valor = EXCLUDED.valor,
    data_vencimento = EXCLUDED.data_vencimento,
    status = EXCLUDED.status,
    tipo = EXCLUDED.tipo,
    descricao = EXCLUDED.descricao,
    forma_pagamento = EXCLUDED.forma_pagamento,
    updated_at = NOW();

INSERT INTO public.bills (
    id,
    student_id,
    amount,
    due_date,
    status,
    code,
    created_at,
    updated_at
)
SELECT
    b.id,
    b.student_id,
    b.amount,
    b.due_date,
    b.status,
    b.code,
    COALESCE(b.created_at, NOW()),
    COALESCE(b.created_at, NOW())
FROM legacy.bills b
WHERE b.student_id IS NOT NULL
ON CONFLICT (id) DO UPDATE
SET
    student_id = EXCLUDED.student_id,
    amount = EXCLUDED.amount,
    due_date = EXCLUDED.due_date,
    status = EXCLUDED.status,
    code = EXCLUDED.code,
    updated_at = NOW();

INSERT INTO public.assinaturas (
    id,
    student_id,
    plan_id,
    plan_name,
    plan_price,
    created_at,
    updated_at
)
SELECT
    a.id,
    a.student_id,
    a.plan_id,
    a.plan_name,
    a.plan_price,
    COALESCE(a.created_at, NOW()),
    COALESCE(a.created_at, NOW())
FROM legacy.assinaturas a
WHERE a.student_id IS NOT NULL
ON CONFLICT (id) DO UPDATE
SET
    student_id = EXCLUDED.student_id,
    plan_id = EXCLUDED.plan_id,
    plan_name = EXCLUDED.plan_name,
    plan_price = EXCLUDED.plan_price,
    updated_at = NOW();

INSERT INTO public.configuracoes (
    id,
    singleton,
    nome_academia,
    cnpj,
    telefone,
    email,
    endereco,
    logo_url,
    cor_primaria,
    cor_secundaria,
    mensagem_boas_vindas,
    termos_contrato,
    created_at,
    updated_at
)
SELECT
    c.id,
    TRUE,
    c.nome_academia,
    c.cnpj,
    c.telefone,
    c.email,
    c.endereco,
    c.logo_url,
    COALESCE(c.cor_primaria, '#3b82f6'),
    COALESCE(c.cor_secundaria, '#18181b'),
    c.mensagem_boas_vindas,
    c.termos_contrato,
    COALESCE(c.created_at, NOW()),
    COALESCE(c.created_at, NOW())
FROM legacy.configuracoes c
ORDER BY c.created_at NULLS FIRST
LIMIT 1
ON CONFLICT (id) DO UPDATE
SET
    nome_academia = EXCLUDED.nome_academia,
    cnpj = EXCLUDED.cnpj,
    telefone = EXCLUDED.telefone,
    email = EXCLUDED.email,
    endereco = EXCLUDED.endereco,
    logo_url = EXCLUDED.logo_url,
    cor_primaria = EXCLUDED.cor_primaria,
    cor_secundaria = EXCLUDED.cor_secundaria,
    mensagem_boas_vindas = EXCLUDED.mensagem_boas_vindas,
    termos_contrato = EXCLUDED.termos_contrato,
    updated_at = NOW();

UPDATE public.system_security_config cfg
SET
    super_admin_user_id = mapped.new_auth_user_id,
    updated_at = NOW()
FROM (
    SELECT m.new_auth_user_id
    FROM legacy.system_security_config old_cfg
    JOIN migration.user_id_map m
      ON m.legacy_user_id = old_cfg.super_admin_user_id
    WHERE old_cfg.singleton = TRUE
    LIMIT 1
) mapped
WHERE cfg.singleton = TRUE;

ANALYZE public.plans;
ANALYZE public.students;
ANALYZE public.treinos;
ANALYZE public.avaliacoes;
ANALYZE public.anamneses;
ANALYZE public.financeiro;
ANALYZE public.bills;
ANALYZE public.assinaturas;
ANALYZE public.configuracoes;
ANALYZE public.user_profiles;
