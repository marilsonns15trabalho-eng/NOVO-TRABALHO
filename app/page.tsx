'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Dashboard from '@/components/Dashboard';
import Workouts from '@/components/Workouts';
import Progress from '@/components/Progress';
import Coach from '@/components/Coach';
import Profile from '@/components/Profile';
import Assessments from '@/components/Assessments';
import AdminPanel from '@/components/AdminPanel';
import Login from '@/components/Login';
import Onboarding from '@/components/Onboarding';
import TermosPage from './termos/page';
import PrivacidadePage from './privacidade/page';
import { useAuthProfile } from '@/hooks/useAuthProfile';
import BottomNav from '@/components/BottomNav';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'home' | 'workouts' | 'progress' | 'coach' | 'profile' | 'assessments' | 'admin';
type View = 'loading' | 'login' | 'onboarding' | 'app' | 'termos' | 'privacidade';

export default function MainApp() {
  const { user, loading, view, setView } = useAuthProfile();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [previousView, setPreviousView] = useState<View>('login');

  // Forçar o fundo preto no carregamento do componente
  useEffect(() => {
    document.documentElement.style.backgroundColor = '#0c0a09';
    document.body.style.backgroundColor = '#0c0a09';
  }, []);

  const handleLoginSuccess = (isNewUser: boolean) => {
    if (isNewUser) {
      setView('onboarding');
    } else {
      setView('app');
    }
  };

  const handleOnboardingSuccess = () => {
    setView('app');
  };

  const openTerms = () => {
    setPreviousView(view as View);
    setView('termos');
  };

  const openPrivacy = () => {
    setPreviousView(view as View);
    setView('privacidade');
  };

  const goBack = () => {
    setView(previousView);
  };

  if (loading || view === 'loading') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0c0a09] z-[9999]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6 text-center"
        >
          <Loader2 className="w-12 h-12 text-[#ff5f1f] animate-spin mx-auto" />
          <div className="space-y-2">
            <h2 className="text-xl font-black uppercase tracking-tighter text-white">LIONES FIT</h2>
            <p className="text-stone-500 text-sm font-bold uppercase tracking-widest">Iniciando Atelier...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (view === 'login') {
    return <Login onSuccess={handleLoginSuccess} />;
  }

  if (view === 'onboarding') {
    return <Onboarding onSuccess={handleOnboardingSuccess} onBack={() => setView('login')} onOpenTerms={openTerms} onOpenPrivacy={openPrivacy} />;
  }

  if (view === 'termos') {
    return <TermosPage onBack={goBack} />;
  }

  if (view === 'privacidade') {
    return <PrivacidadePage onBack={goBack} />;
  }

  const renderContent = () => {
    if (!user) return null;
    
    switch (activeTab) {
      case 'home': return <Dashboard key="home" user={user} onOpenAdmin={() => setActiveTab('admin')} />;
      case 'workouts': return <Workouts key="workouts" user={user} />;
      case 'progress': return <Progress key="progress" user={user} />;
      case 'coach': return <Coach key="coach" user={user} />;
      case 'profile': return <Profile key="profile" user={user} />;
      case 'assessments': return <Assessments key="assessments" user={user} />;
      case 'admin': return <AdminPanel key="admin" onBack={() => setActiveTab('home')} />;
      default: return <Dashboard key="default" user={user} onOpenAdmin={() => setActiveTab('admin')} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0a09] selection:bg-[#ff5f1f] selection:text-white overflow-hidden relative">
      <div className="w-full max-w-7xl mx-auto min-h-screen pb-32">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="w-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
      
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
