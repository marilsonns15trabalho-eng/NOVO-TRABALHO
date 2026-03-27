-- ============================================================
-- FASE 3.05 - VALIDACAO DO PROJETO NOVO
-- Rodar depois de phase3_04_migrate_from_legacy_snapshot.sql.
-- Pode abortar com RAISE EXCEPTION se houver inconsistencias criticas.
-- ============================================================

SET search_path = public;

SELECT COUNT(*) AS total_students
FROM public.students;

SELECT COUNT(*) AS total_user_profiles
FROM public.user_profiles;

SELECT COUNT(*) AS students_sem_vinculo_auth
FROM public.students
WHERE linked_auth_user_id IS NULL;

SELECT COUNT(*) AS students_com_autor_admin
FROM public.students
WHERE created_by_auth_user_id IS NOT NULL;

SELECT linked_auth_user_id, COUNT(*) AS total
FROM public.students
WHERE linked_auth_user_id IS NOT NULL
GROUP BY linked_auth_user_id
HAVING COUNT(*) > 1;

SELECT COUNT(*) AS columns_user_id_remanescentes
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
        'plans',
        'students',
        'treinos',
        'avaliacoes',
        'anamneses',
        'financeiro',
        'bills',
        'assinaturas',
        'configuracoes'
    )
  AND column_name = 'user_id';

SELECT
    tablename,
    COUNT(*) AS total_policies
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
        'plans',
        'students',
        'treinos',
        'avaliacoes',
        'anamneses',
        'financeiro',
        'bills',
        'assinaturas',
        'configuracoes',
        'user_profiles',
        'system_security_config'
    )
GROUP BY tablename
ORDER BY tablename;

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
    v_duplicate_links INTEGER;
    v_invalid_link_roles INTEGER;
    v_invalid_creator_roles INTEGER;
    v_orphans INTEGER;
    v_user_id_columns INTEGER;
    v_missing_profiles INTEGER;
    v_config_rows INTEGER;
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
        RAISE EXCEPTION 'Validacao falhou: linked_auth_user_id duplicado no projeto novo.';
    END IF;

    SELECT COUNT(*)
    INTO v_invalid_link_roles
    FROM public.students s
    JOIN public.user_profiles up ON up.id = s.linked_auth_user_id
    WHERE s.linked_auth_user_id IS NOT NULL
      AND (
            up.role <> 'aluno'
         OR COALESCE(up.is_super_admin, FALSE) = TRUE
      );

    IF v_invalid_link_roles > 0 THEN
        RAISE EXCEPTION 'Validacao falhou: linked_auth_user_id apontando para role invalida.';
    END IF;

    SELECT COUNT(*)
    INTO v_invalid_creator_roles
    FROM public.students s
    JOIN public.user_profiles up ON up.id = s.created_by_auth_user_id
    WHERE s.created_by_auth_user_id IS NOT NULL
      AND up.role = 'aluno'
      AND COALESCE(up.is_super_admin, FALSE) = FALSE;

    IF v_invalid_creator_roles > 0 THEN
        RAISE EXCEPTION 'Validacao falhou: created_by_auth_user_id apontando para role aluno.';
    END IF;

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
    INTO v_user_id_columns
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN (
            'plans',
            'students',
            'treinos',
            'avaliacoes',
            'anamneses',
            'financeiro',
            'bills',
            'assinaturas',
            'configuracoes'
        )
      AND column_name = 'user_id';

    IF v_user_id_columns > 0 THEN
        RAISE EXCEPTION 'Validacao falhou: ainda existe coluna user_id em tabelas relacionais.';
    END IF;

    SELECT COUNT(*)
    INTO v_missing_profiles
    FROM migration.user_id_map m
    LEFT JOIN public.user_profiles up ON up.id = m.new_auth_user_id
    WHERE up.id IS NULL;

    IF v_missing_profiles > 0 THEN
        RAISE EXCEPTION 'Validacao falhou: migration.user_id_map possui usuarios sem user_profiles correspondente.';
    END IF;

    SELECT COUNT(*)
    INTO v_config_rows
    FROM public.configuracoes;

    IF v_config_rows > 1 THEN
        RAISE EXCEPTION 'Validacao falhou: configuracoes possui mais de uma linha.';
    END IF;
END $$;
