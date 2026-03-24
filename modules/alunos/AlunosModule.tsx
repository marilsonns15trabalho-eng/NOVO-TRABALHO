'use client';

// AlunosModule REFATORADO — Apenas UI, toda lógica no hook useAlunos
import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Shield,
} from 'lucide-react';
import { useAlunos } from '@/hooks/useAlunos';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/contexts/AuthContext';
import { Modal, ConfirmDialog, Toast, LoadingSpinner } from '@/components/ui';
import AlunoForm from '@/modules/alunos/AlunoForm';
import type { Aluno, AlunoFormData } from '@/types/aluno';
import * as usersService from '@/services/users.service';
import type { UserProfileRow } from '@/services/users.service';
import { SUPER_ADMIN_EMAIL } from '@/lib/constants';
import { supabase } from '@/lib/supabase';

export default function AlunosModule() {
  const { user, profile } = useAuth();
  const userRole = profile?.role || 'aluno';
  const isAdmin = userRole === 'admin';

  // --- Estado de gerenciamento de roles (admin only) ---
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [userProfiles, setUserProfiles] = useState<UserProfileRow[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [roleNotification, setRoleNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [superAdminId, setSuperAdminId] = useState<string | null>(null);

  const loadProfiles = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingRoles(true);
    const profiles = await usersService.fetchAllProfiles();
    setUserProfiles(profiles);
    // Buscar o user_id do super admin via students
    const { data: saStudent } = await supabase
      .from('students')
      .select('user_id')
      .eq('email', SUPER_ADMIN_EMAIL)
      .single();
    if (saStudent) setSuperAdminId(saStudent.user_id);
    setLoadingRoles(false);
  }, [isAdmin]);

  const handleRoleChange = async (targetUserId: string, newRole: UserRole) => {
    // Proteção super admin no frontend
    if (targetUserId === superAdminId) {
      setRoleNotification({ msg: 'Super admin não pode ser alterado.', type: 'error' });
      setTimeout(() => setRoleNotification(null), 3000);
      return;
    }
    const result = await usersService.updateUserRole(targetUserId, newRole);
    if (result.error) {
      setRoleNotification({ msg: result.error, type: 'error' });
    } else {
      setRoleNotification({ msg: 'Role atualizado com sucesso!', type: 'success' });
      await loadProfiles();
    }
    setTimeout(() => setRoleNotification(null), 3000);
  };

  const openRolesModal = () => {
    setShowRolesModal(true);
    loadProfiles();
  };

  const {
    alunos,
    planos,
    loading,
    searchTerm,
    setSearchTerm,
    showAddModal,
    openAddModal,
    closeAddModal,
    editingAluno,
    startEdit,
    deleteConfirmation,
    setDeleteConfirmation,
    selectedPlanoId,
    setSelectedPlanoId,
    handleSave,
    handleDelete,
    handleToggleStatus,
    notification,
    clearNotification,
    showNotification,
  } = useAlunos(userRole);

  // Estado local do formulário (mantido aqui para o AlunoForm ser controlled)
  const [formData, setFormData] = useState<Partial<AlunoFormData>>({
    nome: '', email: '', telefone: '', status: 'ativo',
  });

  // Sincronizar form ao abrir para edição
  const handleStartEdit = (aluno: Aluno) => {
    setFormData(aluno);
    startEdit(aluno);
  };

  // Abrir modal para novo aluno
  const handleOpenAdd = () => {
    setFormData({ nome: '', email: '', telefone: '', status: 'ativo' });
    openAddModal();
  };

  // WhatsApp — lógica auxiliar de UI (não acessa banco)
  const sendWhatsApp = (aluno: Aluno) => {
    const phone = aluno.celular || aluno.telefone;
    if (!phone) {
      showNotification('Aluno sem telefone cadastrado.', 'error');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá ${aluno.nome}, tudo bem? Gostaria de falar sobre sua matrícula na academia.`);
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
  };

  // Submit do formulário
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome) {
      showNotification('O nome do aluno é obrigatório.', 'error');
      return;
    }
    await handleSave(formData);
  };

  // --- RENDERIZAÇÃO ---

  if (loading) {
    return <LoadingSpinner message="Carregando alunos..." />;
  }

  return (
    <div className="p-8 space-y-8 bg-black min-h-screen text-white">
      {/* Header do Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestão de Alunos</h2>
          <p className="text-zinc-500">Administre sua base de alunos e acompanhe o status de cada um.</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={openRolesModal}
              className="flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white font-bold px-5 py-3 rounded-2xl transition-all"
            >
              <Shield size={18} />
              Roles
            </button>
          )}
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-black font-bold px-6 py-3 rounded-2xl transition-all active:scale-95 shadow-lg shadow-orange-500/20"
          >
            <UserPlus size={20} />
            Novo Aluno
          </button>
        </div>
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
        {alunos.length > 0 ? (
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
                {alunos.map((aluno) => (
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
                        onClick={() => handleToggleStatus(aluno.id, aluno.status)}
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
                        <button onClick={() => sendWhatsApp(aluno)} className="p-2 text-zinc-500 hover:text-emerald-500 transition-colors" title="Enviar WhatsApp">
                          <MessageCircle size={18} />
                        </button>
                        <button onClick={() => handleStartEdit(aluno)} className="p-2 text-zinc-500 hover:text-orange-500 transition-colors" title="Editar">
                          Editar
                        </button>
                        <button onClick={() => setDeleteConfirmation(aluno.id)} className="p-2 text-zinc-500 hover:text-red-500 transition-colors" title="Excluir">
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
            <button onClick={handleOpenAdd} className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all">
              Cadastrar Agora
            </button>
          </div>
        )}
      </div>

      {/* Modal de Cadastro/Edição */}
      <Modal
        isOpen={showAddModal}
        onClose={closeAddModal}
        title={editingAluno ? 'Editar Aluno' : 'Novo Aluno'}
        maxWidth="max-w-4xl"
      >
        <AlunoForm
          data={editingAluno || formData}
          onChange={(d) => editingAluno ? startEdit({ ...editingAluno, ...d } as Aluno) : setFormData(d)}
          planos={planos}
          selectedPlanoId={selectedPlanoId}
          onPlanoChange={setSelectedPlanoId}
          onSubmit={handleFormSubmit}
          onCancel={closeAddModal}
          isEditing={!!editingAluno}
          userRole={userRole}
        />
      </Modal>

      {/* Dialog de Confirmação de Exclusão */}
      <ConfirmDialog
        isOpen={!!deleteConfirmation}
        onClose={() => setDeleteConfirmation(null)}
        onConfirm={handleDelete}
        title="Excluir Aluno?"
        message="Tem certeza que deseja excluir este aluno? Esta ação é irreversível e removerá todos os dados vinculados."
        confirmText="Confirmar Exclusão"
        variant="danger"
      />

      {/* Toast de Notificação */}
      <Toast notification={notification} onClose={clearNotification} />

      {/* Modal de Gerenciamento de Roles (admin only) */}
      {isAdmin && (
        <Modal
          isOpen={showRolesModal}
          onClose={() => setShowRolesModal(false)}
          title="Gerenciar Tipos de Usuário"
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            {roleNotification && (
              <div className={`text-sm font-bold p-3 rounded-xl ${
                roleNotification.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
              }`}>
                {roleNotification.msg}
              </div>
            )}

            {loadingRoles ? (
              <div className="py-8 text-center text-zinc-500">Carregando...</div>
            ) : userProfiles.length === 0 ? (
              <div className="py-8 text-center text-zinc-500">Nenhum usuário encontrado.</div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {userProfiles.map((up) => {
                  const isSelf = up.id === user?.id;
                  const isSuperAdminUser = up.id === superAdminId;
                  const isProtected = isSelf || isSuperAdminUser;
                  return (
                    <div key={up.id} className={`flex items-center justify-between py-4 px-2 ${isProtected ? 'opacity-60' : ''}`}>
                      <div>
                        <p className="text-white font-bold text-sm">
                          {up.display_name || 'Sem nome'}
                          {isSelf && <span className="text-zinc-500 text-xs ml-2">(você)</span>}
                          {isSuperAdminUser && <span className="text-orange-500 text-xs ml-2">★ Super Admin</span>}
                        </p>
                        <p className="text-zinc-500 text-xs">{up.id.slice(0, 8)}...</p>
                      </div>
                      <select
                        value={up.role}
                        onChange={(e) => handleRoleChange(up.id, e.target.value as UserRole)}
                        disabled={isProtected}
                        className={`bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2 text-sm font-bold outline-none transition-all ${
                          up.role === 'admin' ? 'text-orange-500' :
                          up.role === 'professor' ? 'text-blue-500' :
                          'text-zinc-400'
                        } ${isProtected ? 'cursor-not-allowed' : 'focus:ring-2 focus:ring-orange-500/50'}`}
                      >
                        <option value="aluno">Aluno</option>
                        <option value="professor">Professor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
