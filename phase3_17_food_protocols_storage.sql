-- ============================================================
-- FASE 3.17 - PROTOCOLOS ALIMENTARES EM STORAGE PRIVADO
-- Rodar depois de phase3_01/02/10/16.
-- Objetivo:
--   * permitir upload de protocolos alimentares em PDF
--   * armazenar apenas metadados no Postgres
--   * liberar leitura segura para equipe e para a propria aluna
-- ============================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.protocolos_alimentares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    storage_path TEXT NOT NULL UNIQUE,
    file_name TEXT,
    content_type TEXT,
    size_bytes INTEGER CHECK (size_bytes IS NULL OR size_bytes >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    uploaded_by_auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_protocolos_alimentares_student_recent
    ON public.protocolos_alimentares(student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_protocolos_alimentares_student_active
    ON public.protocolos_alimentares(student_id, is_active, created_at DESC);

DROP TRIGGER IF EXISTS set_timestamp_on_protocolos_alimentares ON public.protocolos_alimentares;
CREATE TRIGGER set_timestamp_on_protocolos_alimentares
BEFORE UPDATE ON public.protocolos_alimentares
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

ALTER TABLE public.protocolos_alimentares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS protocolos_alimentares_select ON public.protocolos_alimentares;
CREATE POLICY protocolos_alimentares_select ON public.protocolos_alimentares
FOR SELECT
USING (
    (SELECT public.is_staff())
    OR student_id = (SELECT public.current_student_id())
);

DROP POLICY IF EXISTS protocolos_alimentares_staff_insert ON public.protocolos_alimentares;
CREATE POLICY protocolos_alimentares_staff_insert ON public.protocolos_alimentares
FOR INSERT
WITH CHECK ((SELECT public.is_staff()));

DROP POLICY IF EXISTS protocolos_alimentares_staff_update ON public.protocolos_alimentares;
CREATE POLICY protocolos_alimentares_staff_update ON public.protocolos_alimentares
FOR UPDATE
USING ((SELECT public.is_staff()))
WITH CHECK ((SELECT public.is_staff()));

DROP POLICY IF EXISTS protocolos_alimentares_staff_delete ON public.protocolos_alimentares;
CREATE POLICY protocolos_alimentares_staff_delete ON public.protocolos_alimentares
FOR DELETE
USING ((SELECT public.is_staff()));

INSERT INTO storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
VALUES (
    'food-protocols',
    'food-protocols',
    FALSE,
    15728640,
    ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS food_protocols_objects_select ON storage.objects;
CREATE POLICY food_protocols_objects_select ON storage.objects
FOR SELECT
USING (
    bucket_id = 'food-protocols'
    AND (
        (SELECT public.is_staff())
        OR EXISTS (
            SELECT 1
            FROM public.protocolos_alimentares pa
            WHERE pa.storage_path = storage.objects.name
              AND pa.student_id = (SELECT public.current_student_id())
        )
    )
);

DROP POLICY IF EXISTS food_protocols_objects_insert ON storage.objects;
CREATE POLICY food_protocols_objects_insert ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'food-protocols'
    AND (SELECT public.is_staff())
);

DROP POLICY IF EXISTS food_protocols_objects_update ON storage.objects;
CREATE POLICY food_protocols_objects_update ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'food-protocols'
    AND (SELECT public.is_staff())
)
WITH CHECK (
    bucket_id = 'food-protocols'
    AND (SELECT public.is_staff())
);

DROP POLICY IF EXISTS food_protocols_objects_delete ON storage.objects;
CREATE POLICY food_protocols_objects_delete ON storage.objects
FOR DELETE
USING (
    bucket_id = 'food-protocols'
    AND (SELECT public.is_staff())
);

ANALYZE public.protocolos_alimentares;
