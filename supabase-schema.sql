-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de Planos
CREATE TABLE IF NOT EXISTS plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  frequency INTEGER,
  price DECIMAL(10,2) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabela de Alunos
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  birth_date DATE,
  gender TEXT,
  address TEXT,
  plan_id UUID REFERENCES plans(id),
  plan_name TEXT DEFAULT 'Mensal',
  profession TEXT,
  emergency_contact TEXT,
  modality TEXT DEFAULT 'Presencial', -- 'Presencial' ou 'Consultoria Online'
  objectives TEXT[] DEFAULT '{}',
  desired_weight DECIMAL(5,2),
  start_date DATE DEFAULT CURRENT_DATE,
  amount_paid DECIMAL(10,2),
  notes TEXT,
  status TEXT DEFAULT 'Ativo',
  join_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabela de Transações (Fluxo de Caixa)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabela de Pagamentos de Alunos (Mensalidades)
CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  payment_date DATE,
  status TEXT NOT NULL CHECK (status IN ('paid', 'pending', 'overdue')),
  method TEXT CHECK (method IN ('pix', 'cash', 'card', 'boleto')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabela de Avaliações Físicas
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  weight DECIMAL(5,2),
  height DECIMAL(5,2),
  skinfolds JSONB,
  perimeters JSONB,
  results JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabela de Anamnese
CREATE TABLE IF NOT EXISTS anamnesis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Tabela de Treinos
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  exercises JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE anamnesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Criar políticas básicas (Permitir tudo para usuários anônimos por enquanto)
-- Nota: Em produção, estas políticas devem ser restritas a usuários autenticados.

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for anon users' AND tablename = 'plans') THEN
        CREATE POLICY "Allow all for anon users" ON plans FOR ALL USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for anon users' AND tablename = 'students') THEN
        CREATE POLICY "Allow all for anon users" ON students FOR ALL USING (true) WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for anon users' AND tablename = 'transactions') THEN
        CREATE POLICY "Allow all for anon users" ON transactions FOR ALL USING (true) WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for anon users' AND tablename = 'memberships') THEN
        CREATE POLICY "Allow all for anon users" ON memberships FOR ALL USING (true) WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for anon users' AND tablename = 'assessments') THEN
        CREATE POLICY "Allow all for anon users" ON assessments FOR ALL USING (true) WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for anon users' AND tablename = 'anamnesis') THEN
        CREATE POLICY "Allow all for anon users" ON anamnesis FOR ALL USING (true) WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all for anon users' AND tablename = 'workouts') THEN
        CREATE POLICY "Allow all for anon users" ON workouts FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;
