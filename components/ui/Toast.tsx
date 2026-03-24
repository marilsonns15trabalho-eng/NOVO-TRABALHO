'use client';

// Componente Toast reutilizável para notificações
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, X } from 'lucide-react';
import type { Notification } from '@/types/common';

interface ToastProps {
  notification: Notification | null;
  onClose: () => void;
}

export default function Toast({ notification, onClose }: ToastProps) {
  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -20, x: '-50%' }}
          className="fixed top-6 left-1/2 z-[100] max-w-md w-full"
        >
          <div
            className={`flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-xl backdrop-blur-sm ${
              notification.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 size={20} className="shrink-0" />
            ) : (
              <XCircle size={20} className="shrink-0" />
            )}
            <p className="text-sm font-medium flex-1">{notification.message}</p>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
