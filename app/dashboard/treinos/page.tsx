'use client';

import { motion } from 'motion/react';
import AccessGuard from '@/components/AccessGuard';
import TreinosModule from '@/modules/treinos/TreinosModule';

export default function TreinosPage() {
  return (
    <AccessGuard allowedRoles={['admin', 'professor']}>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="h-full"
      >
        <TreinosModule />
      </motion.div>
    </AccessGuard>
  );
}
