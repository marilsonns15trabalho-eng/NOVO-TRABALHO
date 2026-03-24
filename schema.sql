-- ============================================================
-- LIONESS PRIME — Schema Completo do Banco de Dados (Supabase)
-- ============================================================
-- 100% IDEMPOTENTE — pode rodar múltiplas vezes sem erro.
-- Ordem: CREATE TABLE → ADD COLUMN → ALTER COLUMN → INDEX
-- NÃO usa DROP TABLE, DROP COLUMN ou DELETE.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- FASE 1: CREATE TABLE IF NOT EXISTS (todas as 9 tabelas)
-- ============================================================

-- 1. plans
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    duration_months INTEGER DEFAULT 1,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID
);

-- 2. students
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID
);

-- 3. treinos
CREATE TABLE IF NOT EXISTS treinos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID,
    nome TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID
);

-- 4. avaliacoes
CREATE TABLE IF NOT EXISTS avaliacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID,
    data DATE NOT NULL,
    peso NUMERIC,
    altura NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID
);

-- 5. anamneses
CREATE TABLE IF NOT EXISTS anamneses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID
);

-- 6. financeiro
CREATE TABLE IF NOT EXISTS financeiro (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    valor NUMERIC NOT NULL,
    data_vencimento DATE NOT NULL,
    status TEXT NOT NULL,
    tipo TEXT NOT NULL,
    descricao TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID
);

-- 7. bills
CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID,
    amount NUMERIC NOT NULL,
    due_date DATE NOT NULL,
    status TEXT NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID
);

-- 8. assinaturas
CREATE TABLE IF NOT EXISTS assinaturas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID,
    plan_id UUID,
    plan_name TEXT,
    plan_price NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID
);

-- 9. configuracoes
CREATE TABLE IF NOT EXISTS configuracoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_academia TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID
);


-- ============================================================
-- FASE 2: ADD COLUMN IF NOT EXISTS (todas as colunas)
-- ============================================================

-- ---- plans ----
ALTER TABLE plans ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS duration_months INTEGER;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS active BOOLEAN;

-- ---- students ----
ALTER TABLE students ADD COLUMN IF NOT EXISTS cellphone TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS rg TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS marital_status TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS profession TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS number TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS complement TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS emergency_phone TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS emergency_relationship TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS plan TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS plan_name TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS plan_id UUID;
ALTER TABLE students ADD COLUMN IF NOT EXISTS join_date DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS due_day INTEGER;
ALTER TABLE students ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS objectives TEXT[];
ALTER TABLE students ADD COLUMN IF NOT EXISTS desired_weight NUMERIC;
ALTER TABLE students ADD COLUMN IF NOT EXISTS amount_paid NUMERIC;
ALTER TABLE students ADD COLUMN IF NOT EXISTS "group" TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS modality TEXT;

-- ---- treinos ----
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS student_id UUID;
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS objetivo TEXT;
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS nivel TEXT;
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS duracao_minutos INTEGER;
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS exercicios JSONB;
ALTER TABLE treinos ADD COLUMN IF NOT EXISTS ativo BOOLEAN;

-- ---- avaliacoes (colunas flat — legado) ----
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS ombro NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS torax NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS braco_direito NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS braco_esquerdo NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS antebraco_direito NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS antebraco_esquerdo NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS cintura NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS abdome NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS quadril NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS coxa_direita NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS coxa_esquerda NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS panturrilha_direita NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS panturrilha_esquerda NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS tricipital NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS subescapular NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS supra_iliaca NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS abdominal NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS pressao_arterial_sistolica NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS pressao_arterial_diastolica NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS frequencia_cardiaca_repouso NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS imc NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS percentual_gordura NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS massa_gorda NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS massa_magra NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS soma_dobras NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS protocolo TEXT;
-- avaliacoes (colunas JSONB — usadas pelo service)
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS medidas JSONB;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS dobras JSONB;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS gordura_corporal NUMERIC;

-- ---- anamneses ----
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS data_anamnese DATE;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS data DATE;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS peso NUMERIC;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS altura NUMERIC;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS objetivo_nutricional TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS restricoes_alimentares TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS alergias TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS medicamentos TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS historico_familiar TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS habitos_alimentares TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS consumo_agua TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS atividade_fisica TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS circunferencia_abdominal TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS circunferencia_quadril TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS medidas_corpo TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS doencas_cronicas TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS problemas_saude TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS cirurgias TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS condicoes_hormonais TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS acompanhamento_psicologico TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS disturbios_alimentares TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS gravida_amamentando TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS acompanhamento_previo TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS frequencia_refeicoes TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS horarios_refeicoes TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS consumo_fastfood TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS consumo_doces TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS consumo_bebidas_acucaradas TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS consumo_alcool TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS gosta_cozinhar TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS preferencia_alimentos TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS consumo_cafe TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS uso_suplementos TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS frequencia_atividade_fisica TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS objetivos_treino TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS rotina_sono TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS nivel_estresse TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS tempo_sentado TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS dificuldade_dietas TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS lanches_fora TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS come_emocional TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS beliscar TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS compulsao_alimentar TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS fome_fora_horario TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS estrategias_controle_peso TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS alimentos_preferidos TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS alimentos_evitados TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS meta_peso_medidas TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS disposicao_mudancas TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS preferencia_dietas TEXT;
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS expectativas TEXT;

-- ---- financeiro ----
ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS forma_pagamento TEXT;

-- ---- configuracoes ----
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS endereco TEXT;
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS cor_primaria TEXT;
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS cor_secundaria TEXT;
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS mensagem_boas_vindas TEXT;
ALTER TABLE configuracoes ADD COLUMN IF NOT EXISTS termos_contrato TEXT;


-- ============================================================
-- FASE 3: ALTER COLUMN (alterar constraints de colunas existentes)
-- Usando DO blocks para segurança
-- ============================================================

-- Tornar data_anamnese nullable (o service usa "data", não "data_anamnese")
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'anamneses' AND column_name = 'data_anamnese'
    ) THEN
        ALTER TABLE anamneses ALTER COLUMN data_anamnese DROP NOT NULL;
    END IF;
END $$;

-- Garantir default em plans.active
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'plans' AND column_name = 'active'
    ) THEN
        ALTER TABLE plans ALTER COLUMN active SET DEFAULT true;
    END IF;
END $$;

-- Garantir default em plans.duration_months
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'plans' AND column_name = 'duration_months'
    ) THEN
        ALTER TABLE plans ALTER COLUMN duration_months SET DEFAULT 1;
    END IF;
END $$;

-- Garantir default em students.status
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'students' AND column_name = 'status'
    ) THEN
        ALTER TABLE students ALTER COLUMN status SET DEFAULT 'ativo';
    END IF;
END $$;

-- Garantir default em treinos.ativo
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'treinos' AND column_name = 'ativo'
    ) THEN
        ALTER TABLE treinos ALTER COLUMN ativo SET DEFAULT TRUE;
    END IF;
END $$;

-- Garantir default em configuracoes.cor_primaria
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'configuracoes' AND column_name = 'cor_primaria'
    ) THEN
        ALTER TABLE configuracoes ALTER COLUMN cor_primaria SET DEFAULT '#3b82f6';
    END IF;
END $$;

-- Garantir default em configuracoes.cor_secundaria
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'configuracoes' AND column_name = 'cor_secundaria'
    ) THEN
        ALTER TABLE configuracoes ALTER COLUMN cor_secundaria SET DEFAULT '#18181b';
    END IF;
END $$;


-- ============================================================
-- FASE 4: FOREIGN KEYS (adicionar se não existir)
-- ============================================================

-- students.plan_id → plans(id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'students_plan_id_fkey' AND table_name = 'students'
    ) THEN
        ALTER TABLE students ADD CONSTRAINT students_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES plans(id);
    END IF;
END $$;

-- treinos.student_id → students(id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'treinos_student_id_fkey' AND table_name = 'treinos'
    ) THEN
        ALTER TABLE treinos ADD CONSTRAINT treinos_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id);
    END IF;
END $$;

-- avaliacoes.student_id → students(id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'avaliacoes_student_id_fkey' AND table_name = 'avaliacoes'
    ) THEN
        ALTER TABLE avaliacoes ADD CONSTRAINT avaliacoes_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id);
    END IF;
END $$;

-- anamneses.student_id → students(id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'anamneses_student_id_fkey' AND table_name = 'anamneses'
    ) THEN
        ALTER TABLE anamneses ADD CONSTRAINT anamneses_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id);
    END IF;
END $$;

-- bills.student_id → students(id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'bills_student_id_fkey' AND table_name = 'bills'
    ) THEN
        ALTER TABLE bills ADD CONSTRAINT bills_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id);
    END IF;
END $$;

-- assinaturas.student_id → students(id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'assinaturas_student_id_fkey' AND table_name = 'assinaturas'
    ) THEN
        ALTER TABLE assinaturas ADD CONSTRAINT assinaturas_student_id_fkey FOREIGN KEY (student_id) REFERENCES students(id);
    END IF;
END $$;

-- assinaturas.plan_id → plans(id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'assinaturas_plan_id_fkey' AND table_name = 'assinaturas'
    ) THEN
        ALTER TABLE assinaturas ADD CONSTRAINT assinaturas_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES plans(id);
    END IF;
END $$;


-- ============================================================
-- FASE 5: INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_plan_id ON students(plan_id);

CREATE INDEX IF NOT EXISTS idx_treinos_student_id ON treinos(student_id);
CREATE INDEX IF NOT EXISTS idx_treinos_ativo ON treinos(ativo);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_student_id ON avaliacoes(student_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_data ON avaliacoes(data);

CREATE INDEX IF NOT EXISTS idx_anamneses_student_id ON anamneses(student_id);

CREATE INDEX IF NOT EXISTS idx_financeiro_tipo ON financeiro(tipo);
CREATE INDEX IF NOT EXISTS idx_financeiro_status ON financeiro(status);
CREATE INDEX IF NOT EXISTS idx_financeiro_data ON financeiro(data_vencimento);

CREATE INDEX IF NOT EXISTS idx_bills_student_id ON bills(student_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(due_date);

CREATE INDEX IF NOT EXISTS idx_assinaturas_student_id ON assinaturas(student_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_plan_id ON assinaturas(plan_id);


-- ============================================================
-- FASE 6: TABELA user_profiles (Controle de Roles)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY,
    role TEXT DEFAULT 'aluno',
    display_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Garantir default em user_profiles.role
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE user_profiles ALTER COLUMN role SET DEFAULT 'aluno';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);


-- ============================================================
-- FASE 7: ROW LEVEL SECURITY (RLS)
-- Políticas de segurança por usuário
-- ============================================================

-- Habilitar RLS nas tabelas principais
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamneses ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Função auxiliar: verificar se o usuário é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---- Policies para students ----
DO $$ BEGIN
    DROP POLICY IF EXISTS "students_select" ON students;
    CREATE POLICY "students_select" ON students FOR SELECT USING (
        user_id = auth.uid() OR is_admin()
    );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "students_insert" ON students;
    CREATE POLICY "students_insert" ON students FOR INSERT WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "students_update" ON students;
    CREATE POLICY "students_update" ON students FOR UPDATE USING (
        user_id = auth.uid() OR is_admin()
    );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "students_delete" ON students;
    CREATE POLICY "students_delete" ON students FOR DELETE USING (
        is_admin()
    );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ---- Policies para user_profiles ----
DO $$ BEGIN
    DROP POLICY IF EXISTS "profiles_select" ON user_profiles;
    CREATE POLICY "profiles_select" ON user_profiles FOR SELECT USING (
        id = auth.uid() OR is_admin()
    );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "profiles_insert" ON user_profiles;
    CREATE POLICY "profiles_insert" ON user_profiles FOR INSERT WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "profiles_update" ON user_profiles;
    CREATE POLICY "profiles_update" ON user_profiles FOR UPDATE USING (
        id = auth.uid() OR is_admin()
    );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ---- Policies para demais tabelas (admin full, user own data) ----
DO $$ BEGIN
    DROP POLICY IF EXISTS "treinos_all" ON treinos;
    CREATE POLICY "treinos_all" ON treinos FOR ALL USING (
        user_id = auth.uid() OR is_admin()
    );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "avaliacoes_all" ON avaliacoes;
    CREATE POLICY "avaliacoes_all" ON avaliacoes FOR ALL USING (
        user_id = auth.uid() OR is_admin()
    );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "anamneses_all" ON anamneses;
    CREATE POLICY "anamneses_all" ON anamneses FOR ALL USING (
        user_id = auth.uid() OR is_admin()
    );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "financeiro_all" ON financeiro;
    CREATE POLICY "financeiro_all" ON financeiro FOR ALL USING (
        is_admin()
    );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "bills_all" ON bills;
    CREATE POLICY "bills_all" ON bills FOR ALL USING (
        is_admin()
    );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "plans_select" ON plans;
    CREATE POLICY "plans_select" ON plans FOR SELECT USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "plans_modify" ON plans;
    CREATE POLICY "plans_modify" ON plans FOR ALL USING (
        is_admin()
    );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "assinaturas_all" ON assinaturas;
    CREATE POLICY "assinaturas_all" ON assinaturas FOR ALL USING (
        user_id = auth.uid() OR is_admin()
    );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "configuracoes_all" ON configuracoes;
    CREATE POLICY "configuracoes_all" ON configuracoes FOR ALL USING (
        is_admin()
    );
EXCEPTION WHEN OTHERS THEN NULL;
END $$;



-- ============================================================
-- FASE 8: SUPER ADMIN — Proteção absoluta
-- Email: marilsonns15@gmail.com
-- ============================================================

-- Função: bloquear DELETE no super admin (RETURN OLD correto para DELETE)
CREATE OR REPLACE FUNCTION protect_super_admin_delete()
RETURNS trigger AS $$
DECLARE
    super_admin_id UUID;
BEGIN
    SELECT id INTO super_admin_id
    FROM auth.users
    WHERE email = 'marilsonns15@gmail.com';

    IF OLD.id = super_admin_id THEN
        RAISE EXCEPTION 'Super admin não pode ser removido.';
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função: bloquear UPDATE no super admin (RETURN NEW para permitir updates normais)
CREATE OR REPLACE FUNCTION protect_super_admin_update()
RETURNS trigger AS $$
DECLARE
    super_admin_id UUID;
BEGIN
    SELECT id INTO super_admin_id
    FROM auth.users
    WHERE email = 'marilsonns15@gmail.com';

    IF OLD.id = super_admin_id THEN
        RAISE EXCEPTION 'Super admin não pode ser alterado.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bloquear DELETE do super admin
DROP TRIGGER IF EXISTS block_delete_super_admin ON user_profiles;
CREATE TRIGGER block_delete_super_admin
    BEFORE DELETE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION protect_super_admin_delete();

-- Bloquear UPDATE do super admin (retorna NEW para não bloquear outros)
DROP TRIGGER IF EXISTS block_update_super_admin ON user_profiles;
CREATE TRIGGER block_update_super_admin
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION protect_super_admin_update();

-- Função: forçar role='admin' sempre para o super admin
CREATE OR REPLACE FUNCTION enforce_super_admin_role()
RETURNS trigger AS $$
DECLARE
    super_admin_id UUID;
BEGIN
    SELECT id INTO super_admin_id
    FROM auth.users
    WHERE email = 'marilsonns15@gmail.com';

    IF NEW.id = super_admin_id THEN
        NEW.role := 'admin';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_super_admin_role_trigger ON user_profiles;
CREATE TRIGGER enforce_super_admin_role_trigger
    BEFORE INSERT OR UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION enforce_super_admin_role();


-- ============================================================
-- PRONTO! Schema completo e seguro.
-- Tabelas: plans, students, treinos, avaliacoes, anamneses,
--          financeiro, bills, assinaturas, configuracoes,
--          user_profiles
-- Super Admin: marilsonns15@gmail.com (protegido por triggers)
-- ============================================================

