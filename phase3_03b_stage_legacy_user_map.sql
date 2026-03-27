-- ============================================================
-- FASE 3.03B - STAGING DO MAPA DE USUARIOS NO PROJETO NOVO
-- Rodar no projeto novo.
-- Depois importar aqui o CSV gerado por phase3_03a_extract_legacy_user_map.sql.
-- ============================================================

CREATE SCHEMA IF NOT EXISTS migration;

CREATE TABLE IF NOT EXISTS migration.legacy_user_map_import (
    legacy_user_id UUID PRIMARY KEY,
    email TEXT,
    legacy_role TEXT,
    is_super_admin BOOLEAN DEFAULT FALSE,
    display_name TEXT,
    usage_type TEXT,
    imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE migration.legacy_user_map_import IS
'Tabela de staging para importar o CSV de usuarios do projeto antigo antes de preencher migration.user_id_map.';

-- Opcional: limpar staging antes de reimportar um CSV novo
-- TRUNCATE TABLE migration.legacy_user_map_import;

-- ==========================================
-- CHECKS AUXILIARES
-- ==========================================

-- Linhas importadas
SELECT COUNT(*) AS total_importado
FROM migration.legacy_user_map_import;

-- Emails vazios ou nulos
SELECT *
FROM migration.legacy_user_map_import
WHERE NULLIF(TRIM(email), '') IS NULL
ORDER BY legacy_role, legacy_user_id;

-- Emails duplicados na staging
SELECT
    LOWER(TRIM(email)) AS email_normalizado,
    COUNT(*) AS total
FROM migration.legacy_user_map_import
WHERE NULLIF(TRIM(email), '') IS NOT NULL
GROUP BY LOWER(TRIM(email))
HAVING COUNT(*) > 1
ORDER BY total DESC, email_normalizado;

-- Emails duplicados no Auth novo
SELECT
    LOWER(TRIM(email)) AS email_normalizado,
    COUNT(*) AS total
FROM auth.users
WHERE NULLIF(TRIM(email), '') IS NOT NULL
GROUP BY LOWER(TRIM(email))
HAVING COUNT(*) > 1
ORDER BY total DESC, email_normalizado;
