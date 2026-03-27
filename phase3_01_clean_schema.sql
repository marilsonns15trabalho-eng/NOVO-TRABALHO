-- ============================================================
-- FASE 3.01 - SCHEMA LIMPO PARA O PROJETO NOVO
-- Rodar em um projeto Supabase novo e vazio.
-- Nao cria colunas relacionais user_id.
-- ============================================================

SET search_path = public;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS migration;

CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    duration_months INTEGER NOT NULL DEFAULT 1 CHECK (duration_months > 0),
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    linked_auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_by_auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    cellphone TEXT,
    cpf TEXT,
    rg TEXT,
    birth_date DATE,
    gender TEXT,
    marital_status TEXT,
    profession TEXT,
    zip_code TEXT,
    address TEXT,
    number TEXT,
    complement TEXT,
    bairro TEXT,
    city TEXT,
    state TEXT,
    emergency_contact TEXT,
    emergency_phone TEXT,
    emergency_relationship TEXT,
    plan TEXT,
    plan_name TEXT,
    plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
    join_date DATE,
    start_date DATE,
    due_day INTEGER,
    status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    notes TEXT,
    objectives TEXT[] DEFAULT ARRAY[]::TEXT[],
    desired_weight NUMERIC(8, 2),
    amount_paid NUMERIC(12, 2),
    "group" TEXT,
    modality TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.treinos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    objetivo TEXT,
    nivel TEXT,
    duracao_minutos INTEGER,
    descricao TEXT,
    exercicios JSONB NOT NULL DEFAULT '[]'::JSONB,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.avaliacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    peso NUMERIC(8, 2),
    altura NUMERIC(8, 2),
    ombro NUMERIC(8, 2),
    torax NUMERIC(8, 2),
    braco_direito NUMERIC(8, 2),
    braco_esquerdo NUMERIC(8, 2),
    antebraco_direito NUMERIC(8, 2),
    antebraco_esquerdo NUMERIC(8, 2),
    cintura NUMERIC(8, 2),
    abdome NUMERIC(8, 2),
    quadril NUMERIC(8, 2),
    coxa_direita NUMERIC(8, 2),
    coxa_esquerda NUMERIC(8, 2),
    panturrilha_direita NUMERIC(8, 2),
    panturrilha_esquerda NUMERIC(8, 2),
    tricipital NUMERIC(8, 2),
    subescapular NUMERIC(8, 2),
    supra_iliaca NUMERIC(8, 2),
    abdominal NUMERIC(8, 2),
    pressao_arterial_sistolica NUMERIC(8, 2),
    pressao_arterial_diastolica NUMERIC(8, 2),
    frequencia_cardiaca_repouso NUMERIC(8, 2),
    observacoes TEXT,
    imc NUMERIC(8, 2),
    percentual_gordura NUMERIC(8, 2),
    gordura_corporal NUMERIC(8, 2),
    massa_gorda NUMERIC(8, 2),
    massa_magra NUMERIC(8, 2),
    soma_dobras NUMERIC(8, 2),
    protocolo TEXT,
    medidas JSONB NOT NULL DEFAULT '{}'::JSONB,
    dobras JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.anamneses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    data_anamnese DATE,
    peso NUMERIC(8, 2),
    altura NUMERIC(8, 2),
    objetivo_nutricional TEXT,
    restricoes_alimentares TEXT,
    alergias TEXT,
    medicamentos TEXT,
    historico_familiar TEXT,
    habitos_alimentares TEXT,
    consumo_agua TEXT,
    atividade_fisica TEXT,
    observacoes TEXT,
    circunferencia_abdominal TEXT,
    circunferencia_quadril TEXT,
    medidas_corpo TEXT,
    doencas_cronicas TEXT,
    problemas_saude TEXT,
    cirurgias TEXT,
    condicoes_hormonais TEXT,
    acompanhamento_psicologico TEXT,
    disturbios_alimentares TEXT,
    gravida_amamentando TEXT,
    acompanhamento_previo TEXT,
    frequencia_refeicoes TEXT,
    horarios_refeicoes TEXT,
    consumo_fastfood TEXT,
    consumo_doces TEXT,
    consumo_bebidas_acucaradas TEXT,
    consumo_alcool TEXT,
    gosta_cozinhar TEXT,
    preferencia_alimentos TEXT,
    consumo_cafe TEXT,
    uso_suplementos TEXT,
    frequencia_atividade_fisica TEXT,
    objetivos_treino TEXT,
    rotina_sono TEXT,
    nivel_estresse TEXT,
    tempo_sentado TEXT,
    dificuldade_dietas TEXT,
    lanches_fora TEXT,
    come_emocional TEXT,
    beliscar TEXT,
    compulsao_alimentar TEXT,
    fome_fora_horario TEXT,
    estrategias_controle_peso TEXT,
    alimentos_preferidos TEXT,
    alimentos_evitados TEXT,
    meta_peso_medidas TEXT,
    disposicao_mudancas TEXT,
    preferencia_dietas TEXT,
    expectativas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.financeiro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    valor NUMERIC(12, 2) NOT NULL,
    data_vencimento DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pendente', 'pago', 'vencido', 'atrasado')),
    tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
    descricao TEXT NOT NULL,
    forma_pagamento TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'late')),
    code TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assinaturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
    plan_name TEXT,
    plan_price NUMERIC(12, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.configuracoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    singleton BOOLEAN NOT NULL DEFAULT TRUE CHECK (singleton = TRUE),
    nome_academia TEXT NOT NULL,
    cnpj TEXT,
    telefone TEXT,
    email TEXT,
    endereco TEXT,
    logo_url TEXT,
    cor_primaria TEXT NOT NULL DEFAULT '#3b82f6',
    cor_secundaria TEXT NOT NULL DEFAULT '#18181b',
    mensagem_boas_vindas TEXT,
    termos_contrato TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT configuracoes_singleton_unique UNIQUE (singleton)
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'aluno' CHECK (role IN ('admin', 'professor', 'aluno')),
    display_name TEXT,
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.system_security_config (
    singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton = TRUE),
    super_admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.system_security_config (singleton)
VALUES (TRUE)
ON CONFLICT (singleton) DO NOTHING;

CREATE TABLE IF NOT EXISTS migration.user_id_map (
    legacy_user_id UUID PRIMARY KEY,
    new_auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    legacy_role TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_anamnese_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.data IS NULL AND NEW.data_anamnese IS NOT NULL THEN
        NEW.data := NEW.data_anamnese;
    END IF;

    IF NEW.data_anamnese IS NULL AND NEW.data IS NOT NULL THEN
        NEW.data_anamnese := NEW.data;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_timestamp_on_plans ON public.plans;
CREATE TRIGGER set_timestamp_on_plans
BEFORE UPDATE ON public.plans
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_timestamp_on_students ON public.students;
CREATE TRIGGER set_timestamp_on_students
BEFORE UPDATE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_timestamp_on_treinos ON public.treinos;
CREATE TRIGGER set_timestamp_on_treinos
BEFORE UPDATE ON public.treinos
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_timestamp_on_avaliacoes ON public.avaliacoes;
CREATE TRIGGER set_timestamp_on_avaliacoes
BEFORE UPDATE ON public.avaliacoes
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS sync_dates_on_anamneses ON public.anamneses;
CREATE TRIGGER sync_dates_on_anamneses
BEFORE INSERT OR UPDATE ON public.anamneses
FOR EACH ROW
EXECUTE FUNCTION public.sync_anamnese_dates();

DROP TRIGGER IF EXISTS set_timestamp_on_anamneses ON public.anamneses;
CREATE TRIGGER set_timestamp_on_anamneses
BEFORE UPDATE ON public.anamneses
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_timestamp_on_financeiro ON public.financeiro;
CREATE TRIGGER set_timestamp_on_financeiro
BEFORE UPDATE ON public.financeiro
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_timestamp_on_bills ON public.bills;
CREATE TRIGGER set_timestamp_on_bills
BEFORE UPDATE ON public.bills
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_timestamp_on_assinaturas ON public.assinaturas;
CREATE TRIGGER set_timestamp_on_assinaturas
BEFORE UPDATE ON public.assinaturas
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_timestamp_on_configuracoes ON public.configuracoes;
CREATE TRIGGER set_timestamp_on_configuracoes
BEFORE UPDATE ON public.configuracoes
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_timestamp_on_user_profiles ON public.user_profiles;
CREATE TRIGGER set_timestamp_on_user_profiles
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_timestamp_on_system_security_config ON public.system_security_config;
CREATE TRIGGER set_timestamp_on_system_security_config
BEFORE UPDATE ON public.system_security_config
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();
