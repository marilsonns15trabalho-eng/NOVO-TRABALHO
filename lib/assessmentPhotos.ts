import type {
  AvaliacaoPhoto,
  AvaliacaoPhotoDraftMap,
  AvaliacaoPhotoPosition,
} from '@/types/avaliacao';

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
  if (typeof window === 'undefined') {
    return file;
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Selecione apenas arquivos de imagem.');
  }

  let sourceWidth = 0;
  let sourceHeight = 0;
  let sourceImage: ImageBitmap | HTMLImageElement | null = null;

  try {
    if (typeof createImageBitmap === 'function') {
      sourceImage = await createImageBitmap(file);
      sourceWidth = sourceImage.width;
      sourceHeight = sourceImage.height;
    } else {
      const imageUrl = URL.createObjectURL(file);
      sourceImage = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Nao foi possivel ler a imagem.'));
        image.src = imageUrl;
      });
      sourceWidth = sourceImage.width;
      sourceHeight = sourceImage.height;
      URL.revokeObjectURL(imageUrl);
    }
  } catch {
    return file;
  }

  const maxDimension = 2000;
  const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    if (sourceImage && 'close' in sourceImage && typeof sourceImage.close === 'function') {
      sourceImage.close();
    }
    return file;
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(sourceImage as CanvasImageSource, 0, 0, width, height);

  if (sourceImage && 'close' in sourceImage && typeof sourceImage.close === 'function') {
    sourceImage.close();
  }

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.88);
  });

  if (!blob) {
    return file;
  }

  const safeBaseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '-');
  return new File([blob], `${safeBaseName || 'avaliacao'}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
}
