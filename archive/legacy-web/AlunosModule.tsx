'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  Phone, 
  Calendar,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  ArrowLeft,
  AlertCircle,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';

interface Aluno {
  id: string;
  nome: string;
  cpf?: string;
  rg?: string;
  data_nascimento?: string;
  genero?: string;
  estado_civil?: string;
  profissao?: string;
  telefone?: string;
  celular?: string;
  email?: string;
  cep?: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  contato_emergencia_nome?: string;
  contato_emergencia_telefone?: string;
  contato_emergencia_parentesco?: string;
  plano_id?: string;
  data_matricula?: string;
  dia_vencimento?: number;
  status: 'ativo' | 'inativo';
  observacoes?: string;
  objetivos?: string[];
  peso_desejado?: number;
  grupo?: string;
  modalidade?: string;
  created_at: string;
}

interface Plano {
  id: string;
  name: string;
  price: number;
}

export default function AlunosModule() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [alunoToDelete, setAlunoToDelete] = useState<Aluno | null>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [editingAluno, setEditingAluno] = useState<Aluno | null>(null);
  const [newAluno, setNewAluno] = useState<Partial<Aluno>>({
    nome: '',
    email: '',
    telefone: '',
    status: 'ativo'
  });
  const [selectedPlanoId, setSelectedPlanoId] = useState('');

  const sendWhatsApp = (aluno: Aluno) => {
    const phone = aluno.celular || aluno.telefone;
    if (!phone) {
      showNotify('Aluno sem telefone cadastrado.', 'error');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá ${aluno.nome}, tudo bem? Gostaria de falar sobre sua matrícula na academia.`);
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name', { ascending: true });
      
      const { data: planosData } = await supabase.from('plans').select('id, name, price').eq('active', true);
      
      if (error) {
        console.error('Erro ao buscar alunos:', error);
        return;
      }

      const mappedAlunos: Aluno[] = (data || []).map((s: any) => ({
        id: s.id,
        nome: s.name || '',
        cpf: s.cpf || '',
        rg: s.rg || '',
        data_nascimento: s.birth_date || '',
        genero: s.gender || '',
        estado_civil: s.marital_status || '',
        profissao: s.profession || '',
        telefone: s.phone || '',
        celular: s.cellphone || '',
        email: s.email || '',
        cep: s.zip_code || '',
        endereco: s.address || '',
        numero: s.number || '',
        complemento: s.complement || '',
        bairro: s.bairro || '',
        cidade: s.city || '',
        estado: s.state || '',
        contato_emergencia_nome: s.emergency_contact || '',
        contato_emergencia_telefone: s.emergency_phone || '',
        contato_emergencia_parentesco: s.emergency_relationship || '',
        plano_id: s.plan_id || '',
        data_matricula: s.join_date || '',
        dia_vencimento: s.due_day || 0,
        status: s.status || 'ativo',
        observacoes: s.notes || '',
        objetivos: s.objectives || [],
        peso_desejado: s.desired_weight || 0,
        grupo: s.group || '',
        modalidade: s.modality || '',
        created_at: s.created_at,
      }));
      
      setAlunos(mappedAlunos);
      setPlanos(planosData || []);
      setLoading(false);
    };

    fetchData();
    // ... (mantendo a subscrição)

    // Inscrição em tempo real
    const channel = supabase
      .channel('alunos_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'students' 
      }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const showNotify = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleEditAluno = (aluno: Aluno) => {
    setEditingAluno(aluno);
    setNewAluno(aluno);
    setShowAddModal(true);
  };

  const handleDeleteAluno = async () => {
    if (!alunoToDelete) return;
    try {
      // 1. Remover registros vinculados em outras tabelas para evitar erro de chave estrangeira (FK)
      // Nota: Em um ambiente real, o ideal seria ter "ON DELETE CASCADE" no banco de dados.
      
      // Remover assinaturas
      await supabase.from('assinaturas').delete().eq('student_id', alunoToDelete.id);
      
      // Remover anamneses (se a tabela existir e usar student_id)
      await supabase.from('anamneses').delete().eq('student_id', alunoToDelete.id);
      
      // Remover avaliações (se a tabela existir e usar student_id)
      await supabase.from('avaliacoes').delete().eq('student_id', alunoToDelete.id);
      
      // Remover treinos (se a tabela existir e usar student_id)
      await supabase.from('treinos').delete().eq('student_id', alunoToDelete.id);
      
      // Remover boletos/contas (bills)
      await supabase.from('bills').delete().eq('student_id', alunoToDelete.id);

      // 2. Finalmente, excluir o aluno
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', alunoToDelete.id);
      
      if (error) throw error;
      
      setAlunos(alunos.filter(a => a.id !== alunoToDelete.id));
      setShowDeleteConfirm(false);
      setAlunoToDelete(null);
      showNotify('Aluno e todos os seus dados foram excluídos com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir aluno:', error);
      showNotify('Erro ao excluir aluno. Verifique se existem dependências ou tente novamente.', 'error');
    }
  };

  const handleAddAluno = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAluno.nome) {
      showNotify('O nome do aluno é obrigatório.', 'error');
      return;
    }

    // Mapeamento dos campos do formulário para as colunas do banco
    const plano = planos.find(p => p.id === selectedPlanoId);
    const dbAluno = {
      name: newAluno.nome,
      email: newAluno.email || null,
      phone: newAluno.telefone || null,
      plan: plano ? plano.name : (newAluno.modalidade || null),
      plan_name: plano ? plano.name : null,
      status: newAluno.status || 'ativo',
      join_date: newAluno.data_matricula || null,
      address: newAluno.endereco || null,
      profession: newAluno.profissao || null,
      modality: newAluno.modalidade || null,
      desired_weight: newAluno.peso_desejado || null,
      start_date: newAluno.data_matricula || null,
      emergency_contact: newAluno.contato_emergencia_nome || null,
      objectives: newAluno.objetivos || null,
      notes: newAluno.observacoes || null,
      plan_id: selectedPlanoId || null,
      birth_date: newAluno.data_nascimento || null,
      gender: newAluno.genero || null,
      bairro: newAluno.bairro || null,
      // Novos campos para garantir compatibilidade total
      cpf: newAluno.cpf || null,
      rg: newAluno.rg || null,
      marital_status: newAluno.estado_civil || null,
      cellphone: newAluno.celular || null,
      zip_code: newAluno.cep || null,
      number: newAluno.numero || null,
      complement: newAluno.complemento || null,
      city: newAluno.cidade || null,
      state: newAluno.estado || null,
      emergency_phone: newAluno.contato_emergencia_telefone || null,
      emergency_relationship: newAluno.contato_emergencia_parentesco || null,
      due_day: newAluno.dia_vencimento || null,
      group: newAluno.grupo || null,
    };

    try {
      let studentId = editingAluno?.id;

      if (editingAluno) {
        // Editar
        const { error } = await supabase
          .from('students')
          .update(dbAluno)
          .eq('id', editingAluno.id);
        if (error) throw error;
      } else {
        // Adicionar
        const { data, error } = await supabase
          .from('students')
          .insert([dbAluno])
          .select('id')
          .single();
        if (error) throw error;
        studentId = data?.id;
      }

      // Se um plano foi selecionado, cria a assinatura
      if (selectedPlanoId && studentId) {
        const plano = planos.find(p => p.id === selectedPlanoId);
        if (plano) {
          await supabase.from('assinaturas').insert([{
            student_id: studentId,
            plan_id: plano.id,
            plan_name: plano.name,
            plan_price: plano.price,
          }]);
        }
      }
      
      setShowAddModal(false);
      setEditingAluno(null);
      setNewAluno({ nome: '', email: '', telefone: '', status: 'ativo' });
      setSelectedPlanoId('');
      showNotify(editingAluno ? 'Aluno atualizado com sucesso!' : 'Aluno cadastrado com sucesso!');
      
      const { data } = await supabase.from('students').select('*').order('name', { ascending: true });
      setAlunos(data || []);
    } catch (error: any) {
      console.error('Erro ao salvar aluno detalhado:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        fullError: error
      });
      showNotify(`Erro ao salvar aluno: ${error?.message || 'Erro desconhecido.'}`, 'error');
    }
  };

  const toggleStatus = async (aluno: Aluno) => {
    try {
      const newStatus = aluno.status === 'ativo' ? 'inativo' : 'ativo';
      const { error } = await supabase
        .from('students')
        .update({ status: newStatus })
        .eq('id', aluno.id);
      
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const filteredAlunos = alunos.filter(aluno => 
    (aluno.nome || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
    (aluno.email || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 bg-black min-h-screen text-white">
      {/* Header do Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestão de Alunos</h2>
          <p className="text-zinc-500">Administre sua base de alunos e acompanhe o status de cada um.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-black font-bold px-6 py-3 rounded-2xl transition-all active:scale-95 shadow-lg shadow-orange-500/20"
        >
          <UserPlus size={20} />
          Novo Aluno
        </button>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-hover:text-orange-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou e-mail..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-2xl text-zinc-400 hover:text-white hover:border-zinc-700 transition-all">
          <Filter size={20} />
          Filtros
        </button>
      </div>

      {/* Lista de Alunos */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="text-orange-500 animate-spin" size={40} />
            <p className="text-zinc-500 font-medium">Carregando alunos...</p>
          </div>
        ) : filteredAlunos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Aluno</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Contato</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Cadastro</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredAlunos.map((aluno) => (
                  <tr key={aluno.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-orange-500 font-bold text-xs border border-zinc-700 group-hover:bg-orange-500 group-hover:text-black transition-colors">
                          {(aluno.nome || '').charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm group-hover:text-orange-500 transition-colors truncate max-w-[150px]">{aluno.nome}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        {aluno.email && (
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <Mail size={12} className="text-zinc-600" />
                            <span className="truncate max-w-[120px]">{aluno.email}</span>
                          </div>
                        )}
                        {aluno.telefone && (
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <Phone size={12} className="text-zinc-600" />
                            {aluno.telefone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => toggleStatus(aluno)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
                          aluno.status === 'ativo' 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-black' 
                            : 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-black'
                        }`}
                      >
                        {aluno.status === 'ativo' ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {aluno.status}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Calendar size={14} className="text-zinc-600" />
                        {aluno.created_at ? new Date(aluno.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => sendWhatsApp(aluno)}
                          className="p-2 text-zinc-500 hover:text-emerald-500 transition-colors"
                          title="Enviar WhatsApp"
                        >
                          <MessageCircle size={18} />
                        </button>
                        <button 
                          onClick={() => handleEditAluno(aluno)}
                          className="p-2 text-zinc-500 hover:text-orange-500 transition-colors"
                          title="Editar"
                        >
                          Editar
                        </button>
                        <button 
                          onClick={() => {
                            setAlunoToDelete(aluno);
                            setShowDeleteConfirm(true);
                          }}
                          className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                          title="Excluir"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-20 text-center space-y-4">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
              <Users className="text-zinc-600" size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold">Nenhum aluno encontrado</h3>
              <p className="text-zinc-500">Comece cadastrando seu primeiro aluno para gerenciar seus treinos.</p>
            </div>
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all"
            >
              Cadastrar Agora
            </button>
          </div>
        )}
      </div>

      {/* Modal de Cadastro */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-bold mb-6">Novo Aluno</h3>
              <form onSubmit={handleAddAluno} className="space-y-6">
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Plano</label>
                  <select 
                    value={selectedPlanoId} 
                    onChange={(e) => setSelectedPlanoId(e.target.value)} 
                    className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
                  >
                    <option value="">Selecione um plano...</option>
                    {planos.map(p => <option key={p.id} value={p.id}>{p.name} - R$ {p.price.toFixed(2)}</option>)}
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Nome Completo *</label>
                    <input 
                      required
                      type="text" 
                      value={newAluno.nome || ''}
                      onChange={(e) => setNewAluno({...newAluno, nome: e.target.value})}
                      className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
                      placeholder="Ex: João Silva"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">CPF</label>
                    <input 
                      type="text" 
                      value={newAluno.cpf || ''}
                      onChange={(e) => setNewAluno({...newAluno, cpf: e.target.value})}
                      className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">RG</label>
                    <input 
                      type="text" 
                      value={newAluno.rg || ''}
                      onChange={(e) => setNewAluno({...newAluno, rg: e.target.value})}
                      className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
                      placeholder="00.000.000-0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Data de Nascimento</label>
                    <input 
                      type="date" 
                      value={newAluno.data_nascimento || ''}
                      onChange={(e) => setNewAluno({...newAluno, data_nascimento: e.target.value})}
                      className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Gênero</label>
                    <select
                      value={newAluno.genero || ''}
                      onChange={(e) => setNewAluno({...newAluno, genero: e.target.value})}
                      className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
                    >
                      <option value="">Selecione...</option>
                      <option value="M">Masculino</option>
                      <option value="F">Feminino</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Estado Civil</label>
                    <select
                      value={newAluno.estado_civil || ''}
                      onChange={(e) => setNewAluno({...newAluno, estado_civil: e.target.value})}
                      className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
                    >
                      <option value="">Selecione...</option>
                      <option value="Solteiro(a)">Solteiro(a)</option>
                      <option value="Casado(a)">Casado(a)</option>
                      <option value="Divorciado(a)">Divorciado(a)</option>
                      <option value="Viúvo(a)">Viúvo(a)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">E-mail</label>
                    <input 
                      type="email" 
                      value={newAluno.email || ''}
                      onChange={(e) => setNewAluno({...newAluno, email: e.target.value})}
                      className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
                      placeholder="joao@exemplo.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Telefone Fixo</label>
                    <input 
                      type="text" 
                      value={newAluno.telefone || ''}
                      onChange={(e) => setNewAluno({...newAluno, telefone: e.target.value})}
                      className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
                      placeholder="(11) 3333-3333"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Celular</label>
                    <input 
                      type="text" 
                      value={newAluno.celular || ''}
                      onChange={(e) => setNewAluno({...newAluno, celular: e.target.value})}
                      className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">CEP</label>
                    <input 
                      type="text" 
                      value={newAluno.cep || ''}
                      onChange={(e) => setNewAluno({...newAluno, cep: e.target.value})}
                      className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
                      placeholder="00000-000"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Endereço</label>
                    <input 
                      type="text" 
                      value={newAluno.endereco || ''}
                      onChange={(e) => setNewAluno({...newAluno, endereco: e.target.value})}
                      className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
                      placeholder="Rua Exemplo"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Número</label>
                    <input 
                      type="text" 
                      value={newAluno.numero || ''}
                      onChange={(e) => setNewAluno({...newAluno, numero: e.target.value})}
                      className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
                      placeholder="123"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Complemento</label>
                    <input 
                      type="text" 
                      value={newAluno.complemento || ''}
                      onChange={(e) => setNewAluno({...newAluno, complemento: e.target.value})}
                      className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
                      placeholder="Apto 45"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Bairro</label>
                    <input 
                      type="text" 
                      value={newAluno.bairro || ''}
                      onChange={(e) => setNewAluno({...newAluno, bairro: e.target.value})}
                      className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
                      placeholder="Centro"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Cidade</label>
                    <input 
                      type="text" 
                      value={newAluno.cidade || ''}
                      onChange={(e) => setNewAluno({...newAluno, cidade: e.target.value})}
                      className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
                      placeholder="São Paulo"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Estado (UF)</label>
                    <input 
                      type="text" 
                      value={newAluno.estado || ''}
                      onChange={(e) => setNewAluno({...newAluno, estado: e.target.value})}
                      className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
                      placeholder="SP"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Profissão</label>
                    <input 
                      type="text" 
                      value={newAluno.profissao || ''}
                      onChange={(e) => setNewAluno({...newAluno, profissao: e.target.value})}
                      className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
                      placeholder="Engenheiro"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Contato de Emergência (Nome)</label>
                    <input 
                      type="text" 
                      value={newAluno.contato_emergencia_nome || ''}
                      onChange={(e) => setNewAluno({...newAluno, contato_emergencia_nome: e.target.value})}
                      className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
                      placeholder="Nome do Contato"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Telefone de Emergência</label>
                    <input 
                      type="text" 
                      value={newAluno.contato_emergencia_telefone || ''}
                      onChange={(e) => setNewAluno({...newAluno, contato_emergencia_telefone: e.target.value})}
                      className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Parentesco</label>
                    <input 
                      type="text" 
                      value={newAluno.contato_emergencia_parentesco || ''}
                      onChange={(e) => setNewAluno({...newAluno, contato_emergencia_parentesco: e.target.value})}
                      className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
                      placeholder="Ex: Mãe, Cônjuge"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Data de Matrícula</label>
                    <input 
                      type="date" 
                      value={newAluno.data_matricula || ''}
                      onChange={(e) => setNewAluno({...newAluno, data_matricula: e.target.value})}
                      className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Dia de Vencimento</label>
                    <input 
                      type="number" 
                      min="1"
                      max="31"
                      value={newAluno.dia_vencimento || ''}
                      onChange={(e) => setNewAluno({...newAluno, dia_vencimento: e.target.value ? parseInt(e.target.value) : undefined})}
                      className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
                      placeholder="Ex: 5"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Grupo</label>
                    <input 
                      type="text" 
                      value={newAluno.grupo || ''}
                      onChange={(e) => setNewAluno({...newAluno, grupo: e.target.value})}
                      className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
                      placeholder="Ex: Turma da Manhã"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Modalidade</label>
                    <input 
                      type="text" 
                      value={newAluno.modalidade || ''}
                      onChange={(e) => setNewAluno({...newAluno, modalidade: e.target.value})}
                      className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
                      placeholder="Ex: Musculação"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Peso Desejado (kg)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={newAluno.peso_desejado || ''}
                      onChange={(e) => setNewAluno({...newAluno, peso_desejado: e.target.value ? parseFloat(e.target.value) : undefined})}
                      className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
                      placeholder="75.5"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Status</label>
                    <select
                      value={newAluno.status || 'ativo'}
                      onChange={(e) => setNewAluno({...newAluno, status: e.target.value as 'ativo' | 'inativo'})}
                      className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Objetivos (separados por vírgula)</label>
                  <input 
                    type="text" 
                    value={newAluno.objetivos?.join(', ') || ''}
                    onChange={(e) => setNewAluno({...newAluno, objetivos: e.target.value.split(',').map(s => s.trim())})}
                    className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all"
                    placeholder="Emagrecimento, Hipertrofia..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Observações</label>
                  <textarea 
                    value={newAluno.observacoes || ''}
                    onChange={(e) => setNewAluno({...newAluno, observacoes: e.target.value})}
                    className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none transition-all min-h-[100px]"
                    placeholder="Observações gerais sobre o aluno..."
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-black font-bold rounded-2xl transition-all shadow-lg shadow-orange-500/20"
                  >
                    Salvar Aluno
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmação de Exclusão */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-md shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="text-rose-500" size={40} />
              </div>
              <h3 className="text-2xl font-bold mb-2 text-white">Excluir Aluno?</h3>
              <p className="text-zinc-400 mb-8">
                Tem certeza que deseja excluir <span className="text-white font-bold">{alunoToDelete?.nome}</span>? 
                Esta ação é irreversível e removerá todos os dados vinculados.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDeleteAluno}
                  className="flex-1 py-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-rose-500/20"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notificações (Toast) */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-8 right-8 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border ${
              notification.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                : 'bg-rose-500/10 border-rose-500/20 text-rose-500'
            }`}
          >
            {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="font-bold">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
