-- ============================================================
-- FASE 3.12 - FOTOS DE AVALIACAO EM STORAGE PRIVADO
-- Rodar no projeto novo depois de phase3_01/02/10.
-- Objetivo:
--   * armazenar somente metadados no Postgres
--   * manter fotos em bucket privado com boa qualidade
--   * permitir comparacao visual entre avaliacao base e atualizacao
-- ============================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.avaliacao_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    avaliacao_id UUID NOT NULL REFERENCES public.avaliacoes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    position TEXT NOT NULL CHECK (position IN ('front', 'back', 'left', 'right')),
    storage_path TEXT NOT NULL UNIQUE,
    file_name TEXT,
    content_type TEXT,
    size_bytes INTEGER CHECK (size_bytes IS NULL OR size_bytes >= 0),
    created_by_auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT avaliacao_photos_unique_position UNIQUE (avaliacao_id, position)
);

CREATE INDEX IF NOT EXISTS idx_avaliacao_photos_student_recent
    ON public.avaliacao_photos(student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_avaliacao_photos_avaliacao_position
    ON public.avaliacao_photos(avaliacao_id, position);

DROP TRIGGER IF EXISTS set_timestamp_on_avaliacao_photos ON public.avaliacao_photos;
CREATE TRIGGER set_timestamp_on_avaliacao_photos
BEFORE UPDATE ON public.avaliacao_photos
FOR EACH ROW
EXECUTE FUNCTION public.set_current_timestamp_updated_at();

ALTER TABLE public.avaliacao_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS avaliacao_photos_select ON public.avaliacao_photos;
CREATE POLICY avaliacao_photos_select ON public.avaliacao_photos
FOR SELECT
USING (
    (SELECT public.is_staff())
    OR student_id = (SELECT public.current_student_id())
);

DROP POLICY IF EXISTS avaliacao_photos_staff_insert ON public.avaliacao_photos;
CREATE POLICY avaliacao_photos_staff_insert ON public.avaliacao_photos
FOR INSERT
WITH CHECK ((SELECT public.is_staff()));

DROP POLICY IF EXISTS avaliacao_photos_staff_update ON public.avaliacao_photos;
CREATE POLICY avaliacao_photos_staff_update ON public.avaliacao_photos
FOR UPDATE
USING ((SELECT public.is_staff()))
WITH CHECK ((SELECT public.is_staff()));

DROP POLICY IF EXISTS avaliacao_photos_staff_delete ON public.avaliacao_photos;
CREATE POLICY avaliacao_photos_staff_delete ON public.avaliacao_photos
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
    'avaliacao-photos',
    'avaliacao-photos',
    FALSE,
    8388608,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS avaliacao_photos_objects_select ON storage.objects;
CREATE POLICY avaliacao_photos_objects_select ON storage.objects
FOR SELECT
USING (
    bucket_id = 'avaliacao-photos'
    AND (
        (SELECT public.is_staff())
        OR EXISTS (
            SELECT 1
            FROM public.avaliacao_photos ap
            WHERE ap.storage_path = storage.objects.name
              AND ap.student_id = (SELECT public.current_student_id())
        )
    )
);

DROP POLICY IF EXISTS avaliacao_photos_objects_insert ON storage.objects;
CREATE POLICY avaliacao_photos_objects_insert ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'avaliacao-photos'
    AND (SELECT public.is_staff())
);

DROP POLICY IF EXISTS avaliacao_photos_objects_update ON storage.objects;
CREATE POLICY avaliacao_photos_objects_update ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'avaliacao-photos'
    AND (SELECT public.is_staff())
)
WITH CHECK (
    bucket_id = 'avaliacao-photos'
    AND (SELECT public.is_staff())
);

DROP POLICY IF EXISTS avaliacao_photos_objects_delete ON storage.objects;
CREATE POLICY avaliacao_photos_objects_delete ON storage.objects
FOR DELETE
USING (
    bucket_id = 'avaliacao-photos'
    AND (SELECT public.is_staff())
);

ANALYZE public.avaliacao_photos;
