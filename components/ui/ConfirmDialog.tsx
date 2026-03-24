'use client';

// Componente ConfirmDialog reutilizável
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
}: ConfirmDialogProps) {
  const confirmClass = variant === 'danger'
    ? 'bg-red-500 hover:bg-red-600'
    : 'bg-amber-500 hover:bg-amber-600';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-sm shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${variant === 'danger' ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
                <AlertTriangle className={variant === 'danger' ? 'text-red-500' : 'text-amber-500'} size={20} />
              </div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
            </div>
            <p className="text-zinc-400 mb-6">{message}</p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all"
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 py-3 ${confirmClass} text-white font-bold rounded-xl transition-all`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
