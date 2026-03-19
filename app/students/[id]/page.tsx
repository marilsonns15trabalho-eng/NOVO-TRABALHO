'use client';

import React from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { 
  Phone, 
  Mail, 
  MapPin, 
  ChevronRight, 
  Calendar, 
  FileText, 
  Activity, 
  CreditCard,
  Plus,
  TrendingUp,
  History,
  Eye,
  Trash2,
  Edit2,
  X
} from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { MOCK_ASSESSMENTS } from '@/lib/mock-assessments';
import { EvolutionChart } from '@/components/assessments/EvolutionChart';
import { AssessmentForm } from '@/components/assessments/AssessmentForm';
import { PhysicalAssessment } from '@/lib/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TABS = [
  { id: 'anamnese', label: 'Anamnese', icon: FileText },
  { id: 'avaliacoes', label: 'Avaliações', icon: Activity },
  { id: 'treinos', label: 'Treinos', icon: Activity },
  { id: 'pagamentos', label: 'Pagamentos', icon: CreditCard },
];

export default function StudentProfile() {
  const [activeTab, setActiveTab] = React.useState('anamnese');
  const [assessments, setAssessments] = React.useState<PhysicalAssessment[]>(MOCK_ASSESSMENTS.filter(a => a.studentId === '1'));
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [viewingAssessment, setViewingAssessment] = React.useState<PhysicalAssessment | null>(null);

  const handleSaveAssessment = (data: Partial<PhysicalAssessment>) => {
    const newAssessment: PhysicalAssessment = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      studentId: '1',
      studentName: 'Ana Souza',
    } as PhysicalAssessment;
    setAssessments(prev => [newAssessment, ...prev]);
    setIsFormOpen(false);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#0f1117] text-white font-sans">
      <Sidebar />
      
      <main className="flex-1 flex flex-col">
        <Header />
        
        <div className="p-4 md:p-8">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-8 uppercase tracking-widest">
            <Link href="/" className="hover:text-white transition-colors">Início</Link>
            <ChevronRight size={10} />
            <Link href="/students" className="hover:text-white transition-colors">Alunos</Link>
            <ChevronRight size={10} />
            <span className="text-orange-500 font-bold">Ana Souza</span>
          </div>

          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-orange-500/20 shadow-2xl shadow-orange-500/10">
              <Image 
                src="https://picsum.photos/seed/ana/400/400" 
                alt="Ana Souza" 
                fill 
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-4 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Ana Souza</h1>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-center md:justify-start gap-3 text-gray-400">
                  <Phone size={18} className="text-orange-500" />
                  <span className="text-sm">+55 21 98876-5432</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-3 text-gray-400">
                  <Mail size={18} className="text-orange-500" />
                  <span className="text-sm">ana.souza@email.com</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-3 text-gray-400">
                  <MapPin size={18} className="text-orange-500" />
                  <span className="text-sm">Rio de Janeiro, RJ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 md:gap-8 border-b border-white/5 mb-8 overflow-x-auto no-scrollbar">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "pb-4 px-2 text-sm font-bold transition-all relative whitespace-nowrap",
                  activeTab === tab.id ? "text-white" : "text-gray-500 hover:text-gray-300"
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 rounded-full" 
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <AnimatePresence mode="wait">
                {activeTab === 'anamnese' && (
                  <motion.div
                    key="anamnese"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-[#1a1d26] p-6 md:p-8 rounded-3xl border border-white/5"
                  >
                    <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                      <div className="w-1 h-6 bg-orange-500 rounded-full" />
                      Informações Pessoais
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0f1117] border border-white/5">
                          <div className="flex items-center gap-3">
                            <Phone size={20} className="text-orange-500" />
                            <span className="text-sm text-gray-400 font-medium">Telefone</span>
                          </div>
                          <span className="text-sm font-bold">+55 21 98876-5432</span>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0f1117] border border-white/5">
                          <div className="flex items-center gap-3">
                            <Mail size={20} className="text-orange-500" />
                            <span className="text-sm text-gray-400 font-medium">Email</span>
                          </div>
                          <span className="text-sm font-bold">ana.souza@email.com</span>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0f1117] border border-white/5">
                          <div className="flex items-center gap-3">
                            <MapPin size={20} className="text-orange-500" />
                            <span className="text-sm text-gray-400 font-medium">Endereço</span>
                          </div>
                          <span className="text-sm font-bold">Rio de Janeiro, RJ</span>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0f1117] border border-white/5">
                          <div className="flex items-center gap-3">
                            <Calendar size={20} className="text-orange-500" />
                            <span className="text-sm text-gray-400 font-medium">Nascimento</span>
                          </div>
                          <span className="text-sm font-bold">12 Mai, 1995</span>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0f1117] border border-white/5">
                          <div className="flex items-center gap-3">
                            <Activity size={20} className="text-orange-500" />
                            <span className="text-sm text-gray-400 font-medium">Peso</span>
                          </div>
                          <span className="text-sm font-bold">65 kg</span>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0f1117] border border-white/5">
                          <div className="flex items-center gap-3">
                            <Activity size={20} className="text-orange-500" />
                            <span className="text-sm text-gray-400 font-medium">Altura</span>
                          </div>
                          <span className="text-sm font-bold">1.70 m</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'avaliacoes' && (
                  <motion.div
                    key="avaliacoes"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-8"
                  >
                    <div className="bg-[#1a1d26] p-6 md:p-8 rounded-3xl border border-white/5">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold flex items-center gap-3">
                          <div className="w-1 h-6 bg-orange-500 rounded-full" />
                          Evolução Antropométrica
                        </h3>
                        <button 
                          onClick={() => setIsFormOpen(true)}
                          className="p-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                      <EvolutionChart data={assessments} />
                    </div>

                    <div className="bg-[#1a1d26] rounded-3xl border border-white/5 overflow-hidden">
                      <div className="p-6 border-b border-white/5">
                        <h3 className="text-lg font-bold">Histórico de Avaliações</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 bg-white/2">
                              <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Data</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Peso</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">% Gordura</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {assessments.map((a) => (
                              <tr key={a.id} className="hover:bg-white/2 transition-colors group">
                                <td className="px-6 py-4">
                                  <span className="text-sm font-bold">{format(new Date(a.date), 'dd/MM/yyyy')}</span>
                                </td>
                                <td className="px-6 py-4 text-center text-sm">{a.weight} kg</td>
                                <td className="px-6 py-4 text-center">
                                  <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-bold">
                                    {a.results.fatPercentage}%
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <button 
                                    onClick={() => setViewingAssessment(a)}
                                    className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-xl transition-all"
                                  >
                                    <Eye size={18} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-8">
              <div className="bg-[#1a1d26] p-6 md:p-8 rounded-3xl border border-white/5">
                <h3 className="text-xl font-bold mb-6">Plano Atual</h3>
                <div className="p-6 rounded-2xl bg-orange-500 text-white space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-orange-100 text-[10px] font-bold uppercase tracking-wider">Plano Premium</p>
                      <h4 className="text-2xl font-bold">VIP Anual</h4>
                    </div>
                    <CreditCard size={24} className="text-orange-200" />
                  </div>
                  <div className="pt-4 border-t border-white/20">
                    <div className="flex justify-between text-sm">
                      <span className="text-orange-100">Expira em</span>
                      <span className="font-bold">45 Dias</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#1a1d26] p-6 md:p-8 rounded-3xl border border-white/5">
                <h3 className="text-xl font-bold mb-6">Atividade Recente</h3>
                <div className="space-y-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-1 h-10 bg-white/5 rounded-full relative">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-orange-500 border-2 border-[#1a1d26]" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Avaliação Física</p>
                        <p className="text-xs text-gray-500">Concluída em 10 Mar, 2024</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Modals */}
      {isFormOpen && (
        <AssessmentForm 
          onClose={() => setIsFormOpen(false)}
          onSave={handleSaveAssessment}
          students={[{ id: '1', name: 'Ana Souza' }]}
          initialData={{ studentId: '1' }}
        />
      )}

      {viewingAssessment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1d26] w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 shadow-2xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white">Detalhes da Avaliação</h2>
                <p className="text-gray-500 text-sm">{viewingAssessment.studentName} • {format(new Date(viewingAssessment.date), 'dd/MM/yyyy')}</p>
              </div>
              <button onClick={() => setViewingAssessment(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-8">
                <div className="bg-[#0f1117] p-6 rounded-3xl border border-white/5">
                  <h4 className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-4">Resultados</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">IMC</p>
                      <p className="text-xl font-bold">{viewingAssessment.results.bmi}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">% Gordura</p>
                      <p className="text-xl font-bold">{viewingAssessment.results.fatPercentage}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Massa Gorda</p>
                      <p className="text-xl font-bold">{viewingAssessment.results.fatMass} kg</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Massa Magra</p>
                      <p className="text-xl font-bold">{viewingAssessment.results.leanMass} kg</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#0f1117] p-6 rounded-3xl border border-white/5">
                  <h4 className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-4">Dobras Cutâneas</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Tríceps</p>
                      <p className="text-lg font-bold">{viewingAssessment.skinfolds.triceps} mm</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Subescapular</p>
                      <p className="text-lg font-bold">{viewingAssessment.skinfolds.subscapular} mm</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Supra-ilíaca</p>
                      <p className="text-lg font-bold">{viewingAssessment.skinfolds.suprailiac} mm</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Abdominal</p>
                      <p className="text-lg font-bold">{viewingAssessment.skinfolds.abdominal} mm</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#0f1117] p-6 rounded-3xl border border-white/5">
                <h4 className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-4">Perímetros</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(viewingAssessment.perimeters).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-[10px] text-gray-500 uppercase">{key}</p>
                      <p className="text-sm font-bold">{value} cm</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {viewingAssessment.notes && (
              <div className="mt-8 p-6 bg-[#0f1117] rounded-3xl border border-white/5">
                <h4 className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-2">Observações</h4>
                <p className="text-gray-400 text-sm leading-relaxed">{viewingAssessment.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
