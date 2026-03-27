-- ============================================================
-- FASE 3.07 - HARDENING DE SEGURANCA DE CONTA
-- Rodar no projeto novo ja inicializado com phase3_01/02/03.
-- Inclui:
--   * pergunta secreta e hash de resposta
--   * controle de recuperacao de senha
--   * data da ultima troca de senha
--   * ajuste da RPC get_my_profile
--   * indice unico por email em students
-- ============================================================

SET search_path = public;

ALTER TABLE public.user_profiles
    ADD COLUMN IF NOT EXISTS secret_question TEXT,
    ADD COLUMN IF NOT EXISTS secret_answer_hash TEXT,
    ADD COLUMN IF NOT EXISTS password_recovery_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS last_password_change_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_students_email_unique
    ON public.students (LOWER(email))
    WHERE email IS NOT NULL;

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS TABLE (
    id UUID,
    role TEXT,
    display_name TEXT,
    created_at TIMESTAMPTZ,
    is_super_admin BOOLEAN,
    must_change_password BOOLEAN,
    secret_question TEXT,
    password_recovery_enabled BOOLEAN
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
        COALESCE(up.password_recovery_enabled, FALSE) AS password_recovery_enabled
    FROM public.user_profiles up
    WHERE up.id = (SELECT auth.uid())
    LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_my_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;
