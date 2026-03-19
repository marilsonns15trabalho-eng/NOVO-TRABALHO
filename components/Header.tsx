'use client';

import { Search, Bell, Settings, User } from 'lucide-react';

export function Header() {
  return (
    <header className="h-20 border-b border-white/5 px-4 md:px-8 flex items-center justify-between bg-[#0f1117]/80 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-4 bg-[#1a1d26] px-4 py-2 rounded-xl border border-white/5 w-full max-w-[120px] md:max-w-96 ml-12 lg:ml-0">
        <Search size={18} className="text-gray-500 shrink-0" />
        <input 
          type="text" 
          placeholder="Buscar..." 
          className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-gray-600"
        />
      </div>

      <div className="flex items-center gap-2 md:gap-6">
        <button className="relative p-2 text-gray-400 hover:text-white transition-colors hidden sm:block">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-[#0f1117]" />
        </button>
        <button className="p-2 text-gray-400 hover:text-white transition-colors hidden sm:block">
          <Settings size={20} />
        </button>
        <div className="h-8 w-px bg-white/10 mx-2 hidden sm:block" />
        <button className="flex items-center gap-3 pl-2 group">
          <div className="text-right hidden md:block">
            <p className="text-sm font-bold text-white group-hover:text-orange-500 transition-colors">Admin User</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Super Admin</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-500 overflow-hidden shrink-0">
            <User size={20} />
          </div>
        </button>
      </div>
    </header>
  );
}
