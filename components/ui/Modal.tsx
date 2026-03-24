'use client';

// Componente Modal reutilizável
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
  /** Ações no header (ex: botão de exportar) */
  headerActions?: React.ReactNode;
  /** Conteúdo fixo no rodapé */
  footer?: React.ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
  headerActions,
  footer,
}: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className={`relative bg-zinc-900 border border-zinc-800 rounded-3xl w-full ${maxWidth} shadow-2xl flex flex-col max-h-[90vh]`}
          >
            {/* Header */}
            {(title || headerActions) && (
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between shrink-0">
                <div>
                  {title && <h3 className="text-xl font-bold text-white">{title}</h3>}
                  {subtitle && <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {headerActions}
                  <button
                    onClick={onClose}
                    className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            )}

            {/* Body (scrollable) */}
            <div className="p-6 overflow-y-auto flex-1">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="p-6 border-t border-zinc-800 shrink-0 bg-zinc-900">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
