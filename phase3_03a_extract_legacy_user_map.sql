-- ============================================================
-- FASE 3.03A - EXTRAIR MAPA DE USUARIOS DO PROJETO ANTIGO
-- Rodar no projeto antigo.
-- Exportar o resultado para CSV.
-- ============================================================

SET search_path = public;

SELECT
    up.id AS legacy_user_id,
    LOWER(TRIM(COALESCE(au.email, s.email))) AS email,
    up.role AS legacy_role,
    COALESCE(up.is_super_admin, FALSE) AS is_super_admin,
    up.display_name,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM public.students s_linked
            WHERE s_linked.linked_auth_user_id = up.id
        ) THEN 'linked_student'
        WHEN EXISTS (
            SELECT 1
            FROM public.students s_created
            WHERE s_created.created_by_auth_user_id = up.id
        ) THEN 'student_creator'
        ELSE 'profile_only'
    END AS usage_type
FROM public.user_profiles up
LEFT JOIN auth.users au
  ON au.id = up.id
LEFT JOIN LATERAL (
    SELECT s.email
    FROM public.students s
    WHERE s.linked_auth_user_id = up.id
      AND s.email IS NOT NULL
    ORDER BY s.created_at ASC NULLS LAST
    LIMIT 1
) s ON TRUE
ORDER BY email NULLS LAST, legacy_role, legacy_user_id;

-- ==========================================
-- CHECKS AUXILIARES
-- ==========================================

-- Usuarios antigos sem email utilizavel
SELECT
    up.id AS legacy_user_id,
    up.role AS legacy_role,
    up.display_name
FROM public.user_profiles up
LEFT JOIN auth.users au
  ON au.id = up.id
LEFT JOIN LATERAL (
    SELECT s.email
    FROM public.students s
    WHERE s.linked_auth_user_id = up.id
      AND s.email IS NOT NULL
    ORDER BY s.created_at ASC NULLS LAST
    LIMIT 1
) s ON TRUE
WHERE COALESCE(au.email, s.email) IS NULL
ORDER BY up.created_at;

-- Emails duplicados no projeto antigo
SELECT
    LOWER(TRIM(COALESCE(au.email, s.email))) AS email_normalizado,
    COUNT(*) AS total
FROM public.user_profiles up
LEFT JOIN auth.users au
  ON au.id = up.id
LEFT JOIN LATERAL (
    SELECT s.email
    FROM public.students s
    WHERE s.linked_auth_user_id = up.id
      AND s.email IS NOT NULL
    ORDER BY s.created_at ASC NULLS LAST
    LIMIT 1
) s ON TRUE
WHERE COALESCE(au.email, s.email) IS NOT NULL
GROUP BY LOWER(TRIM(COALESCE(au.email, s.email)))
HAVING COUNT(*) > 1
ORDER BY total DESC, email_normalizado;
