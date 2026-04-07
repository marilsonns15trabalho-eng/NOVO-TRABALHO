-- ============================================================
-- FASE 3.19 - DESAFIOS COM ACESSO CONTROLADO
-- Rodar depois de phase3_02/08/09/17.
-- Objetivo:
--   * permitir desafios diarios de treino e protocolo alimentar
--   * exibir a aba apenas para alunas vinculadas ao desafio
--   * manter gestao simples para equipe sem sobrecarregar o banco
-- ============================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.desafios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
    start_date DATE,
    end_date DATE,
    created_by_auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by_auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT desafios_valid_date_range CHECK (
        start_date IS NULL
        OR end_date IS NULL
        OR start_date <= end_date
    )
);

CREATE INDEX IF NOT EXISTS idx_desafios_status_date_window
    ON public.desafios(status, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_desafios_updated_recent
    ON public.desafios(updated_at DESC);

DROP TRIGGER IF EXISTS set_timestamp_on_desafios ON public.desafios;
CREATE TRIGGER set_timestamp_on_desafios
BEFORE UPDATE ON public.desafios
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TABLE IF NOT EXISTS public.desafio_participantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES public.desafios(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    assigned_by_auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    removed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT desafio_participantes_unique UNIQUE (challenge_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_desafio_participantes_challenge_active
    ON public.desafio_participantes(challenge_id, removed_at, assigned_at DESC);

CREATE INDEX IF NOT EXISTS idx_desafio_participantes_student_active
    ON public.desafio_participantes(student_id, removed_at, assigned_at DESC);

DROP TRIGGER IF EXISTS set_timestamp_on_desafio_participantes ON public.desafio_participantes;
CREATE TRIGGER set_timestamp_on_desafio_participantes
BEFORE UPDATE ON public.desafio_participantes
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

CREATE TABLE IF NOT EXISTS public.desafio_dias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES public.desafios(id) ON DELETE CASCADE,
    challenge_date DATE NOT NULL,
    title TEXT,
    training_guidance TEXT,
    nutrition_guidance TEXT,
    notes TEXT,
    linked_training_plan_id UUID REFERENCES public.training_plans(id) ON DELETE SET NULL,
    linked_food_protocol_id UUID REFERENCES public.protocolos_alimentares(id) ON DELETE SET NULL,
    updated_by_auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT desafio_dias_unique UNIQUE (challenge_id, challenge_date)
);

CREATE INDEX IF NOT EXISTS idx_desafio_dias_challenge_recent
    ON public.desafio_dias(challenge_id, challenge_date DESC);

CREATE INDEX IF NOT EXISTS idx_desafio_dias_date_recent
    ON public.desafio_dias(challenge_date DESC, challenge_id);

DROP TRIGGER IF EXISTS set_timestamp_on_desafio_dias ON public.desafio_dias;
CREATE TRIGGER set_timestamp_on_desafio_dias
BEFORE UPDATE ON public.desafio_dias
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

ALTER TABLE public.desafios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.desafio_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.desafio_dias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS desafios_select ON public.desafios;
CREATE POLICY desafios_select ON public.desafios
FOR SELECT
USING (
    (SELECT public.is_staff())
    OR EXISTS (
        SELECT 1
        FROM public.desafio_participantes dp
        WHERE dp.challenge_id = desafios.id
          AND dp.student_id = (SELECT public.current_student_id())
          AND dp.removed_at IS NULL
          AND desafios.status = 'active'
    )
);

DROP POLICY IF EXISTS desafios_staff_insert ON public.desafios;
CREATE POLICY desafios_staff_insert ON public.desafios
FOR INSERT
WITH CHECK ((SELECT public.is_staff()));

DROP POLICY IF EXISTS desafios_staff_update ON public.desafios;
CREATE POLICY desafios_staff_update ON public.desafios
FOR UPDATE
USING ((SELECT public.is_staff()))
WITH CHECK ((SELECT public.is_staff()));

DROP POLICY IF EXISTS desafios_staff_delete ON public.desafios;
CREATE POLICY desafios_staff_delete ON public.desafios
FOR DELETE
USING ((SELECT public.is_staff()));

DROP POLICY IF EXISTS desafio_participantes_select ON public.desafio_participantes;
CREATE POLICY desafio_participantes_select ON public.desafio_participantes
FOR SELECT
USING (
    (SELECT public.is_staff())
    OR (
        student_id = (SELECT public.current_student_id())
        AND EXISTS (
            SELECT 1
            FROM public.desafios d
            WHERE d.id = desafio_participantes.challenge_id
              AND d.status = 'active'
        )
    )
);

DROP POLICY IF EXISTS desafio_participantes_staff_insert ON public.desafio_participantes;
CREATE POLICY desafio_participantes_staff_insert ON public.desafio_participantes
FOR INSERT
WITH CHECK ((SELECT public.is_staff()));

DROP POLICY IF EXISTS desafio_participantes_staff_update ON public.desafio_participantes;
CREATE POLICY desafio_participantes_staff_update ON public.desafio_participantes
FOR UPDATE
USING ((SELECT public.is_staff()))
WITH CHECK ((SELECT public.is_staff()));

DROP POLICY IF EXISTS desafio_participantes_staff_delete ON public.desafio_participantes;
CREATE POLICY desafio_participantes_staff_delete ON public.desafio_participantes
FOR DELETE
USING ((SELECT public.is_staff()));

DROP POLICY IF EXISTS desafio_dias_select ON public.desafio_dias;
CREATE POLICY desafio_dias_select ON public.desafio_dias
FOR SELECT
USING (
    (SELECT public.is_staff())
    OR EXISTS (
        SELECT 1
        FROM public.desafio_participantes dp
        JOIN public.desafios d
          ON d.id = dp.challenge_id
        WHERE dp.challenge_id = desafio_dias.challenge_id
          AND dp.student_id = (SELECT public.current_student_id())
          AND dp.removed_at IS NULL
          AND d.status = 'active'
    )
);

DROP POLICY IF EXISTS desafio_dias_staff_insert ON public.desafio_dias;
CREATE POLICY desafio_dias_staff_insert ON public.desafio_dias
FOR INSERT
WITH CHECK ((SELECT public.is_staff()));

DROP POLICY IF EXISTS desafio_dias_staff_update ON public.desafio_dias;
CREATE POLICY desafio_dias_staff_update ON public.desafio_dias
FOR UPDATE
USING ((SELECT public.is_staff()))
WITH CHECK ((SELECT public.is_staff()));

DROP POLICY IF EXISTS desafio_dias_staff_delete ON public.desafio_dias;
CREATE POLICY desafio_dias_staff_delete ON public.desafio_dias
FOR DELETE
USING ((SELECT public.is_staff()));

ANALYZE public.desafios;
ANALYZE public.desafio_participantes;
ANALYZE public.desafio_dias;
