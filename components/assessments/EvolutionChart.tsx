'use client';

import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { PhysicalAssessment } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EvolutionChartProps {
  data: PhysicalAssessment[];
}

export function EvolutionChart({ data }: EvolutionChartProps) {
  const chartData = React.useMemo(() => {
    return [...data]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(item => ({
        date: format(new Date(item.date), 'dd/MM/yy', { locale: ptBR }),
        fat: item.results.fatPercentage,
        weight: item.weight,
        lean: item.results.leanMass,
      }));
  }, [data]);

  if (data.length < 2) {
    return (
      <div className="h-64 flex items-center justify-center bg-[#0f1117] rounded-3xl border border-white/5 p-8 text-center">
        <p className="text-gray-500 text-sm">
          São necessárias pelo menos duas avaliações para mostrar a evolução.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-[#0f1117] p-6 rounded-3xl border border-white/5 h-[400px]">
        <h4 className="text-sm font-bold text-gray-400 mb-6 uppercase tracking-widest">% de Gordura e Peso</h4>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#666" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <YAxis 
              stroke="#666" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1d26', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                fontSize: '12px'
              }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            <Line 
              type="monotone" 
              dataKey="fat" 
              name="% Gordura"
              stroke="#f97316" 
              strokeWidth={3} 
              dot={{ r: 6, fill: '#f97316', strokeWidth: 2, stroke: '#1a1d26' }}
              activeDot={{ r: 8, strokeWidth: 0 }}
            />
            <Line 
              type="monotone" 
              dataKey="weight" 
              name="Peso (kg)"
              stroke="#3b82f6" 
              strokeWidth={3} 
              dot={{ r: 6, fill: '#3b82f6', strokeWidth: 2, stroke: '#1a1d26' }}
              activeDot={{ r: 8, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-[#0f1117] p-6 rounded-3xl border border-white/5 h-[400px]">
        <h4 className="text-sm font-bold text-gray-400 mb-6 uppercase tracking-widest">Massa Magra (kg)</h4>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#666" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              dy={10}
            />
            <YAxis 
              stroke="#666" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1d26', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                fontSize: '12px'
              }}
              itemStyle={{ color: '#fff' }}
            />
            <Line 
              type="monotone" 
              dataKey="lean" 
              name="Massa Magra"
              stroke="#10b981" 
              strokeWidth={3} 
              dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#1a1d26' }}
              activeDot={{ r: 8, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
