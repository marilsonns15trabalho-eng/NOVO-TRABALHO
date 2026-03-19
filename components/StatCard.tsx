'use client';

import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  color?: string;
}

export function StatCard({ label, value, icon: Icon, color = 'orange' }: StatCardProps) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-[#1a1d26] p-6 rounded-2xl border border-white/5 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${color === 'orange' ? 'bg-orange-500/10 text-orange-500' : color === 'green' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
            <Icon size={18} />
          </div>
          <span className="text-gray-400 text-sm font-medium">{label}</span>
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-white text-3xl font-bold tracking-tight">{value}</span>
        <div className="w-full h-1 bg-white/5 rounded-full mt-4 overflow-hidden">
          <div className={`h-full rounded-full ${color === 'orange' ? 'bg-orange-500' : color === 'green' ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: '60%' }} />
        </div>
      </div>
    </motion.div>
  );
}
