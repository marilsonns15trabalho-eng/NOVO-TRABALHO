import type {
  AvaliacaoPhoto,
  AvaliacaoPhotoDraftMap,
  AvaliacaoPhotoPosition,
} from '@/types/avaliacao';
import { normalizeImageFile } from '@/lib/image-processing';

export const AVALIACAO_PHOTO_POSITIONS: Array<{
  key: AvaliacaoPhotoPosition;
  label: string;
  hint: string;
}> = [
  { key: 'front', label: 'Frente', hint: 'Foto frontal' },
  { key: 'back', label: 'Costas', hint: 'Foto posterior' },
  { key: 'left', label: 'Lateral esquerda', hint: 'Perfil esquerdo' },
  { key: 'right', label: 'Lateral direita', hint: 'Perfil direito' },
];

export function createPhotoDraftMap(
  photos?: AvaliacaoPhoto[] | null,
): AvaliacaoPhotoDraftMap {
  return {
    front: { existing: photos?.find((photo) => photo.position === 'front') ?? null, file: null, preview_url: null, remove: false },
    back: { existing: photos?.find((photo) => photo.position === 'back') ?? null, file: null, preview_url: null, remove: false },
    left: { existing: photos?.find((photo) => photo.position === 'left') ?? null, file: null, preview_url: null, remove: false },
    right: { existing: photos?.find((photo) => photo.position === 'right') ?? null, file: null, preview_url: null, remove: false },
  };
}

export function revokePhotoDraftUrls(drafts: AvaliacaoPhotoDraftMap) {
  Object.values(drafts).forEach((draft) => {
    if (draft.preview_url?.startsWith('blob:')) {
      URL.revokeObjectURL(draft.preview_url);
    }
  });
}

export async function optimizeAssessmentPhotoFile(file: File): Promise<File> {
  const safeBaseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-');
  return normalizeImageFile(file, {
    fileNamePrefix: safeBaseName || 'avaliacao',
    maxDimension: 2000,
    quality: 0.88,
  });
}
