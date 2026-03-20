'use client';

import React from 'react';
import { X, ArrowRight, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { PhysicalAssessment } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ComparisonModalProps {
  onClose: () => void;
  assessments: PhysicalAssessment[];
}

const calculateDiff = (val1: number, val2: number) => {
  const diff = val2 - val1;
  const percent = val1 !== 0 ? (diff / val1) * 100 : 0;
  return { diff, percent };
};

const ComparisonRow = ({ label, val1, val2, unit = '', inverse = false }: { label: string, val1: number, val2: number, unit?: string, inverse?: boolean }) => {
  const { diff, percent } = calculateDiff(val1, val2);
  const isPositive = diff > 0;
  const isZero = diff === 0;
  
  // For weight/fat, positive is usually "bad" (red), negative is "good" (green)
  // For lean mass, positive is "good" (green)
  const isGood = inverse ? !isPositive : isPositive;

  return (
    <div className="flex items-center justify-between p-4 bg-white/2 rounded-2xl border border-white/5">
      <div className="flex-1">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</p>
        <div className="flex items-center gap-4 mt-1">
          <span className="text-lg font-bold text-white/60">{val1}{unit}</span>
          <ArrowRight size={16} className="text-gray-600" />
          <span className="text-lg font-bold text-white">{val2}{unit}</span>
        </div>
      </div>
      <div className={cn(
        "flex flex-col items-end",
        isZero ? "text-gray-500" : isGood ? "text-emerald-500" : "text-red-500"
      )}>
        <div className="flex items-center gap-1 font-bold">
          {isZero ? <Minus size={16} /> : isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span>{Math.abs(diff).toFixed(1)}{unit}</span>
        </div>
        <span className="text-[10px] font-bold opacity-80">
          {isPositive ? '+' : ''}{percent.toFixed(1)}%
        </span>
      </div>
    </div>
  );
};

export function ComparisonModal({ onClose, assessments }: ComparisonModalProps) {
  // Sort assessments by date to compare oldest to newest
  const sorted = [...assessments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  if (sorted.length < 2) return null;

  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1d26] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 shadow-2xl p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Comparativo de Evolução</h2>
            <p className="text-gray-500 text-sm">
              {format(new Date(first.date), 'dd/MM/yyyy')} vs {format(new Date(last.date), 'dd/MM/yyyy')}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <ComparisonRow label="Peso Corporal" val1={first.weight} val2={last.weight} unit="kg" inverse={true} />
          <ComparisonRow label="IMC" val1={first.results.bmi} val2={last.results.bmi} inverse={true} />
          <ComparisonRow label="% de Gordura" val1={first.results.fatPercentage} val2={last.results.fatPercentage} unit="%" inverse={true} />
          <ComparisonRow label="Massa Gorda" val1={first.results.fatMass} val2={last.results.fatMass} unit="kg" inverse={true} />
          <ComparisonRow label="Massa Magra" val1={first.results.leanMass} val2={last.results.leanMass} unit="kg" inverse={false} />
          <ComparisonRow label="RCQ" val1={first.results.waistHipRatio} val2={last.results.waistHipRatio} inverse={true} />
          
          <div className="pt-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Perímetros Principais</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ComparisonRow label="Cintura" val1={first.perimeters.waist} val2={last.perimeters.waist} unit="cm" inverse={true} />
              <ComparisonRow label="Abdomen" val1={first.perimeters.abdomen} val2={last.perimeters.abdomen} unit="cm" inverse={true} />
              <ComparisonRow label="Quadril" val1={first.perimeters.hip} val2={last.perimeters.hip} unit="cm" inverse={true} />
              <ComparisonRow label="Braço Dir." val1={first.perimeters.rightArm} val2={last.perimeters.rightArm} unit="cm" />
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 bg-orange-500/10 rounded-2xl border border-orange-500/20">
          <p className="text-sm text-orange-500 font-medium text-center italic">
            &quot;A constância é a chave para resultados duradouros. Continue focada no seu objetivo!&quot;
          </p>
        </div>
      </div>
    </div>
  );
}
