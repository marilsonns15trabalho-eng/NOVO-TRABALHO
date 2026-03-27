-- ============================================================
-- FASE 3.05 SIMPLIFICADA - VALIDAR OPERACAO SEM AUTH LEGADO
-- Rodar depois de phase3_04_simple_migrate_business_data.sql.
-- ============================================================

SET search_path = public;

SELECT COUNT(*) AS total_students
FROM public.students;

SELECT COUNT(*) AS total_students_sem_link_auth
FROM public.students
WHERE linked_auth_user_id IS NULL;

SELECT COUNT(*) AS total_admins
FROM public.user_profiles
WHERE role = 'admin';

SELECT COUNT(*) AS total_super_admins
FROM public.user_profiles
WHERE COALESCE(is_super_admin, FALSE) = TRUE;

SELECT COUNT(*) AS treinos_orfaos
FROM public.treinos t
LEFT JOIN public.students s ON s.id = t.student_id
WHERE s.id IS NULL;

SELECT COUNT(*) AS avaliacoes_orfaos
FROM public.avaliacoes a
LEFT JOIN public.students s ON s.id = a.student_id
WHERE s.id IS NULL;

SELECT COUNT(*) AS anamneses_orfaos
FROM public.anamneses a
LEFT JOIN public.students s ON s.id = a.student_id
WHERE s.id IS NULL;

SELECT COUNT(*) AS bills_orfaos
FROM public.bills b
LEFT JOIN public.students s ON s.id = b.student_id
WHERE s.id IS NULL;

SELECT COUNT(*) AS assinaturas_orfaos
FROM public.assinaturas a
LEFT JOIN public.students s ON s.id = a.student_id
WHERE s.id IS NULL;

DO $$
DECLARE
    v_orphans INTEGER;
    v_admins INTEGER;
    v_super_admins INTEGER;
BEGIN
    SELECT
        COALESCE((SELECT COUNT(*) FROM public.treinos t LEFT JOIN public.students s ON s.id = t.student_id WHERE s.id IS NULL), 0)
      + COALESCE((SELECT COUNT(*) FROM public.avaliacoes a LEFT JOIN public.students s ON s.id = a.student_id WHERE s.id IS NULL), 0)
      + COALESCE((SELECT COUNT(*) FROM public.anamneses a LEFT JOIN public.students s ON s.id = a.student_id WHERE s.id IS NULL), 0)
      + COALESCE((SELECT COUNT(*) FROM public.bills b LEFT JOIN public.students s ON s.id = b.student_id WHERE s.id IS NULL), 0)
      + COALESCE((SELECT COUNT(*) FROM public.assinaturas a LEFT JOIN public.students s ON s.id = a.student_id WHERE s.id IS NULL), 0)
    INTO v_orphans;

    IF v_orphans > 0 THEN
        RAISE EXCEPTION 'Validacao falhou: existem registros orfaos nas tabelas relacionais.';
    END IF;

    SELECT COUNT(*)
    INTO v_admins
    FROM public.user_profiles
    WHERE role = 'admin';

    IF v_admins = 0 THEN
        RAISE EXCEPTION 'Validacao falhou: nenhum admin encontrado no projeto novo.';
    END IF;

    SELECT COUNT(*)
    INTO v_super_admins
    FROM public.user_profiles
    WHERE COALESCE(is_super_admin, FALSE) = TRUE;

    IF v_super_admins <> 1 THEN
        RAISE EXCEPTION 'Validacao falhou: deve existir exatamente um super admin.';
    END IF;
END $$;

SELECT
    au.email,
    up.role,
    up.is_super_admin
FROM public.user_profiles up
JOIN auth.users au
  ON au.id = up.id
ORDER BY up.is_super_admin DESC, up.role, au.email;
