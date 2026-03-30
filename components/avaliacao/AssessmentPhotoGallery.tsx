'use client';

import { useMemo, useState } from 'react';
import { Expand, ImageOff } from 'lucide-react';
import { AVALIACAO_PHOTO_POSITIONS } from '@/lib/assessmentPhotos';
import type { AvaliacaoPhoto } from '@/types/avaliacao';

interface AssessmentPhotoGalleryProps {
  title?: string;
  subtitle?: string;
  photos?: AvaliacaoPhoto[] | null;
  compact?: boolean;
}

export default function AssessmentPhotoGallery({
  title,
  subtitle,
  photos,
  compact = false,
}: AssessmentPhotoGalleryProps) {
  const [activePhoto, setActivePhoto] = useState<AvaliacaoPhoto | null>(null);

  const orderedPhotos = useMemo(
    () =>
      AVALIACAO_PHOTO_POSITIONS.map((position) => ({
        ...position,
        photo: photos?.find((item) => item.position === position.key) ?? null,
      })),
    [photos],
  );

  const hasPhotos = orderedPhotos.some((item) => item.photo?.signed_url);

  if (!hasPhotos && !title && !subtitle) {
    return null;
  }

  return (
    <>
      <div className="rounded-[24px] border border-zinc-800 bg-black/25 p-4">
        {title || subtitle ? (
          <div className="mb-4">
            {title ? <h4 className="text-sm font-bold uppercase tracking-[0.18em] text-white">{title}</h4> : null}
            {subtitle ? <p className="mt-1 text-xs leading-5 text-zinc-500">{subtitle}</p> : null}
          </div>
        ) : null}

        <div className={`grid gap-3 ${compact ? 'grid-cols-2' : 'grid-cols-2 xl:grid-cols-4'}`}>
          {orderedPhotos.map(({ key, label, hint, photo }) => {
            const imageUrl = photo?.signed_url || null;

            return (
              <button
                key={key}
                type="button"
                onClick={() => imageUrl && setActivePhoto(photo)}
                disabled={!imageUrl}
                className={`group overflow-hidden rounded-[20px] border text-left transition-all ${
                  imageUrl
                    ? 'border-zinc-800 bg-zinc-950 hover:border-orange-500/35'
                    : 'cursor-default border-dashed border-zinc-800 bg-zinc-950/50'
                }`}
              >
                <div className={`relative ${compact ? 'aspect-[4/5]' : 'aspect-[3/4]'}`}>
                  {imageUrl ? (
                    <>
                      <img
                        src={imageUrl}
                        alt={label}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                      <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/45 p-2 text-white">
                        <Expand size={14} />
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center bg-zinc-950 text-zinc-600">
                      <ImageOff size={22} />
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-white">{label}</p>
                    <p className="mt-1 text-[11px] leading-5 text-zinc-300">{hint}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {activePhoto?.signed_url ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <button
            type="button"
            aria-label="Fechar ampliacao"
            className="absolute inset-0"
            onClick={() => setActivePhoto(null)}
          />

          <div className="relative z-[91] w-full max-w-6xl overflow-hidden rounded-[30px] border border-zinc-800 bg-zinc-950 shadow-[0_40px_140px_-56px_rgba(0,0,0,0.95)]">
            <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
              <div>
                <p className="text-sm font-bold text-white">
                  {AVALIACAO_PHOTO_POSITIONS.find((item) => item.key === activePhoto.position)?.label || 'Foto'}
                </p>
                <p className="mt-1 text-xs text-zinc-500">Amplie para comparar postura, alinhamento e simetria.</p>
              </div>

              <button
                type="button"
                onClick={() => setActivePhoto(null)}
                className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-bold text-white transition-all hover:border-zinc-700 hover:bg-zinc-800"
              >
                Fechar
              </button>
            </div>

            <div className="max-h-[82vh] overflow-auto bg-black p-3 md:p-5">
              <img
                src={activePhoto.signed_url}
                alt={activePhoto.file_name || 'Foto ampliada da avaliacao'}
                className="mx-auto h-auto max-h-[76vh] w-auto max-w-full rounded-[24px] object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
