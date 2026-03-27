-- ============================================================
-- FASE 3.03E - PROMOVER O ADMIN PRINCIPAL DO PROJETO NOVO
-- Rodar no projeto novo depois de criar manualmente o usuario admin no Auth.
-- Email do admin principal ja configurado abaixo.
-- ============================================================

SET search_path = public;

DO $$
DECLARE
    v_admin_email TEXT := 'marilsonns15@gmail.com';
    v_admin_user_id UUID;
BEGIN
    SELECT au.id
    INTO v_admin_user_id
    FROM auth.users au
    WHERE LOWER(TRIM(au.email)) = LOWER(TRIM(v_admin_email))
    LIMIT 1;

    IF v_admin_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario admin com email % nao encontrado em auth.users.', v_admin_email;
    END IF;

    INSERT INTO public.user_profiles (
        id,
        role,
        display_name,
        must_change_password,
        is_super_admin
    )
    VALUES (
        v_admin_user_id,
        'admin',
        v_admin_email,
        FALSE,
        TRUE
    )
    ON CONFLICT (id) DO UPDATE
    SET
        role = 'admin',
        is_super_admin = TRUE,
        updated_at = NOW();

    UPDATE public.system_security_config
    SET
        super_admin_user_id = v_admin_user_id,
        updated_at = NOW()
    WHERE singleton = TRUE;
END $$;

SELECT
    up.id,
    au.email,
    up.role,
    up.is_super_admin
FROM public.user_profiles up
JOIN auth.users au
  ON au.id = up.id
WHERE COALESCE(up.is_super_admin, FALSE) = TRUE;
