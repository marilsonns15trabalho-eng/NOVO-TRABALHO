import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Instagram, Phone, MapPin, Dumbbell, Users, TrendingUp } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-[#FF6B00] selection:text-white">
      {/* Header/Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#333]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#FF6B00] rounded-lg flex items-center justify-center font-bold text-xl">L</div>
              <span className="font-bold text-xl tracking-tighter">LIONESS <span className="text-[#FF6B00]">PERSONAL</span></span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
              <a href="#sobre" className="hover:text-[#FF6B00] transition-colors">Sobre</a>
              <a href="#planos" className="hover:text-[#FF6B00] transition-colors">Planos</a>
              <a href="#contato" className="hover:text-[#FF6B00] transition-colors">Contato</a>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="text-gray-400 hover:text-white hover:bg-[#333]">Entrar</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-[#FF6B00] hover:bg-[#e65a00] text-white font-bold">Começar Agora</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#FF6B0015] via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF6B0015] border border-[#FF6B0033] text-[#FF6B00] text-xs font-bold mb-6 animate-fade-in">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6B00] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF6B00]"></span>
              </span>
              ESTÚDIO PREMIUM EM RIO DE JANEIRO
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
              Transforme seu corpo, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B00] to-[#ff9d5c]">conquiste sua força.</span>
            </h1>
            <p className="text-lg text-gray-400 mb-10 leading-relaxed">
              Treinamento personalizado de alta performance em um ambiente exclusivo. 
              Foco total nos seus objetivos com acompanhamento profissional de elite.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button className="w-full sm:w-auto bg-[#FF6B00] hover:bg-[#e65a00] text-white font-bold px-8 py-7 text-lg rounded-xl group">
                  Agendar Aula Experimental
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="#planos">
                <Button variant="outline" className="w-full sm:w-auto border-[#333] bg-transparent hover:bg-[#333] text-white px-8 py-7 text-lg rounded-xl">
                  Ver Planos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats/Features */}
      <section className="py-20 border-y border-[#333] bg-[#0d0d0d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#FF6B0015] rounded-xl flex items-center justify-center text-[#FF6B00]">
                <Dumbbell className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-2">Equipamentos Elite</h3>
                <p className="text-gray-400 text-sm">Tecnologia de ponta para maximizar seus resultados em cada repetição.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#FF6B0015] rounded-xl flex items-center justify-center text-[#FF6B00]">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-2">Atendimento VIP</h3>
                <p className="text-gray-400 text-sm">No máximo 3 alunos por horário. Atenção total do seu personal trainer.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#FF6B0015] rounded-xl flex items-center justify-center text-[#FF6B00]">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-xl mb-2">Evolução Real</h3>
                <p className="text-gray-400 text-sm">Avaliações físicas periódicas e treinos ajustados ao seu progresso.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section id="planos" className="py-24 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold mb-4">Escolha seu <span className="text-[#FF6B00]">Plano</span></h2>
            <p className="text-gray-400">Investimento na sua saúde com flexibilidade e resultados.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Basic', price: '249', features: ['2x na semana', 'Avaliação mensal', 'App de treinos', 'Suporte WhatsApp'] },
              { name: 'Premium', price: '349', features: ['3x na semana', 'Avaliação quinzenal', 'App de treinos', 'Suporte VIP 24h', 'Plano nutricional'], popular: true },
              { name: 'Elite', price: '499', features: ['5x na semana', 'Avaliação semanal', 'App de treinos', 'Suporte VIP 24h', 'Plano nutricional', 'Acesso livre'] },
            ].map((plan, i) => (
              <div key={i} className={`relative p-8 rounded-3xl border ${plan.popular ? 'border-[#FF6B00] bg-[#FF6B0005]' : 'border-[#333] bg-[#111]'} flex flex-col`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#FF6B00] text-white text-xs font-bold px-4 py-1 rounded-full">
                    MAIS POPULAR
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold">R$ {plan.price}</span>
                  <span className="text-gray-500">/mês</span>
                </div>
                <ul className="space-y-4 mb-8 flex-grow">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm text-gray-300">
                      <CheckCircle2 className="w-5 h-5 text-[#FF6B00]" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button className={`w-full py-6 font-bold rounded-xl ${plan.popular ? 'bg-[#FF6B00] hover:bg-[#e65a00] text-white' : 'bg-white text-black hover:bg-gray-200'}`}>
                  Assinar Agora
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contato" className="py-20 border-t border-[#333] bg-[#0d0d0d]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 bg-[#FF6B00] rounded-lg flex items-center justify-center font-bold text-xl">L</div>
                <span className="font-bold text-xl tracking-tighter">LIONESS <span className="text-[#FF6B00]">PERSONAL</span></span>
              </div>
              <p className="text-gray-400 max-w-sm mb-6">
                O estúdio de treinamento personalizado mais exclusivo do Rio de Janeiro. 
                Focado em resultados reais e atendimento de alta performance.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-gray-400 hover:text-[#FF6B00] transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-gray-400 hover:text-[#FF6B00] transition-colors">
                  <Phone className="w-5 h-5" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-6">Localização</h4>
              <ul className="space-y-4 text-sm text-gray-400">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#FF6B00] shrink-0" />
                  Av. das Américas, 500 - Barra da Tijuca, Rio de Janeiro - RJ
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6">Horários</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Segunda - Sexta: 06h às 22h</li>
                <li>Sábado: 08h às 14h</li>
                <li>Domingo: Fechado</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-[#333] text-center text-sm text-gray-500">
            © 2026 Lioness Personal Estúdio. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
