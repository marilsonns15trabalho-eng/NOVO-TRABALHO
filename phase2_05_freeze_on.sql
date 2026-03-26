-- ============================================================
-- Phase 2.05 - Enable controlled write freeze
-- Freeze affects only the tables covered by phase2 triggers.
-- Migration sessions can bypass with:
--   SET LOCAL app.migration_mode = 'on';
-- ============================================================

SET search_path = public;

DO $$
BEGIN
    IF to_regclass('public.phase2_migration_control') IS NULL THEN
        RAISE EXCEPTION 'Tabela public.phase2_migration_control nao encontrada. Rode phase2_01_expand.sql antes.';
    END IF;
END $$;

UPDATE public.phase2_migration_control
SET write_freeze_enabled = TRUE,
    updated_at = NOW()
WHERE singleton = TRUE;

SELECT singleton, write_freeze_enabled, updated_at
FROM public.phase2_migration_control
WHERE singleton = TRUE;
