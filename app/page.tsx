'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import Dashboard from '@/modules/dashboard/Dashboard';
import { useUserRole } from '@/hooks/useUserRole';
import AlunoDashboard from '@/modules/aluno/AlunoDashboard';
import ProfessorDashboard from '@/modules/professor/ProfessorDashboard';

export default function DashboardPage() {
  const router = useRouter();
  const { loading, isAdmin, isProfessor } = useUserRole();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="animate-spin rounded-full border-2 border-orange-500/30 border-t-orange-500 w-16 h-16" />
      </div>
    );
  }

  // setActiveTab agora navega para rotas reais
  const handleNavigate = (id: string) => {
    if (id === 'home') {
      router.push('/dashboard');
    } else {
      router.push(`/dashboard/${id}`);
    }
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

  return <AlunoDashboard onNavigate={handleNavigate} />;
}
