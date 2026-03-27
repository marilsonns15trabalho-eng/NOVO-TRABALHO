-- ============================================================
-- FASE 3.10 - LEITURA DE NOTIFICACOES DO CABECALHO
-- Rodar no projeto novo depois de phase3_01/08/09.
-- Objetivo:
--   * persistir notificacoes ja abertas por usuario
--   * permitir limpar notificacoes nao lidas sem criar modulo pesado
-- ============================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.user_notification_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_id TEXT NOT NULL,
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT user_notification_reads_unique UNIQUE (user_id, notification_id)
);

CREATE INDEX IF NOT EXISTS idx_user_notification_reads_user_recent
    ON public.user_notification_reads(user_id, read_at DESC);

DROP TRIGGER IF EXISTS set_timestamp_on_user_notification_reads ON public.user_notification_reads;
CREATE TRIGGER set_timestamp_on_user_notification_reads
BEFORE UPDATE ON public.user_notification_reads
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

ALTER TABLE public.user_notification_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_notification_reads_select ON public.user_notification_reads;
CREATE POLICY user_notification_reads_select ON public.user_notification_reads
FOR SELECT
USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS user_notification_reads_insert ON public.user_notification_reads;
CREATE POLICY user_notification_reads_insert ON public.user_notification_reads
FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS user_notification_reads_update ON public.user_notification_reads;
CREATE POLICY user_notification_reads_update ON public.user_notification_reads
FOR UPDATE
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS user_notification_reads_delete ON public.user_notification_reads;
CREATE POLICY user_notification_reads_delete ON public.user_notification_reads
FOR DELETE
USING (user_id = (SELECT auth.uid()));

ANALYZE public.user_notification_reads;
