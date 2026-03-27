-- ============================================================
-- FASE 3.09 - VERSIONAMENTO E EXECUCAO DE TREINO
-- Rodar no projeto novo depois de phase3_08_training_system.sql.
-- Objetivo:
--   * versionar planos sem reescrever o modulo atual
--   * adicionar agenda por treino (split/dia da semana)
--   * suportar execucao parcial com checkpoint manual
--   * manter compatibilidade com o historico atual de conclusao
-- ============================================================

SET search_path = public;

DO $$
BEGIN
    IF to_regclass('public.training_plans') IS NULL THEN
        RAISE EXCEPTION 'Tabela public.training_plans nao encontrada. Rode phase3_08_training_system.sql antes da phase3_09.';
    END IF;

    IF to_regclass('public.student_training_plans') IS NULL THEN
        RAISE EXCEPTION 'Tabela public.student_training_plans nao encontrada. Rode phase3_08_training_system.sql antes da phase3_09.';
    END IF;

    IF to_regclass('public.treino_student_assignments') IS NULL THEN
        RAISE EXCEPTION 'Tabela public.treino_student_assignments nao encontrada. Rode phase3_08_training_system.sql antes da phase3_09.';
    END IF;

    IF to_regclass('public.treino_completion_logs') IS NULL THEN
        RAISE EXCEPTION 'Tabela public.treino_completion_logs nao encontrada. Rode phase3_08_training_system.sql antes da phase3_09.';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.training_plan_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    training_plan_id UUID NOT NULL REFERENCES public.training_plans(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL CHECK (version_number > 0),
    objective TEXT,
    level TEXT,
    duration_weeks INTEGER CHECK (duration_weeks IS NULL OR duration_weeks BETWEEN 1 AND 52),
    coach_notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_by_auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT training_plan_versions_unique UNIQUE (training_plan_id, version_number)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_training_plan_versions_single_active
    ON public.training_plan_versions(training_plan_id)
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_training_plan_versions_active_lookup
    ON public.training_plan_versions(training_plan_id, is_active, version_number DESC);

ALTER TABLE public.treinos
    ADD COLUMN IF NOT EXISTS training_plan_version_id UUID REFERENCES public.training_plan_versions(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS split_label TEXT,
    ADD COLUMN IF NOT EXISTS day_of_week SMALLINT,
    ADD COLUMN IF NOT EXISTS coach_notes TEXT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'treinos_day_of_week_check'
    ) THEN
        ALTER TABLE public.treinos
            ADD CONSTRAINT treinos_day_of_week_check
            CHECK (day_of_week IS NULL OR day_of_week BETWEEN 0 AND 6);
    END IF;
END $$;

INSERT INTO public.training_plan_versions (
    training_plan_id,
    version_number,
    objective,
    level,
    duration_weeks,
    coach_notes,
    is_active,
    published_at,
    created_by_auth_user_id,
    created_at,
    updated_at
)
SELECT
    tp.id,
    1,
    tp.description,
    NULL,
    NULL,
    NULL,
    TRUE,
    COALESCE(tp.updated_at, tp.created_at, NOW()),
    tp.created_by_auth_user_id,
    COALESCE(tp.created_at, NOW()),
    COALESCE(tp.updated_at, tp.created_at, NOW())
FROM public.training_plans tp
WHERE NOT EXISTS (
    SELECT 1
    FROM public.training_plan_versions tpv
    WHERE tpv.training_plan_id = tp.id
);

UPDATE public.treinos t
SET training_plan_version_id = active_version.id
FROM public.training_plan_versions active_version
WHERE t.training_plan_id = active_version.training_plan_id
  AND active_version.is_active = TRUE
  AND t.training_plan_version_id IS NULL;

CREATE TABLE IF NOT EXISTS public.treino_execution_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    treino_id UUID NOT NULL REFERENCES public.treinos(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    execution_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'completed', 'cancelled')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_by_auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    completed_by_auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    completion_source TEXT NOT NULL DEFAULT 'student'
        CHECK (completion_source IN ('student', 'staff')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT treino_execution_sessions_unique UNIQUE (treino_id, student_id, execution_date)
);

CREATE TABLE IF NOT EXISTS public.treino_execution_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.treino_execution_sessions(id) ON DELETE CASCADE,
    exercise_index INTEGER NOT NULL CHECK (exercise_index >= 0),
    exercise_name TEXT NOT NULL,
    planned_sets INTEGER,
    planned_reps TEXT,
    planned_load TEXT,
    planned_rest TEXT,
    performed_sets INTEGER,
    performed_reps TEXT,
    performed_load TEXT,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT treino_execution_items_unique UNIQUE (session_id, exercise_index)
);

INSERT INTO public.treino_execution_sessions (
    treino_id,
    student_id,
    execution_date,
    status,
    started_at,
    completed_at,
    last_activity_at,
    started_by_auth_user_id,
    completed_by_auth_user_id,
    completion_source,
    notes,
    created_at,
    updated_at
)
SELECT
    log.treino_id,
    log.student_id,
    log.completed_on,
    'completed',
    COALESCE(log.completed_at, log.created_at, NOW()),
    COALESCE(log.completed_at, log.created_at, NOW()),
    COALESCE(log.completed_at, log.updated_at, NOW()),
    log.completed_by_auth_user_id,
    log.completed_by_auth_user_id,
    log.completion_source,
    log.notes,
    COALESCE(log.created_at, NOW()),
    COALESCE(log.updated_at, log.created_at, NOW())
FROM public.treino_completion_logs log
ON CONFLICT (treino_id, student_id, execution_date) DO NOTHING;

DROP TRIGGER IF EXISTS set_timestamp_on_training_plan_versions ON public.training_plan_versions;
CREATE TRIGGER set_timestamp_on_training_plan_versions
BEFORE UPDATE ON public.training_plan_versions
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_timestamp_on_treino_execution_sessions ON public.treino_execution_sessions;
CREATE TRIGGER set_timestamp_on_treino_execution_sessions
BEFORE UPDATE ON public.treino_execution_sessions
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_timestamp_on_treino_execution_items ON public.treino_execution_items;
CREATE TRIGGER set_timestamp_on_treino_execution_items
BEFORE UPDATE ON public.treino_execution_items
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE INDEX IF NOT EXISTS idx_treinos_plan_version_schedule
    ON public.treinos(training_plan_id, training_plan_version_id, day_of_week, sort_order);

CREATE INDEX IF NOT EXISTS idx_treino_execution_sessions_student_date
    ON public.treino_execution_sessions(student_id, execution_date DESC);

CREATE INDEX IF NOT EXISTS idx_treino_execution_sessions_treino_date
    ON public.treino_execution_sessions(treino_id, execution_date DESC);

CREATE INDEX IF NOT EXISTS idx_treino_execution_sessions_status_date
    ON public.treino_execution_sessions(status, execution_date DESC);

CREATE INDEX IF NOT EXISTS idx_treino_execution_items_session
    ON public.treino_execution_items(session_id, exercise_index);

ALTER TABLE public.training_plan_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treino_execution_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treino_execution_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS training_plan_versions_select ON public.training_plan_versions;
CREATE POLICY training_plan_versions_select ON public.training_plan_versions
FOR SELECT
USING (
    (SELECT public.is_staff())
    OR EXISTS (
        SELECT 1
        FROM public.student_training_plans stp
        JOIN public.students s ON s.id = stp.student_id
        WHERE stp.training_plan_id = training_plan_versions.training_plan_id
          AND stp.active = TRUE
          AND s.linked_auth_user_id = (SELECT auth.uid())
    )
);

DROP POLICY IF EXISTS training_plan_versions_staff_insert ON public.training_plan_versions;
CREATE POLICY training_plan_versions_staff_insert ON public.training_plan_versions
FOR INSERT
WITH CHECK ((SELECT public.is_staff()));

DROP POLICY IF EXISTS training_plan_versions_staff_update ON public.training_plan_versions;
CREATE POLICY training_plan_versions_staff_update ON public.training_plan_versions
FOR UPDATE
USING ((SELECT public.is_staff()))
WITH CHECK ((SELECT public.is_staff()));

DROP POLICY IF EXISTS training_plan_versions_staff_delete ON public.training_plan_versions;
CREATE POLICY training_plan_versions_staff_delete ON public.training_plan_versions
FOR DELETE
USING ((SELECT public.is_staff()));

DROP POLICY IF EXISTS treino_execution_sessions_select ON public.treino_execution_sessions;
CREATE POLICY treino_execution_sessions_select ON public.treino_execution_sessions
FOR SELECT
USING (
    (SELECT public.is_staff())
    OR treino_execution_sessions.student_id = (SELECT public.current_student_id())
);

DROP POLICY IF EXISTS treino_execution_sessions_insert ON public.treino_execution_sessions;
CREATE POLICY treino_execution_sessions_insert ON public.treino_execution_sessions
FOR INSERT
WITH CHECK (
    (SELECT public.is_staff())
    OR treino_execution_sessions.student_id = (SELECT public.current_student_id())
);

DROP POLICY IF EXISTS treino_execution_sessions_update ON public.treino_execution_sessions;
CREATE POLICY treino_execution_sessions_update ON public.treino_execution_sessions
FOR UPDATE
USING (
    (SELECT public.is_staff())
    OR treino_execution_sessions.student_id = (SELECT public.current_student_id())
)
WITH CHECK (
    (SELECT public.is_staff())
    OR treino_execution_sessions.student_id = (SELECT public.current_student_id())
);

DROP POLICY IF EXISTS treino_execution_sessions_delete ON public.treino_execution_sessions;
CREATE POLICY treino_execution_sessions_delete ON public.treino_execution_sessions
FOR DELETE
USING ((SELECT public.is_staff()));

DROP POLICY IF EXISTS treino_execution_items_select ON public.treino_execution_items;
CREATE POLICY treino_execution_items_select ON public.treino_execution_items
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.treino_execution_sessions session
        WHERE session.id = treino_execution_items.session_id
          AND (
              (SELECT public.is_staff())
              OR session.student_id = (SELECT public.current_student_id())
          )
    )
);

DROP POLICY IF EXISTS treino_execution_items_insert ON public.treino_execution_items;
CREATE POLICY treino_execution_items_insert ON public.treino_execution_items
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.treino_execution_sessions session
        WHERE session.id = treino_execution_items.session_id
          AND (
              (SELECT public.is_staff())
              OR session.student_id = (SELECT public.current_student_id())
          )
    )
);

DROP POLICY IF EXISTS treino_execution_items_update ON public.treino_execution_items;
CREATE POLICY treino_execution_items_update ON public.treino_execution_items
FOR UPDATE
USING (
    EXISTS (
        SELECT 1
        FROM public.treino_execution_sessions session
        WHERE session.id = treino_execution_items.session_id
          AND (
              (SELECT public.is_staff())
              OR session.student_id = (SELECT public.current_student_id())
          )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.treino_execution_sessions session
        WHERE session.id = treino_execution_items.session_id
          AND (
              (SELECT public.is_staff())
              OR session.student_id = (SELECT public.current_student_id())
          )
    )
);

DROP POLICY IF EXISTS treino_execution_items_delete ON public.treino_execution_items;
CREATE POLICY treino_execution_items_delete ON public.treino_execution_items
FOR DELETE
USING (
    EXISTS (
        SELECT 1
        FROM public.treino_execution_sessions session
        WHERE session.id = treino_execution_items.session_id
          AND (SELECT public.is_staff())
    )
);

ANALYZE public.training_plan_versions;
ANALYZE public.treinos;
ANALYZE public.treino_execution_sessions;
ANALYZE public.treino_execution_items;
