-- ============================================================
-- FASE 3.21 - CORRECAO DEFINITIVA DA RECURSAO RLS DO DESAFIO
-- Rodar depois de phase3_19/20.
-- Objetivo:
--   * eliminar a recursao infinita nas policies de desafios
--   * mover a verificacao de acesso para funcoes SECURITY DEFINER
-- ============================================================

SET search_path = public;

ALTER TABLE public.desafio_dias
    ADD COLUMN IF NOT EXISTS storage_path TEXT,
    ADD COLUMN IF NOT EXISTS file_name TEXT,
    ADD COLUMN IF NOT EXISTS content_type TEXT,
    ADD COLUMN IF NOT EXISTS size_bytes INTEGER CHECK (size_bytes IS NULL OR size_bytes >= 0);

CREATE UNIQUE INDEX IF NOT EXISTS idx_desafio_dias_storage_path_unique
    ON public.desafio_dias(storage_path)
    WHERE storage_path IS NOT NULL;

CREATE OR REPLACE FUNCTION public.can_current_student_access_challenge(target_challenge_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.desafios d
        JOIN public.desafio_participantes dp
          ON dp.challenge_id = d.id
        WHERE d.id = target_challenge_id
          AND d.status = 'active'
          AND dp.student_id = (SELECT public.current_student_id())
          AND dp.removed_at IS NULL
    );
$$;

CREATE OR REPLACE FUNCTION public.can_current_student_access_challenge_pdf(target_storage_path TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.desafio_dias dd
        WHERE dd.storage_path = target_storage_path
          AND public.can_current_student_access_challenge(dd.challenge_id)
    );
$$;

REVOKE ALL ON FUNCTION public.can_current_student_access_challenge(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_current_student_access_challenge_pdf(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_current_student_access_challenge(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_current_student_access_challenge_pdf(TEXT) TO authenticated;

DROP POLICY IF EXISTS desafios_select ON public.desafios;
CREATE POLICY desafios_select ON public.desafios
FOR SELECT
USING (
    (SELECT public.is_staff())
    OR (SELECT public.can_current_student_access_challenge(id))
);

DROP POLICY IF EXISTS desafio_participantes_select ON public.desafio_participantes;
CREATE POLICY desafio_participantes_select ON public.desafio_participantes
FOR SELECT
USING (
    (SELECT public.is_staff())
    OR (
        student_id = (SELECT public.current_student_id())
        AND removed_at IS NULL
        AND (SELECT public.can_current_student_access_challenge(challenge_id))
    )
);

DROP POLICY IF EXISTS desafio_dias_select ON public.desafio_dias;
CREATE POLICY desafio_dias_select ON public.desafio_dias
FOR SELECT
USING (
    (SELECT public.is_staff())
    OR (SELECT public.can_current_student_access_challenge(challenge_id))
);

DROP POLICY IF EXISTS challenge_day_pdfs_select ON storage.objects;
CREATE POLICY challenge_day_pdfs_select ON storage.objects
FOR SELECT
USING (
    bucket_id = 'challenge-day-pdfs'
    AND (
        (SELECT public.is_staff())
        OR (SELECT public.can_current_student_access_challenge_pdf(storage.objects.name))
    )
);

ANALYZE public.desafios;
ANALYZE public.desafio_participantes;
ANALYZE public.desafio_dias;
