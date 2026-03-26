-- ============================================================
-- Phase 2.08 - Disable controlled write freeze
-- Run only after successful validation or after rollback smoke tests.
-- ============================================================

SET search_path = public;

DO $$
BEGIN
    IF to_regclass('public.phase2_migration_control') IS NULL THEN
        RAISE EXCEPTION 'Tabela public.phase2_migration_control nao encontrada.';
    END IF;
END $$;

UPDATE public.phase2_migration_control
SET write_freeze_enabled = FALSE,
    updated_at = NOW()
WHERE singleton = TRUE;

SELECT singleton, write_freeze_enabled, updated_at
FROM public.phase2_migration_control
WHERE singleton = TRUE;
