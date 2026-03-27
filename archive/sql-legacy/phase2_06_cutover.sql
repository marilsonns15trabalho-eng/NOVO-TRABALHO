-- ============================================================
-- Phase 2.06 - Final cutover
-- Requires freeze enabled before execution.
-- Keeps freeze ON after completion.
-- ============================================================

BEGIN;

SET LOCAL search_path = public;
SET LOCAL app.migration_mode = 'on';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.phase2_migration_control
        WHERE singleton = TRUE
          AND write_freeze_enabled = TRUE
    ) THEN
        RAISE EXCEPTION 'Write freeze nao esta ativo. Rode phase2_05_freeze_on.sql antes do cutover.';
    END IF;

    IF to_regprocedure('public.phase2_can_read_student_record(uuid)') IS NULL THEN
        RAISE EXCEPTION 'Funcao public.phase2_can_read_student_record(uuid) nao encontrada. Rode phase2_01_expand.sql antes do cutover.';
    END IF;

    IF to_regprocedure('public.phase2_can_read_student_as(uuid,uuid)') IS NULL THEN
        RAISE EXCEPTION 'Funcao public.phase2_can_read_student_as(uuid,uuid) nao encontrada. Rode phase2_01_expand.sql antes do cutover.';
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.phase2_can_read_student_record(target_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = target_student_id
          AND (
                s.linked_auth_user_id = auth.uid()
             OR public.is_admin()
          )
    );
$$;

CREATE OR REPLACE FUNCTION public.phase2_can_read_student_as(actor_user_id UUID, target_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = target_student_id
          AND (
                s.linked_auth_user_id = actor_user_id
             OR EXISTS (
                    SELECT 1
                    FROM public.user_profiles up
                    WHERE up.id = actor_user_id
                      AND (
                            up.role = 'admin'
                         OR COALESCE(up.is_super_admin, FALSE) = TRUE
                      )
                )
          )
    );
$$;

UPDATE public.students s
SET created_by_auth_user_id = s.user_id
FROM public.user_profiles up
WHERE s.user_id IS NOT NULL
  AND s.created_by_auth_user_id IS NULL
  AND up.id = s.user_id
  AND (
        up.role IN ('admin', 'professor')
     OR COALESCE(up.is_super_admin, FALSE) = TRUE
  );

WITH deterministic_link AS (
    SELECT
        s.id,
        s.user_id
    FROM public.students s
    JOIN public.user_profiles up ON up.id = s.user_id
    JOIN auth.users au ON au.id = s.user_id
    WHERE s.user_id IS NOT NULL
      AND up.role = 'aluno'
      AND COALESCE(up.is_super_admin, FALSE) = FALSE
      AND s.email IS NOT NULL
      AND au.email IS NOT NULL
      AND s.email = au.email
      AND NOT EXISTS (
            SELECT 1
            FROM public.students s2
            WHERE s2.user_id = s.user_id
              AND s2.id <> s.id
        )
      AND NOT EXISTS (
            SELECT 1
            FROM public.students s3
            WHERE s3.email = s.email
              AND s3.id <> s.id
        )
)
UPDATE public.students s
SET linked_auth_user_id = d.user_id
FROM deterministic_link d
WHERE s.id = d.id
  AND s.linked_auth_user_id IS NULL;

DO $$
DECLARE
    v_multiple_resolved_students INTEGER;
    v_multiple_resolved_users INTEGER;
    v_invalid_resolved_users INTEGER;
    v_conflicting_existing_links INTEGER;
    v_duplicate_links INTEGER;
    v_invalid_role_links INTEGER;
    v_treinos_orfaos INTEGER;
    v_avaliacoes_orfaos INTEGER;
    v_anamneses_orfaos INTEGER;
    v_assinaturas_orfaos INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_multiple_resolved_students
    FROM (
        SELECT student_id
        FROM public.student_link_reconciliation
        WHERE status = 'resolved'
        GROUP BY student_id
        HAVING COUNT(*) > 1
    ) q;

    IF v_multiple_resolved_students > 0 THEN
        RAISE EXCEPTION 'Cutover abortado: existe student_id com mais de um candidato resolved.';
    END IF;

    SELECT COUNT(*)
    INTO v_multiple_resolved_users
    FROM (
        SELECT possible_auth_user_id
        FROM public.student_link_reconciliation
        WHERE status = 'resolved'
        GROUP BY possible_auth_user_id
        HAVING COUNT(*) > 1
    ) q;

    IF v_multiple_resolved_users > 0 THEN
        RAISE EXCEPTION 'Cutover abortado: existe possible_auth_user_id resolved em mais de um student.';
    END IF;

    SELECT COUNT(*)
    INTO v_invalid_resolved_users
    FROM public.student_link_reconciliation r
    LEFT JOIN public.user_profiles up ON up.id = r.possible_auth_user_id
    WHERE r.status = 'resolved'
      AND (
            up.id IS NULL
         OR up.role <> 'aluno'
         OR COALESCE(up.is_super_admin, FALSE) = TRUE
      );

    IF v_invalid_resolved_users > 0 THEN
        RAISE EXCEPTION 'Cutover abortado: existe candidate resolved com role invalida.';
    END IF;

    SELECT COUNT(*)
    INTO v_conflicting_existing_links
    FROM public.students s
    JOIN public.student_link_reconciliation r
      ON r.student_id = s.id
     AND r.status = 'resolved'
    WHERE s.linked_auth_user_id IS NOT NULL
      AND s.linked_auth_user_id <> r.possible_auth_user_id;

    IF v_conflicting_existing_links > 0 THEN
        RAISE EXCEPTION 'Cutover abortado: existe linked_auth_user_id ja preenchido com valor diferente do resolved.';
    END IF;
END $$;

UPDATE public.students s
SET linked_auth_user_id = r.possible_auth_user_id
FROM public.student_link_reconciliation r
WHERE r.status = 'resolved'
  AND r.student_id = s.id
  AND s.linked_auth_user_id IS NULL;

SELECT COUNT(*) AS students_com_user_id_sem_linked_auth_user_id
FROM public.students
WHERE user_id IS NOT NULL
  AND linked_auth_user_id IS NULL;

SELECT COALESCE(up.role, 'sem_user_profile') AS legacy_user_role, COUNT(*) AS total
FROM public.students s
LEFT JOIN public.user_profiles up ON up.id = s.user_id
WHERE s.user_id IS NOT NULL
  AND s.linked_auth_user_id IS NULL
GROUP BY COALESCE(up.role, 'sem_user_profile')
ORDER BY legacy_user_role;

DO $$
DECLARE
    v_duplicate_links INTEGER;
    v_invalid_role_links INTEGER;
    v_treinos_orfaos INTEGER;
    v_avaliacoes_orfaos INTEGER;
    v_anamneses_orfaos INTEGER;
    v_assinaturas_orfaos INTEGER;
    v_students_with_user_id INTEGER;
    v_students_with_user_id_without_link INTEGER;
    v_resolved_post_cut_mismatch INTEGER;
    v_unlinked_abs_abort_threshold CONSTANT INTEGER := 50;
    v_unlinked_ratio_min_rows CONSTANT INTEGER := 10;
    v_unlinked_ratio_abort_threshold CONSTANT NUMERIC := 0.05;
    v_unlinked_ratio NUMERIC := 0;
BEGIN
    SELECT COUNT(*)
    INTO v_duplicate_links
    FROM (
        SELECT linked_auth_user_id
        FROM public.students
        WHERE linked_auth_user_id IS NOT NULL
        GROUP BY linked_auth_user_id
        HAVING COUNT(*) > 1
    ) q;

    IF v_duplicate_links > 0 THEN
        RAISE EXCEPTION 'Cutover abortado: linked_auth_user_id duplicado.';
    END IF;

    SELECT COUNT(*)
    INTO v_invalid_role_links
    FROM public.students s
    JOIN public.user_profiles up ON up.id = s.linked_auth_user_id
    WHERE s.linked_auth_user_id IS NOT NULL
      AND (
            up.role <> 'aluno'
         OR COALESCE(up.is_super_admin, FALSE) = TRUE
      );

    IF v_invalid_role_links > 0 THEN
        RAISE EXCEPTION 'Cutover abortado: linked_auth_user_id apontando para role invalida.';
    END IF;

    SELECT COUNT(*)
    INTO v_students_with_user_id
    FROM public.students
    WHERE user_id IS NOT NULL;

    SELECT COUNT(*)
    INTO v_students_with_user_id_without_link
    FROM public.students
    WHERE user_id IS NOT NULL
      AND linked_auth_user_id IS NULL;

    IF v_students_with_user_id > 0 THEN
        v_unlinked_ratio := v_students_with_user_id_without_link::NUMERIC / v_students_with_user_id::NUMERIC;
    END IF;

    IF v_students_with_user_id_without_link >= v_unlinked_abs_abort_threshold
       OR (
            v_students_with_user_id_without_link >= v_unlinked_ratio_min_rows
        AND v_unlinked_ratio >= v_unlinked_ratio_abort_threshold
       ) THEN
        RAISE EXCEPTION
            'Cutover abortado: volume significativo de students com user_id mas sem linked_auth_user_id (% de %, %%%).',
            v_students_with_user_id_without_link,
            v_students_with_user_id,
            ROUND(v_unlinked_ratio * 100, 2);
    END IF;

    SELECT COUNT(*)
    INTO v_resolved_post_cut_mismatch
    FROM public.student_link_reconciliation r
    JOIN public.students s ON s.id = r.student_id
    WHERE r.status = 'resolved'
      AND s.linked_auth_user_id IS DISTINCT FROM r.possible_auth_user_id;

    IF v_resolved_post_cut_mismatch > 0 THEN
        RAISE EXCEPTION 'Cutover abortado: reconciliation resolved divergente do linked_auth_user_id apos aplicacao.';
    END IF;

    SELECT COUNT(*)
    INTO v_treinos_orfaos
    FROM public.treinos t
    LEFT JOIN public.students s ON s.id = t.student_id
    WHERE t.student_id IS NOT NULL
      AND s.id IS NULL;

    IF v_treinos_orfaos > 0 THEN
        RAISE EXCEPTION 'Cutover abortado: existem treinos com student_id sem students.';
    END IF;

    SELECT COUNT(*)
    INTO v_avaliacoes_orfaos
    FROM public.avaliacoes a
    LEFT JOIN public.students s ON s.id = a.student_id
    WHERE a.student_id IS NOT NULL
      AND s.id IS NULL;

    IF v_avaliacoes_orfaos > 0 THEN
        RAISE EXCEPTION 'Cutover abortado: existem avaliacoes com student_id sem students.';
    END IF;

    SELECT COUNT(*)
    INTO v_anamneses_orfaos
    FROM public.anamneses a
    LEFT JOIN public.students s ON s.id = a.student_id
    WHERE a.student_id IS NOT NULL
      AND s.id IS NULL;

    IF v_anamneses_orfaos > 0 THEN
        RAISE EXCEPTION 'Cutover abortado: existem anamneses com student_id sem students.';
    END IF;

    SELECT COUNT(*)
    INTO v_assinaturas_orfaos
    FROM public.assinaturas a
    LEFT JOIN public.students s ON s.id = a.student_id
    WHERE a.student_id IS NOT NULL
      AND s.id IS NULL;

    IF v_assinaturas_orfaos > 0 THEN
        RAISE EXCEPTION 'Cutover abortado: existem assinaturas com student_id sem students.';
    END IF;
END $$;

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamneses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students_select" ON public.students;
CREATE POLICY "students_select" ON public.students FOR SELECT USING (
    linked_auth_user_id = auth.uid()
    OR public.is_admin()
);

DROP POLICY IF EXISTS "students_update" ON public.students;
CREATE POLICY "students_update" ON public.students FOR UPDATE USING (
    linked_auth_user_id = auth.uid()
    OR public.is_admin()
) WITH CHECK (
    linked_auth_user_id = auth.uid()
    OR public.is_admin()
);

DROP POLICY IF EXISTS "treinos_all" ON public.treinos;
DROP POLICY IF EXISTS "treinos_select" ON public.treinos;
DROP POLICY IF EXISTS "treinos_insert" ON public.treinos;
DROP POLICY IF EXISTS "treinos_update" ON public.treinos;
DROP POLICY IF EXISTS "treinos_delete" ON public.treinos;

CREATE POLICY "treinos_select" ON public.treinos FOR SELECT USING (
    EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = student_id
          AND s.linked_auth_user_id = auth.uid()
    )
    OR public.is_admin()
);

CREATE POLICY "treinos_insert" ON public.treinos FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = student_id
          AND s.linked_auth_user_id = auth.uid()
    )
    OR public.is_admin()
);

CREATE POLICY "treinos_update" ON public.treinos FOR UPDATE USING (
    EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = student_id
          AND s.linked_auth_user_id = auth.uid()
    )
    OR public.is_admin()
) WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = student_id
          AND s.linked_auth_user_id = auth.uid()
    )
    OR public.is_admin()
);

CREATE POLICY "treinos_delete" ON public.treinos FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = student_id
          AND s.linked_auth_user_id = auth.uid()
    )
    OR public.is_admin()
);

DROP POLICY IF EXISTS "avaliacoes_select" ON public.avaliacoes;
DROP POLICY IF EXISTS "avaliacoes_insert" ON public.avaliacoes;
DROP POLICY IF EXISTS "avaliacoes_update" ON public.avaliacoes;
DROP POLICY IF EXISTS "avaliacoes_delete" ON public.avaliacoes;
DROP POLICY IF EXISTS "avaliacoes_all" ON public.avaliacoes;

CREATE POLICY "avaliacoes_select" ON public.avaliacoes FOR SELECT USING (
    EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = student_id
          AND s.linked_auth_user_id = auth.uid()
    )
    OR public.is_admin()
);

CREATE POLICY "avaliacoes_insert" ON public.avaliacoes FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = student_id
          AND s.linked_auth_user_id = auth.uid()
    )
    OR public.is_admin()
);

CREATE POLICY "avaliacoes_update" ON public.avaliacoes FOR UPDATE USING (
    EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = student_id
          AND s.linked_auth_user_id = auth.uid()
    )
    OR public.is_admin()
) WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = student_id
          AND s.linked_auth_user_id = auth.uid()
    )
    OR public.is_admin()
);

CREATE POLICY "avaliacoes_delete" ON public.avaliacoes FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = student_id
          AND s.linked_auth_user_id = auth.uid()
    )
    OR public.is_admin()
);

DROP POLICY IF EXISTS "anamneses_all" ON public.anamneses;
DROP POLICY IF EXISTS "anamneses_select" ON public.anamneses;
DROP POLICY IF EXISTS "anamneses_insert" ON public.anamneses;
DROP POLICY IF EXISTS "anamneses_update" ON public.anamneses;
DROP POLICY IF EXISTS "anamneses_delete" ON public.anamneses;

CREATE POLICY "anamneses_select" ON public.anamneses FOR SELECT USING (
    EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = student_id
          AND s.linked_auth_user_id = auth.uid()
    )
    OR public.is_admin()
);

CREATE POLICY "anamneses_insert" ON public.anamneses FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = student_id
          AND s.linked_auth_user_id = auth.uid()
    )
    OR public.is_admin()
);

CREATE POLICY "anamneses_update" ON public.anamneses FOR UPDATE USING (
    EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = student_id
          AND s.linked_auth_user_id = auth.uid()
    )
    OR public.is_admin()
) WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = student_id
          AND s.linked_auth_user_id = auth.uid()
    )
    OR public.is_admin()
);

CREATE POLICY "anamneses_delete" ON public.anamneses FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = student_id
          AND s.linked_auth_user_id = auth.uid()
    )
    OR public.is_admin()
);

DROP POLICY IF EXISTS "assinaturas_all" ON public.assinaturas;
DROP POLICY IF EXISTS "assinaturas_select" ON public.assinaturas;
DROP POLICY IF EXISTS "assinaturas_insert" ON public.assinaturas;
DROP POLICY IF EXISTS "assinaturas_update" ON public.assinaturas;
DROP POLICY IF EXISTS "assinaturas_delete" ON public.assinaturas;

CREATE POLICY "assinaturas_select" ON public.assinaturas FOR SELECT USING (
    EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = student_id
          AND s.linked_auth_user_id = auth.uid()
    )
    OR public.is_admin()
);

CREATE POLICY "assinaturas_insert" ON public.assinaturas FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = student_id
          AND s.linked_auth_user_id = auth.uid()
    )
    OR public.is_admin()
);

CREATE POLICY "assinaturas_update" ON public.assinaturas FOR UPDATE USING (
    EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = student_id
          AND s.linked_auth_user_id = auth.uid()
    )
    OR public.is_admin()
) WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = student_id
          AND s.linked_auth_user_id = auth.uid()
    )
    OR public.is_admin()
);

CREATE POLICY "assinaturas_delete" ON public.assinaturas FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = student_id
          AND s.linked_auth_user_id = auth.uid()
    )
    OR public.is_admin()
);

SELECT linked_auth_user_id, COUNT(*) AS total
FROM public.students
WHERE linked_auth_user_id IS NOT NULL
GROUP BY linked_auth_user_id
HAVING COUNT(*) > 1;

SELECT s.id AS student_id, COUNT(*) AS readable_by_alunos
FROM public.students s
JOIN public.user_profiles actor
  ON actor.role = 'aluno'
 AND public.phase2_can_read_student_as(actor.id, s.id)
GROUP BY s.id
HAVING COUNT(*) > 1
ORDER BY readable_by_alunos DESC, s.id;

SELECT actor.id AS aluno_id, s.id AS student_id, s.linked_auth_user_id, s.created_by_auth_user_id
FROM public.user_profiles actor
JOIN public.students s
  ON actor.role = 'aluno'
 AND public.phase2_can_read_student_as(actor.id, s.id)
WHERE s.linked_auth_user_id IS DISTINCT FROM actor.id
ORDER BY actor.id, s.id;

SELECT s.id AS student_id,
       r.possible_auth_user_id AS resolved_auth_user_id,
       s.linked_auth_user_id AS current_linked_auth_user_id
FROM public.student_link_reconciliation r
JOIN public.students s ON s.id = r.student_id
WHERE r.status = 'resolved'
  AND s.linked_auth_user_id IS DISTINCT FROM r.possible_auth_user_id
ORDER BY s.id;

DO $$
DECLARE
    v_duplicate_links INTEGER;
    v_leak_multiple_alunos INTEGER;
    v_leak_wrong_aluno INTEGER;
    v_resolved_post_cut_mismatch INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_duplicate_links
    FROM (
        SELECT linked_auth_user_id
        FROM public.students
        WHERE linked_auth_user_id IS NOT NULL
        GROUP BY linked_auth_user_id
        HAVING COUNT(*) > 1
    ) q;

    IF v_duplicate_links > 0 THEN
        RAISE EXCEPTION 'Cutover abortado: linked_auth_user_id duplicado apos aplicacao das policies.';
    END IF;

    SELECT COUNT(*)
    INTO v_leak_multiple_alunos
    FROM (
        SELECT s.id
        FROM public.students s
        JOIN public.user_profiles actor
          ON actor.role = 'aluno'
         AND public.phase2_can_read_student_as(actor.id, s.id)
        GROUP BY s.id
        HAVING COUNT(*) > 1
    ) q;

    IF v_leak_multiple_alunos > 0 THEN
        RAISE EXCEPTION 'Cutover abortado: um student pode ser lido por mais de um aluno.';
    END IF;

    SELECT COUNT(*)
    INTO v_leak_wrong_aluno
    FROM public.user_profiles actor
    JOIN public.students s
      ON actor.role = 'aluno'
     AND public.phase2_can_read_student_as(actor.id, s.id)
    WHERE s.linked_auth_user_id IS DISTINCT FROM actor.id;

    IF v_leak_wrong_aluno > 0 THEN
        RAISE EXCEPTION 'Cutover abortado: existe aluno lendo student que nao esta vinculado a ele.';
    END IF;

    SELECT COUNT(*)
    INTO v_resolved_post_cut_mismatch
    FROM public.student_link_reconciliation r
    JOIN public.students s ON s.id = r.student_id
    WHERE r.status = 'resolved'
      AND s.linked_auth_user_id IS DISTINCT FROM r.possible_auth_user_id;

    IF v_resolved_post_cut_mismatch > 0 THEN
        RAISE EXCEPTION 'Cutover abortado: reconciliation resolved divergente do linked_auth_user_id no pos-cut.';
    END IF;
END $$;

SELECT COUNT(*) AS total_students_pos_cut
FROM public.students;

SELECT COUNT(*) AS total_linked_pos_cut
FROM public.students
WHERE linked_auth_user_id IS NOT NULL;

SELECT COUNT(*) AS total_created_by_pos_cut
FROM public.students
WHERE created_by_auth_user_id IS NOT NULL;

COMMIT;
