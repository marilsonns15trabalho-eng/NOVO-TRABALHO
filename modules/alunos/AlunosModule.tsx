'use client';

import React, { useCallback, useState } from 'react';
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
  KeyRound,
  Loader2,
} from 'lucide-react';
import { useAlunos } from '@/hooks/useAlunos';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/contexts/AuthContext';
import { Modal, ConfirmDialog, Toast, LoadingSpinner } from '@/components/ui';
import AlunoForm from '@/modules/alunos/AlunoForm';
import type { Aluno, AlunoFormData } from '@/types/aluno';
import * as usersService from '@/services/users.service';
import type { UserProfileRow } from '@/services/users.service';
import { resetStudentPassword } from '@/services/admin.service';

export default function AlunosModule() {
  const { user, role, isSuperAdmin } = useAuth();
  const userRole = role;
  const isAdmin = userRole === 'admin';
  const isReadOnly = userRole === 'professor';

  const [showRolesModal, setShowRolesModal] = useState(false);
  const [userProfiles, setUserProfiles] = useState<UserProfileRow[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [roleNotification, setRoleNotification] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [resetPasswordTarget, setResetPasswordTarget] = useState<Aluno | null>(null);
  const [resettingPasswordForId, setResettingPasswordForId] = useState<string | null>(null);

  const loadProfiles = useCallback(async () => {
    if (!isAdmin) return;

    setLoadingRoles(true);

    const profiles = await usersService.fetchAllProfiles();
    setUserProfiles(profiles);

    setLoadingRoles(false);
  }, [isAdmin]);

  const handleRoleChange = async (targetUserId: string, newRole: UserRole) => {
    const targetProfile = userProfiles.find((profile) => profile.id === targetUserId);

    if (targetProfile?.is_super_admin) {
      setRoleNotification({ msg: 'Super admin nao pode ser alterado.', type: 'error' });
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

  const [formData, setFormData] = useState<Partial<AlunoFormData>>({
    nome: '',
    email: '',
    telefone: '',
    status: 'ativo',
  });

  const handleStartEdit = (aluno: Aluno) => {
    setFormData(aluno);
    startEdit(aluno);
  };

  const handleOpenAdd = () => {
    setFormData({ nome: '', email: '', telefone: '', status: 'ativo' });
    openAddModal();
  };

  const sendWhatsApp = (aluno: Aluno) => {
    const phone = aluno.celular || aluno.telefone;

    if (!phone) {
      showNotification('Aluno sem telefone cadastrado.', 'error');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Ola ${aluno.nome}, tudo bem? Gostaria de falar sobre sua matricula na academia.`);
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, '_blank');
  };

  const openResetPasswordDialog = (aluno: Aluno) => {
    if (!isAdmin) {
      showNotification('Apenas admin pode resetar senha.', 'error');
      return;
    }

    if (!aluno.linked_auth_user_id) {
      showNotification('Aluno sem vinculo de autenticacao.', 'error');
      return;
    }

    setResetPasswordTarget(aluno);
  };

  const closeResetPasswordDialog = () => {
    if (resettingPasswordForId) {
      return;
    }

    setResetPasswordTarget(null);
  };

  const handleResetPassword = async () => {
    const aluno = resetPasswordTarget;

    if (!aluno) {
      return;
    }

    try {
      if (!isAdmin) {
        throw new Error('Apenas admin pode resetar senha');
      }

      if (!aluno.linked_auth_user_id) {
        throw new Error('Aluno sem vinculo de autenticacao.');
      }

      if (resettingPasswordForId) {
        return;
      }

      setResettingPasswordForId(aluno.id);

      await resetStudentPassword(aluno.linked_auth_user_id);

      showNotification('Senha resetada para 123456. Troca obrigatoria ativada.', 'success');
      setResetPasswordTarget(null);
    } catch (error: any) {
      showNotification(error?.message || 'Erro ao resetar senha', 'error');
    } finally {
      setResettingPasswordForId(null);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome) {
      showNotification('O nome do aluno e obrigatorio.', 'error');
      return;
    }

    if (!editingAluno && !formData.email) {
      showNotification('O e-mail do aluno e obrigatorio para criar o acesso.', 'error');
      return;
    }

    await handleSave(formData);
  };

  if (!userRole) {
    return <LoadingSpinner message="Carregando acessos..." />;
  }

  if (loading) {
    return <LoadingSpinner message="Carregando alunos..." />;
  }

  return (
    <div className="p-8 space-y-8 bg-black min-h-screen text-white">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestao de Alunos</h2>
          <p className="text-zinc-500">Administre sua base de alunos e acompanhe o status de cada um.</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={openRolesModal}
              className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-3 font-bold text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white"
            >
              <Shield size={18} />
              Roles
            </button>
          )}
          {!isReadOnly && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-3 font-bold text-black shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-600 active:scale-95"
            >
              <UserPlus size={20} />
              Novo Aluno
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="group relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors group-hover:text-orange-500" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 py-3 pl-12 pr-4 text-white transition-all focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          />
        </div>
        <button className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-6 py-3 text-zinc-400 transition-all hover:border-zinc-700 hover:text-white">
          <Filter size={20} />
          Filtros
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-xl">
        {alunos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Aluno</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Contato</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Cadastro</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-widest text-zinc-500">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {alunos.map((aluno) => {
                  const isResettingThisAluno = resettingPasswordForId === aluno.id;

                  return (
                    <tr key={aluno.id} className="group transition-colors hover:bg-zinc-800/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-xs font-bold text-orange-500 transition-colors group-hover:bg-orange-500 group-hover:text-black">
                            {(aluno.nome || '').charAt(0)}
                          </div>
                          <div>
                            <p className="max-w-[150px] truncate text-sm font-bold text-white transition-colors group-hover:text-orange-500">{aluno.nome}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          {aluno.email && (
                            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                              <Mail size={12} className="text-zinc-600" />
                              <span className="max-w-[120px] truncate">{aluno.email}</span>
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
                          disabled={isReadOnly}
                          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all ${
                            aluno.status === 'ativo'
                              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black'
                              : 'border-rose-500/20 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-black'
                          } disabled:cursor-not-allowed disabled:opacity-50`}
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
                            className="p-2 text-zinc-500 transition-colors hover:text-emerald-500"
                            title="Enviar WhatsApp"
                          >
                            <MessageCircle size={18} />
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => openResetPasswordDialog(aluno)}
                              disabled={!aluno.linked_auth_user_id || !!resettingPasswordForId}
                              className="inline-flex items-center gap-2 p-2 text-zinc-500 transition-colors hover:text-amber-400 disabled:cursor-not-allowed disabled:opacity-40"
                              title={aluno.linked_auth_user_id ? 'Resetar senha' : 'Aluno sem vinculo de autenticacao'}
                            >
                              {isResettingThisAluno ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <KeyRound size={16} />
                              )}
                              <span className="hidden xl:inline">Resetar Senha</span>
                            </button>
                          )}

                          {!isReadOnly && (
                            <>
                              <button
                                onClick={() => handleStartEdit(aluno)}
                                className="p-2 text-zinc-500 transition-colors hover:text-orange-500"
                                title="Editar"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => setDeleteConfirmation(aluno.id)}
                                className="p-2 text-zinc-500 transition-colors hover:text-red-500"
                                title="Excluir"
                              >
                                Excluir
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="space-y-4 p-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800">
              <Users className="text-zinc-600" size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold">Nenhum aluno encontrado</h3>
              <p className="text-zinc-500">Comece cadastrando seu primeiro aluno para gerenciar seus treinos.</p>
            </div>
            {!isReadOnly && (
              <button
                onClick={handleOpenAdd}
                className="rounded-2xl bg-zinc-800 px-6 py-3 font-bold text-white transition-all hover:bg-zinc-700"
              >
                Cadastrar Agora
              </button>
            )}
          </div>
        )}
      </div>

      {!isReadOnly && (
        <Modal
          isOpen={showAddModal}
          onClose={closeAddModal}
          title={editingAluno ? 'Editar Aluno' : 'Novo Aluno'}
          maxWidth="max-w-4xl"
        >
          <AlunoForm
            data={editingAluno || formData}
            onChange={(d) => (editingAluno ? startEdit({ ...editingAluno, ...d } as Aluno) : setFormData(d))}
            planos={planos}
            selectedPlanoId={selectedPlanoId}
            onPlanoChange={setSelectedPlanoId}
            onSubmit={handleFormSubmit}
            onCancel={closeAddModal}
            isEditing={!!editingAluno}
            userRole={userRole}
          />
        </Modal>
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirmation}
        onClose={() => setDeleteConfirmation(null)}
        onConfirm={handleDelete}
        title="Excluir Aluno?"
        message="Tem certeza que deseja excluir este aluno? Esta acao e irreversivel e removera todos os dados vinculados."
        confirmText="Confirmar Exclusao"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={!!resetPasswordTarget}
        onClose={closeResetPasswordDialog}
        onConfirm={handleResetPassword}
        title="Resetar senha do aluno?"
        message={
          resetPasswordTarget
            ? `Tem certeza que deseja resetar a senha de ${resetPasswordTarget.nome} para 123456? O aluno sera obrigado a trocar a senha no proximo login.`
            : 'Tem certeza que deseja resetar a senha deste aluno?'
        }
        confirmText="Resetar senha"
        cancelText="Cancelar"
        variant="warning"
        loading={!!resettingPasswordForId}
      />

      <Toast notification={notification} onClose={clearNotification} />

      {isAdmin && (
        <Modal
          isOpen={showRolesModal}
          onClose={() => setShowRolesModal(false)}
          title="Gerenciar Tipos de Usuario"
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            {roleNotification && (
              <div
                className={`rounded-xl border p-3 text-sm font-bold ${
                  roleNotification.type === 'success'
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'
                    : 'border-rose-500/20 bg-rose-500/10 text-rose-500'
                }`}
              >
                {roleNotification.msg}
              </div>
            )}

            {loadingRoles ? (
              <div className="py-8 text-center text-zinc-500">Carregando...</div>
            ) : userProfiles.length === 0 ? (
              <div className="py-8 text-center text-zinc-500">Nenhum usuario encontrado.</div>
            ) : (
              <div className="divide-y divide-zinc-800">
                {userProfiles.map((up) => {
                  const isSelf = up.id === user?.id;
                  const isSuperAdminUser = !!up.is_super_admin;
                  const isOtherAdminManagedByRegularAdmin =
                    !isSuperAdmin && up.role === 'admin';
                  const isProtected = isSelf || isSuperAdminUser || isOtherAdminManagedByRegularAdmin;

                  return (
                    <div key={up.id} className={`flex items-center justify-between px-2 py-4 ${isProtected ? 'opacity-60' : ''}`}>
                      <div>
                        <p className="text-sm font-bold text-white">
                          {up.display_name || 'Sem nome'}
                          {isSelf && <span className="ml-2 text-xs text-zinc-500">(voce)</span>}
                          {isSuperAdminUser && <span className="ml-2 text-xs text-orange-500">Super Admin</span>}
                        </p>
                        <p className="text-xs text-zinc-500">{up.id.slice(0, 8)}...</p>
                      </div>
                      <select
                        value={up.role}
                        onChange={(e) => handleRoleChange(up.id, e.target.value as UserRole)}
                        disabled={isProtected}
                        className={`rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-bold outline-none transition-all ${
                          up.role === 'admin'
                            ? 'text-orange-500'
                            : up.role === 'professor'
                              ? 'text-blue-500'
                              : 'text-zinc-400'
                        } ${isProtected ? 'cursor-not-allowed' : 'focus:ring-2 focus:ring-orange-500/50'}`}
                      >
                        <option value="aluno">Aluno</option>
                        <option value="professor">Professor</option>
                        {(isSuperAdmin || up.role === 'admin') && (
                          <option value="admin">Admin</option>
                        )}
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
