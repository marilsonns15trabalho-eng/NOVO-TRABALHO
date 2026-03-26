-- ============================================================
-- FASE 1: SEGURANCA RLS E PROTECAO DE ROLES
-- Objetivo: endurecer user_profiles, tornar role banco-dirigida
-- e impedir alteracao de user_id em UPDATE.
-- ============================================================

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_single_super_admin
    ON user_profiles(is_super_admin)
    WHERE is_super_admin = TRUE;

CREATE TABLE IF NOT EXISTS system_security_config (
    singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton = TRUE),
    super_admin_user_id UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE system_security_config ADD COLUMN IF NOT EXISTS super_admin_user_id UUID;
ALTER TABLE system_security_config ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS idx_system_security_config_super_admin_user_id
    ON system_security_config(super_admin_user_id)
    WHERE super_admin_user_id IS NOT NULL;

INSERT INTO system_security_config (singleton)
VALUES (TRUE)
ON CONFLICT (singleton) DO NOTHING;

DO $$
DECLARE
    v_super_admin_id UUID;
BEGIN
    SELECT super_admin_user_id
    INTO v_super_admin_id
    FROM system_security_config
    WHERE singleton = TRUE;

    IF v_super_admin_id IS NULL THEN
        SELECT id
        INTO v_super_admin_id
        FROM auth.users
        WHERE email = 'marilsonns15@gmail.com'
        LIMIT 1;

        IF v_super_admin_id IS NOT NULL THEN
            UPDATE system_security_config
            SET super_admin_user_id = v_super_admin_id,
                updated_at = NOW()
            WHERE singleton = TRUE;
        END IF;
    END IF;

    IF v_super_admin_id IS NULL THEN
        RAISE EXCEPTION 'Super admin canonico nao encontrado em auth.users para marilsonns15@gmail.com.';
    END IF;
END $$;

ALTER TABLE system_security_config ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_super_admin_user_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT super_admin_user_id
    FROM public.system_security_config
    WHERE singleton = TRUE
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION is_super_admin(target_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_profiles
        WHERE id = target_user_id
          AND is_super_admin = TRUE
          AND id = public.get_super_admin_user_id()
    );
$$;

CREATE OR REPLACE FUNCTION is_regular_admin(target_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
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

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION prevent_user_id_changes()
RETURNS trigger AS $$
BEGIN
    IF OLD.user_id IS DISTINCT FROM NEW.user_id THEN
        RAISE EXCEPTION 'Campo user_id e imutavel em UPDATE.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE OR REPLACE FUNCTION enforce_user_profile_security()
RETURNS trigger AS $$
DECLARE
    v_actor_id UUID := auth.uid();
    v_super_admin_id UUID := public.get_super_admin_user_id();
    v_actor_is_super_admin BOOLEAN := public.is_super_admin(v_actor_id);
    v_actor_is_regular_admin BOOLEAN := public.is_regular_admin(v_actor_id);
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF v_super_admin_id IS NOT NULL AND NEW.id = v_super_admin_id THEN
            NEW.role := 'admin';
            NEW.is_super_admin := TRUE;
        ELSE
            NEW.role := 'aluno';
            NEW.is_super_admin := FALSE;
        END IF;

        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        IF OLD.id IS DISTINCT FROM NEW.id THEN
            RAISE EXCEPTION 'O id do profile e imutavel.';
        END IF;

        IF OLD.is_super_admin IS DISTINCT FROM NEW.is_super_admin THEN
            RAISE EXCEPTION 'O marcador is_super_admin e imutavel.';
        END IF;

        IF v_super_admin_id IS NOT NULL AND NEW.id = v_super_admin_id THEN
            NEW.is_super_admin := TRUE;
            NEW.role := 'admin';

            IF v_actor_id IS NOT NULL AND v_actor_id <> v_super_admin_id THEN
                RAISE EXCEPTION 'Apenas o proprio super admin pode alterar este profile.';
            END IF;

            RETURN NEW;
        END IF;

        NEW.is_super_admin := FALSE;

        IF OLD.role IS DISTINCT FROM NEW.role THEN
            IF NEW.role IS NULL OR NEW.role NOT IN ('admin', 'professor', 'aluno') THEN
                RAISE EXCEPTION 'Role invalida.';
            END IF;

            IF v_actor_id IS NULL THEN
                RETURN NEW;
            END IF;

            IF v_actor_id = OLD.id THEN
                RAISE EXCEPTION 'Usuarios nao podem alterar a propria role.';
            END IF;

            IF v_actor_is_super_admin THEN
                RETURN NEW;
            END IF;

            IF v_actor_is_regular_admin THEN
                IF OLD.role = 'admin' OR NEW.role = 'admin' THEN
                    RAISE EXCEPTION 'Apenas o super admin pode promover ou demover admins.';
                END IF;

                RETURN NEW;
            END IF;

            RAISE EXCEPTION 'Sem permissao para alterar roles.';
        END IF;

        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

CREATE OR REPLACE FUNCTION protect_super_admin_profile_delete()
RETURNS trigger AS $$
BEGIN
    IF OLD.id = public.get_super_admin_user_id() OR COALESCE(OLD.is_super_admin, FALSE) = TRUE THEN
        RAISE EXCEPTION 'Super admin nao pode ser removido.';
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

DROP TRIGGER IF EXISTS prevent_students_user_id_changes ON students;
CREATE TRIGGER prevent_students_user_id_changes
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION prevent_user_id_changes();

DROP TRIGGER IF EXISTS prevent_treinos_user_id_changes ON treinos;
CREATE TRIGGER prevent_treinos_user_id_changes
    BEFORE UPDATE ON treinos
    FOR EACH ROW
    EXECUTE FUNCTION prevent_user_id_changes();

DROP TRIGGER IF EXISTS prevent_avaliacoes_user_id_changes ON avaliacoes;
CREATE TRIGGER prevent_avaliacoes_user_id_changes
    BEFORE UPDATE ON avaliacoes
    FOR EACH ROW
    EXECUTE FUNCTION prevent_user_id_changes();

DROP TRIGGER IF EXISTS prevent_anamneses_user_id_changes ON anamneses;
CREATE TRIGGER prevent_anamneses_user_id_changes
    BEFORE UPDATE ON anamneses
    FOR EACH ROW
    EXECUTE FUNCTION prevent_user_id_changes();

DROP TRIGGER IF EXISTS prevent_financeiro_user_id_changes ON financeiro;
CREATE TRIGGER prevent_financeiro_user_id_changes
    BEFORE UPDATE ON financeiro
    FOR EACH ROW
    EXECUTE FUNCTION prevent_user_id_changes();

DROP TRIGGER IF EXISTS prevent_bills_user_id_changes ON bills;
CREATE TRIGGER prevent_bills_user_id_changes
    BEFORE UPDATE ON bills
    FOR EACH ROW
    EXECUTE FUNCTION prevent_user_id_changes();

DROP TRIGGER IF EXISTS prevent_plans_user_id_changes ON plans;
CREATE TRIGGER prevent_plans_user_id_changes
    BEFORE UPDATE ON plans
    FOR EACH ROW
    EXECUTE FUNCTION prevent_user_id_changes();

DROP TRIGGER IF EXISTS prevent_assinaturas_user_id_changes ON assinaturas;
CREATE TRIGGER prevent_assinaturas_user_id_changes
    BEFORE UPDATE ON assinaturas
    FOR EACH ROW
    EXECUTE FUNCTION prevent_user_id_changes();

DROP TRIGGER IF EXISTS prevent_configuracoes_user_id_changes ON configuracoes;
CREATE TRIGGER prevent_configuracoes_user_id_changes
    BEFORE UPDATE ON configuracoes
    FOR EACH ROW
    EXECUTE FUNCTION prevent_user_id_changes();

DROP TRIGGER IF EXISTS enforce_user_profile_security_trigger ON user_profiles;
CREATE TRIGGER enforce_user_profile_security_trigger
    BEFORE INSERT OR UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION enforce_user_profile_security();

DROP TRIGGER IF EXISTS protect_super_admin_profile_delete_trigger ON user_profiles;
CREATE TRIGGER protect_super_admin_profile_delete_trigger
    BEFORE DELETE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION protect_super_admin_profile_delete();

DROP POLICY IF EXISTS "students_update_claim" ON students;

DROP POLICY IF EXISTS "profiles_select" ON user_profiles;
CREATE POLICY "profiles_select" ON user_profiles FOR SELECT USING (
    id = auth.uid() OR is_admin()
);

DROP POLICY IF EXISTS "profiles_insert" ON user_profiles;
CREATE POLICY "profiles_insert" ON user_profiles FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND id = auth.uid()
);

DROP POLICY IF EXISTS "profiles_update" ON user_profiles;

DROP POLICY IF EXISTS "profiles_self_update" ON user_profiles;
CREATE POLICY "profiles_self_update" ON user_profiles FOR UPDATE USING (
    id = auth.uid()
) WITH CHECK (
    id = auth.uid()
);

DROP POLICY IF EXISTS "profiles_admin_update_non_admins" ON user_profiles;
CREATE POLICY "profiles_admin_update_non_admins" ON user_profiles FOR UPDATE USING (
    is_regular_admin()
    AND COALESCE(is_super_admin, FALSE) = FALSE
    AND role IN ('aluno', 'professor')
) WITH CHECK (
    COALESCE(is_super_admin, FALSE) = FALSE
    AND role IN ('aluno', 'professor')
);

DROP POLICY IF EXISTS "profiles_super_admin_update" ON user_profiles;
CREATE POLICY "profiles_super_admin_update" ON user_profiles FOR UPDATE USING (
    is_super_admin()
) WITH CHECK (
    is_super_admin()
);

DROP TRIGGER IF EXISTS block_delete_super_admin ON user_profiles;
DROP TRIGGER IF EXISTS block_update_super_admin ON user_profiles;
DROP TRIGGER IF EXISTS enforce_super_admin_role_trigger ON user_profiles;

DROP FUNCTION IF EXISTS protect_super_admin_delete();
DROP FUNCTION IF EXISTS protect_super_admin_update();
DROP FUNCTION IF EXISTS enforce_super_admin_role();
