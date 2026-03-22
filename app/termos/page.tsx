import React from 'react';
import { ChevronLeft } from 'lucide-react';

export default function TermosPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-[#0c0a09] text-[#fcf9f8] py-12 px-6 safe-area-pt">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onBack}
          className="text-[#ab3600] font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-[#ab3600]/10 px-4 py-2 rounded-full border border-[#ab3600]/20 mb-8 transition-all"
        >
          <ChevronLeft size={16} />
          Voltar
        </button>
        
        <h1 className="font-display text-4xl font-black uppercase tracking-tighter mb-8 text-white italic">Termos de Performance</h1>
        
        <div className="space-y-6 text-stone-400 leading-relaxed font-medium">
          <p>
            Bem-vindo à LIONESS FIT. Ao acessar e usar nosso aplicativo, você concorda com os seguintes Termos de Performance.
          </p>
          
          <h2 className="font-display text-2xl font-bold text-white mt-8 mb-4 uppercase italic">1. Aceitação dos Termos</h2>
          <p>
            Ao criar uma conta e utilizar os serviços da LIONESS FIT, você concorda em cumprir e estar vinculado a estes termos. Se você não concorda com qualquer parte destes termos, não deve usar nossos serviços.
          </p>

          <h2 className="font-display text-2xl font-bold text-white mt-8 mb-4 uppercase italic">2. Uso do Aplicativo</h2>
          <p>
            A LIONESS FIT fornece um serviço de acompanhamento de treinos e nutrição. As informações fornecidas pelo aplicativo, incluindo planos de treino e cálculos de macronutrientes, são apenas para fins informativos e não substituem o aconselhamento médico profissional.
          </p>

          <h2 className="font-display text-2xl font-bold text-white mt-8 mb-4 uppercase italic">3. Responsabilidade do Usuário</h2>
          <p>
            Você é responsável por manter a confidencialidade de sua conta e senha. Você concorda em aceitar a responsabilidade por todas as atividades que ocorram sob sua conta.
          </p>

          <h2 className="font-display text-2xl font-bold text-white mt-8 mb-4 uppercase italic">4. Saúde e Segurança</h2>
          <p>
            Consulte um médico antes de iniciar qualquer novo programa de exercícios ou dieta. A LIONESS FIT não se responsabiliza por quaisquer lesões ou problemas de saúde que possam resultar do uso das informações fornecidas no aplicativo.
          </p>

          <p className="mt-12 text-[10px] font-bold text-stone-600 uppercase tracking-widest">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  );
}
