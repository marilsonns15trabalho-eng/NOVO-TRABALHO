-- ============================================================
-- Phase 2.02 - Diagnostics and lightweight snapshots
-- Safe to rerun. Preserves resolved/rejected reconciliation rows.
-- ============================================================

SET search_path = public;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'students'
          AND column_name = 'created_by_auth_user_id'
    ) THEN
        RAISE EXCEPTION 'Coluna students.created_by_auth_user_id nao encontrada. Rode phase2_01_expand.sql antes.';
    END IF;
END $$;

TRUNCATE TABLE public.phase2_students_snapshot;
TRUNCATE TABLE public.phase2_user_profiles_snapshot;
TRUNCATE TABLE public.phase2_auth_users_snapshot;

INSERT INTO public.phase2_students_snapshot (
    id, name, email, phone, cpf, status, created_at, user_id, captured_at
)
SELECT
    s.id,
    s.name,
    s.email,
    s.phone,
    s.cpf,
    s.status,
    s.created_at,
    s.user_id,
    NOW()
FROM public.students s;

INSERT INTO public.phase2_user_profiles_snapshot (
    id, role, is_super_admin, captured_at
)
SELECT
    up.id,
    up.role,
    up.is_super_admin,
    NOW()
FROM public.user_profiles up;

INSERT INTO public.phase2_auth_users_snapshot (
    id, email, captured_at
)
SELECT
    au.id,
    au.email,
    NOW()
FROM auth.users au;

DELETE FROM public.student_link_reconciliation
WHERE status = 'pending';

INSERT INTO public.student_link_reconciliation (
    student_id,
    possible_auth_user_id,
    status,
    reason
)
SELECT
    s.id,
    s.user_id,
    'pending',
    'legacy_user_missing_profile'
FROM public.students s
LEFT JOIN public.user_profiles up ON up.id = s.user_id
WHERE s.user_id IS NOT NULL
  AND up.id IS NULL
ON CONFLICT (student_id, possible_auth_user_id) DO UPDATE
SET reason = EXCLUDED.reason
WHERE public.student_link_reconciliation.status = 'pending';

INSERT INTO public.student_link_reconciliation (
    student_id,
    possible_auth_user_id,
    status,
    reason
)
SELECT
    s.id,
    s.user_id,
    'pending',
    'legacy_user_missing_auth_user'
FROM public.students s
JOIN public.user_profiles up ON up.id = s.user_id
LEFT JOIN auth.users au ON au.id = s.user_id
WHERE s.user_id IS NOT NULL
  AND au.id IS NULL
ON CONFLICT (student_id, possible_auth_user_id) DO UPDATE
SET reason = EXCLUDED.reason
WHERE public.student_link_reconciliation.status = 'pending';

INSERT INTO public.student_link_reconciliation (
    student_id,
    possible_auth_user_id,
    status,
    reason
)
SELECT
    s.id,
    s.user_id,
    'pending',
    'duplicate_student_for_user'
FROM public.students s
JOIN public.user_profiles up ON up.id = s.user_id
WHERE s.user_id IS NOT NULL
  AND up.role = 'aluno'
  AND EXISTS (
        SELECT 1
        FROM public.students s2
        WHERE s2.user_id = s.user_id
          AND s2.id <> s.id
    )
ON CONFLICT (student_id, possible_auth_user_id) DO UPDATE
SET reason = EXCLUDED.reason
WHERE public.student_link_reconciliation.status = 'pending';

INSERT INTO public.student_link_reconciliation (
    student_id,
    possible_auth_user_id,
    status,
    reason
)
SELECT
    s.id,
    s.user_id,
    'pending',
    'legacy_user_email_mismatch'
FROM public.students s
JOIN public.user_profiles up ON up.id = s.user_id
JOIN auth.users au ON au.id = s.user_id
WHERE s.user_id IS NOT NULL
  AND up.role = 'aluno'
  AND (
        s.email IS NULL
     OR au.email IS NULL
     OR s.email <> au.email
  )
ON CONFLICT (student_id, possible_auth_user_id) DO UPDATE
SET reason = EXCLUDED.reason
WHERE public.student_link_reconciliation.status = 'pending';

INSERT INTO public.student_link_reconciliation (
    student_id,
    possible_auth_user_id,
    status,
    reason
)
SELECT
    s.id,
    s.user_id,
    'pending',
    'duplicate_student_email'
FROM public.students s
JOIN public.user_profiles up ON up.id = s.user_id
JOIN auth.users au ON au.id = s.user_id
WHERE s.user_id IS NOT NULL
  AND up.role = 'aluno'
  AND s.email = au.email
  AND EXISTS (
        SELECT 1
        FROM public.students s2
        WHERE s2.email = s.email
          AND s2.id <> s.id
    )
ON CONFLICT (student_id, possible_auth_user_id) DO UPDATE
SET reason = EXCLUDED.reason
WHERE public.student_link_reconciliation.status = 'pending';

SELECT COUNT(*) AS total_students
FROM public.students;

SELECT COUNT(*) AS students_com_user_id
FROM public.students
WHERE user_id IS NOT NULL;

SELECT up.role, COUNT(*) AS total
FROM public.students s
JOIN public.user_profiles up ON up.id = s.user_id
GROUP BY up.role
ORDER BY up.role;

SELECT s.user_id, COUNT(*) AS total_students
FROM public.students s
WHERE s.user_id IS NOT NULL
GROUP BY s.user_id
HAVING COUNT(*) > 1
ORDER BY total_students DESC, s.user_id;

SELECT s.id, s.user_id
FROM public.students s
LEFT JOIN public.user_profiles up ON up.id = s.user_id
WHERE s.user_id IS NOT NULL
  AND up.id IS NULL
ORDER BY s.id;

SELECT s.id, s.user_id, s.email
FROM public.students s
JOIN public.user_profiles up ON up.id = s.user_id
JOIN auth.users au ON au.id = s.user_id
WHERE up.role = 'aluno'
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
ORDER BY s.id;

SELECT COUNT(*) AS students_sem_user_id
FROM public.students
WHERE user_id IS NULL;

SELECT COUNT(*) AS students_sem_email
FROM public.students
WHERE email IS NULL;

SELECT reason, COUNT(*) AS total_pending
FROM public.student_link_reconciliation
WHERE status = 'pending'
GROUP BY reason
ORDER BY reason;

SELECT COUNT(*) AS treinos_sem_student
FROM public.treinos t
LEFT JOIN public.students s ON s.id = t.student_id
WHERE t.student_id IS NOT NULL
  AND s.id IS NULL;

SELECT COUNT(*) AS avaliacoes_sem_student
FROM public.avaliacoes a
LEFT JOIN public.students s ON s.id = a.student_id
WHERE a.student_id IS NOT NULL
  AND s.id IS NULL;

SELECT COUNT(*) AS anamneses_sem_student
FROM public.anamneses a
LEFT JOIN public.students s ON s.id = a.student_id
WHERE a.student_id IS NOT NULL
  AND s.id IS NULL;

SELECT COUNT(*) AS assinaturas_sem_student
FROM public.assinaturas a
LEFT JOIN public.students s ON s.id = a.student_id
WHERE a.student_id IS NOT NULL
  AND s.id IS NULL;
