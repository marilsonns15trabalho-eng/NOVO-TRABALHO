'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import Dashboard from '@/modules/dashboard/Dashboard';

export default function DashboardPage() {
  const router = useRouter();

  // setActiveTab agora navega para rotas reais
  const handleNavigate = (id: string) => {
    if (id === 'home') {
      router.push('/dashboard');
    } else {
      router.push(`/dashboard/${id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="h-full"
    >
      <Dashboard setActiveTab={handleNavigate} />
    </motion.div>
  );
}
