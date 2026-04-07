'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Download,
  Eye,
  FileStack,
  Loader2,
  ScanSearch,
  Search,
  Star,
  Trash2,
  Upload,
  UtensilsCrossed,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import ProfileAvatar from '@/components/account/ProfileAvatar';
import {
  ModuleEmptyState,
  ModuleHero,
  ModuleHeroAction,
  ModuleSectionHeading,
  ModuleShell,
  ModuleStatCard,
  ModuleSurface,
} from '@/components/dashboard/ModulePrimitives';
import { ConfirmDialog, Toast } from '@/components/ui';
import { formatDatePtBr } from '@/lib/date';
import {
  deriveFoodProtocolTitle,
  formatFoodProtocolSize,
  suggestStudentForFoodProtocolFileName,
} from '@/lib/food-protocols';
import { useNotification } from '@/hooks/useNotification';
import {
  activateFoodProtocol,
  deleteFoodProtocol,
  downloadFoodProtocol,
  fetchFoodProtocols,
  fetchFoodProtocolStudents,
  openFoodProtocol,
  uploadFoodProtocol,
} from '@/services/food-protocols.service';
import type { FoodProtocol, FoodProtocolStudent } from '@/types/food-protocol';

function getDownloadFeedbackLabel(kind: 'saved' | 'shared' | 'downloaded' | null) {
  if (kind === 'saved') {
    return 'Protocolo salvo no celular na pasta Lioness.';
  }

  if (kind === 'shared') {
    return 'Protocolo pronto para compartilhar no aparelho.';
  }

  if (kind === 'downloaded') {
    return 'Protocolo baixado com sucesso.';
  }

  return 'Protocolo processado com sucesso.';
}

export default function ProtocoloAlimentarModule() {
  const searchParams = useSearchParams();
  const preselectedStudentId = searchParams.get('studentId')?.trim() || '';
  const { notification, showNotification, clearNotification } = useNotification();

  const [students, setStudents] = useState<FoodProtocolStudent[]>([]);
  const [protocols, setProtocols] = useState<FoodProtocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState(preselectedStudentId);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [fileSuggestionMessage, setFileSuggestionMessage] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FoodProtocol | null>(null);

  const loadData = async (forcedStudentId?: string) => {
    try {
      setLoading(true);
      const [studentRows, protocolRows] = await Promise.all([
        fetchFoodProtocolStudents(),
        fetchFoodProtocols(),
      ]);

      setStudents(studentRows);
      setProtocols(protocolRows);

      if (forcedStudentId) {
        setStudentId(forcedStudentId);
      }
    } catch (error) {
      console.error('Erro ao carregar protocolos alimentares:', error);
      showNotification('Nao foi possivel carregar os protocolos alimentares.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData(preselectedStudentId || undefined);
  }, [preselectedStudentId]);

  const selectedStudent = useMemo(
    () => students.find((item) => item.id === studentId) ?? null,
    [studentId, students],
  );

  const filteredProtocols = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return protocols.filter((protocol) => {
      const matchesStudent = studentId ? protocol.student_id === studentId : true;

      if (!normalizedSearch) {
        return matchesStudent;
      }

      const haystacks = [
        protocol.title,
        protocol.students?.nome,
        protocol.students?.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesStudent && haystacks.includes(normalizedSearch);
    });
  }, [protocols, searchTerm, studentId]);

  const activeProtocols = protocols.filter((protocol) => protocol.is_active).length;
  const canUpload = Boolean(studentId && file && title.trim());
  const selectedStudentProtocolsCount = selectedStudent
    ? protocols.filter((protocol) => protocol.student_id === selectedStudent.id).length
    : protocols.length;

  const handlePickFile = (incomingFile: File | null) => {
    setFile(incomingFile);
    setFileSuggestionMessage(null);

    if (!incomingFile) {
      setTitle('');
      return;
    }

    setTitle(deriveFoodProtocolTitle(incomingFile.name));

    const suggested = suggestStudentForFoodProtocolFileName(incomingFile.name, students);
    if (!suggested) {
      return;
    }

    if (!studentId || studentId === preselectedStudentId) {
      setStudentId(suggested.student.id);
    }

    if (studentId && studentId !== suggested.student.id && studentId !== preselectedStudentId) {
      setFileSuggestionMessage(
        `O nome do arquivo parece ser de ${suggested.student.nome}, mas a selecao atual continua em outra aluna. Confirme antes de enviar.`,
      );
      return;
    }

    setFileSuggestionMessage(
      suggested.confidence === 'high'
        ? `Aluna reconhecida automaticamente: ${suggested.student.nome}.`
        : `Sugestao de aluna pelo nome do arquivo: ${suggested.student.nome}. Confirme antes de enviar.`,
    );
  };

  const clearSelectedFile = () => {
    setFile(null);
    setTitle('');
    setFileSuggestionMessage(null);
  };

  const handleUpload = async () => {
    if (!studentId) {
      showNotification('Selecione a aluna para vincular o protocolo.', 'error');
      return;
    }

    if (!file) {
      showNotification('Selecione um PDF para enviar.', 'error');
      return;
    }

    try {
      setUploading(true);
      await uploadFoodProtocol({
        student_id: studentId,
        title,
        file,
      });

      showNotification('Protocolo alimentar enviado com sucesso.', 'success');
      setFile(null);
      setTitle('');
      setFileSuggestionMessage(null);
      await loadData();
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Nao foi possivel enviar o protocolo alimentar.',
        'error',
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (protocolId: string) => {
    try {
      setDeletingId(protocolId);
      await deleteFoodProtocol(protocolId);
      setProtocols((current) => current.filter((item) => item.id !== protocolId));
      showNotification('Protocolo alimentar excluido com sucesso.', 'success');
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Nao foi possivel excluir o protocolo.',
        'error',
      );
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  const handleActivate = async (protocolId: string) => {
    try {
      setActivatingId(protocolId);
      await activateFoodProtocol(protocolId);
      setProtocols((current) =>
        current.map((item) => ({
          ...item,
          is_active: item.id === protocolId,
        })),
      );
      showNotification('Protocolo marcado como principal.', 'success');
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Nao foi possivel ativar o protocolo.',
        'error',
      );
    } finally {
      setActivatingId(null);
    }
  };

  const handleOpen = async (protocol: FoodProtocol) => {
    try {
      setOpeningId(protocol.id);
      await openFoodProtocol(protocol);
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Nao foi possivel abrir o protocolo.',
        'error',
      );
    } finally {
      setOpeningId(null);
    }
  };

  const handleDownload = async (protocol: FoodProtocol) => {
    try {
      setDownloadingId(protocol.id);
      const result = await downloadFoodProtocol(protocol);
      showNotification(getDownloadFeedbackLabel(result?.kind || null), 'success');
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Nao foi possivel baixar o protocolo.',
        'error',
      );
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <ModuleShell>
      <ModuleHero
        badge="Protocolo alimentar"
        title="PDFs alimentares por aluna, com envio seguro"
        description="Envie protocolos em PDF com storage privado, sugestao inteligente pelo nome do arquivo e acesso direto no painel da aluna."
        accent="emerald"
        chips={[
          { label: 'Alunas', value: String(students.length) },
          { label: 'Protocolos', value: String(protocols.length) },
          { label: 'Vigentes', value: String(activeProtocols) },
          { label: 'Filtro', value: selectedStudent?.nome || 'Todas' },
        ]}
        actions={
          <>
            <ModuleHeroAction
              label="Enviar protocolo"
              subtitle="Selecionar aluna, PDF e liberar acesso imediato."
              icon={Upload}
              accent="emerald"
              filled
              onClick={() => void handleUpload()}
              disabled={uploading || !canUpload}
            />
            <ModuleHeroAction
              label="Reconhecimento"
              subtitle="Sugere a aluna pelo nome do arquivo antes do envio."
              icon={ScanSearch}
              accent="emerald"
            />
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <ModuleStatCard
          label="Protocolos ativos"
          value={String(activeProtocols)}
          detail="Quantidade de protocolos principais atualmente visiveis como versao mais recente das alunas."
          icon={Star}
          accent="emerald"
        />
        <ModuleStatCard
          label="PDFs enviados"
          value={String(protocols.length)}
          detail="Historico completo de uploads disponiveis para consulta, download e substituicao segura."
          icon={FileStack}
          accent="emerald"
        />
        <ModuleStatCard
          label="Aluna selecionada"
          value={selectedStudent?.nome || 'Todas'}
          detail={`Historico visivel: ${selectedStudentProtocolsCount} protocolo(s) neste filtro.`}
          icon={UtensilsCrossed}
          accent="emerald"
        />
      </div>

      <ModuleSurface className="space-y-5">
        <ModuleSectionHeading
          eyebrow="Envio"
          title="Novo protocolo alimentar"
          description="O sistema sugere a aluna pelo nome do arquivo, mas voce sempre pode confirmar antes de enviar."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
              Aluna
            </label>
            <select
              value={studentId}
              onChange={(event) => setStudentId(event.target.value)}
              className="w-full rounded-2xl border border-zinc-800 bg-black/40 px-4 py-3 text-white outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
            >
              <option value="">Selecione a aluna</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
              Titulo do protocolo
            </label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex.: Protocolo de abril"
              className="w-full rounded-2xl border border-zinc-800 bg-black/40 px-4 py-3 text-white outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>
        </div>

        {selectedStudent ? (
          <div className="flex items-center gap-3 rounded-[24px] border border-emerald-500/15 bg-emerald-500/5 p-4">
            <ProfileAvatar
              displayName={selectedStudent.nome}
              avatarUrl={selectedStudent.avatar_url}
              className="h-12 w-12 rounded-full border border-zinc-700"
              textClassName="text-sm"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">{selectedStudent.nome}</p>
              <p className="mt-1 truncate text-xs uppercase tracking-[0.18em] text-emerald-200/80">
                {selectedStudentProtocolsCount} protocolo(s) neste historico
              </p>
            </div>
            {preselectedStudentId ? (
              <button
                type="button"
                onClick={() => setStudentId('')}
                className="ml-auto rounded-full border border-zinc-800 bg-zinc-900 px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-300 transition-all hover:border-zinc-700 hover:text-white"
              >
                Mostrar todas
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-3 rounded-[24px] border border-dashed border-zinc-800 bg-black/20 p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold text-white">Arquivo do protocolo</p>
              <p className="mt-1 text-sm text-zinc-500">
                Aceita somente PDF. Ao enviar um novo protocolo, ele passa a ser o principal da aluna.
              </p>
            </div>

            <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-white transition-all hover:border-zinc-700">
              <Upload size={16} />
              Selecionar PDF
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(event) => handlePickFile(event.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          {file ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
              <p className="font-bold text-white">{file.name}</p>
              <p className="mt-1 text-emerald-100/80">{formatFoodProtocolSize(file.size)}</p>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={clearSelectedFile}
                  className="rounded-full border border-emerald-500/20 bg-black/20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-100 transition-all hover:bg-black/35"
                >
                  Limpar arquivo
                </button>
              </div>
            </div>
          ) : null}

          {fileSuggestionMessage ? (
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
              {fileSuggestionMessage}
            </div>
          ) : null}
        </div>
      </ModuleSurface>

      <ModuleSurface className="space-y-5">
        <ModuleSectionHeading
          eyebrow="Historico"
          title="Protocolos enviados"
          description="Abra, baixe, troque a versao principal ou exclua quando necessario."
        />

        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="group relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors group-hover:text-emerald-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por titulo ou aluna..."
              className="w-full rounded-2xl border border-zinc-800 bg-black/40 py-3 pl-11 pr-4 text-white outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
            />
          </div>

          <select
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-white outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
          >
            <option value="">Todas as alunas</option>
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.nome}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-zinc-400">
            <Loader2 className="animate-spin text-emerald-400" size={28} />
          </div>
        ) : filteredProtocols.length === 0 ? (
          <ModuleEmptyState
            icon={FileStack}
            title="Nenhum protocolo encontrado"
            description="Envie o primeiro PDF para a aluna selecionada ou remova os filtros para ver o historico completo."
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredProtocols.map((protocol) => (
              <div
                key={protocol.id}
                className="rounded-[24px] border border-zinc-800 bg-black/25 p-4 shadow-[0_28px_90px_-58px_rgba(0,0,0,0.9)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <ProfileAvatar
                      displayName={protocol.students?.nome || 'Aluna'}
                      avatarUrl={protocol.students?.avatar_url}
                      className="h-12 w-12 rounded-full border border-zinc-700"
                      textClassName="text-sm"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-white">{protocol.title}</p>
                      <p className="mt-1 truncate text-sm text-zinc-500">
                        {protocol.students?.nome || 'Aluna sem nome'}
                      </p>
                      {protocol.file_name ? (
                        <p className="mt-1 truncate text-xs text-zinc-600">{protocol.file_name}</p>
                      ) : null}
                    </div>
                  </div>

                  {protocol.is_active ? (
                    <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                      Vigente
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                      Data de envio
                    </p>
                    <p className="mt-2 text-sm font-bold text-white">{formatDatePtBr(protocol.created_at)}</p>
                  </div>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                      Arquivo
                    </p>
                    <p className="mt-2 text-sm font-bold text-white">
                      {formatFoodProtocolSize(protocol.size_bytes)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => void handleOpen(protocol)}
                    disabled={openingId === protocol.id}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-white transition-all hover:border-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {openingId === protocol.id ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
                    Abrir
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleDownload(protocol)}
                    disabled={downloadingId === protocol.id}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-300 transition-all hover:bg-emerald-500 hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {downloadingId === protocol.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    Baixar
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleActivate(protocol.id)}
                    disabled={protocol.is_active || activatingId === protocol.id}
                    className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold transition-all ${
                      protocol.is_active
                        ? 'cursor-not-allowed border-zinc-800 bg-zinc-900 text-zinc-500'
                        : 'border-orange-500/20 bg-orange-500/10 text-orange-300 hover:bg-orange-500 hover:text-black'
                    } disabled:opacity-60`}
                  >
                    {activatingId === protocol.id ? <Loader2 size={16} className="animate-spin" /> : <Star size={16} />}
                    Principal
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(protocol)}
                    disabled={deletingId === protocol.id}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-300 transition-all hover:bg-rose-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingId === protocol.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ModuleSurface>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && void handleDelete(deleteTarget.id)}
        title="Excluir protocolo alimentar?"
        message={
          deleteTarget
            ? `Tem certeza que deseja excluir o protocolo "${deleteTarget.title}"? Esta acao remove o PDF para a equipe e para a aluna.`
            : 'Tem certeza que deseja excluir este protocolo?'
        }
        confirmText="Excluir protocolo"
        cancelText="Cancelar"
        variant="danger"
        loading={Boolean(deleteTarget && deletingId === deleteTarget.id)}
      />

      <Toast notification={notification} onClose={clearNotification} />
    </ModuleShell>
  );
}
