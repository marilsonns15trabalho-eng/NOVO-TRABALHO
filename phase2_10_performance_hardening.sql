-- ============================================================
-- FASE 2.10 - HARDENING DE AUTH E PERFORMANCE
-- Objetivo:
--   * reduzir custo do bootstrap de auth/profile
--   * melhorar performance de policies com auth.uid()/is_admin()
--   * preparar RPC segura para leitura do profile atual
--   * adicionar indices compostos para consultas recorrentes
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

DROP POLICY IF EXISTS "profiles_select" ON public.user_profiles;
CREATE POLICY "profiles_select" ON public.user_profiles FOR SELECT USING (
    id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
);

DROP POLICY IF EXISTS "profiles_self_update" ON public.user_profiles;
CREATE POLICY "profiles_self_update" ON public.user_profiles FOR UPDATE USING (
    id = (SELECT auth.uid())
) WITH CHECK (
    id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "profiles_admin_update_non_admins" ON public.user_profiles;
CREATE POLICY "profiles_admin_update_non_admins" ON public.user_profiles FOR UPDATE USING (
    (SELECT public.is_regular_admin())
    AND COALESCE(is_super_admin, FALSE) = FALSE
    AND role IN ('aluno', 'professor')
) WITH CHECK (
    COALESCE(is_super_admin, FALSE) = FALSE
    AND role IN ('aluno', 'professor')
);

DROP POLICY IF EXISTS "profiles_super_admin_update" ON public.user_profiles;
CREATE POLICY "profiles_super_admin_update" ON public.user_profiles FOR UPDATE USING (
    (SELECT public.is_super_admin())
) WITH CHECK (
    (SELECT public.is_super_admin())
);

CREATE INDEX IF NOT EXISTS idx_financeiro_tipo_status_data_vencimento
    ON public.financeiro(tipo, status, data_vencimento);

CREATE INDEX IF NOT EXISTS idx_bills_status_due_date
    ON public.bills(status, due_date);

ANALYZE public.user_profiles;
ANALYZE public.financeiro;
ANALYZE public.bills;
