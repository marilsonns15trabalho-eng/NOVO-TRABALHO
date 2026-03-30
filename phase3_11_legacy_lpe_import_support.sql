-- ============================================================
-- FASE 3.11 - SUPORTE A IMPORTACAO DO LEGADO LPE
-- Rodar no projeto novo depois de phase3_01/08/09/10.
-- Objetivo:
--   * permitir importacao idempotente do banco SQLite legado
--   * rastrear ids de origem sem poluir a operacao diaria
--   * evitar duplicidade em reprocessamentos
-- ============================================================

SET search_path = public;

ALTER TABLE public.plans
    ADD COLUMN IF NOT EXISTS legacy_lpe_id INTEGER;

ALTER TABLE public.students
    ADD COLUMN IF NOT EXISTS legacy_lpe_id INTEGER;

ALTER TABLE public.assinaturas
    ADD COLUMN IF NOT EXISTS legacy_lpe_id INTEGER;

ALTER TABLE public.avaliacoes
    ADD COLUMN IF NOT EXISTS legacy_lpe_id INTEGER;

ALTER TABLE public.bills
    ADD COLUMN IF NOT EXISTS legacy_lpe_id INTEGER;

ALTER TABLE public.financeiro
    ADD COLUMN IF NOT EXISTS legacy_lpe_source TEXT,
    ADD COLUMN IF NOT EXISTS legacy_lpe_id INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS idx_plans_legacy_lpe_unique
    ON public.plans(legacy_lpe_id)
    WHERE legacy_lpe_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_students_legacy_lpe_unique
    ON public.students(legacy_lpe_id)
    WHERE legacy_lpe_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_assinaturas_legacy_lpe_unique
    ON public.assinaturas(legacy_lpe_id)
    WHERE legacy_lpe_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_avaliacoes_legacy_lpe_unique
    ON public.avaliacoes(legacy_lpe_id)
    WHERE legacy_lpe_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_bills_legacy_lpe_unique
    ON public.bills(legacy_lpe_id)
    WHERE legacy_lpe_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_financeiro_legacy_lpe_unique
    ON public.financeiro(legacy_lpe_source, legacy_lpe_id)
    WHERE legacy_lpe_source IS NOT NULL
      AND legacy_lpe_id IS NOT NULL;

ANALYZE public.plans;
ANALYZE public.students;
ANALYZE public.assinaturas;
ANALYZE public.avaliacoes;
ANALYZE public.bills;
ANALYZE public.financeiro;
