-- ============================================================
-- FASE 3.06 - VINCULAR ALUNOS FUTURAMENTE POR EMAIL EXATO
-- Uso opcional.
-- Execute depois que alunos criarem conta no Auth novo.
-- ============================================================

SET search_path = public;

WITH candidate_links AS (
    SELECT
        s.id AS student_id,
        au.id AS auth_user_id
    FROM public.students s
    JOIN auth.users au
      ON LOWER(TRIM(au.email)) = LOWER(TRIM(s.email))
    JOIN public.user_profiles up
      ON up.id = au.id
    WHERE s.linked_auth_user_id IS NULL
      AND s.email IS NOT NULL
      AND up.role = 'aluno'
      AND COALESCE(up.is_super_admin, FALSE) = FALSE
      AND NOT EXISTS (
            SELECT 1
            FROM public.students s2
            WHERE s2.email = s.email
              AND s2.id <> s.id
        )
      AND NOT EXISTS (
            SELECT 1
            FROM public.students s3
            WHERE s3.linked_auth_user_id = au.id
              AND s3.id <> s.id
        )
)
UPDATE public.students s
SET
    linked_auth_user_id = c.auth_user_id,
    updated_at = NOW()
FROM candidate_links c
WHERE s.id = c.student_id;

SELECT COUNT(*) AS total_students_linked
FROM public.students
WHERE linked_auth_user_id IS NOT NULL;

SELECT linked_auth_user_id, COUNT(*) AS total
FROM public.students
WHERE linked_auth_user_id IS NOT NULL
GROUP BY linked_auth_user_id
HAVING COUNT(*) > 1;
