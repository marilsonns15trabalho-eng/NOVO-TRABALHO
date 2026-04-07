-- ============================================================
-- FASE 3.20 - CORRECAO RLS E PDF DIARIO DO DESAFIO
-- Rodar depois de phase3_19.
-- Objetivo:
--   * corrigir recursao infinita nas policies do modulo desafio
--   * permitir PDF diario privado com substituicao do arquivo antigo
--   * restringir gestao de participantes ao admin
-- ============================================================

SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_profiles up
        WHERE up.id = (SELECT auth.uid())
          AND up.role = 'admin'
    );
$$;

REVOKE ALL ON FUNCTION public.is_admin_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

ALTER TABLE public.desafio_dias
    ADD COLUMN IF NOT EXISTS storage_path TEXT,
    ADD COLUMN IF NOT EXISTS file_name TEXT,
    ADD COLUMN IF NOT EXISTS content_type TEXT,
    ADD COLUMN IF NOT EXISTS size_bytes INTEGER CHECK (size_bytes IS NULL OR size_bytes >= 0);

CREATE UNIQUE INDEX IF NOT EXISTS idx_desafio_dias_storage_path_unique
    ON public.desafio_dias(storage_path)
    WHERE storage_path IS NOT NULL;

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

DROP POLICY IF EXISTS desafio_participantes_select ON public.desafio_participantes;
CREATE POLICY desafio_participantes_select ON public.desafio_participantes
FOR SELECT
USING (
    (SELECT public.is_staff())
    OR (
        student_id = (SELECT public.current_student_id())
        AND removed_at IS NULL
    )
);

DROP POLICY IF EXISTS desafio_participantes_staff_insert ON public.desafio_participantes;
CREATE POLICY desafio_participantes_staff_insert ON public.desafio_participantes
FOR INSERT
WITH CHECK ((SELECT public.is_admin_user()));

DROP POLICY IF EXISTS desafio_participantes_staff_update ON public.desafio_participantes;
CREATE POLICY desafio_participantes_staff_update ON public.desafio_participantes
FOR UPDATE
USING ((SELECT public.is_admin_user()))
WITH CHECK ((SELECT public.is_admin_user()));

DROP POLICY IF EXISTS desafio_participantes_staff_delete ON public.desafio_participantes;
CREATE POLICY desafio_participantes_staff_delete ON public.desafio_participantes
FOR DELETE
USING ((SELECT public.is_admin_user()));

INSERT INTO storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
VALUES (
    'challenge-day-pdfs',
    'challenge-day-pdfs',
    FALSE,
    15728640,
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS challenge_day_pdfs_select ON storage.objects;
CREATE POLICY challenge_day_pdfs_select ON storage.objects
FOR SELECT
USING (
    bucket_id = 'challenge-day-pdfs'
    AND (
        (SELECT public.is_staff())
        OR EXISTS (
            SELECT 1
            FROM public.desafio_dias dd
            JOIN public.desafios d
              ON d.id = dd.challenge_id
            JOIN public.desafio_participantes dp
              ON dp.challenge_id = dd.challenge_id
            WHERE dd.storage_path = storage.objects.name
              AND dp.student_id = (SELECT public.current_student_id())
              AND dp.removed_at IS NULL
              AND d.status = 'active'
        )
    )
);

DROP POLICY IF EXISTS challenge_day_pdfs_insert ON storage.objects;
CREATE POLICY challenge_day_pdfs_insert ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'challenge-day-pdfs'
    AND (SELECT public.is_staff())
);

DROP POLICY IF EXISTS challenge_day_pdfs_update ON storage.objects;
CREATE POLICY challenge_day_pdfs_update ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'challenge-day-pdfs'
    AND (SELECT public.is_staff())
)
WITH CHECK (
    bucket_id = 'challenge-day-pdfs'
    AND (SELECT public.is_staff())
);

DROP POLICY IF EXISTS challenge_day_pdfs_delete ON storage.objects;
CREATE POLICY challenge_day_pdfs_delete ON storage.objects
FOR DELETE
USING (
    bucket_id = 'challenge-day-pdfs'
    AND (SELECT public.is_staff())
);

ANALYZE public.desafios;
ANALYZE public.desafio_participantes;
ANALYZE public.desafio_dias;
