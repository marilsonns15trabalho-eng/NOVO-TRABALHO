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
  X,
  UserPlus
} from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { MOCK_ASSESSMENTS } from '@/lib/mock-assessments';
import { EvolutionChart } from '@/components/assessments/EvolutionChart';
import { AssessmentForm } from '@/components/assessments/AssessmentForm';
import { PhysicalAssessment } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TABS = [
  { id: 'anamnese', label: 'Anamnese', icon: FileText },
  { id: 'avaliacoes', label: 'Avaliações', icon: Activity },
  { id: 'treinos', label: 'Treinos', icon: Activity },
  { id: 'pagamentos', label: 'Pagamentos', icon: CreditCard },
];

export default function StudentProfile() {
  const params = useParams();
  const studentId = params.id as string;
  
  const [activeTab, setActiveTab] = React.useState('anamnese');
  const [student, setStudent] = React.useState<any>(null);
  const [assessments, setAssessments] = React.useState<PhysicalAssessment[]>([]);
  const [workouts, setWorkouts] = React.useState<any[]>([]);
  const [payments, setPayments] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [viewingAssessment, setViewingAssessment] = React.useState<PhysicalAssessment | null>(null);
  const [viewingWorkout, setViewingWorkout] = React.useState<any | null>(null);

  const fetchStudentData = React.useCallback(async () => {
    if (!studentId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();
      
      if (error) throw error;
      setStudent(data);

      // Fetch assessments
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('assessments')
        .select('*')
        .eq('student_id', studentId)
        .order('date', { ascending: false });
      
      if (!assessmentsError) {
        setAssessments(assessmentsData || []);
      }

      // Fetch workouts
      const { data: workoutsData, error: workoutsError } = await supabase
        .from('workouts')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      
      if (!workoutsError) {
        setWorkouts(workoutsData || []);
      }

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('memberships')
        .select('*')
        .eq('student_id', studentId)
        .order('due_date', { ascending: false });
      
      if (!paymentsError) {
        setPayments(paymentsData || []);
      }
    } catch (error: any) {
      console.error('Erro ao buscar dados do aluno:', error);
      toast.error('Erro ao carregar perfil do aluno');
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  React.useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  const handleSaveAssessment = async (data: any) => {
    try {
      const { error } = await supabase
        .from('assessments')
        .insert([{
          student_id: studentId,
          date: data.date || new Date().toISOString(),
          weight: data.weight,
          height: data.height,
          skinfolds: data.skinfolds,
          perimeters: data.perimeters,
          results: data.results,
          notes: data.notes
        }]);
      
      if (error) throw error;
      
      toast.success('Avaliação salva com sucesso!');
      fetchStudentData();
      setIsFormOpen(false);
    } catch (error: any) {
      console.error('Erro ao salvar avaliação:', error);
      toast.error(`Erro ao salvar avaliação: ${error.message || 'Erro desconhecido'}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col lg:flex-row min-h-screen bg-[#0f1117] text-white font-sans">
        <Sidebar />
        <main className="flex-1 flex flex-col">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </main>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col lg:flex-row min-h-screen bg-[#0f1117] text-white font-sans">
        <Sidebar />
        <main className="flex-1 flex flex-col">
          <Header />
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <h2 className="text-2xl font-bold">Aluno não encontrado</h2>
            <Link href="/students" className="text-orange-500 hover:underline">Voltar para lista</Link>
          </div>
        </main>
      </div>
    );
  }

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
            <span className="text-orange-500 font-bold">{student.name}</span>
          </div>

          {/* Profile Header */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-orange-500/20 shadow-2xl shadow-orange-500/10 bg-orange-500/10 flex items-center justify-center text-4xl font-bold text-orange-500">
              {student.name?.charAt(0) || '?'}
            </div>
            <div className="space-y-4 text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{student.name}</h1>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-center md:justify-start gap-3 text-gray-400">
                  <Phone size={18} className="text-orange-500" />
                  <span className="text-sm">{student.phone || 'Não informado'}</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-3 text-gray-400">
                  <Mail size={18} className="text-orange-500" />
                  <span className="text-sm">{student.email}</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-3 text-gray-400">
                  <MapPin size={18} className="text-orange-500" />
                  <span className="text-sm">Membro desde {format(new Date(student.join_date), "dd 'de' MMM, yyyy", { locale: ptBR })}</span>
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
                    className="space-y-8"
                  >
                    {/* Informações Pessoais */}
                    <div className="bg-[#1a1d26] p-6 md:p-8 rounded-3xl border border-white/5">
                      <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                        <div className="w-1 h-6 bg-orange-500 rounded-full" />
                        Dados Cadastrais
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        <div className="space-y-6">
                          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0f1117] border border-white/5">
                            <div className="flex items-center gap-3">
                              <Phone size={20} className="text-orange-500" />
                              <span className="text-sm text-gray-400 font-medium">Telefone</span>
                            </div>
                            <span className="text-sm font-bold">{student.phone || 'Não informado'}</span>
                          </div>
                          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0f1117] border border-white/5">
                            <div className="flex items-center gap-3">
                              <Mail size={20} className="text-orange-500" />
                              <span className="text-sm text-gray-400 font-medium">Email</span>
                            </div>
                            <span className="text-sm font-bold">{student.email}</span>
                          </div>
                          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0f1117] border border-white/5">
                            <div className="flex items-center gap-3">
                              <Calendar size={20} className="text-orange-500" />
                              <span className="text-sm text-gray-400 font-medium">Nascimento</span>
                            </div>
                            <span className="text-sm font-bold">{student.birth_date ? format(new Date(student.birth_date), 'dd/MM/yyyy') : 'Não informado'}</span>
                          </div>
                          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0f1117] border border-white/5">
                            <div className="flex items-center gap-3">
                              <UserPlus size={20} className="text-orange-500" />
                              <span className="text-sm text-gray-400 font-medium">Gênero</span>
                            </div>
                            <span className="text-sm font-bold">{student.gender || 'Não informado'}</span>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0f1117] border border-white/5">
                            <div className="flex items-center gap-3">
                              <MapPin size={20} className="text-orange-500" />
                              <span className="text-sm text-gray-400 font-medium">Endereço</span>
                            </div>
                            <span className="text-sm font-bold text-right max-w-[200px] truncate">{student.address || 'Não informado'}</span>
                          </div>
                          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0f1117] border border-white/5">
                            <div className="flex items-center gap-3">
                              <FileText size={20} className="text-orange-500" />
                              <span className="text-sm text-gray-400 font-medium">Profissão</span>
                            </div>
                            <span className="text-sm font-bold">{student.profession || 'Não informado'}</span>
                          </div>
                          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0f1117] border border-white/5">
                            <div className="flex items-center gap-3">
                              <Phone size={20} className="text-orange-500" />
                              <span className="text-sm text-gray-400 font-medium">Emergência</span>
                            </div>
                            <span className="text-sm font-bold">{student.emergency_contact || 'Não informado'}</span>
                          </div>
                          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0f1117] border border-white/5">
                            <div className="flex items-center gap-3">
                              <Activity size={20} className="text-orange-500" />
                              <span className="text-sm text-gray-400 font-medium">Status</span>
                            </div>
                            <span className={cn("text-sm font-bold", student.status === 'Ativo' ? 'text-emerald-500' : 'text-red-500')}>{student.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Plano e Objetivos */}
                    <div className="bg-[#1a1d26] p-6 md:p-8 rounded-3xl border border-white/5">
                      <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                        <div className="w-1 h-6 bg-orange-500 rounded-full" />
                        Plano e Objetivos
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        <div className="space-y-6">
                          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0f1117] border border-white/5">
                            <div className="flex items-center gap-3">
                              <CreditCard size={20} className="text-orange-500" />
                              <span className="text-sm text-gray-400 font-medium">Plano Atual</span>
                            </div>
                            <span className="text-sm font-bold">{student.plan_name || student.plan || 'Mensal'}</span>
                          </div>
                          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0f1117] border border-white/5">
                            <div className="flex items-center gap-3">
                              <Activity size={20} className="text-orange-500" />
                              <span className="text-sm text-gray-400 font-medium">Modalidade</span>
                            </div>
                            <span className="text-sm font-bold">{student.modality || 'Presencial'}</span>
                          </div>
                          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0f1117] border border-white/5">
                            <div className="flex items-center gap-3">
                              <Calendar size={20} className="text-orange-500" />
                              <span className="text-sm text-gray-400 font-medium">Início</span>
                            </div>
                            <span className="text-sm font-bold">{student.start_date ? format(new Date(student.start_date), 'dd/MM/yyyy') : 'Não informado'}</span>
                          </div>
                          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0f1117] border border-white/5">
                            <div className="flex items-center gap-3">
                              <TrendingUp size={20} className="text-orange-500" />
                              <span className="text-sm text-gray-400 font-medium">Valor Pago</span>
                            </div>
                            <span className="text-sm font-bold">R$ {student.amount_paid?.toFixed(2) || '0,00'}</span>
                          </div>
                        </div>

                        <div className="space-y-6">
                          <div className="p-4 rounded-2xl bg-[#0f1117] border border-white/5 space-y-3">
                            <div className="flex items-center gap-3">
                              <TrendingUp size={20} className="text-orange-500" />
                              <span className="text-sm text-gray-400 font-medium">Objetivos</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {student.objectives && student.objectives.length > 0 ? (
                                student.objectives.map((obj: string) => (
                                  <span key={obj} className="px-3 py-1 bg-orange-500/10 text-orange-500 text-[10px] font-bold rounded-full uppercase tracking-wider">
                                    {obj}
                                  </span>
                                ))
                              ) : (
                                <span className="text-sm font-bold text-gray-600 italic">Nenhum objetivo definido</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0f1117] border border-white/5">
                            <div className="flex items-center gap-3">
                              <Activity size={20} className="text-orange-500" />
                              <span className="text-sm text-gray-400 font-medium">Peso Desejado</span>
                            </div>
                            <span className="text-sm font-bold">{student.desired_weight ? `${student.desired_weight} kg` : 'Não informado'}</span>
                          </div>
                          <div className="p-4 rounded-2xl bg-[#0f1117] border border-white/5 space-y-2">
                            <div className="flex items-center gap-3">
                              <FileText size={20} className="text-orange-500" />
                              <span className="text-sm text-gray-400 font-medium">Observações</span>
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed">{student.notes || 'Nenhuma observação cadastrada.'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'treinos' && (
                  <motion.div
                    key="treinos"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold flex items-center gap-3">
                        <div className="w-1 h-6 bg-orange-500 rounded-full" />
                        Treinos Atribuídos
                      </h3>
                      <Link 
                        href="/workouts"
                        className="p-2 bg-orange-500/10 text-orange-500 rounded-xl hover:bg-orange-500 hover:text-white transition-all"
                      >
                        <Plus size={20} />
                      </Link>
                    </div>

                    {workouts.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {workouts.map((workout) => (
                          <div 
                            key={workout.id}
                            className="bg-[#1a1d26] p-6 rounded-3xl border border-white/5 space-y-4 hover:border-orange-500/30 transition-all group"
                          >
                            <div className="flex justify-between items-start">
                              <div className="p-3 bg-orange-500/10 rounded-xl text-orange-500">
                                <Activity size={24} />
                              </div>
                              <button 
                                onClick={() => setViewingWorkout(workout)}
                                className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all"
                              >
                                <Eye size={16} />
                              </button>
                            </div>
                            <div>
                              <h4 className="font-bold text-white">{workout.title}</h4>
                              <p className="text-xs text-gray-500 line-clamp-2">{workout.description || 'Sem descrição'}</p>
                            </div>
                            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-gray-500 uppercase tracking-widest">
                              <span>{workout.exercises?.length || 0} Exercícios</span>
                              <span>{format(new Date(workout.created_at), 'dd/MM/yyyy')}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-[#1a1d26] p-12 rounded-3xl border border-white/5 text-center space-y-4">
                        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-gray-600 mx-auto">
                          <Activity size={32} />
                        </div>
                        <p className="text-gray-500 text-sm">Nenhum treino atribuído a este aluno.</p>
                        <Link href="/workouts" className="text-orange-500 text-xs font-bold hover:underline">Ir para Gestão de Treinos</Link>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'pagamentos' && (
                  <motion.div
                    key="pagamentos"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold flex items-center gap-3">
                        <div className="w-1 h-6 bg-orange-500 rounded-full" />
                        Histórico de Pagamentos
                      </h3>
                      <Link 
                        href="/financial"
                        className="p-2 bg-orange-500/10 text-orange-500 rounded-xl hover:bg-orange-500 hover:text-white transition-all"
                      >
                        <Plus size={20} />
                      </Link>
                    </div>

                    <div className="bg-[#1a1d26] rounded-3xl border border-white/5 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-white/5 bg-white/2">
                              <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Vencimento</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Valor</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Método</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {payments.length > 0 ? (
                              payments.map((p) => (
                                <tr key={p.id} className="hover:bg-white/2 transition-colors">
                                  <td className="px-6 py-4 text-sm font-bold">
                                    {format(new Date(p.due_date), 'dd/MM/yyyy')}
                                  </td>
                                  <td className="px-6 py-4 text-sm">
                                    R$ {p.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={cn(
                                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                                      p.status === 'paid' ? "bg-emerald-500/10 text-emerald-500" : 
                                      p.status === 'pending' ? "bg-orange-500/10 text-orange-500" : "bg-red-500/10 text-red-500"
                                    )}>
                                      {p.status === 'paid' ? 'Pago' : p.status === 'pending' ? 'Pendente' : 'Atrasado'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-xs text-gray-400 uppercase">
                                    {p.method || '-'}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500 text-sm">
                                  Nenhum registro de pagamento encontrado.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
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
                      <p className="text-orange-100 text-[10px] font-bold uppercase tracking-wider">Modalidade: {student.modality || 'Presencial'}</p>
                      <h4 className="text-2xl font-bold">{student.plan_name || 'Mensal'}</h4>
                    </div>
                    <CreditCard size={24} className="text-orange-200" />
                  </div>
                  <div className="pt-4 border-t border-white/20">
                    <div className="flex justify-between text-sm">
                      <span className="text-orange-100">Início em</span>
                      <span className="font-bold">{student.start_date ? format(new Date(student.start_date), 'dd/MM/yyyy') : 'Não informado'}</span>
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
          students={[{ id: student.id, name: student.name }]}
          initialData={{ studentId: student.id }}
        />
      )}

      {viewingWorkout && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1d26] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 shadow-2xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white">{viewingWorkout.title}</h2>
                <p className="text-gray-500 text-sm">{student.name} • {format(new Date(viewingWorkout.created_at), 'dd/MM/yyyy')}</p>
              </div>
              <button onClick={() => setViewingWorkout(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={24} className="text-gray-400" />
              </button>
            </div>

            <div className="space-y-6">
              {viewingWorkout.description && (
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-gray-400 text-sm italic">&quot;{viewingWorkout.description}&quot;</p>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  Exercícios
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {viewingWorkout.exercises?.map((ex: any, idx: number) => (
                    <div key={idx} className="p-4 bg-[#0f1117] rounded-2xl border border-white/5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white">{ex.name}</p>
                        <p className="text-xs text-gray-500">{ex.sets} séries x {ex.reps} reps • {ex.rest} descanso</p>
                      </div>
                      {ex.notes && (
                        <div className="text-[10px] text-orange-500 bg-orange-500/10 px-2 py-1 rounded-lg">
                          Obs: {ex.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewingAssessment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1d26] w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 shadow-2xl p-6 md:p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white">Detalhes da Avaliação</h2>
                <p className="text-gray-500 text-sm">{student.name} • {format(new Date(viewingAssessment.date), 'dd/MM/yyyy')}</p>
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
