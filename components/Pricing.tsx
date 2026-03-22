'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';

const plans = [
  { name: 'GRÁTIS', price: 'R$ 0,00', features: ['Acesso básico', 'Com anúncios'], color: 'border-stone-700' },
  { name: 'BÁSICO', price: 'R$ 9,90/mês', features: ['Sem anúncios', 'Treinos essenciais'], color: 'border-orange-500' },
  { name: 'PRO', price: 'R$ 19,90/mês', features: ['Tudo liberado', 'Avaliação física', 'Suporte VIP'], color: 'border-orange-600' },
];

export default function Pricing() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      {plans.map((plan) => (
        <motion.div 
          key={plan.name}
          whileHover={{ scale: 1.02 }}
          className={`bg-stone-900 border-2 ${plan.color} rounded-2xl p-6 flex flex-col`}
        >
          <h3 className="text-xl font-black text-white text-center mb-2">{plan.name}</h3>
          <p className="text-3xl font-black text-orange-500 text-center mb-6">{plan.price}</p>
          <ul className="space-y-3 mb-8 flex-grow">
            {plan.features.map(f => (
              <li key={f} className="flex items-center text-stone-300 text-sm">
                <Check className="w-4 h-4 text-orange-500 mr-2" /> {f}
              </li>
            ))}
          </ul>
          <button className="w-full bg-orange-600 text-white font-black py-3 rounded-xl hover:bg-orange-700 transition-colors">
            ESCOLHER
          </button>
        </motion.div>
      ))}
    </div>
  );
}
