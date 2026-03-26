'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import Dashboard from '@/modules/dashboard/Dashboard';
import ProfessorDashboard from '@/modules/professor/ProfessorDashboard';
import { useUserRole } from '@/hooks/useUserRole';

export default function DashboardPage() {
  const router = useRouter();
  const { loading, isAdmin, isProfessor } = useUserRole();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-black text-white">Carregando...</div>;
  }

  const handleNavigate = (id: string) => {
    if (id === 'home') {
      router.push('/dashboard');
      return;
    }

    router.push(`/dashboard/${id}`);
  };

  if (isAdmin) {
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

  if (isProfessor) {
    return <ProfessorDashboard onNavigate={handleNavigate} />;
  }

  return null;
}
