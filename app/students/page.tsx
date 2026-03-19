'use client';

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
  plan: string;
  status: 'Ativo' | 'Inativo';
  join_date: string;
}

export default function StudentsPage() {
  const [students, setStudents] = React.useState<Student[]>([]);
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
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar alunos:', error);
      toast.error('Erro ao carregar lista de alunos');
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
    const studentData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      plan: formData.get('plan') as string,
      status: (formData.get('status') as 'Ativo' | 'Inativo') || 'Ativo',
    };

    try {
      if (editingStudent) {
        const { error } = await supabase
          .from('students')
          .update(studentData)
          .eq('id', editingStudent.id);
        
        if (error) throw error;
        toast.success('Aluno atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('students')
          .insert([{ ...studentData, join_date: new Date().toISOString().split('T')[0] }]);
        
        if (error) throw error;
        toast.success('Novo aluno cadastrado!');
      }
      
      fetchStudents();
      setIsModalOpen(false);
      setEditingStudent(null);
    } catch (error: any) {
      console.error('Erro ao salvar aluno:', error);
      toast.error('Erro ao salvar dados do aluno');
    }
  };

  const confirmDeleteAction = async () => {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', confirmDelete.id);
      
      if (error) throw error;
      toast.success('Aluno excluído com sucesso');
      fetchStudents();
    } catch (error: any) {
      console.error('Erro ao excluir aluno:', error);
      toast.error('Erro ao excluir aluno');
    }
  };

  const toggleStatus = async (student: Student) => {
    const newStatus = student.status === 'Ativo' ? 'Inativo' : 'Ativo';
    try {
      const { error } = await supabase
        .from('students')
        .update({ status: newStatus })
        .eq('id', student.id);
      
      if (error) throw error;
      toast.success(`Status de ${student.name} alterado para ${newStatus}`);
      fetchStudents();
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status');
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
                            {student.name.charAt(0)}
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
                        <span className="text-sm text-gray-300">{student.plan}</span>
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
                        <div className="flex flex-col items-center gap-3 text-gray-500">
                          <Search size={48} className="opacity-20" />
                          <p className="text-sm font-medium">Nenhum aluno encontrado.</p>
                        </div>
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
              
              <form onSubmit={handleAddStudent} className="p-6 space-y-4">
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
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Plano</label>
                    <select 
                      name="plan"
                      defaultValue={editingStudent?.plan || 'Mensal'}
                      className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all appearance-none"
                    >
                      <option value="Mensal">Mensal</option>
                      <option value="Trimestral">Trimestral</option>
                      <option value="Semestral">Semestral</option>
                      <option value="VIP Anual">VIP Anual</option>
                    </select>
                  </div>
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
                </div>
                
                <div className="pt-4 flex gap-3">
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
