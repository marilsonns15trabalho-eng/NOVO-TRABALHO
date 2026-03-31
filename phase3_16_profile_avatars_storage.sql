-- ============================================================
-- FASE 3.16 - FOTOS DE PERFIL EM STORAGE PRIVADO
-- Rodar depois de phase3_01/02/07/12.
-- Objetivo:
--   * permitir avatar de perfil sem expor bucket publicamente
--   * manter apenas metadados no user_profiles
--   * atualizar a RPC get_my_profile para refletir avatar
-- ============================================================

SET search_path = public;

ALTER TABLE public.user_profiles
    ADD COLUMN IF NOT EXISTS avatar_path TEXT,
    ADD COLUMN IF NOT EXISTS avatar_updated_at TIMESTAMPTZ;

DROP FUNCTION IF EXISTS public.get_my_profile();

CREATE FUNCTION public.get_my_profile()
RETURNS TABLE (
    id UUID,
    role TEXT,
    display_name TEXT,
    created_at TIMESTAMPTZ,
    is_super_admin BOOLEAN,
    must_change_password BOOLEAN,
    secret_question TEXT,
    password_recovery_enabled BOOLEAN,
    avatar_path TEXT,
    avatar_updated_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        up.id,
        up.role,
        up.display_name,
        up.created_at,
        COALESCE(up.is_super_admin, FALSE) AS is_super_admin,
        COALESCE(up.must_change_password, FALSE) AS must_change_password,
        up.secret_question,
        COALESCE(up.password_recovery_enabled, FALSE) AS password_recovery_enabled,
        up.avatar_path,
        up.avatar_updated_at
    FROM public.user_profiles up
    WHERE up.id = (SELECT auth.uid())
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_my_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

INSERT INTO storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
VALUES (
    'profile-photos',
    'profile-photos',
    FALSE,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

ANALYZE public.user_profiles;
