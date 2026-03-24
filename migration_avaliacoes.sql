-- =====================================================
-- MIGRAÇÃO: Garantir todas as colunas da tabela avaliacoes
-- Rodar no Supabase SQL Editor (https://supabase.com/dashboard)
-- Idempotente: pode rodar múltiplas vezes sem erro
-- =====================================================

-- Colunas base
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS imc NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS percentual_gordura NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS gordura_corporal NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS massa_magra NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS massa_gorda NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS soma_dobras NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS protocolo TEXT;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS observacoes TEXT;

-- Colunas JSONB (medidas e dobras agrupadas)
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS medidas JSONB;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS dobras JSONB;

-- Perímetros flat (legado, mantido para compatibilidade)
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

-- Dobras flat (legado)
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS tricipital NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS subescapular NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS supra_iliaca NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS abdominal NUMERIC;

-- Pressão arterial e frequência
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS pressao_arterial_sistolica NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS pressao_arterial_diastolica NUMERIC;
ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS frequencia_cardiaca_repouso NUMERIC;

-- Índices
CREATE INDEX IF NOT EXISTS idx_avaliacoes_student_id ON avaliacoes(student_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_data ON avaliacoes(data);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_user_id ON avaliacoes(user_id);
