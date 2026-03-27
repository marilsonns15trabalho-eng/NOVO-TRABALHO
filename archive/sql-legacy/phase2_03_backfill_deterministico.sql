-- ============================================================
-- Phase 2.03 - Deterministic backfill only
-- No weak inference. Keeps students.user_id untouched.
-- ============================================================

SET search_path = public;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'students'
          AND column_name = 'linked_auth_user_id'
    ) THEN
        RAISE EXCEPTION 'Coluna students.linked_auth_user_id nao encontrada. Rode phase2_01_expand.sql antes.';
    END IF;
END $$;

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
      AND NOT EXISTS (
            SELECT 1
            FROM public.students s2
            WHERE s2.user_id = s.user_id
              AND s2.id <> s.id
        )
)
UPDATE public.students s
SET linked_auth_user_id = d.user_id
FROM deterministic_link d
WHERE s.id = d.id
  AND s.linked_auth_user_id IS NULL;

DO $$
DECLARE
    v_duplicate_links INTEGER;
    v_invalid_role_links INTEGER;
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
        RAISE EXCEPTION 'Backfill gerou linked_auth_user_id duplicado.';
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
        RAISE EXCEPTION 'Backfill gerou linked_auth_user_id apontando para role invalida.';
    END IF;
END $$;

SELECT COUNT(*) AS total_students
FROM public.students;

SELECT COUNT(*) AS total_created_by_preenchido
FROM public.students
WHERE created_by_auth_user_id IS NOT NULL;

SELECT COUNT(*) AS total_linked_preenchido
FROM public.students
WHERE linked_auth_user_id IS NOT NULL;

SELECT COUNT(*) AS total_sem_nenhum_vinculo_novo
FROM public.students
WHERE created_by_auth_user_id IS NULL
  AND linked_auth_user_id IS NULL;

SELECT s.id, s.user_id, s.created_by_auth_user_id, s.linked_auth_user_id
FROM public.students s
WHERE s.created_by_auth_user_id IS NOT NULL
   OR s.linked_auth_user_id IS NOT NULL
ORDER BY s.id;
