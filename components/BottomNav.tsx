'use client';

import React from 'react';
import { Home, Dumbbell, TrendingUp, Sparkles, User, Ruler } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

type Tab = 'home' | 'workouts' | 'progress' | 'coach' | 'profile' | 'assessments' | 'admin';

interface BottomNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  return (
    <nav className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-[95%] sm:w-[92%] max-w-md md:max-w-2xl lg:max-w-3xl z-[9999] bg-stone-900/80 backdrop-blur-2xl flex justify-around items-center px-1 sm:px-2 py-2 sm:py-2.5 rounded-2xl sm:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-stone-800 safe-area-mb">
      <NavButton 
        active={activeTab === 'home'} 
        onClick={() => setActiveTab('home')} 
        icon={<Home size={18} className="sm:w-5 sm:h-5" />}
        label="Início" 
      />
      <NavButton 
        active={activeTab === 'workouts'} 
        onClick={() => setActiveTab('workouts')} 
        icon={<Dumbbell size={18} className="sm:w-5 sm:h-5" />}
        label="Treinos" 
      />
      <NavButton 
        active={activeTab === 'progress'} 
        onClick={() => setActiveTab('progress')} 
        icon={<TrendingUp size={18} className="sm:w-5 sm:h-5" />}
        label="Evolução"
      />
      <NavButton 
        active={activeTab === 'assessments'} 
        onClick={() => setActiveTab('assessments')} 
        icon={<Ruler size={18} className="sm:w-5 sm:h-5" />}
        label="Medidas" 
      />
      <NavButton 
        active={activeTab === 'coach'} 
        onClick={() => setActiveTab('coach')} 
        icon={<Sparkles size={18} className="sm:w-5 sm:h-5" />}
        label="Coach" 
      />
      <NavButton 
        active={activeTab === 'profile'} 
        onClick={() => setActiveTab('profile')} 
        icon={<User size={18} className="sm:w-5 sm:h-5" />}
        label="Perfil" 
      />
    </nav>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center transition-all duration-300 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl group min-w-[50px] sm:min-w-[64px]",
        active ? "text-[#ff5f1f]" : "text-stone-500 hover:text-stone-300"
      )}
    >
      {active && (
        <motion.div
          layoutId="nav-pill"
          className="absolute inset-0 bg-[#ff5f1f]/10 rounded-xl sm:rounded-2xl -z-10"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      
      <motion.div 
        animate={{ 
          scale: active ? 1.1 : 1,
          y: active ? -2 : 0
        }}
        className="mb-0.5 sm:mb-1"
      >
        {icon}
      </motion.div>
      
      <span className={cn(
        "text-[7px] sm:text-[8px] font-black uppercase tracking-widest font-sans transition-all duration-300 whitespace-nowrap",
        active ? "opacity-100 scale-100 h-auto" : "opacity-0 scale-90 h-0 overflow-hidden"
      )}>
        {label}
      </span>
    </button>
  );
}
