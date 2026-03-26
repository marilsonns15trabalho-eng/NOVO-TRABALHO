'use client';

import { motion } from 'motion/react';
import AccessGuard from '@/components/AccessGuard';
import PlanosModule from '@/modules/planos/PlanosModule';

export default function PlanosPage() {
  return (
    <AccessGuard allowedRoles={['admin']}>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="h-full"
      >
        <PlanosModule />
      </motion.div>
    </AccessGuard>
  );
}
