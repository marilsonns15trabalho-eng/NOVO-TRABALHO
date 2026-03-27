-- ============================================================
-- Phase 2.09 - Rollback to legacy read model
-- This script enables/keeps freeze ON and restores legacy policies.
-- Keep new columns and reconciliation data for audit.
-- After rollback smoke tests succeed, run phase2_08_freeze_off.sql.
-- ============================================================

BEGIN;

SET LOCAL search_path = public;
SET LOCAL app.migration_mode = 'on';

UPDATE public.phase2_migration_control
SET write_freeze_enabled = TRUE,
    updated_at = NOW()
WHERE singleton = TRUE;

DROP POLICY IF EXISTS "students_select" ON public.students;
CREATE POLICY "students_select" ON public.students FOR SELECT USING (
    user_id = auth.uid() OR public.is_admin()
);

DROP POLICY IF EXISTS "students_update" ON public.students;
CREATE POLICY "students_update" ON public.students FOR UPDATE USING (
    user_id = auth.uid() OR public.is_admin()
) WITH CHECK (
    user_id = auth.uid() OR public.is_admin()
);

DROP POLICY IF EXISTS "treinos_select" ON public.treinos;
DROP POLICY IF EXISTS "treinos_insert" ON public.treinos;
DROP POLICY IF EXISTS "treinos_update" ON public.treinos;
DROP POLICY IF EXISTS "treinos_delete" ON public.treinos;
DROP POLICY IF EXISTS "treinos_all" ON public.treinos;
CREATE POLICY "treinos_all" ON public.treinos FOR ALL USING (
    user_id = auth.uid() OR public.is_admin()
);

DROP POLICY IF EXISTS "avaliacoes_select" ON public.avaliacoes;
DROP POLICY IF EXISTS "avaliacoes_insert" ON public.avaliacoes;
DROP POLICY IF EXISTS "avaliacoes_update" ON public.avaliacoes;
DROP POLICY IF EXISTS "avaliacoes_delete" ON public.avaliacoes;
DROP POLICY IF EXISTS "avaliacoes_all" ON public.avaliacoes;

CREATE POLICY "avaliacoes_select" ON public.avaliacoes FOR SELECT USING (
    user_id = auth.uid() OR public.is_admin()
);

CREATE POLICY "avaliacoes_insert" ON public.avaliacoes FOR INSERT WITH CHECK (
    user_id = auth.uid() OR public.is_admin()
);

CREATE POLICY "avaliacoes_update" ON public.avaliacoes FOR UPDATE USING (
    user_id = auth.uid() OR public.is_admin()
) WITH CHECK (
    user_id = auth.uid() OR public.is_admin()
);

CREATE POLICY "avaliacoes_delete" ON public.avaliacoes FOR DELETE USING (
    user_id = auth.uid() OR public.is_admin()
);

DROP POLICY IF EXISTS "anamneses_select" ON public.anamneses;
DROP POLICY IF EXISTS "anamneses_insert" ON public.anamneses;
DROP POLICY IF EXISTS "anamneses_update" ON public.anamneses;
DROP POLICY IF EXISTS "anamneses_delete" ON public.anamneses;
DROP POLICY IF EXISTS "anamneses_all" ON public.anamneses;
CREATE POLICY "anamneses_all" ON public.anamneses FOR ALL USING (
    user_id = auth.uid() OR public.is_admin()
);

DROP POLICY IF EXISTS "assinaturas_select" ON public.assinaturas;
DROP POLICY IF EXISTS "assinaturas_insert" ON public.assinaturas;
DROP POLICY IF EXISTS "assinaturas_update" ON public.assinaturas;
DROP POLICY IF EXISTS "assinaturas_delete" ON public.assinaturas;
DROP POLICY IF EXISTS "assinaturas_all" ON public.assinaturas;
CREATE POLICY "assinaturas_all" ON public.assinaturas FOR ALL USING (
    user_id = auth.uid() OR public.is_admin()
);

SELECT singleton, write_freeze_enabled, updated_at
FROM public.phase2_migration_control
WHERE singleton = TRUE;

COMMIT;
