-- ============================================================
-- FASE 3.03D - VALIDAR migration.user_id_map
-- Rodar no projeto novo depois de preencher migration.user_id_map.
-- Se passar, pode seguir para importar o schema legacy e rodar phase3_04.
-- ============================================================

SET search_path = public;

DO $$
BEGIN
    IF to_regclass('migration.user_id_map') IS NULL THEN
        RAISE EXCEPTION 'Tabela migration.user_id_map nao encontrada. Rode phase3_01_clean_schema.sql antes.';
    END IF;
END $$;

-- Total de usuarios mapeados
SELECT COUNT(*) AS total_mapeado
FROM migration.user_id_map;

-- Legacy users duplicados no mapa
SELECT
    legacy_user_id,
    COUNT(*) AS total
FROM migration.user_id_map
GROUP BY legacy_user_id
HAVING COUNT(*) > 1
ORDER BY total DESC, legacy_user_id;

-- New auth users duplicados no mapa
SELECT
    new_auth_user_id,
    COUNT(*) AS total
FROM migration.user_id_map
GROUP BY new_auth_user_id
HAVING COUNT(*) > 1
ORDER BY total DESC, new_auth_user_id;

-- Mapeamentos apontando para usuarios inexistentes no Auth novo
SELECT
    m.legacy_user_id,
    m.new_auth_user_id,
    m.email,
    m.legacy_role
FROM migration.user_id_map m
LEFT JOIN auth.users au
  ON au.id = m.new_auth_user_id
WHERE au.id IS NULL
ORDER BY m.email NULLS LAST, m.legacy_user_id;

-- Emails duplicados no mapa
SELECT
    LOWER(TRIM(email)) AS email_normalizado,
    COUNT(*) AS total
FROM migration.user_id_map
WHERE NULLIF(TRIM(email), '') IS NOT NULL
GROUP BY LOWER(TRIM(email))
HAVING COUNT(*) > 1
ORDER BY total DESC, email_normalizado;

DO $$
DECLARE
    v_missing_auth_users INTEGER;
    v_duplicate_legacy INTEGER;
    v_duplicate_new_auth INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO v_missing_auth_users
    FROM migration.user_id_map m
    LEFT JOIN auth.users au
      ON au.id = m.new_auth_user_id
    WHERE au.id IS NULL;

    IF v_missing_auth_users > 0 THEN
        RAISE EXCEPTION 'Validacao falhou: migration.user_id_map aponta para usuarios inexistentes no Auth novo.';
    END IF;

    SELECT COUNT(*)
    INTO v_duplicate_legacy
    FROM (
        SELECT legacy_user_id
        FROM migration.user_id_map
        GROUP BY legacy_user_id
        HAVING COUNT(*) > 1
    ) q;

    IF v_duplicate_legacy > 0 THEN
        RAISE EXCEPTION 'Validacao falhou: legacy_user_id duplicado em migration.user_id_map.';
    END IF;

    SELECT COUNT(*)
    INTO v_duplicate_new_auth
    FROM (
        SELECT new_auth_user_id
        FROM migration.user_id_map
        GROUP BY new_auth_user_id
        HAVING COUNT(*) > 1
    ) q;

    IF v_duplicate_new_auth > 0 THEN
        RAISE EXCEPTION 'Validacao falhou: new_auth_user_id duplicado em migration.user_id_map.';
    END IF;
END $$;
