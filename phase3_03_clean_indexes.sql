-- ============================================================
-- FASE 3.03 - INDICES DO PROJETO NOVO
-- Rodar depois de phase3_01_clean_schema.sql.
-- ============================================================

SET search_path = public;

CREATE INDEX IF NOT EXISTS idx_plans_active_price
    ON public.plans(active, price)
    WHERE active = TRUE;

CREATE INDEX IF NOT EXISTS idx_students_name
    ON public.students(name);

CREATE INDEX IF NOT EXISTS idx_students_status
    ON public.students(status);

CREATE INDEX IF NOT EXISTS idx_students_plan_id
    ON public.students(plan_id);

CREATE INDEX IF NOT EXISTS idx_students_created_by_auth_user_id
    ON public.students(created_by_auth_user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_students_linked_auth_user_id_unique
    ON public.students(linked_auth_user_id)
    WHERE linked_auth_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_students_email_unique
    ON public.students (LOWER(email))
    WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_treinos_student_id_created_at
    ON public.treinos(student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_treinos_student_id_ativo
    ON public.treinos(student_id, ativo);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_student_id_data
    ON public.avaliacoes(student_id, data DESC);

CREATE INDEX IF NOT EXISTS idx_anamneses_student_id_data
    ON public.anamneses(student_id, data DESC);

CREATE INDEX IF NOT EXISTS idx_financeiro_tipo_status_data_vencimento
    ON public.financeiro(tipo, status, data_vencimento);

CREATE INDEX IF NOT EXISTS idx_bills_student_id
    ON public.bills(student_id);

CREATE INDEX IF NOT EXISTS idx_bills_status_due_date
    ON public.bills(status, due_date);

CREATE INDEX IF NOT EXISTS idx_assinaturas_student_id_created_at
    ON public.assinaturas(student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_assinaturas_plan_id
    ON public.assinaturas(plan_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_role
    ON public.user_profiles(role);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_single_super_admin
    ON public.user_profiles(is_super_admin)
    WHERE is_super_admin = TRUE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_system_security_config_super_admin_user_id
    ON public.system_security_config(super_admin_user_id)
    WHERE super_admin_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_migration_user_id_map_new_auth_user_id
    ON migration.user_id_map(new_auth_user_id);

CREATE INDEX IF NOT EXISTS idx_migration_user_id_map_email
    ON migration.user_id_map(email);
