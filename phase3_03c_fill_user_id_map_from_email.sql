-- ============================================================
-- FASE 3.03C - PREENCHER migration.user_id_map POR EMAIL
-- Rodar no projeto novo, depois de:
--   1. recriar os usuarios no Auth novo
--   2. importar o CSV em migration.legacy_user_map_import
-- ============================================================

SET search_path = public;

DO $$
BEGIN
    IF to_regclass('migration.legacy_user_map_import') IS NULL THEN
        RAISE EXCEPTION 'Tabela migration.legacy_user_map_import nao encontrada. Rode phase3_03b_stage_legacy_user_map.sql antes.';
    END IF;

    IF to_regclass('migration.user_id_map') IS NULL THEN
        RAISE EXCEPTION 'Tabela migration.user_id_map nao encontrada. Rode phase3_01_clean_schema.sql antes.';
    END IF;
END $$;

-- ==========================================
-- CHECKS PREVIOS
-- ==========================================

-- Duplicados no CSV importado
SELECT
    LOWER(TRIM(email)) AS email_normalizado,
    COUNT(*) AS total
FROM migration.legacy_user_map_import
WHERE NULLIF(TRIM(email), '') IS NOT NULL
GROUP BY LOWER(TRIM(email))
HAVING COUNT(*) > 1
ORDER BY total DESC, email_normalizado;

-- Duplicados no auth.users do projeto novo
SELECT
    LOWER(TRIM(email)) AS email_normalizado,
    COUNT(*) AS total
FROM auth.users
WHERE NULLIF(TRIM(email), '') IS NOT NULL
GROUP BY LOWER(TRIM(email))
HAVING COUNT(*) > 1
ORDER BY total DESC, email_normalizado;

-- Usuarios antigos sem match por email no Auth novo
SELECT
    i.legacy_user_id,
    i.email,
    i.legacy_role,
    i.is_super_admin,
    i.display_name,
    i.usage_type
FROM migration.legacy_user_map_import i
LEFT JOIN auth.users au
  ON LOWER(TRIM(au.email)) = LOWER(TRIM(i.email))
WHERE NULLIF(TRIM(i.email), '') IS NOT NULL
  AND au.id IS NULL
ORDER BY i.email, i.legacy_user_id;

-- ==========================================
-- UPSERT DO MAPEAMENTO
-- ==========================================

INSERT INTO migration.user_id_map (
    legacy_user_id,
    new_auth_user_id,
    email,
    legacy_role,
    notes
)
SELECT
    i.legacy_user_id,
    au.id AS new_auth_user_id,
    LOWER(TRIM(i.email)) AS email,
    CASE
        WHEN COALESCE(i.is_super_admin, FALSE) = TRUE THEN 'admin'
        ELSE i.legacy_role
    END AS legacy_role,
    CONCAT(
        'mapped_by_email:',
        COALESCE(i.usage_type, 'unknown')
    ) AS notes
FROM migration.legacy_user_map_import i
JOIN auth.users au
  ON LOWER(TRIM(au.email)) = LOWER(TRIM(i.email))
WHERE NULLIF(TRIM(i.email), '') IS NOT NULL
ON CONFLICT (legacy_user_id) DO UPDATE
SET
    new_auth_user_id = EXCLUDED.new_auth_user_id,
    email = EXCLUDED.email,
    legacy_role = EXCLUDED.legacy_role,
    notes = EXCLUDED.notes;

-- ==========================================
-- POS-CHECKS
-- ==========================================

SELECT COUNT(*) AS total_mapeado
FROM migration.user_id_map;

SELECT
    i.legacy_user_id,
    i.email,
    i.legacy_role
FROM migration.legacy_user_map_import i
LEFT JOIN migration.user_id_map m
  ON m.legacy_user_id = i.legacy_user_id
WHERE m.legacy_user_id IS NULL
ORDER BY i.email, i.legacy_user_id;

SELECT
    m.new_auth_user_id,
    COUNT(*) AS total
FROM migration.user_id_map m
GROUP BY m.new_auth_user_id
HAVING COUNT(*) > 1
ORDER BY total DESC, m.new_auth_user_id;
