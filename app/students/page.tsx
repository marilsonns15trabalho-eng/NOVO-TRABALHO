'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  UserPlus,
  Filter,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { ConfirmModal } from '@/components/ConfirmModal';

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  birth_date?: string;
  gender?: string;
  address?: string;
  plan_id?: string;
  plan_name?: string;
  profession?: string;
  emergency_contact?: string;
  modality?: string;
  objectives?: string[];
  desired_weight?: number;
  start_date?: string;
  amount_paid?: number;
  notes?: string;
  status: 'Ativo' | 'Inativo';
  join_date: string;
}

export default function StudentsPage() {
  const [students, setStudents] = React.useState<Student[]>([]);
  const [plans, setPlans] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [editingStudent, setEditingStudent] = React.useState<Student | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<{ isOpen: boolean; id: string }>({
    isOpen: false,
    id: ''
  });

  const fetchStudents = React.useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('Iniciando busca de alunos e planos...');
      const { data, error, status, statusText } = await supabase
        .from('students')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Erro detalhado do Supabase (fetch):', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          status,
          statusText
        });
        throw error;
      }
      console.log('Alunos carregados com sucesso:', data?.length || 0);
      setStudents(data || []);

      // Também buscar planos
      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .eq('active', true);
      
      if (!plansError) {
        setPlans(plansData || []);
      }
    } catch (error: any) {
      console.error('Erro ao buscar alunos:', error);
      toast.error(`Erro ao carregar lista de alunos: ${error.message || 'Erro de conexão com o banco de dados'}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Pegar objetivos selecionados
    const selectedObjectives = Array.from(formData.getAll('objectives')) as string[];
    const planId = formData.get('plan_id') as string;
    const selectedPlan = plans.find(p => p.id === planId);
    
    const studentData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      birth_date: formData.get('birth_date') as string || null,
      gender: formData.get('gender') as string || null,
      address: formData.get('address') as string || null,
      plan_id: planId || null,
      plan_name: selectedPlan?.name || 'Mensal',
      profession: formData.get('profession') as string || null,
      emergency_contact: formData.get('emergency_contact') as string || null,
      modality: formData.get('modality') as string || 'Presencial',
      objectives: selectedObjectives,
      desired_weight: formData.get('desired_weight') ? parseFloat(formData.get('desired_weight') as string) : null,
      start_date: formData.get('start_date') as string || new Date().toISOString().split('T')[0],
      amount_paid: formData.get('amount_paid') ? parseFloat(formData.get('amount_paid') as string) : null,
      notes: formData.get('notes') as string || null,
      status: (formData.get('status') as 'Ativo' | 'Inativo') || 'Ativo',
    };

    try {
      console.log('Tentando salvar aluno:', studentData);
      if (editingStudent) {
        const { error, status, statusText } = await supabase
          .from('students')
          .update(studentData)
          .eq('id', editingStudent.id);
        
        if (error) {
          console.error('Erro detalhado do Supabase (update):', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            status,
            statusText
          });
          throw error;
        }
        toast.success('Aluno atualizado com sucesso!');
      } else {
        const { error, status, statusText } = await supabase
          .from('students')
          .insert([studentData]);
        
        if (error) {
          console.error('Erro detalhado do Supabase (insert):', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            status,
            statusText
          });
          throw error;
        }
        toast.success('Novo aluno cadastrado!');
      }
      
      fetchStudents();
      setIsModalOpen(false);
      setEditingStudent(null);
    } catch (error: any) {
      console.error('Erro ao salvar aluno:', error);
      toast.error(`Erro ao salvar dados do aluno: ${error.message || 'Verifique se o e-mail já está cadastrado ou se há problemas de conexão.'}`);
    }
  };

  const confirmDeleteAction = async () => {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', confirmDelete.id);
      
      if (error) {
        console.error('Erro detalhado do Supabase (delete):', error);
        throw error;
      }
      toast.success('Aluno excluído com sucesso');
      fetchStudents();
    } catch (error: any) {
      console.error('Erro ao excluir aluno:', error);
      toast.error(`Erro ao excluir aluno: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const toggleStatus = async (student: Student) => {
    const newStatus = student.status === 'Ativo' ? 'Inativo' : 'Ativo';
    try {
      const { error } = await supabase
        .from('students')
        .update({ status: newStatus })
        .eq('id', student.id);
      
      if (error) {
        console.error('Erro detalhado do Supabase (toggleStatus):', error);
        throw error;
      }
      toast.success(`Status de ${student.name} alterado para ${newStatus}`);
      fetchStudents();
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      toast.error(`Erro ao alterar status: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#0f1117] text-white font-sans">
      <Sidebar />
      
      <main className="flex-1 flex flex-col">
        <Header />
        
        <div className="p-4 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gestão de Alunos</h1>
              <p className="text-gray-500 text-sm">Gerencie, adicione e edite os alunos do estúdio.</p>
            </div>
            <button 
              onClick={() => { setEditingStudent(null); setIsModalOpen(true); }}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-orange-500/20"
            >
              <UserPlus size={20} />
              Novo Aluno
            </button>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex items-center gap-3 bg-[#1a1d26] px-4 py-3 rounded-xl border border-white/5">
              <Search size={18} className="text-gray-500" />
              <input 
                type="text" 
                placeholder="Buscar por nome ou email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-gray-600"
              />
            </div>
            <button className="flex items-center gap-2 bg-[#1a1d26] px-4 py-3 rounded-xl border border-white/5 text-gray-400 hover:text-white transition-colors">
              <Filter size={18} />
              Filtros
            </button>
          </div>

          {/* Students Table */}
          <div className="bg-[#1a1d26] rounded-2xl border border-white/5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-[#0f1117]/50">
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Aluno</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest hidden md:table-cell">Plano</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest hidden lg:table-cell">Contato</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/5" />
                            <div className="space-y-2">
                              <div className="h-4 bg-white/5 rounded w-32" />
                              <div className="h-3 bg-white/5 rounded w-24" />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 hidden md:table-cell"><div className="h-4 bg-white/5 rounded w-20" /></td>
                        <td className="p-4 hidden lg:table-cell"><div className="h-4 bg-white/5 rounded w-28" /></td>
                        <td className="p-4"><div className="h-6 bg-white/5 rounded-full w-16" /></td>
                        <td className="p-4 text-right"><div className="h-8 bg-white/5 rounded-lg w-16 ml-auto" /></td>
                      </tr>
                    ))
                  ) : filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500 font-bold">
                            {student.name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <Link href={`/students/${student.id}`} className="text-sm font-bold hover:text-orange-500 transition-colors">
                              {student.name}
                            </Link>
                            <p className="text-xs text-gray-500">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <span className="text-sm text-gray-300">{student.plan_name || 'Mensal'}</span>
                      </td>
                      <td className="p-4 hidden lg:table-cell">
                        <span className="text-sm text-gray-300">{student.phone}</span>
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={() => toggleStatus(student)}
                          className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all hover:scale-105",
                            student.status === 'Ativo' ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                          )}
                        >
                          {student.status}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openEditModal(student)}
                            className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => setConfirmDelete({ isOpen: true, id: student.id })}
                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-12 text-center">
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-col items-center gap-4 text-gray-500"
                        >
                          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-gray-600">
                            <Search size={32} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-white">Nenhum aluno encontrado</p>
                            <p className="text-xs">Não encontramos registros para o termo &quot;{searchQuery}&quot;.</p>
                          </div>
                          {searchQuery && (
                            <button 
                              onClick={() => setSearchQuery('')}
                              className="mt-2 text-xs font-bold text-orange-500 hover:text-orange-400 transition-colors"
                            >
                              Limpar busca
                            </button>
                          )}
                        </motion.div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="p-4 border-t border-white/5 flex items-center justify-between">
              <p className="text-xs text-gray-500">Mostrando {filteredStudents.length} de {students.length} alunos</p>
              <div className="flex items-center gap-2">
                <button className="p-2 text-gray-500 hover:text-white disabled:opacity-30" disabled>
                  <ChevronLeft size={20} />
                </button>
                <button className="p-2 text-gray-500 hover:text-white">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* CRUD Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[#1a1d26] rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-xl font-bold">{editingStudent ? 'Editar Aluno' : 'Novo Aluno'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              
              <form onSubmit={handleAddStudent} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {/* Informações Pessoais */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-orange-500 uppercase tracking-wider border-b border-white/5 pb-2">Informações Pessoais</h3>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nome Completo</label>
                    <input 
                      name="name"
                      required
                      defaultValue={editingStudent?.name}
                      placeholder="Ex: Ana Souza"
                      className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Email</label>
                      <input 
                        name="email"
                        type="email"
                        required
                        defaultValue={editingStudent?.email}
                        placeholder="ana@email.com"
                        className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Telefone</label>
                      <input 
                        name="phone"
                        required
                        defaultValue={editingStudent?.phone}
                        placeholder="(21) 99999-9999"
                        className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Data de Nascimento</label>
                      <input 
                        name="birth_date"
                        type="date"
                        defaultValue={editingStudent?.birth_date}
                        className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Gênero</label>
                      <select 
                        name="gender"
                        defaultValue={editingStudent?.gender || ''}
                        className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all appearance-none"
                      >
                        <option value="">Selecione...</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                        <option value="Outro">Outro</option>
                        <option value="Prefiro não dizer">Prefiro não dizer</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Endereço</label>
                    <input 
                      name="address"
                      defaultValue={editingStudent?.address}
                      placeholder="Rua, Número, Bairro, Cidade"
                      className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Profissão</label>
                      <input 
                        name="profession"
                        defaultValue={editingStudent?.profession}
                        placeholder="Ex: Engenheiro"
                        className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Contato de Emergência</label>
                      <input 
                        name="emergency_contact"
                        defaultValue={editingStudent?.emergency_contact}
                        placeholder="Nome e Telefone"
                        className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Plano e Modalidade */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-sm font-bold text-orange-500 uppercase tracking-wider border-b border-white/5 pb-2">Plano e Modalidade</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Plano</label>
                      <select 
                        name="plan_id"
                        defaultValue={editingStudent?.plan_id || ''}
                        className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all appearance-none"
                      >
                        <option value="">Selecione um plano...</option>
                        {plans.map(plan => (
                          <option key={plan.id} value={plan.id}>{plan.name} - R$ {plan.price}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Modalidade</label>
                      <select 
                        name="modality"
                        defaultValue={editingStudent?.modality || 'Presencial'}
                        className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all appearance-none"
                      >
                        <option value="Presencial">Presencial</option>
                        <option value="Consultoria Online">Consultoria Online</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Data de Início</label>
                      <input 
                        name="start_date"
                        type="date"
                        defaultValue={editingStudent?.start_date || new Date().toISOString().split('T')[0]}
                        className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Valor Pago (R$)</label>
                      <input 
                        name="amount_paid"
                        type="number"
                        step="0.01"
                        defaultValue={editingStudent?.amount_paid}
                        placeholder="0,00"
                        className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all"
                      />
                      <p className="text-[10px] text-gray-600 italic">Opcional em caso de auto-cadastro.</p>
                    </div>
                  </div>
                </div>

                {/* Objetivos */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-sm font-bold text-orange-500 uppercase tracking-wider border-b border-white/5 pb-2">Objetivos</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      'Emagrecimento',
                      'Hipertrofia',
                      'Condicionamento Físico',
                      'Saúde e Bem-estar',
                      'Performance Esportiva'
                    ].map((obj) => (
                      <label key={obj} className="flex items-center gap-3 p-3 bg-[#0f1117] border border-white/5 rounded-xl cursor-pointer hover:border-orange-500/50 transition-all">
                        <input 
                          type="checkbox" 
                          name="objectives" 
                          value={obj}
                          defaultChecked={editingStudent?.objectives?.includes(obj)}
                          className="w-4 h-4 rounded border-white/10 bg-transparent text-orange-500 focus:ring-orange-500 focus:ring-offset-0"
                        />
                        <span className="text-sm text-gray-300">{obj}</span>
                      </label>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Peso Desejado (kg)</label>
                    <input 
                      name="desired_weight"
                      type="number"
                      step="0.1"
                      defaultValue={editingStudent?.desired_weight}
                      placeholder="Ex: 75.5"
                      className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Observações e Status */}
                <div className="space-y-4 pt-4">
                  <h3 className="text-sm font-bold text-orange-500 uppercase tracking-wider border-b border-white/5 pb-2">Outros</h3>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Status</label>
                    <select 
                      name="status"
                      defaultValue={editingStudent?.status || 'Ativo'}
                      className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all appearance-none"
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Inativo">Inativo</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Observações</label>
                    <textarea 
                      name="notes"
                      defaultValue={editingStudent?.notes}
                      placeholder="Informações adicionais importantes..."
                      rows={3}
                      className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all resize-none"
                    />
                  </div>
                </div>
                
                <div className="pt-6 flex gap-3 sticky bottom-0 bg-[#1a1d26] pb-2">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-3 rounded-xl font-bold text-gray-400 hover:bg-white/5 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-orange-500/20"
                  >
                    {editingStudent ? 'Salvar Alterações' : 'Cadastrar Aluno'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ isOpen: false, id: '' })}
        onConfirm={confirmDeleteAction}
        title="Excluir Aluno"
        message="Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita."
      />
    </div>
  );
}
