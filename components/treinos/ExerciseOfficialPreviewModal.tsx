'use client';

import React from 'react';
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

        <div className="mt-6 space-y-5">
          {item.stream_path ? (
            <div className="overflow-hidden rounded-[28px] border border-zinc-800 bg-black">
              <video
                key={item.stream_path}
                controls
                muted
                playsInline
                preload="metadata"
                className="aspect-[4/5] w-full bg-black object-contain sm:aspect-video"
              >
                <source src={item.stream_path} />
                Seu navegador nao conseguiu abrir o video oficial deste exercicio.
              </video>
            </div>
          ) : (
            <div className="flex min-h-[320px] items-center justify-center rounded-[28px] border border-dashed border-zinc-800 bg-black/25 px-5 py-8 text-center text-sm leading-6 text-zinc-500">
              Nenhum video oficial disponivel para este exercicio.
            </div>
          )}

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
      </motion.div>
    </div>
  );
}
