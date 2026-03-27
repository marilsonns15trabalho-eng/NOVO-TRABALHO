-- ============================================================
-- FASE 3.02 - AUTH, FUNCOES E RLS DO PROJETO NOVO
-- Rodar depois de phase3_01_clean_schema.sql.
-- ============================================================

SET search_path = public;

DO $$
BEGIN
    IF to_regclass('public.user_profiles') IS NULL THEN
        RAISE EXCEPTION 'Tabela public.user_profiles nao encontrada. Rode phase3_01_clean_schema.sql antes.';
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_profiles (
        id,
        role,
        display_name
    )
    VALUES (
        NEW.id,
        'aluno',
        NULLIF(
            COALESCE(
                NEW.raw_user_meta_data ->> 'display_name',
                NEW.raw_user_meta_data ->> 'name',
                NEW.email
            ),
            ''
        )
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();

INSERT INTO public.user_profiles (
    id,
    role,
    display_name
)
SELECT
    au.id,
    'aluno',
    NULLIF(
        COALESCE(
            au.raw_user_meta_data ->> 'display_name',
            au.raw_user_meta_data ->> 'name',
            au.email
        ),
        ''
    )
FROM auth.users au
LEFT JOIN public.user_profiles up ON up.id = au.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_super_admin_user_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT super_admin_user_id
    FROM public.system_security_config
    WHERE singleton = TRUE;
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(target_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_profiles up
        WHERE up.id = target_user_id
          AND COALESCE(up.is_super_admin, FALSE) = TRUE
          AND up.id = public.get_super_admin_user_id()
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
        FROM public.user_profiles up
        WHERE up.id = target_user_id
          AND up.role = 'admin'
          AND COALESCE(up.is_super_admin, FALSE) = FALSE
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
        FROM public.user_profiles up
        WHERE up.id = target_user_id
          AND (
                up.role = 'admin'
             OR COALESCE(up.is_super_admin, FALSE) = TRUE
          )
    );
$$;

CREATE OR REPLACE FUNCTION public.is_professor(target_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_profiles up
        WHERE up.id = target_user_id
          AND up.role = 'professor'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_staff(target_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_profiles up
        WHERE up.id = target_user_id
          AND (
                up.role IN ('admin', 'professor')
             OR COALESCE(up.is_super_admin, FALSE) = TRUE
          )
    );
$$;

CREATE OR REPLACE FUNCTION public.current_student_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT s.id
    FROM public.students s
    WHERE s.linked_auth_user_id = (SELECT auth.uid())
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS TABLE (
    id UUID,
    role TEXT,
    display_name TEXT,
    created_at TIMESTAMPTZ,
    is_super_admin BOOLEAN,
    must_change_password BOOLEAN
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
        COALESCE(up.must_change_password, FALSE) AS must_change_password
    FROM public.user_profiles up
    WHERE up.id = (SELECT auth.uid())
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_super_admin_user_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_super_admin(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_regular_admin(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_professor(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_staff(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_student_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_profile() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_super_admin_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_regular_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_professor(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_student_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamneses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_security_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS plans_select ON public.plans;
CREATE POLICY plans_select ON public.plans
FOR SELECT
USING (
    active = TRUE
    OR (SELECT public.is_staff())
);

DROP POLICY IF EXISTS plans_admin_insert ON public.plans;
CREATE POLICY plans_admin_insert ON public.plans
FOR INSERT
WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS plans_admin_update ON public.plans;
CREATE POLICY plans_admin_update ON public.plans
FOR UPDATE
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS plans_admin_delete ON public.plans;
CREATE POLICY plans_admin_delete ON public.plans
FOR DELETE
USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS students_select ON public.students;
CREATE POLICY students_select ON public.students
FOR SELECT
USING (
    (SELECT public.is_staff())
    OR linked_auth_user_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS students_admin_insert ON public.students;
CREATE POLICY students_admin_insert ON public.students
FOR INSERT
WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS students_self_update ON public.students;
CREATE POLICY students_self_update ON public.students
FOR UPDATE
USING (
    linked_auth_user_id = (SELECT auth.uid())
)
WITH CHECK (
    linked_auth_user_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS students_admin_update ON public.students;
CREATE POLICY students_admin_update ON public.students
FOR UPDATE
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS students_admin_delete ON public.students;
CREATE POLICY students_admin_delete ON public.students
FOR DELETE
USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS treinos_select ON public.treinos;
CREATE POLICY treinos_select ON public.treinos
FOR SELECT
USING (
    (SELECT public.is_staff())
    OR EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = treinos.student_id
          AND s.linked_auth_user_id = (SELECT auth.uid())
    )
);

DROP POLICY IF EXISTS treinos_staff_insert ON public.treinos;
CREATE POLICY treinos_staff_insert ON public.treinos
FOR INSERT
WITH CHECK (
    (SELECT public.is_staff())
    AND EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = treinos.student_id
    )
);

DROP POLICY IF EXISTS treinos_staff_update ON public.treinos;
CREATE POLICY treinos_staff_update ON public.treinos
FOR UPDATE
USING ((SELECT public.is_staff()))
WITH CHECK ((SELECT public.is_staff()));

DROP POLICY IF EXISTS treinos_staff_delete ON public.treinos;
CREATE POLICY treinos_staff_delete ON public.treinos
FOR DELETE
USING ((SELECT public.is_staff()));

DROP POLICY IF EXISTS avaliacoes_select ON public.avaliacoes;
CREATE POLICY avaliacoes_select ON public.avaliacoes
FOR SELECT
USING (
    (SELECT public.is_staff())
    OR EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = avaliacoes.student_id
          AND s.linked_auth_user_id = (SELECT auth.uid())
    )
);

DROP POLICY IF EXISTS avaliacoes_staff_insert ON public.avaliacoes;
CREATE POLICY avaliacoes_staff_insert ON public.avaliacoes
FOR INSERT
WITH CHECK (
    (SELECT public.is_staff())
    AND EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = avaliacoes.student_id
    )
);

DROP POLICY IF EXISTS avaliacoes_staff_update ON public.avaliacoes;
CREATE POLICY avaliacoes_staff_update ON public.avaliacoes
FOR UPDATE
USING ((SELECT public.is_staff()))
WITH CHECK ((SELECT public.is_staff()));

DROP POLICY IF EXISTS avaliacoes_staff_delete ON public.avaliacoes;
CREATE POLICY avaliacoes_staff_delete ON public.avaliacoes
FOR DELETE
USING ((SELECT public.is_staff()));

DROP POLICY IF EXISTS anamneses_select ON public.anamneses;
CREATE POLICY anamneses_select ON public.anamneses
FOR SELECT
USING (
    (SELECT public.is_staff())
    OR EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = anamneses.student_id
          AND s.linked_auth_user_id = (SELECT auth.uid())
    )
);

DROP POLICY IF EXISTS anamneses_staff_insert ON public.anamneses;
CREATE POLICY anamneses_staff_insert ON public.anamneses
FOR INSERT
WITH CHECK (
    (SELECT public.is_staff())
    AND EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = anamneses.student_id
    )
);

DROP POLICY IF EXISTS anamneses_staff_update ON public.anamneses;
CREATE POLICY anamneses_staff_update ON public.anamneses
FOR UPDATE
USING ((SELECT public.is_staff()))
WITH CHECK ((SELECT public.is_staff()));

DROP POLICY IF EXISTS anamneses_staff_delete ON public.anamneses;
CREATE POLICY anamneses_staff_delete ON public.anamneses
FOR DELETE
USING ((SELECT public.is_staff()));

DROP POLICY IF EXISTS assinaturas_select ON public.assinaturas;
CREATE POLICY assinaturas_select ON public.assinaturas
FOR SELECT
USING (
    (SELECT public.is_admin())
    OR EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = assinaturas.student_id
          AND s.linked_auth_user_id = (SELECT auth.uid())
    )
);

DROP POLICY IF EXISTS assinaturas_admin_insert ON public.assinaturas;
CREATE POLICY assinaturas_admin_insert ON public.assinaturas
FOR INSERT
WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS assinaturas_admin_update ON public.assinaturas;
CREATE POLICY assinaturas_admin_update ON public.assinaturas
FOR UPDATE
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS assinaturas_admin_delete ON public.assinaturas;
CREATE POLICY assinaturas_admin_delete ON public.assinaturas
FOR DELETE
USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS bills_admin_select ON public.bills;
CREATE POLICY bills_admin_select ON public.bills
FOR SELECT
USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS bills_admin_insert ON public.bills;
CREATE POLICY bills_admin_insert ON public.bills
FOR INSERT
WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS bills_admin_update ON public.bills;
CREATE POLICY bills_admin_update ON public.bills
FOR UPDATE
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS bills_admin_delete ON public.bills;
CREATE POLICY bills_admin_delete ON public.bills
FOR DELETE
USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS financeiro_admin_select ON public.financeiro;
CREATE POLICY financeiro_admin_select ON public.financeiro
FOR SELECT
USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS financeiro_admin_insert ON public.financeiro;
CREATE POLICY financeiro_admin_insert ON public.financeiro
FOR INSERT
WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS financeiro_admin_update ON public.financeiro;
CREATE POLICY financeiro_admin_update ON public.financeiro
FOR UPDATE
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS financeiro_admin_delete ON public.financeiro;
CREATE POLICY financeiro_admin_delete ON public.financeiro
FOR DELETE
USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS configuracoes_select ON public.configuracoes;
CREATE POLICY configuracoes_select ON public.configuracoes
FOR SELECT
USING ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS configuracoes_admin_insert ON public.configuracoes;
CREATE POLICY configuracoes_admin_insert ON public.configuracoes
FOR INSERT
WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS configuracoes_admin_update ON public.configuracoes;
CREATE POLICY configuracoes_admin_update ON public.configuracoes
FOR UPDATE
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS user_profiles_select ON public.user_profiles;
CREATE POLICY user_profiles_select ON public.user_profiles
FOR SELECT
USING (
    id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
);

DROP POLICY IF EXISTS user_profiles_regular_admin_update ON public.user_profiles;
CREATE POLICY user_profiles_regular_admin_update ON public.user_profiles
FOR UPDATE
USING (
    (SELECT public.is_regular_admin())
    AND COALESCE(is_super_admin, FALSE) = FALSE
    AND role IN ('aluno', 'professor')
)
WITH CHECK (
    COALESCE(is_super_admin, FALSE) = FALSE
    AND role IN ('aluno', 'professor')
);

DROP POLICY IF EXISTS user_profiles_super_admin_update ON public.user_profiles;
CREATE POLICY user_profiles_super_admin_update ON public.user_profiles
FOR UPDATE
USING ((SELECT public.is_super_admin()))
WITH CHECK ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS system_security_config_super_admin_select ON public.system_security_config;
CREATE POLICY system_security_config_super_admin_select ON public.system_security_config
FOR SELECT
USING ((SELECT public.is_super_admin()));

DROP POLICY IF EXISTS system_security_config_super_admin_update ON public.system_security_config;
CREATE POLICY system_security_config_super_admin_update ON public.system_security_config
FOR UPDATE
USING ((SELECT public.is_super_admin()))
WITH CHECK ((SELECT public.is_super_admin()));
