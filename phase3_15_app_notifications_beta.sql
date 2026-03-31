-- ============================================================
-- FASE 3.15 - NOTIFICACOES BETA DO APP/SITE
-- Rodar no SQL Editor do Supabase depois de phase3_02/08/09/10.
-- Objetivo:
--   * persistir notificacoes reais do sistema sem polling pesado
--   * permitir realtime por usuario
--   * manter leitura simples e barata no app/site
-- ============================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.app_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    treino_id UUID REFERENCES public.treinos(id) ON DELETE CASCADE,
    avaliacao_id UUID REFERENCES public.avaliacoes(id) ON DELETE SET NULL,
    anamnese_id UUID REFERENCES public.anamneses(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (
        type IN (
            'training_update',
            'workout_completion',
            'new_anamnese',
            'new_avaliacao',
            'avaliacao_evolution'
        )
    ),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    route TEXT NOT NULL DEFAULT '/dashboard',
    event_key TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_notifications_recipient_recent
    ON public.app_notifications(recipient_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_app_notifications_recipient_unread
    ON public.app_notifications(recipient_user_id, read_at, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_app_notifications_type_recent
    ON public.app_notifications(type, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_app_notifications_recipient_event_key
    ON public.app_notifications(recipient_user_id, event_key)
    WHERE event_key IS NOT NULL;

DROP TRIGGER IF EXISTS set_timestamp_on_app_notifications ON public.app_notifications;
CREATE TRIGGER set_timestamp_on_app_notifications
BEFORE UPDATE ON public.app_notifications
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.notification_staff_users()
RETURNS TABLE (
    id UUID,
    role TEXT,
    display_name TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        up.id,
        up.role,
        up.display_name
    FROM public.user_profiles up
    WHERE up.role IN ('admin', 'professor')
       OR COALESCE(up.is_super_admin, FALSE) = TRUE;
$$;

REVOKE ALL ON FUNCTION public.notification_staff_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.notification_staff_users() TO authenticated;

DROP POLICY IF EXISTS app_notifications_select ON public.app_notifications;
CREATE POLICY app_notifications_select ON public.app_notifications
FOR SELECT
USING (recipient_user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS app_notifications_insert ON public.app_notifications;
CREATE POLICY app_notifications_insert ON public.app_notifications
FOR INSERT
WITH CHECK (
    actor_user_id = (SELECT auth.uid())
    AND recipient_user_id IS NOT NULL
);

DROP POLICY IF EXISTS app_notifications_update ON public.app_notifications;
CREATE POLICY app_notifications_update ON public.app_notifications
FOR UPDATE
USING (recipient_user_id = (SELECT auth.uid()))
WITH CHECK (recipient_user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS app_notifications_delete ON public.app_notifications;
CREATE POLICY app_notifications_delete ON public.app_notifications
FOR DELETE
USING (recipient_user_id = (SELECT auth.uid()));

ANALYZE public.app_notifications;
