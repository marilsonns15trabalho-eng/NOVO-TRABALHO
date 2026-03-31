export function getProfileInitials(value?: string | null) {
  const base = value?.trim() || 'Usuario';
  return base
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function buildProfileAvatarCachePath(
  profileId: string,
  avatarUpdatedAt?: string | null,
) {
  const versionKey = (avatarUpdatedAt || 'avatar').replace(/[^a-zA-Z0-9-_]/g, '-');
  return `profile-photos/${profileId}-${versionKey}.jpg`;
}

export async function optimizeProfileAvatarFile(file: File): Promise<File> {
  if (typeof window === 'undefined') {
    return file;
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Selecione apenas arquivos de imagem.');
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('Nao foi possivel ler a imagem.'));
      element.src = objectUrl;
    });

    const cropSize = Math.min(image.width, image.height);
    const sx = Math.max(0, Math.floor((image.width - cropSize) / 2));
    const sy = Math.max(0, Math.floor((image.height - cropSize) / 2));
    const targetSize = Math.min(1200, cropSize);

    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;

    const context = canvas.getContext('2d');
    if (!context) {
      return file;
    }

    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, sx, sy, cropSize, cropSize, 0, 0, targetSize, targetSize);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.9);
    });

    if (!blob) {
      return file;
    }

    return new File([blob], `avatar-${Date.now()}.jpg`, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
