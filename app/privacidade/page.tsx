import React from 'react';
import { ChevronLeft } from 'lucide-react';

export default function PrivacidadePage({ onBack }: { onBack: () => void }) {
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
        
        <h1 className="font-display text-4xl font-black uppercase tracking-tighter mb-8 text-white italic">Política de Privacidade</h1>
        
        <div className="space-y-6 text-stone-400 leading-relaxed font-medium">
          <p>
            A LIONESS FIT leva a sua privacidade a sério. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações pessoais.
          </p>
          
          <h2 className="font-display text-2xl font-bold text-white mt-8 mb-4 uppercase italic">1. Informações Coletadas</h2>
          <p>
            Coletamos informações que você nos fornece diretamente, como nome, endereço de e-mail, idade, peso, altura, gênero, nível de condicionamento físico e objetivos.
          </p>

          <h2 className="font-display text-2xl font-bold text-white mt-8 mb-4 uppercase italic">2. Uso das Informações</h2>
          <p>
            As informações coletadas são usadas para:
          </p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Fornecer, manter e melhorar nossos serviços.</li>
            <li>Personalizar sua experiência (macros e treinos).</li>
            <li>Comunicar-nos com você sobre sua conta.</li>
          </ul>

          <h2 className="font-display text-2xl font-bold text-white mt-8 mb-4 uppercase italic">3. Segurança dos Dados</h2>
          <p>
            Implementamos medidas de segurança para proteger suas informações pessoais contra acesso não autorizado.
          </p>

          <h2 className="font-display text-2xl font-bold text-white mt-8 mb-4 uppercase italic">4. Seus Direitos</h2>
          <p>
            Você tem o direito de acessar, corrigir ou excluir suas informações pessoais a qualquer momento através do aplicativo.
          </p>

          <p className="mt-12 text-[10px] font-bold text-stone-600 uppercase tracking-widest">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  );
}
