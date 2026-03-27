-- ============================================================
-- FASE 2.10A - FUNCOES E RPC DE PROFILE
-- Executar primeiro.
-- ============================================================

SET search_path = public;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_super_admin(target_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_profiles
        WHERE id = target_user_id
          AND COALESCE(is_super_admin, FALSE) = TRUE
          AND id = public.get_super_admin_user_id()
    );
$$;

CREATE OR REPLACE FUNCTION public.is_regular_admin(target_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_profiles
        WHERE id = target_user_id
          AND role = 'admin'
          AND COALESCE(is_super_admin, FALSE) = FALSE
    );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(target_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_profiles
        WHERE id = target_user_id
          AND role = 'admin'
    );
$$;

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS TABLE (
    id UUID,
    role TEXT,
    display_name TEXT,
    created_at TIMESTAMPTZ,
    is_super_admin BOOLEAN
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
        COALESCE(up.is_super_admin, FALSE) AS is_super_admin
    FROM public.user_profiles up
    WHERE up.id = (SELECT auth.uid())
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_my_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;
