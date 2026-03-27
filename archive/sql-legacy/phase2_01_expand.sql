-- ============================================================
-- Phase 2.01 - Expand schema for students identity split
-- Safe to run multiple times where possible.
-- Does not remove or rewrite students.user_id.
-- ============================================================

SET search_path = public;

DO $$
BEGIN
    IF to_regclass('public.students') IS NULL THEN
        RAISE EXCEPTION 'Tabela public.students nao encontrada.';
    END IF;
END $$;

ALTER TABLE public.students
    ADD COLUMN IF NOT EXISTS created_by_auth_user_id UUID,
    ADD COLUMN IF NOT EXISTS linked_auth_user_id UUID;

CREATE INDEX IF NOT EXISTS idx_students_user_id
    ON public.students(user_id);

CREATE INDEX IF NOT EXISTS idx_students_email
    ON public.students(email);

CREATE INDEX IF NOT EXISTS idx_students_created_by_auth_user_id
    ON public.students(created_by_auth_user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_students_linked_auth_user_id_unique
    ON public.students(linked_auth_user_id)
    WHERE linked_auth_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_treinos_student_id
    ON public.treinos(student_id);

CREATE INDEX IF NOT EXISTS idx_avaliacoes_student_id
    ON public.avaliacoes(student_id);

CREATE INDEX IF NOT EXISTS idx_anamneses_student_id
    ON public.anamneses(student_id);

CREATE INDEX IF NOT EXISTS idx_assinaturas_student_id
    ON public.assinaturas(student_id);

CREATE TABLE IF NOT EXISTS public.phase2_students_snapshot (
    id UUID PRIMARY KEY,
    name TEXT,
    email TEXT,
    phone TEXT,
    cpf TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    user_id UUID,
    captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.phase2_user_profiles_snapshot (
    id UUID PRIMARY KEY,
    role TEXT,
    is_super_admin BOOLEAN,
    captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.phase2_auth_users_snapshot (
    id UUID PRIMARY KEY,
    email TEXT,
    captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.student_link_reconciliation (
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    possible_auth_user_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'resolved', 'rejected')),
    reason TEXT NOT NULL,
    PRIMARY KEY (student_id, possible_auth_user_id)
);

CREATE INDEX IF NOT EXISTS idx_student_link_reconciliation_status
    ON public.student_link_reconciliation(status);

CREATE INDEX IF NOT EXISTS idx_student_link_reconciliation_possible_auth_user_id
    ON public.student_link_reconciliation(possible_auth_user_id);

CREATE TABLE IF NOT EXISTS public.phase2_migration_control (
    singleton BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (singleton = TRUE),
    write_freeze_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

INSERT INTO public.phase2_migration_control (singleton, write_freeze_enabled)
VALUES (TRUE, FALSE)
ON CONFLICT (singleton) DO NOTHING;

CREATE OR REPLACE FUNCTION public.phase2_is_migration_mode()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
    SELECT COALESCE(NULLIF(current_setting('app.migration_mode', true), ''), 'off')
           IN ('on', 'true', '1');
$$;

CREATE OR REPLACE FUNCTION public.phase2_write_freeze_enabled()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.phase2_migration_control
        WHERE singleton = TRUE
          AND write_freeze_enabled = TRUE
    );
$$;

CREATE OR REPLACE FUNCTION public.phase2_enforce_write_freeze()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF public.phase2_is_migration_mode() THEN
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        END IF;

        RETURN NEW;
    END IF;

    IF public.phase2_write_freeze_enabled() THEN
        RAISE EXCEPTION 'Phase 2 write freeze ativo para tabela %.', TG_TABLE_NAME;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.phase2_enforce_students_identity_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_actor_role TEXT;
    v_actor_is_super_admin BOOLEAN := FALSE;
BEGIN
    IF public.phase2_is_migration_mode() THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        IF auth.uid() IS NOT NULL THEN
            SELECT up.role, COALESCE(up.is_super_admin, FALSE)
            INTO v_actor_role, v_actor_is_super_admin
            FROM public.user_profiles up
            WHERE up.id = auth.uid();
        END IF;

        IF auth.uid() IS NOT NULL AND (
            v_actor_role IN ('admin', 'professor')
            OR v_actor_is_super_admin = TRUE
        ) THEN
            NEW.created_by_auth_user_id := auth.uid();
        ELSE
            NEW.created_by_auth_user_id := NULL;
        END IF;

        NEW.linked_auth_user_id := NULL;
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        IF OLD.created_by_auth_user_id IS DISTINCT FROM NEW.created_by_auth_user_id THEN
            RAISE EXCEPTION 'Campo created_by_auth_user_id e protegido.';
        END IF;

        IF OLD.linked_auth_user_id IS DISTINCT FROM NEW.linked_auth_user_id THEN
            RAISE EXCEPTION 'Campo linked_auth_user_id e protegido.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.phase2_can_read_student_record(target_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = target_student_id
          AND (
                s.linked_auth_user_id = auth.uid()
             OR s.created_by_auth_user_id = auth.uid()
             OR public.is_admin()
          )
    );
$$;

CREATE OR REPLACE FUNCTION public.phase2_can_read_student_as(actor_user_id UUID, target_student_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = target_student_id
          AND (
                s.linked_auth_user_id = actor_user_id
             OR s.created_by_auth_user_id = actor_user_id
             OR EXISTS (
                    SELECT 1
                    FROM public.user_profiles up
                    WHERE up.id = actor_user_id
                      AND up.role = 'admin'
                )
          )
    );
$$;

DROP TRIGGER IF EXISTS phase2_freeze_students_write ON public.students;
CREATE TRIGGER phase2_freeze_students_write
    BEFORE INSERT OR UPDATE OR DELETE ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.phase2_enforce_write_freeze();

DROP TRIGGER IF EXISTS phase2_protect_students_identity_fields ON public.students;
CREATE TRIGGER phase2_protect_students_identity_fields
    BEFORE INSERT OR UPDATE ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.phase2_enforce_students_identity_fields();

DROP TRIGGER IF EXISTS phase2_freeze_treinos_write ON public.treinos;
CREATE TRIGGER phase2_freeze_treinos_write
    BEFORE INSERT OR UPDATE OR DELETE ON public.treinos
    FOR EACH ROW
    EXECUTE FUNCTION public.phase2_enforce_write_freeze();

DROP TRIGGER IF EXISTS phase2_freeze_avaliacoes_write ON public.avaliacoes;
CREATE TRIGGER phase2_freeze_avaliacoes_write
    BEFORE INSERT OR UPDATE OR DELETE ON public.avaliacoes
    FOR EACH ROW
    EXECUTE FUNCTION public.phase2_enforce_write_freeze();

DROP TRIGGER IF EXISTS phase2_freeze_anamneses_write ON public.anamneses;
CREATE TRIGGER phase2_freeze_anamneses_write
    BEFORE INSERT OR UPDATE OR DELETE ON public.anamneses
    FOR EACH ROW
    EXECUTE FUNCTION public.phase2_enforce_write_freeze();

DROP TRIGGER IF EXISTS phase2_freeze_assinaturas_write ON public.assinaturas;
CREATE TRIGGER phase2_freeze_assinaturas_write
    BEFORE INSERT OR UPDATE OR DELETE ON public.assinaturas
    FOR EACH ROW
    EXECUTE FUNCTION public.phase2_enforce_write_freeze();

SELECT column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'students'
  AND column_name IN ('created_by_auth_user_id', 'linked_auth_user_id')
ORDER BY column_name;

SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'students'
  AND indexname IN (
      'idx_students_user_id',
      'idx_students_email',
      'idx_students_created_by_auth_user_id',
      'idx_students_linked_auth_user_id_unique'
  )
ORDER BY indexname;

SELECT singleton, write_freeze_enabled, updated_at
FROM public.phase2_migration_control
WHERE singleton = TRUE;
