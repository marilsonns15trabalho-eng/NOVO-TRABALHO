'use client';

function sanitizeBaseName(value: string) {
  return value
    .replace(/\.[^.]+$/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

function looksLikeImageFile(file: File) {
  if (file.type.startsWith('image/')) {
    return true;
  }

  return /\.(avif|bmp|gif|heic|heif|jpe?g|png|tiff?|webp)$/i.test(file.name);
}

async function loadImageElement(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Nao foi possivel ler a imagem selecionada.'));
      element.src = objectUrl;
    });

    return image;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function normalizeImageFile(
  file: File,
  options?: {
    fileNamePrefix?: string;
    cropSquare?: boolean;
    targetSize?: number;
    maxDimension?: number;
    quality?: number;
  },
): Promise<File> {
  if (typeof window === 'undefined') {
    return file;
  }

  if (!looksLikeImageFile(file)) {
    throw new Error('Selecione apenas arquivos de imagem.');
  }

  const image = await loadImageElement(file);
  const cropSquare = Boolean(options?.cropSquare);
  const quality = options?.quality ?? 0.9;
  const safeBaseName =
    sanitizeBaseName(options?.fileNamePrefix || file.name || `imagem-${Date.now()}`) ||
    `imagem-${Date.now()}`;

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Nao foi possivel preparar a imagem para envio.');
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  if (cropSquare) {
    const cropSize = Math.min(image.width, image.height);
    const sx = Math.max(0, Math.floor((image.width - cropSize) / 2));
    const sy = Math.max(0, Math.floor((image.height - cropSize) / 2));
    const targetSize = Math.max(320, Math.min(options?.targetSize || 1200, cropSize));

    canvas.width = targetSize;
    canvas.height = targetSize;
    context.drawImage(image, sx, sy, cropSize, cropSize, 0, 0, targetSize, targetSize);
  } else {
    const maxDimension = Math.max(640, options?.maxDimension || 2000);
    const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);
  }

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', quality);
  });

  if (!blob) {
    throw new Error('Nao foi possivel converter a imagem para um formato compativel.');
  }

  return new File([blob], `${safeBaseName}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
}
