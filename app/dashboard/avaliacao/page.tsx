'use client';

import { motion } from 'motion/react';
import AvaliacaoModule from '@/modules/avaliacao/AvaliacaoModule';

export default function AvaliacaoPage() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="h-full"
    >
      <AvaliacaoModule />
    </motion.div>
  );
}
