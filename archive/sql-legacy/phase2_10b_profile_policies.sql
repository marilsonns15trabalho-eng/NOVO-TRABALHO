-- ============================================================
-- FASE 2.10B - POLICIES DE USER_PROFILES
-- Executar depois de 2.10A.
-- ============================================================

SET search_path = public;

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

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
