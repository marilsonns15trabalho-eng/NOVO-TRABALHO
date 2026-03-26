'use client';

import { motion } from 'motion/react';
import AccessGuard from '@/components/AccessGuard';
import AvaliacaoModule from '@/modules/avaliacao/AvaliacaoModule';

export default function AvaliacaoPage() {
  return (
    <AccessGuard allowedRoles={['admin', 'professor']}>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="h-full"
      >
        <AvaliacaoModule />
      </motion.div>
    </AccessGuard>
  );
}
