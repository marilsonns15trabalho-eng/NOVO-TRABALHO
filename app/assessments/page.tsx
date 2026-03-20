'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { 
  Plus, 
  Search, 
  Filter, 
  Activity, 
  ChevronRight, 
  Trash2, 
  Edit2, 
  Eye, 
  TrendingUp, 
  History,
  Calendar,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PhysicalAssessment } from '@/lib/types';
import { AssessmentForm } from '@/components/assessments/AssessmentForm';
import { EvolutionChart } from '@/components/assessments/EvolutionChart';
import { ConfirmModal } from '@/components/ConfirmModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function AssessmentsPage() {
  const [assessments, setAssessments] = React.useState<PhysicalAssessment[]>([]);
  const [students, setStudents] = React.useState<{ id: string; name: string; birth_date?: string; gender?: string }[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedStudentId, setSelectedStudentId] = React.useState<string>('all');
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingAssessment, setEditingAssessment] = React.useState<PhysicalAssessment | null>(null);
  const [viewingAssessment, setViewingAssessment] = React.useState<PhysicalAssessment | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = React.useState<string | null>(null);
  const [activeView, setActiveView] = React.useState<'list' | 'evolution'>('list');

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, name, birth_date, gender')
        .order('name');
      
      if (studentsError) throw studentsError;
      setStudents(studentsData || []);

      // Fetch assessments
      const { data: assessmentsData, error: assessmentsError } = await supabase
        .from('assessments')
        .select(`
          *,
          students (
            name
          )
        `)
        .order('date', { ascending: false });

      if (assessmentsError) throw assessmentsError;

      const formattedAssessments: PhysicalAssessment[] = (assessmentsData || []).map(item => ({
        id: item.id,
        studentId: item.student_id,
        studentName: item.students?.name || 'Aluna Desconhecida',
        date: item.date,
        weight: Number(item.weight),
        height: Number(item.height),
        skinfolds: item.skinfolds,
        perimeters: item.perimeters,
        results: item.results,
        notes: item.notes,
      }));

      setAssessments(formattedAssessments);
    } catch (error: any) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar dados: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredAssessments = React.useMemo(() => {
    return assessments.filter(a => {
      const matchesSearch = a.studentName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStudent = selectedStudentId === 'all' || a.studentId === selectedStudentId;
      return matchesSearch && matchesStudent;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [assessments, searchQuery, selectedStudentId]);

  const studentEvolutionData = React.useMemo(() => {
    if (selectedStudentId === 'all') return [];
    return assessments.filter(a => a.studentId === selectedStudentId).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [assessments, selectedStudentId]);

  const handleSaveAssessment = async (data: Partial<PhysicalAssessment>) => {
    try {
      const assessmentPayload = {
        student_id: data.studentId,
        date: data.date,
        weight: data.weight,
        height: data.height,
        skinfolds: data.skinfolds,
        perimeters: data.perimeters,
        results: data.results,
        notes: data.notes,
      };

      if (editingAssessment) {
        const { error } = await supabase
          .from('assessments')
          .update(assessmentPayload)
          .eq('id', editingAssessment.id);
        
        if (error) throw error;
        toast.success('Avaliação atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('assessments')
          .insert([assessmentPayload]);
        
        if (error) throw error;
        toast.success('Nova avaliação cadastrada!');
      }
      
      fetchData();
      setIsFormOpen(false);
      setEditingAssessment(null);
    } catch (error: any) {
      console.error('Erro ao salvar avaliação:', error);
      toast.error('Erro ao salvar avaliação: ' + error.message);
    }
  };

  const handleDeleteAssessment = (id: string) => {
    setAssessmentToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!assessmentToDelete) return;
    
    try {
      const { error } = await supabase
        .from('assessments')
        .delete()
        .eq('id', assessmentToDelete);

      if (error) throw error;

      setAssessments(prev => prev.filter(a => a.id !== assessmentToDelete));
      toast.success('Avaliação excluída com sucesso');
    } catch (error: any) {
      console.error('Erro ao excluir avaliação:', error);
      toast.error('Erro ao excluir avaliação: ' + error.message);
    } finally {
      setIsDeleteModalOpen(false);
      setAssessmentToDelete(null);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#0f1117] text-white font-sans">
      <Sidebar />
      
      <main className="flex-1 flex flex-col">
        <Header />
        
        <div className="p-4 md:p-8 space-y-8">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Avaliações Físicas</h1>
              <p className="text-gray-500 mt-2">Gestão de protocolos e evolução antropométrica.</p>
            </div>
            <button 
              onClick={() => setIsFormOpen(true)}
              className="px-6 py-4 bg-orange-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20"
            >
              <Plus size={20} />
              Nova Avaliação
            </button>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#1a1d26] p-6 rounded-3xl border border-white/5 flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500">
                <Activity size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Realizado</p>
                <p className="text-2xl font-bold">{assessments.length}</p>
              </div>
            </div>
            <div className="bg-[#1a1d26] p-6 rounded-3xl border border-white/5 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Este Mês</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
            <div className="bg-[#1a1d26] p-6 rounded-3xl border border-white/5 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500">
                <History size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Média de % Gordura</p>
                <p className="text-2xl font-bold">18.4%</p>
              </div>
            </div>
          </div>

          {/* Filters & Tabs */}
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-[#1a1d26] p-4 rounded-3xl border border-white/5">
            <div className="flex gap-2 p-1 bg-[#0f1117] rounded-2xl">
              <button 
                onClick={() => setActiveView('list')}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeView === 'list' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-500 hover:text-white'}`}
              >
                Listagem
              </button>
              <button 
                onClick={() => setActiveView('evolution')}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeView === 'evolution' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-500 hover:text-white'}`}
              >
                Evolução
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar aluna..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0f1117] border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
              <div className="relative md:w-48">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <select 
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full bg-[#0f1117] border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-colors appearance-none"
                >
                  <option value="all">Todas Alunas</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {activeView === 'list' ? (
              <motion.div 
                key="list"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-[#1a1d26] rounded-3xl border border-white/5 overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/2">
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Aluna</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Data</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">Peso</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">% Gordura</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-center">IMC</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredAssessments.map((assessment) => (
                        <tr key={assessment.id} className="hover:bg-white/2 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 font-bold text-xs">
                                {assessment.studentName.charAt(0)}
                              </div>
                              <span className="font-bold text-sm">{assessment.studentName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                              <Calendar size={14} className="text-orange-500" />
                              {format(new Date(assessment.date), 'dd MMM, yyyy', { locale: ptBR })}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-medium">{assessment.weight} kg</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 text-xs font-bold">
                              {assessment.results.fatPercentage}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-sm font-medium">{assessment.results.bmi}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => setViewingAssessment(assessment)}
                                className="p-2 hover:bg-blue-500/10 text-blue-500 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Eye size={18} />
                              </button>
                              <button 
                                onClick={() => {
                                  setEditingAssessment(assessment);
                                  setIsFormOpen(true);
                                }}
                                className="p-2 hover:bg-orange-500/10 text-orange-500 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button 
                                onClick={() => handleDeleteAssessment(assessment.id)}
                                className="p-2 hover:bg-red-500/10 text-red-500 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredAssessments.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-20">
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex flex-col items-center justify-center text-gray-500 gap-4"
                            >
                              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                                <Search size={32} className="text-gray-600" />
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-bold text-white">Nenhuma avaliação encontrada</p>
                                <p className="text-sm text-gray-400 max-w-xs mx-auto mt-1">
                                  {searchQuery || selectedStudentId !== 'all'
                                    ? "Não encontramos resultados para os filtros aplicados. Tente ajustar sua busca."
                                    : "Ainda não há avaliações registradas. Comece criando uma nova avaliação."}
                                </p>
                              </div>
                              {(searchQuery || selectedStudentId !== 'all') && (
                                <button
                                  onClick={() => {
                                    setSearchQuery('');
                                    setSelectedStudentId('all');
                                  }}
                                  className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-bold transition-all border border-white/10"
                                >
                                  Limpar filtros
                                </button>
                              )}
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="evolution"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {selectedStudentId === 'all' ? (
                  <div className="bg-[#1a1d26] p-12 rounded-3xl border border-white/5 text-center space-y-4">
                    <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 mx-auto">
                      <Filter size={32} />
                    </div>
                    <div className="max-w-xs mx-auto">
                      <h3 className="text-xl font-bold">Selecione uma Aluna</h3>
                      <p className="text-gray-500 text-sm mt-2">Para ver o gráfico de evolução, selecione uma aluna específica no filtro acima.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#1a1d26] p-6 md:p-8 rounded-3xl border border-white/5">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xl font-bold flex items-center gap-3">
                        <div className="w-1 h-6 bg-orange-500 rounded-full" />
                        Evolução de {students.find(s => s.id === selectedStudentId)?.name}
                      </h3>
                    </div>
                    <EvolutionChart data={studentEvolutionData} />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Modals */}
      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Avaliação"
        message="Tem certeza que deseja excluir esta avaliação física? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
      />
      {isFormOpen && (
        <AssessmentForm 
          onClose={() => {
            setIsFormOpen(false);
            setEditingAssessment(null);
          }}
          onSave={handleSaveAssessment}
          initialData={editingAssessment || undefined}
          students={students}
        />
      )}

      {/* Viewing Details Modal */}
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
                      <p className="text-[10px] text-gray-500">{viewingAssessment.results.bmiClassification}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">RCQ</p>
                      <p className="text-xl font-bold">{viewingAssessment.results.waistHipRatio}</p>
                      <p className="text-[10px] text-gray-500">{viewingAssessment.results.rcqClassification}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Idade</p>
                      <p className="text-xl font-bold">{viewingAssessment.results.age || viewingAssessment.age || '--'} anos</p>
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
                  {Object.entries(viewingAssessment.perimeters).map(([key, value]) => {
                    const labels: Record<string, string> = {
                      neck: 'Pescoço',
                      shoulder: 'Ombro',
                      chest: 'Tórax',
                      waist: 'Cintura',
                      abdomen: 'Abdômen',
                      hip: 'Quadril',
                      rightArm: 'Braço D',
                      leftArm: 'Braço E',
                      rightThigh: 'Coxa D',
                      leftThigh: 'Coxa E',
                      rightCalf: 'Pant. D',
                      leftCalf: 'Pant. E',
                    };
                    return (
                      <div key={key}>
                        <p className="text-[10px] text-gray-500 uppercase">{labels[key] || key}</p>
                        <p className="text-sm font-bold">{value} cm</p>
                      </div>
                    );
                  })}
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
