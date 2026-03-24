'use client';

import { motion } from 'motion/react';
import FinanceiroModule from '@/modules/financeiro/FinanceiroModule';

export default function FinanceiroPage() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="h-full"
    >
      <FinanceiroModule />
    </motion.div>
  );
}
