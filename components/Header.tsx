'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Search, User, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const [lateCount, setLateCount] = useState(0);

  useEffect(() => {
    const fetchLateBills = async () => {
      const { count, error } = await supabase
        .from('bills')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'late');
      
      if (!error) setLateCount(count || 0);
    };
    fetchLateBills();
    
    // Realtime subscription
    const channel = supabase
      .channel('bills_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bills' }, fetchLateBills)
      .subscribe();
      
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <header className="h-20 bg-black border-b border-zinc-900 px-8 flex items-center justify-between sticky top-0 z-10 backdrop-blur-md bg-black/80">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
        <div className="h-6 w-px bg-zinc-800 mx-2" />
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-hover:text-orange-500 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Pesquisar..." 
            className="bg-zinc-900/50 border border-zinc-800 rounded-full py-2 pl-10 pr-4 text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 w-64 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="relative p-2 text-zinc-400 hover:text-orange-500 transition-colors">
          <Bell size={22} />
          {lateCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-black text-[10px] flex items-center justify-center font-bold text-white">
              {lateCount}
            </span>
          )}
        </button>

        <div className="flex items-center gap-4 pl-6 border-l border-zinc-800">
          <div className="text-right">
            <p className="text-sm font-semibold text-white">Marilson Silva</p>
            <p className="text-xs text-zinc-500">Personal Trainer</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-black font-bold border-2 border-zinc-800">
            MS
          </div>
          <button className="p-2 text-zinc-500 hover:text-red-500 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}
