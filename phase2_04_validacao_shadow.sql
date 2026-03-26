-- ============================================================
-- Phase 2.04 - Shadow validation before freeze/cutover
-- Read-only validation. Raises on critical inconsistencies.
-- ============================================================

SET search_path = public;

SELECT COUNT(*) AS total_students
FROM public.students;

SELECT COUNT(*) AS total_created_by_preenchido
FROM public.students
WHERE created_by_auth_user_id IS NOT NULL;

SELECT COUNT(*) AS total_linked_preenchido
FROM public.students
WHERE linked_auth_user_id IS NOT NULL;

SELECT reason, COUNT(*) AS total_pending
FROM public.student_link_reconciliation
WHERE status = 'pending'
GROUP BY reason
ORDER BY reason;

SELECT linked_auth_user_id, COUNT(*) AS total
FROM public.students
WHERE linked_auth_user_id IS NOT NULL
GROUP BY linked_auth_user_id
HAVING COUNT(*) > 1;

SELECT s.id, s.linked_auth_user_id, up.role, up.is_super_admin
FROM public.students s
JOIN public.user_profiles up ON up.id = s.linked_auth_user_id
WHERE s.linked_auth_user_id IS NOT NULL
  AND (
        up.role <> 'aluno'
     OR COALESCE(up.is_super_admin, FALSE) = TRUE
  );

SELECT s.id, s.created_by_auth_user_id, up.role, up.is_super_admin
FROM public.students s
JOIN public.user_profiles up ON up.id = s.created_by_auth_user_id
WHERE s.created_by_auth_user_id IS NOT NULL
  AND up.role = 'aluno'
  AND COALESCE(up.is_super_admin, FALSE) = FALSE;

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

SELECT actor.id AS aluno_id, COUNT(*) AS readable_students
FROM public.user_profiles actor
JOIN public.students s ON public.phase2_can_read_student_as(actor.id, s.id)
WHERE actor.role = 'aluno'
GROUP BY actor.id
ORDER BY readable_students DESC, actor.id;

DO $$
DECLARE
    v_duplicate_links INTEGER;
    v_invalid_role_links INTEGER;
    v_invalid_creator_links INTEGER;
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
        RAISE EXCEPTION 'Shadow validation falhou: linked_auth_user_id duplicado.';
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
        RAISE EXCEPTION 'Shadow validation falhou: linked_auth_user_id aponta para role invalida.';
    END IF;

    SELECT COUNT(*)
    INTO v_invalid_creator_links
    FROM public.students s
    JOIN public.user_profiles up ON up.id = s.created_by_auth_user_id
    WHERE s.created_by_auth_user_id IS NOT NULL
      AND up.role = 'aluno'
      AND COALESCE(up.is_super_admin, FALSE) = FALSE;

    IF v_invalid_creator_links > 0 THEN
        RAISE EXCEPTION 'Shadow validation falhou: created_by_auth_user_id aponta para role aluno.';
    END IF;
END $$;
