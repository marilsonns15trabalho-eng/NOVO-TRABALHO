-- ============================================================
-- FASE 3.18 - FLEXIBILIZAR MIME TYPES DE IMAGEM
-- Rodar depois de phase3_12/16.
-- Objetivo:
--   * ampliar formatos aceitos nos uploads de imagem
--   * evitar falhas ao enviar fotos da galeria/camera
-- ============================================================

SET search_path = public;

UPDATE storage.buckets
SET
    file_size_limit = 8388608,
    allowed_mime_types = ARRAY[
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/heic',
      'image/heif',
      'image/avif'
    ]
WHERE id = 'avaliacao-photos';

UPDATE storage.buckets
SET
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY[
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/heic',
      'image/heif',
      'image/avif'
    ]
WHERE id = 'profile-photos';
