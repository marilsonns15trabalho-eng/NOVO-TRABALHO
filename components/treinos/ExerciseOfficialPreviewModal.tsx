'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import type { ExerciseLibraryItem } from '@/types/exercise-library';

interface ExerciseOfficialPreviewModalProps {
  item: ExerciseLibraryItem;
  onClose: () => void;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
}

export default function ExerciseOfficialPreviewModal({
  item,
  onClose,
  primaryActionLabel,
  onPrimaryAction,
}: ExerciseOfficialPreviewModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(
    item.preview_image_url || item.gallery_image_urls[0] || null,
  );

  useEffect(() => {
    setSelectedImage(item.preview_image_url || item.gallery_image_urls[0] || null);
  }, [item]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 20 }}
        className="relative w-full max-w-6xl overflow-y-auto rounded-[30px] border border-zinc-800 bg-zinc-950 p-5 shadow-2xl max-h-[94vh] md:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-zinc-500">
              Demonstracao oficial
            </p>
            <h3 className="mt-2 text-3xl font-bold text-white">{item.display_name}</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
              Use esta visualizacao para conferir a execucao do exercicio antes ou durante o treino.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-400 transition-all hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.85fr)]">
          <div className="min-w-0 space-y-4">
            {item.stream_path ? (
              <div className="overflow-hidden rounded-[28px] border border-zinc-800 bg-black">
                <video
                  key={item.stream_path}
                  controls
                  muted
                  playsInline
                  preload="metadata"
                  poster={selectedImage || undefined}
                  className="aspect-[4/5] w-full bg-black object-contain sm:aspect-video"
                >
                  <source src={item.stream_path} />
                  Seu navegador nao conseguiu abrir o video oficial deste exercicio.
                </video>
              </div>
            ) : selectedImage ? (
              <div className="overflow-hidden rounded-[28px] border border-zinc-800 bg-black">
                <img
                  src={selectedImage}
                  alt={item.display_name}
                  className="aspect-[4/5] w-full bg-black object-contain sm:aspect-video"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="flex min-h-[320px] items-center justify-center rounded-[28px] border border-dashed border-zinc-800 bg-black/25 px-5 py-8 text-center text-sm leading-6 text-zinc-500">
                Nenhuma imagem ou video oficial disponivel para este exercicio na biblioteca no momento.
              </div>
            )}

            {item.gallery_image_urls.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {item.gallery_image_urls.map((imageUrl, index) => {
                  const isActive = selectedImage === imageUrl;
                  return (
                    <button
                      key={`${item.id}-gallery-${index}`}
                      type="button"
                      onClick={() => setSelectedImage(imageUrl)}
                      className={`overflow-hidden rounded-[22px] border transition-all ${
                        isActive
                          ? 'border-sky-500 bg-sky-500/10'
                          : 'border-zinc-800 bg-black/30 hover:border-zinc-700'
                      }`}
                    >
                      <img
                        src={imageUrl}
                        alt={`${item.display_name} ${index + 1}`}
                        className="aspect-square w-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="rounded-[24px] border border-zinc-800 bg-black/25 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Resumo rapido</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                {item.primary_muscle_label ? (
                  <span className="rounded-full border border-orange-500/20 px-2.5 py-1 text-orange-300">
                    {item.primary_muscle_label}
                  </span>
                ) : null}
                {item.category_label ? (
                  <span className="rounded-full border border-zinc-800 px-2.5 py-1">
                    {item.category_label}
                  </span>
                ) : null}
                {item.has_official_video ? (
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
                    Video oficial
                  </span>
                ) : null}
                {item.stream_path ? (
                  <span className="rounded-full border border-zinc-800 px-2.5 py-1">
                    Sem audio
                  </span>
                ) : null}
                {item.preview_image_url ? (
                  <span className="rounded-full border border-zinc-800 px-2.5 py-1">
                    Foto oficial
                  </span>
                ) : null}
              </div>
            </div>

            <div className="rounded-[24px] border border-zinc-800 bg-black/25 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Como executar</p>
              {item.instructions.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {item.instructions.map((instruction, index) => (
                    <p key={`${item.id}-instruction-${index}`} className="text-sm leading-6 text-zinc-300">
                      {instruction}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-zinc-500">
                  A biblioteca oficial nao enviou instrucoes detalhadas para este exercicio.
                </p>
              )}
            </div>

            <div className="rounded-[24px] border border-zinc-800 bg-black/25 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Fonte e licenca</p>
              <div className="mt-3 space-y-2 text-sm leading-6 text-zinc-300">
                <p>Fonte: wger</p>
                <p>Licenca: {item.license_name || 'Nao informada'}</p>
                <p>Autor: {item.license_author || 'Nao informado'}</p>
                {item.license_url ? (
                  <a
                    href={item.license_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex text-sky-300 transition-all hover:text-sky-200"
                  >
                    Abrir detalhes da licenca
                  </a>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-2xl bg-zinc-800 px-4 py-4 font-bold text-white transition-all hover:bg-zinc-700"
              >
                Fechar
              </button>
              {onPrimaryAction && primaryActionLabel ? (
                <button
                  type="button"
                  onClick={onPrimaryAction}
                  className="flex-1 rounded-2xl bg-sky-500 px-4 py-4 font-bold text-black transition-all hover:bg-sky-400"
                >
                  {primaryActionLabel}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
