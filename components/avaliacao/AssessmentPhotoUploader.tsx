'use client';

import { useRef } from 'react';
import { Camera, ImagePlus, Loader2, RefreshCcw, Trash2 } from 'lucide-react';
import { AVALIACAO_PHOTO_POSITIONS } from '@/lib/assessmentPhotos';
import type {
  AvaliacaoPhotoDraftMap,
  AvaliacaoPhotoPosition,
} from '@/types/avaliacao';

interface AssessmentPhotoUploaderProps {
  drafts: AvaliacaoPhotoDraftMap;
  onPickFile: (position: AvaliacaoPhotoPosition, file: File | null) => void;
  onCapturePhoto?: (position: AvaliacaoPhotoPosition) => void | Promise<void>;
  onPickGalleryPhoto?: (position: AvaliacaoPhotoPosition) => void | Promise<void>;
  capturingPosition?: AvaliacaoPhotoPosition | null;
  pickingGalleryPosition?: AvaliacaoPhotoPosition | null;
  onRemove: (position: AvaliacaoPhotoPosition) => void;
}

export default function AssessmentPhotoUploader({
  drafts,
  onPickFile,
  onCapturePhoto,
  onPickGalleryPhoto,
  capturingPosition,
  pickingGalleryPosition,
  onRemove,
}: AssessmentPhotoUploaderProps) {
  const inputRefs = useRef<Record<AvaliacaoPhotoPosition, HTMLInputElement | null>>({
    front: null,
    back: null,
    left: null,
    right: null,
  });

  return (
    <section className="border-t border-zinc-800 pt-4">
      <div className="mb-4">
        <h4 className="text-lg font-bold text-purple-500">Fotos da avaliacao</h4>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Suba ate 4 fotos com boa luz. Na evolucao, o sistema compara a avaliacao anterior como base e a atual como atualizacao.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {AVALIACAO_PHOTO_POSITIONS.map(({ key, label, hint }) => {
          const draft = drafts[key];
          const previewUrl = draft.preview_url || draft.existing?.signed_url || null;
          const hasImage = Boolean(previewUrl) && !draft.remove;

          return (
            <div
              key={key}
              className="overflow-hidden rounded-[24px] border border-zinc-800 bg-black/25"
            >
              <div className="border-b border-zinc-800 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-white">{label}</p>
                <p className="mt-1 text-[11px] leading-5 text-zinc-500">{hint}</p>
              </div>

              <div className="p-4">
                <div className="relative aspect-[3/4] overflow-hidden rounded-[20px] border border-zinc-800 bg-zinc-950">
                  {hasImage ? (
                    <img
                      src={previewUrl || ''}
                      alt={label}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-zinc-950 text-zinc-600">
                      <ImagePlus size={24} />
                    </div>
                  )}
                </div>

                <div className="mt-4 grid gap-2">
                  {onCapturePhoto ? (
                    <button
                      type="button"
                      onClick={() => void onCapturePhoto(key)}
                      disabled={capturingPosition === key || pickingGalleryPosition === key}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-sm font-bold text-orange-300 transition-all hover:bg-orange-500 hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {capturingPosition === key ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                      {capturingPosition === key ? 'Abrindo camera...' : 'Tirar foto'}
                    </button>
                  ) : null}

                  {onPickGalleryPhoto ? (
                    <button
                      type="button"
                      onClick={() => void onPickGalleryPhoto(key)}
                      disabled={capturingPosition === key || pickingGalleryPosition === key}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-sm font-bold text-purple-300 transition-all hover:bg-purple-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {pickingGalleryPosition === key ? <Loader2 size={16} className="animate-spin" /> : hasImage ? <RefreshCcw size={16} /> : <ImagePlus size={16} />}
                      {pickingGalleryPosition === key
                        ? 'Abrindo galeria...'
                        : hasImage
                          ? 'Trocar da galeria'
                          : 'Adicionar da galeria'}
                    </button>
                  ) : (
                    <>
                      <input
                        ref={(element) => {
                          inputRefs.current[key] = element;
                        }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0] ?? null;
                          onPickFile(key, file);
                          event.currentTarget.value = '';
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => inputRefs.current[key]?.click()}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-sm font-bold text-purple-300 transition-all hover:bg-purple-500 hover:text-white"
                      >
                        {hasImage ? <RefreshCcw size={16} /> : <ImagePlus size={16} />}
                        {hasImage ? 'Trocar foto' : 'Adicionar foto'}
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => onRemove(key)}
                    disabled={!hasImage && !draft.existing}
                    className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                      hasImage || draft.existing
                        ? 'border border-zinc-800 bg-zinc-900 text-white hover:border-zinc-700 hover:bg-zinc-800'
                        : 'cursor-not-allowed border border-zinc-900 bg-zinc-950 text-zinc-600'
                    }`}
                  >
                    <Trash2 size={16} />
                    Remover
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
