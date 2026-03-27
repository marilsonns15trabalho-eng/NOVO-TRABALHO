-- ============================================================
-- FASE 3.08 - SISTEMA PROFISSIONAL DE PLANOS E VINCULOS DE TREINO
-- Rodar no projeto novo depois de phase3_01/02/03/07.
-- Inclui:
--   * planos de treino por frequencia semanal
--   * vinculo ativo de aluno com plano de treino
--   * vinculo direto de treino com um ou mais alunos
--   * conclusao de treino por aluno
--   * leitura mensal de progresso
-- ============================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.training_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    weekly_frequency INTEGER NOT NULL CHECK (weekly_frequency BETWEEN 1 AND 7),
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by_auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.student_training_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    training_plan_id UUID NOT NULL REFERENCES public.training_plans(id) ON DELETE CASCADE,
    start_date DATE,
    end_date DATE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_by_auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.treinos
    ALTER COLUMN student_id DROP NOT NULL;

ALTER TABLE public.treinos
    ADD COLUMN IF NOT EXISTS training_plan_id UUID REFERENCES public.training_plans(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS created_by_auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.treino_student_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    treino_id UUID NOT NULL REFERENCES public.treinos(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    assigned_by_auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT treino_student_assignments_unique UNIQUE (treino_id, student_id)
);

CREATE TABLE IF NOT EXISTS public.treino_completion_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    treino_id UUID NOT NULL REFERENCES public.treinos(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    completed_on DATE NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_by_auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    completion_source TEXT NOT NULL DEFAULT 'student' CHECK (completion_source IN ('student', 'staff')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT treino_completion_logs_unique UNIQUE (treino_id, student_id, completed_on)
);

UPDATE public.treinos t
SET created_by_auth_user_id = s.created_by_auth_user_id
FROM public.students s
WHERE t.created_by_auth_user_id IS NULL
  AND t.student_id IS NOT NULL
  AND s.id = t.student_id;

INSERT INTO public.treino_student_assignments (
    treino_id,
    student_id,
    active,
    assigned_by_auth_user_id,
    created_at,
    updated_at
)
SELECT
    t.id,
    t.student_id,
    COALESCE(t.ativo, TRUE),
    t.created_by_auth_user_id,
    COALESCE(t.created_at, NOW()),
    COALESCE(t.updated_at, NOW())
FROM public.treinos t
WHERE t.student_id IS NOT NULL
ON CONFLICT (treino_id, student_id) DO NOTHING;

DROP TRIGGER IF EXISTS set_timestamp_on_training_plans ON public.training_plans;
CREATE TRIGGER set_timestamp_on_training_plans
BEFORE UPDATE ON public.training_plans
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_timestamp_on_student_training_plans ON public.student_training_plans;
CREATE TRIGGER set_timestamp_on_student_training_plans
BEFORE UPDATE ON public.student_training_plans
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_timestamp_on_treino_student_assignments ON public.treino_student_assignments;
CREATE TRIGGER set_timestamp_on_treino_student_assignments
BEFORE UPDATE ON public.treino_student_assignments
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

DROP TRIGGER IF EXISTS set_timestamp_on_treino_completion_logs ON public.treino_completion_logs;
CREATE TRIGGER set_timestamp_on_treino_completion_logs
BEFORE UPDATE ON public.treino_completion_logs
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE INDEX IF NOT EXISTS idx_training_plans_active_frequency
    ON public.training_plans(active, weekly_frequency);

CREATE UNIQUE INDEX IF NOT EXISTS idx_student_training_plans_single_active
    ON public.student_training_plans(student_id)
    WHERE active = TRUE;

CREATE INDEX IF NOT EXISTS idx_student_training_plans_training_plan_id
    ON public.student_training_plans(training_plan_id);

CREATE INDEX IF NOT EXISTS idx_treinos_training_plan_id
    ON public.treinos(training_plan_id);

CREATE INDEX IF NOT EXISTS idx_treinos_created_by_auth_user_id
    ON public.treinos(created_by_auth_user_id);

CREATE INDEX IF NOT EXISTS idx_treino_student_assignments_student_id
    ON public.treino_student_assignments(student_id);

CREATE INDEX IF NOT EXISTS idx_treino_student_assignments_treino_id
    ON public.treino_student_assignments(treino_id);

CREATE INDEX IF NOT EXISTS idx_treino_completion_logs_student_month
    ON public.treino_completion_logs(student_id, completed_on DESC);

CREATE INDEX IF NOT EXISTS idx_treino_completion_logs_treino_month
    ON public.treino_completion_logs(treino_id, completed_on DESC);

ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treino_student_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treino_completion_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS training_plans_select ON public.training_plans;
CREATE POLICY training_plans_select ON public.training_plans
FOR SELECT
USING (
    (SELECT public.is_staff())
    OR EXISTS (
        SELECT 1
        FROM public.student_training_plans stp
        JOIN public.students s ON s.id = stp.student_id
        WHERE stp.training_plan_id = training_plans.id
          AND stp.active = TRUE
          AND s.linked_auth_user_id = (SELECT auth.uid())
    )
);

DROP POLICY IF EXISTS training_plans_staff_insert ON public.training_plans;
CREATE POLICY training_plans_staff_insert ON public.training_plans
FOR INSERT
WITH CHECK ((SELECT public.is_staff()));

DROP POLICY IF EXISTS training_plans_staff_update ON public.training_plans;
CREATE POLICY training_plans_staff_update ON public.training_plans
FOR UPDATE
USING ((SELECT public.is_staff()))
WITH CHECK ((SELECT public.is_staff()));

DROP POLICY IF EXISTS training_plans_staff_delete ON public.training_plans;
CREATE POLICY training_plans_staff_delete ON public.training_plans
FOR DELETE
USING ((SELECT public.is_staff()));

DROP POLICY IF EXISTS student_training_plans_select ON public.student_training_plans;
CREATE POLICY student_training_plans_select ON public.student_training_plans
FOR SELECT
USING (
    (SELECT public.is_staff())
    OR EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = student_training_plans.student_id
          AND s.linked_auth_user_id = (SELECT auth.uid())
    )
);

DROP POLICY IF EXISTS student_training_plans_staff_insert ON public.student_training_plans;
CREATE POLICY student_training_plans_staff_insert ON public.student_training_plans
FOR INSERT
WITH CHECK ((SELECT public.is_staff()));

DROP POLICY IF EXISTS student_training_plans_staff_update ON public.student_training_plans;
CREATE POLICY student_training_plans_staff_update ON public.student_training_plans
FOR UPDATE
USING ((SELECT public.is_staff()))
WITH CHECK ((SELECT public.is_staff()));

DROP POLICY IF EXISTS student_training_plans_staff_delete ON public.student_training_plans;
CREATE POLICY student_training_plans_staff_delete ON public.student_training_plans
FOR DELETE
USING ((SELECT public.is_staff()));

DROP POLICY IF EXISTS treino_student_assignments_select ON public.treino_student_assignments;
CREATE POLICY treino_student_assignments_select ON public.treino_student_assignments
FOR SELECT
USING (
    (SELECT public.is_staff())
    OR EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = treino_student_assignments.student_id
          AND s.linked_auth_user_id = (SELECT auth.uid())
    )
);

DROP POLICY IF EXISTS treino_student_assignments_staff_insert ON public.treino_student_assignments;
CREATE POLICY treino_student_assignments_staff_insert ON public.treino_student_assignments
FOR INSERT
WITH CHECK ((SELECT public.is_staff()));

DROP POLICY IF EXISTS treino_student_assignments_staff_update ON public.treino_student_assignments;
CREATE POLICY treino_student_assignments_staff_update ON public.treino_student_assignments
FOR UPDATE
USING ((SELECT public.is_staff()))
WITH CHECK ((SELECT public.is_staff()));

DROP POLICY IF EXISTS treino_student_assignments_staff_delete ON public.treino_student_assignments;
CREATE POLICY treino_student_assignments_staff_delete ON public.treino_student_assignments
FOR DELETE
USING ((SELECT public.is_staff()));

DROP POLICY IF EXISTS treino_completion_logs_select ON public.treino_completion_logs;
CREATE POLICY treino_completion_logs_select ON public.treino_completion_logs
FOR SELECT
USING (
    (SELECT public.is_staff())
    OR EXISTS (
        SELECT 1
        FROM public.students s
        WHERE s.id = treino_completion_logs.student_id
          AND s.linked_auth_user_id = (SELECT auth.uid())
    )
);

DROP POLICY IF EXISTS treino_completion_logs_insert ON public.treino_completion_logs;
CREATE POLICY treino_completion_logs_insert ON public.treino_completion_logs
FOR INSERT
WITH CHECK (
    (
        (SELECT public.is_staff())
        AND EXISTS (
            SELECT 1
            FROM public.students s
            WHERE s.id = treino_completion_logs.student_id
        )
    )
    OR (
        treino_completion_logs.student_id = (SELECT public.current_student_id())
    )
);

DROP POLICY IF EXISTS treino_completion_logs_update ON public.treino_completion_logs;
CREATE POLICY treino_completion_logs_update ON public.treino_completion_logs
FOR UPDATE
USING (
    (SELECT public.is_staff())
    OR treino_completion_logs.student_id = (SELECT public.current_student_id())
)
WITH CHECK (
    (SELECT public.is_staff())
    OR treino_completion_logs.student_id = (SELECT public.current_student_id())
);

DROP POLICY IF EXISTS treino_completion_logs_delete ON public.treino_completion_logs;
CREATE POLICY treino_completion_logs_delete ON public.treino_completion_logs
FOR DELETE
USING (
    (SELECT public.is_staff())
    OR treino_completion_logs.student_id = (SELECT public.current_student_id())
);

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
    OR EXISTS (
        SELECT 1
        FROM public.treino_student_assignments tsa
        JOIN public.students s ON s.id = tsa.student_id
        WHERE tsa.treino_id = treinos.id
          AND tsa.active = TRUE
          AND s.linked_auth_user_id = (SELECT auth.uid())
    )
    OR EXISTS (
        SELECT 1
        FROM public.student_training_plans stp
        JOIN public.students s ON s.id = stp.student_id
        WHERE stp.training_plan_id = treinos.training_plan_id
          AND stp.active = TRUE
          AND s.linked_auth_user_id = (SELECT auth.uid())
    )
);

DROP POLICY IF EXISTS treinos_staff_insert ON public.treinos;
CREATE POLICY treinos_staff_insert ON public.treinos
FOR INSERT
WITH CHECK ((SELECT public.is_staff()));

DROP POLICY IF EXISTS treinos_staff_update ON public.treinos;
CREATE POLICY treinos_staff_update ON public.treinos
FOR UPDATE
USING ((SELECT public.is_staff()))
WITH CHECK ((SELECT public.is_staff()));

DROP POLICY IF EXISTS treinos_staff_delete ON public.treinos;
CREATE POLICY treinos_staff_delete ON public.treinos
FOR DELETE
USING ((SELECT public.is_staff()));

ANALYZE public.training_plans;
ANALYZE public.student_training_plans;
ANALYZE public.treinos;
ANALYZE public.treino_student_assignments;
ANALYZE public.treino_completion_logs;
