'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Plus,
  Loader2,
  Search,
  Calendar,
  User,
  Scale,
  Ruler,
  TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAvaliacoes } from '@/hooks/useAvaliacoes';
import { useUserRole } from '@/hooks/useUserRole';
import ProfileAvatar from '@/components/account/ProfileAvatar';
import ChartWrapper from '@/components/ChartWrapper';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import AssessmentPhotoGallery from '@/components/avaliacao/AssessmentPhotoGallery';
import AssessmentPhotoUploader from '@/components/avaliacao/AssessmentPhotoUploader';
import { Toast } from '@/components/ui';
import {
  ModuleEmptyState,
  ModuleHero,
  ModuleHeroAction,
  ModuleSectionHeading,
  ModuleShell,
  ModuleStatCard,
  ModuleSurface,
} from '@/components/dashboard/ModulePrimitives';

import { createPhotoDraftMap, revokePhotoDraftUrls } from '@/lib/assessmentPhotos';
import { calcularBiometria } from '@/lib/biometrics';
import { compareDateOnly, extractDateOnly, formatDateDayMonthPtBr, formatDatePtBr, isSameMonthDate } from '@/lib/date';
import { captureAssessmentPhotoFile } from '@/lib/native-app';
import { exportAvaliacaoPdf } from '@/lib/pdf/exportAvaliacaoPdf';
import { exportAvaliacaoEvolutionPdf } from '@/lib/pdf/exportAvaliacaoEvolutionPdf';
import { useNativeApp } from '@/hooks/useNativeApp';
import { syncAvaliacaoPhotos } from '@/services/avaliacoes.service';
import type { Avaliacao, AvaliacaoPhotoDraftMap, AvaliacaoPhotoPosition } from '@/types/avaliacao';

function parseOptionalDecimal(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function AvaliacaoModule() {
  const { isAdmin, isProfessor } = useUserRole();
  const nativeApp = useNativeApp();
  const canManageRecords = isAdmin || isProfessor;
  const {
    avaliacoes,
    alunos,
    loading,
    searchTerm,
    setSearchTerm,
    showAddModal,
    openAddModal,
    closeAddModal,
    editingAvaliacao,
    newAvaliacao,
    setNewAvaliacao,
    handleSave,
    startEdit,
    showViewModal: showReportModal,
    setShowViewModal: setShowReportModal,
    selectedAvaliacao: selectedReport,
    historico: historicoAluno,
    viewAvaliacao: handleViewReport,
    notification,
    showNotification,
    clearNotification,
  } = useAvaliacoes();

  // Filtros de data locais (UI only)
  const [filterDataInicio, setFilterDataInicio] = useState('');
  const [filterDataFim, setFilterDataFim] = useState('');

  // Busca de aluno no formulário
  const [alunoSearch, setAlunoSearch] = useState('');
  const [showAlunoDropdown, setShowAlunoDropdown] = useState(false);
  const [photoDrafts, setPhotoDrafts] = useState<AvaliacaoPhotoDraftMap>(() => createPhotoDraftMap());
  const [capturingPhotoPosition, setCapturingPhotoPosition] = useState<AvaliacaoPhotoPosition | null>(null);
  const alunoPickerRef = useRef<HTMLDivElement | null>(null);

  const comparisonBase = useMemo(() => {
    if (!selectedReport) {
      return null;
    }

    const currentIndex = historicoAluno.findIndex(
      (item: Avaliacao) => item.id === selectedReport.id
    );

    return currentIndex > 0 ? historicoAluno[currentIndex - 1] : null;
  }, [historicoAluno, selectedReport]);

  const handleAvaliacaoFieldChange = (campo: string, valor: unknown) => {
    setNewAvaliacao((prev) => {
      const atualizado = { ...prev, [campo]: valor };
      const calculado = calcularBiometria(atualizado as Record<string, unknown>);
      return { ...atualizado, ...calculado };
    });
  };

  const handleOpenNovaAvaliacao = () => {
    openAddModal();
    setAlunoSearch('');
    setShowAlunoDropdown(false);
    setPhotoDrafts((prev) => {
      revokePhotoDraftUrls(prev);
      return createPhotoDraftMap();
    });
  };

  const handleCloseAvaliacaoModal = () => {
    setPhotoDrafts((prev) => {
      revokePhotoDraftUrls(prev);
      return createPhotoDraftMap();
    });
    closeAddModal();
    setAlunoSearch('');
    setShowAlunoDropdown(false);
  };

  const handlePhotoPick = (position: AvaliacaoPhotoPosition, file: File | null) => {
    setPhotoDrafts((prev) => {
      const current = prev[position];
      if (current.preview_url?.startsWith('blob:')) {
        URL.revokeObjectURL(current.preview_url);
      }

      return {
        ...prev,
        [position]: {
          ...current,
          file,
          preview_url: file ? URL.createObjectURL(file) : current.existing?.signed_url ?? null,
          remove: false,
        },
      };
    });
  };

  const handlePhotoRemove = (position: AvaliacaoPhotoPosition) => {
    setPhotoDrafts((prev) => {
      const current = prev[position];
      if (current.preview_url?.startsWith('blob:')) {
        URL.revokeObjectURL(current.preview_url);
      }

      return {
        ...prev,
        [position]: {
          ...current,
          file: null,
          preview_url: null,
          remove: Boolean(current.existing),
        },
      };
    });
  };

  const handleCapturePhoto = async (position: AvaliacaoPhotoPosition) => {
    try {
      setCapturingPhotoPosition(position);
      const file = await captureAssessmentPhotoFile(position);
      handlePhotoPick(position, file);
      showNotification('Foto capturada com sucesso.', 'success');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Nao foi possivel abrir a camera para capturar a foto.';
      showNotification(message, 'error');
    } finally {
      setCapturingPhotoPosition(null);
    }
  };

  useEffect(() => {
    if (!showAddModal) return;
    if (editingAvaliacao) {
      setAlunoSearch(editingAvaliacao.students?.nome || '');
      setPhotoDrafts((prev) => {
        revokePhotoDraftUrls(prev);
        return createPhotoDraftMap(editingAvaliacao.photos);
      });
    } else {
      setAlunoSearch('');
      setPhotoDrafts((prev) => {
        revokePhotoDraftUrls(prev);
        return createPhotoDraftMap();
      });
    }
  }, [showAddModal, editingAvaliacao]);

  useEffect(() => {
    return () => {
      revokePhotoDraftUrls(photoDrafts);
    };
  }, [photoDrafts]);

  useEffect(() => {
    if (!showAddModal || !showAlunoDropdown) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (alunoPickerRef.current && !alunoPickerRef.current.contains(event.target as Node)) {
        setShowAlunoDropdown(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [showAddModal, showAlunoDropdown]);

  // Filtro local por data
  const filteredAvaliacoes = avaliacoes.filter((a: any) => {
    const avaliacaoDate = extractDateOnly(a.data);
    const matchInicio = filterDataInicio ? compareDateOnly(avaliacaoDate, filterDataInicio) >= 0 : true;
    const matchFim = filterDataFim ? compareDateOnly(avaliacaoDate, filterDataFim) <= 0 : true;
    return matchInicio && matchFim;
  });

  const filteredAlunosList = alunos.filter((a: any) =>
    (a.nome || '').toLowerCase().includes((alunoSearch || '').toLowerCase())
  );

  const totalAvaliacoes = filteredAvaliacoes.length;
  const alunosAvaliados = new Set(
    filteredAvaliacoes.map((avaliacao: any) => avaliacao.student_id).filter(Boolean)
  ).size;
  const avaliacoesNoMes = filteredAvaliacoes.filter((avaliacao: any) => {
    return isSameMonthDate(avaliacao.data);
  }).length;
  const canSaveAvaliacao =
    Boolean(newAvaliacao.student_id) &&
    Boolean(newAvaliacao.data) &&
    Number(newAvaliacao.peso) > 0 &&
    Number(newAvaliacao.altura) > 0;

  return (
    <ModuleShell>
      <ModuleHero
        badge="Leitura corporal"
        title="Avaliacoes fisicas e relatorios"
        description="Historico corporal, evolucao e exportacao em PDF."
        accent="rose"
        chips={[
          { label: 'Avaliacoes', value: String(totalAvaliacoes) },
          { label: 'Alunos avaliados', value: String(alunosAvaliados) },
          { label: 'No mes', value: String(avaliacoesNoMes) },
          { label: 'Alunos disponiveis', value: String(alunos.length) },
        ]}
        actions={
          canManageRecords ? (
            <>
              <ModuleHeroAction
                label="Nova avaliacao"
                subtitle="Registrar medidas corporais e atualizar historico."
                icon={Plus}
                accent="rose"
                filled
                onClick={handleOpenNovaAvaliacao}
              />
            </>
          ) : undefined
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <ModuleStatCard
          label="Historico corporal"
          value={String(totalAvaliacoes)}
          detail="Total de avaliacoes carregadas com os filtros atuais."
          icon={Activity}
          accent="rose"
        />
        <ModuleStatCard
          label="Alunos avaliados"
          value={String(alunosAvaliados)}
          detail="Quantidade de alunos que ja possuem registro fisico."
          icon={User}
          accent="rose"
        />
        <ModuleStatCard
          label="Atualizacao mensal"
          value={String(avaliacoesNoMes)}
          detail="Avaliacoes registradas no mes corrente."
          icon={TrendingUp}
          accent="rose"
        />
      </div>

      <ModuleSurface className="space-y-6">
      <ModuleSectionHeading
        eyebrow="Controle de registros"
        title="Historico de avaliacoes"
        description="Pesquise por aluna, protocolo ou data e abra o relatorio quando precisar."
        actionLabel={canManageRecords ? 'Nova avaliacao' : undefined}
        onActionClick={canManageRecords ? handleOpenNovaAvaliacao : undefined}
      />
        <div className="hidden">
          <h2 className="text-3xl font-bold tracking-tight">Avaliação Física</h2>
          <p className="text-zinc-500">Acompanhe a evolução corporal e os resultados dos seus alunos.</p>
        </div>
        {false && canManageRecords && (
          <button
            type="button"
            onClick={handleOpenNovaAvaliacao}
            className="flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white font-bold px-6 py-3 rounded-2xl transition-all active:scale-95 shadow-lg shadow-purple-500/20"
          >
            <Plus size={20} />
            Nova Avaliação
          </button>
        )}

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-hover:text-rose-400 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome, data ou protocolo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all"
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:w-[320px]">
          <input type="date" value={filterDataInicio} onChange={(e) => setFilterDataInicio(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all [color-scheme:dark]" />
          <input type="date" value={filterDataFim} onChange={(e) => setFilterDataFim(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all [color-scheme:dark]" />
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/70 shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-4 p-16">
            <Loader2 className="text-purple-500 animate-spin" size={40} />
            <p className="text-zinc-500 font-medium">Carregando avaliacoes...</p>
          </div>
        ) : filteredAvaliacoes.length > 0 ? (
          <div className="-mx-4 overflow-x-auto md:mx-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60">
                  <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500 md:px-6">Aluno</th>
                  <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500 md:px-6">Data</th>
                  <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500 md:px-6">Peso / Altura</th>
                  <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500 md:px-6">BF (%)</th>
                  <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500 text-right md:px-6">Acoes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredAvaliacoes.map((avaliacao: any) => (
                  <tr key={avaliacao.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-4 py-4 md:px-6">
                      <div className="flex items-center gap-3">
                        <ProfileAvatar
                          displayName={avaliacao.students?.nome}
                          avatarUrl={avaliacao.students?.avatar_url}
                          className="h-10 w-10 rounded-xl border border-purple-500/20 bg-purple-500/10"
                          textClassName="text-sm"
                        />
                        <div>
                          <p className="font-bold text-white group-hover:text-purple-400 transition-colors">{avaliacao.students?.nome}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 md:px-6">
                      <div className="flex items-center gap-2 text-sm text-zinc-300">
                        <Calendar size={14} className="text-zinc-500" />
                        {formatDatePtBr(avaliacao.data)}
                      </div>
                    </td>
                    <td className="px-4 py-4 md:px-6">
                      <div className="flex flex-col gap-1 text-sm text-zinc-300">
                        <div className="flex items-center gap-2">
                          <Scale size={14} className="text-zinc-500" />
                          {avaliacao.peso} kg
                        </div>
                        <div className="flex items-center gap-2">
                          <Ruler size={14} className="text-zinc-500" />
                          {avaliacao.altura} m
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 md:px-6">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20">
                        <Activity size={12} />
                        {avaliacao.percentual_gordura ? `${avaliacao.percentual_gordura}%` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right md:px-6">
                      <button
                        onClick={() => handleViewReport(avaliacao)}
                        className="px-4 py-2 bg-purple-500/10 text-purple-500 hover:bg-purple-500 hover:text-white rounded-xl text-xs font-bold transition-all mr-2"
                      >
                        Ver relatorio
                      </button>
                      {canManageRecords && (
                        <button
                          onClick={() => startEdit(avaliacao)}
                          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold transition-all mr-2"
                        >
                          Editar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <ModuleEmptyState
            icon={Activity}
            title="Nenhuma avaliacao encontrada"
            description="Ajuste os filtros ou registre a primeira avaliacao fisica para acompanhar a evolucao."
          />
        )}
      </div>

      <AnimatePresence>
        {showReportModal && selectedReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowReportModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-5xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-start gap-4">
                  <ProfileAvatar
                    displayName={selectedReport.students?.nome}
                    avatarUrl={selectedReport.students?.avatar_url}
                    className="h-14 w-14 shrink-0 rounded-2xl border border-zinc-800"
                    textClassName="text-lg"
                  />
                  <div>
                    <h3 className="text-3xl font-bold text-white">{selectedReport.students?.nome}</h3>
                  <p className="text-zinc-500">Relatório de Avaliação Física - {formatDatePtBr(selectedReport.data)}</p>
                </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => exportAvaliacaoPdf(selectedReport)}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2"
                  >
                    PDF avaliacao
                  </button>
                  <button
                    onClick={() => comparisonBase && exportAvaliacaoEvolutionPdf(comparisonBase, selectedReport)}
                    disabled={!comparisonBase}
                    className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
                      comparisonBase
                        ? 'bg-white/10 text-white hover:bg-white/15'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    }`}
                    title={
                      comparisonBase
                        ? 'Gerar relatorio comparativo entre esta avaliacao e a anterior.'
                        : 'Esta avaliacao ainda nao possui registro anterior para comparacao.'
                    }
                  >
                    PDF evolucao
                  </button>
                  <button onClick={() => setShowReportModal(false)} className="text-zinc-500 hover:text-white p-2">
                    <Plus className="rotate-45" size={24} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-black/40 border border-zinc-800 p-6 rounded-2xl text-center relative group">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Percentual de Gordura</p>
                  <p className="text-4xl font-black text-purple-500">{selectedReport.percentual_gordura || 0}%</p>
                  <p className="text-xs text-zinc-600 mt-2">Protocolo Faulkner</p>
                  {historicoAluno.length > 1 && historicoAluno.findIndex((a: any) => a.id === selectedReport.id) > 0 && (
                    (() => {
                      const currentIndex = historicoAluno.findIndex((a: any) => a.id === selectedReport.id);
                      const prevEval = historicoAluno[currentIndex - 1];
                      if (!prevEval || prevEval.percentual_gordura === undefined) return null;
                      const diff = selectedReport.percentual_gordura! - prevEval.percentual_gordura!;
                      return (
                        <div className={`absolute top-4 right-4 text-xs font-bold flex items-center gap-1 ${diff < 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {diff < 0 ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
                          {Math.abs(diff).toFixed(1)}%
                        </div>
                      );
                    })()
                  )}
                </div>
                <div className="bg-black/40 border border-zinc-800 p-6 rounded-2xl text-center relative">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Massa Magra</p>
                  <p className="text-4xl font-black text-emerald-500">{selectedReport.massa_magra || 0} kg</p>
                  {historicoAluno.length > 1 && historicoAluno.findIndex((a: any) => a.id === selectedReport.id) > 0 && (
                    (() => {
                      const currentIndex = historicoAluno.findIndex((a: any) => a.id === selectedReport.id);
                      const prevEval = historicoAluno[currentIndex - 1];
                      if (!prevEval || prevEval.massa_magra === undefined) return null;
                      const diff = selectedReport.massa_magra! - prevEval.massa_magra!;
                      return (
                        <div className={`absolute top-4 right-4 text-xs font-bold flex items-center gap-1 ${diff > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {diff > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                          {Math.abs(diff).toFixed(1)}kg
                        </div>
                      );
                    })()
                  )}
                </div>
                <div className="bg-black/40 border border-zinc-800 p-6 rounded-2xl text-center relative">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Massa Gorda</p>
                  <p className="text-4xl font-black text-red-500">{selectedReport.massa_gorda || 0} kg</p>
                  {historicoAluno.length > 1 && historicoAluno.findIndex((a: any) => a.id === selectedReport.id) > 0 && (
                    (() => {
                      const currentIndex = historicoAluno.findIndex((a: any) => a.id === selectedReport.id);
                      const prevEval = historicoAluno[currentIndex - 1];
                      if (!prevEval || prevEval.massa_gorda === undefined) return null;
                      const diff = selectedReport.massa_gorda! - prevEval.massa_gorda!;
                      return (
                        <div className={`absolute top-4 right-4 text-xs font-bold flex items-center gap-1 ${diff < 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {diff < 0 ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
                          {Math.abs(diff).toFixed(1)}kg
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>

              {/* Dashboard de Evolução */}
              {(selectedReport.photos?.length || comparisonBase?.photos?.length) ? (
                <div className="mb-10 grid gap-6 lg:grid-cols-2">
                  {comparisonBase ? (
                    <AssessmentPhotoGallery
                      title="Fotos base"
                      subtitle={`Registro anterior de ${formatDatePtBr(comparisonBase.data)}`}
                      photos={comparisonBase.photos}
                    />
                  ) : null}

                  <AssessmentPhotoGallery
                    title={comparisonBase ? 'Fotos de atualizacao' : 'Fotos da avaliacao'}
                    subtitle={
                      comparisonBase
                        ? `Registro atual de ${formatDatePtBr(selectedReport.data)}`
                        : 'Clique em uma foto para ampliar e conferir os angulos.'
                    }
                    photos={selectedReport.photos}
                  />
                </div>
              ) : null}

              <div className="mb-12 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="text-purple-500" />
                  <h4 className="text-xl font-bold">Dashboard de Evolução</h4>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-black/40 border border-zinc-800 p-6 rounded-3xl h-[300px] relative">
                    <p className="text-sm font-bold text-zinc-500 mb-6 uppercase tracking-widest">Evolução do Peso (kg)</p>
                    <ChartWrapper minHeight={200}>
                      <LineChart data={historicoAluno}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis
                          dataKey="data"
                          stroke="#71717a"
                          fontSize={10}
                          tickFormatter={(val) => formatDateDayMonthPtBr(val)}
                        />
                        <YAxis stroke="#71717a" fontSize={10} domain={['auto', 'auto']} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                          labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                          labelFormatter={(val) => formatDatePtBr(val)}
                        />
                        <Line type="monotone" dataKey="peso" stroke="#a855f7" strokeWidth={3} dot={{ fill: '#a855f7', r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ChartWrapper>
                  </div>

                  <div className="bg-black/40 border border-zinc-800 p-6 rounded-3xl h-[300px] relative">
                    <p className="text-sm font-bold text-zinc-500 mb-6 uppercase tracking-widest">Evolução do BF (%)</p>
                    <ChartWrapper minHeight={200}>
                      <LineChart data={historicoAluno}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis
                          dataKey="data"
                          stroke="#71717a"
                          fontSize={10}
                          tickFormatter={(val) => formatDateDayMonthPtBr(val)}
                        />
                        <YAxis stroke="#71717a" fontSize={10} domain={[0, 'auto']} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                          labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                          labelFormatter={(val) => formatDatePtBr(val)}
                        />
                        <Line type="monotone" dataKey="percentual_gordura" stroke="#ec4899" strokeWidth={3} dot={{ fill: '#ec4899', r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ChartWrapper>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h4 className="text-xl font-bold border-b border-zinc-800 pb-2">Perímetros</h4>
                  <div className="grid grid-cols-2 gap-y-3">
                    <div className="flex justify-between pr-4 border-r border-zinc-800"><span className="text-zinc-500">Ombro:</span> <span className="font-bold">{selectedReport.ombro || '-'} cm</span></div>
                    <div className="flex justify-between pl-4"><span className="text-zinc-500">Tórax:</span> <span className="font-bold">{selectedReport.torax || '-'} cm</span></div>
                    <div className="flex justify-between pr-4 border-r border-zinc-800"><span className="text-zinc-500">Cintura:</span> <span className="font-bold">{selectedReport.cintura || '-'} cm</span></div>
                    <div className="flex justify-between pl-4"><span className="text-zinc-500">Abdome:</span> <span className="font-bold">{selectedReport.abdome || '-'} cm</span></div>
                    <div className="flex justify-between pr-4 border-r border-zinc-800"><span className="text-zinc-500">Quadril:</span> <span className="font-bold">{selectedReport.quadril || '-'} cm</span></div>
                    <div className="flex justify-between pl-4"><span className="text-zinc-500">Braço D:</span> <span className="font-bold">{selectedReport.braco_direito || '-'} cm</span></div>
                    <div className="flex justify-between pr-4 border-r border-zinc-800"><span className="text-zinc-500">Braço E:</span> <span className="font-bold">{selectedReport.braco_esquerdo || '-'} cm</span></div>
                    <div className="flex justify-between pl-4"><span className="text-zinc-500">Coxa D:</span> <span className="font-bold">{selectedReport.coxa_direita || '-'} cm</span></div>
                  </div>
                </div>
                <div className="space-y-6">
                  <h4 className="text-xl font-bold border-b border-zinc-800 pb-2">Dobras Cutâneas</h4>
                  <div className="grid grid-cols-2 gap-y-3">
                    <div className="flex justify-between pr-4 border-r border-zinc-800"><span className="text-zinc-500">Tricipital:</span> <span className="font-bold">{selectedReport.tricipital || '-'} mm</span></div>
                    <div className="flex justify-between pl-4"><span className="text-zinc-500">Subescapular:</span> <span className="font-bold">{selectedReport.subescapular || '-'} mm</span></div>
                    <div className="flex justify-between pr-4 border-r border-zinc-800"><span className="text-zinc-500">Supra-ilíaca:</span> <span className="font-bold">{selectedReport.supra_iliaca || '-'} mm</span></div>
                    <div className="flex justify-between pl-4"><span className="text-zinc-500">Abdominal:</span> <span className="font-bold">{selectedReport.abdominal || '-'} mm</span></div>
                  </div>
                </div>
              </div>

              {selectedReport.observacoes && (
                <div className="mt-8 p-6 bg-black/20 border border-zinc-800 rounded-2xl">
                  <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-2">Observações</h4>
                  <p className="text-zinc-300 italic">{selectedReport.observacoes}</p>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {canManageRecords && showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleCloseAvaliacaoModal}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-bold mb-6">{editingAvaliacao ? 'Editar avaliacao' : 'Nova avaliacao'}</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleSave(async (savedAvaliacao) => {
                    await syncAvaliacaoPhotos({
                      avaliacaoId: savedAvaliacao.id,
                      studentId: savedAvaliacao.student_id,
                      drafts: photoDrafts,
                    });
                  });
                }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div ref={alunoPickerRef} className="space-y-1.5 relative">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Aluno *</label>
                    <input
                      required
                      type="text"
                      value={alunoSearch}
                      onChange={(e) => { setAlunoSearch(e.target.value); setShowAlunoDropdown(true); }}
                      onFocus={() => setShowAlunoDropdown(true)}
                      aria-expanded={showAlunoDropdown}
                      className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all"
                      placeholder="Digite ou selecione o aluno..."
                    />
                    {showAlunoDropdown && (
                      <div className="absolute z-20 w-full bg-zinc-900 border border-zinc-800 rounded-xl mt-1 max-h-48 overflow-y-auto shadow-2xl">
                        {filteredAlunosList.length > 0 ? (
                          filteredAlunosList.map((aluno: any) => (
                            <div
                              key={aluno.id}
                              onClick={() => {
                                handleAvaliacaoFieldChange('student_id', aluno.id);
                                setAlunoSearch(aluno.nome);
                                setShowAlunoDropdown(false);
                              }}
                              className="flex items-center gap-3 px-4 py-2 hover:bg-purple-500/20 cursor-pointer text-sm text-white"
                            >
                              <ProfileAvatar
                                displayName={aluno.nome}
                                avatarUrl={aluno.avatar_url}
                                className="h-9 w-9 shrink-0 rounded-xl border border-zinc-800"
                                textClassName="text-xs"
                              />
                              <div className="min-w-0">
                                <p className="truncate font-bold">{aluno.nome}</p>
                                <p className="truncate text-xs text-zinc-500">
                                  {aluno.birth_date || aluno.gender ? 'Aluna cadastrada' : 'Selecionar'}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-sm text-zinc-500">Nenhum aluno encontrado</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Data da Avaliação *</label>
                    <input required type="date" value={newAvaliacao.data || ''} onChange={(e) => handleAvaliacaoFieldChange('data', e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all [color-scheme:dark]" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Protocolo</label>
                    <select
                      value={newAvaliacao.protocolo}
                      onChange={(e) => handleAvaliacaoFieldChange('protocolo', e.target.value)}
                      className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all"
                    >
                      <option value="faulkner">Faulkner (4 Dobras)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Peso (kg) *</label>
                    <input required type="number" step="0.1" value={newAvaliacao.peso ?? ''} onChange={(e) => handleAvaliacaoFieldChange('peso', parseOptionalDecimal(e.target.value))} className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all" placeholder="75.5" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Altura (m ou cm) *</label>
                    <input required type="number" step="0.01" value={newAvaliacao.altura ?? ''} onChange={(e) => handleAvaliacaoFieldChange('altura', parseOptionalDecimal(e.target.value))} className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all" placeholder="1.75 m ou 175 cm" />
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-4">
                  <h4 className="text-lg font-bold mb-4 text-purple-500">Perímetros (cm)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { key: 'ombro', label: 'Ombro' }, { key: 'torax', label: 'Tórax' }, { key: 'cintura', label: 'Cintura' }, { key: 'abdome', label: 'Abdome' },
                      { key: 'quadril', label: 'Quadril' }, { key: 'braco_direito', label: 'Braço Dir.' }, { key: 'braco_esquerdo', label: 'Braço Esq.' }, { key: 'coxa_direita', label: 'Coxa Dir.' },
                      { key: 'coxa_esquerda', label: 'Coxa Esq.' }, { key: 'panturrilha_direita', label: 'Panturrilha Dir.' }, { key: 'panturrilha_esquerda', label: 'Panturrilha Esq.' },
                    ].map(({ key, label }) => (
                      <div key={key} className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{label}</label>
                        <input
                          type="number"
                          step="0.1"
                          value={(newAvaliacao as Record<string, number | undefined>)[key] ?? ''}
                          onChange={(e) => {
                            const v = e.target.value === '' ? undefined : parseFloat(e.target.value);
                            handleAvaliacaoFieldChange(key, v !== undefined && !Number.isNaN(v) ? v : undefined);
                          }}
                          className="w-full bg-black border border-zinc-800 rounded-xl py-2 px-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-4">
                  <h4 className="text-lg font-bold mb-4 text-purple-500">Dobras Cutâneas (mm)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { key: 'tricipital', label: 'Tricipital' }, { key: 'subescapular', label: 'Subescapular' }, { key: 'supra_iliaca', label: 'Supra-ilíaca' }, { key: 'abdominal', label: 'Abdominal' },
                    ].map(({ key, label }) => (
                      <div key={key} className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{label}</label>
                        <input
                          type="number"
                          step="0.1"
                          value={(newAvaliacao as Record<string, number | undefined>)[key] ?? ''}
                          onChange={(e) => {
                            const v = e.target.value === '' ? undefined : parseFloat(e.target.value);
                            handleAvaliacaoFieldChange(key, v !== undefined && !Number.isNaN(v) ? v : undefined);
                          }}
                          className="w-full bg-black border border-zinc-800 rounded-xl py-2 px-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-4">
                  <h4 className="text-lg font-bold mb-4 text-purple-500">Resultados</h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Soma Dobras</label>
                      <input type="number" readOnly value={newAvaliacao.soma_dobras ?? ''} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-400 cursor-not-allowed outline-none" placeholder="0.0" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">IMC</label>
                      <input type="number" readOnly value={newAvaliacao.imc ?? ''} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-400 cursor-not-allowed outline-none" placeholder="Calculado auto." />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">% Gordura (BF)</label>
                      <input type="number" readOnly value={newAvaliacao.percentual_gordura ?? ''} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-400 cursor-not-allowed outline-none" placeholder="Calculado auto." />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Massa Gorda (kg)</label>
                      <input type="number" readOnly value={newAvaliacao.massa_gorda ?? ''} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-400 cursor-not-allowed outline-none" placeholder="Calculado auto." />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Massa Magra (kg)</label>
                      <input type="number" readOnly value={newAvaliacao.massa_magra ?? ''} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-400 cursor-not-allowed outline-none" placeholder="Calculado auto." />
                    </div>
                  </div>
                </div>

                <AssessmentPhotoUploader
                  drafts={photoDrafts}
                  onPickFile={handlePhotoPick}
                  onCapturePhoto={nativeApp ? handleCapturePhoto : undefined}
                  capturingPosition={capturingPhotoPosition}
                  onRemove={handlePhotoRemove}
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Observações</label>
                  <textarea value={newAvaliacao.observacoes || ''} onChange={(e) => handleAvaliacaoFieldChange('observacoes', e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all min-h-[100px]" placeholder="Observações gerais..."></textarea>
                </div>

                {!canSaveAvaliacao ? (
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                    Preencha aluna, data, peso e altura para liberar o salvamento.
                  </div>
                ) : null}

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={handleCloseAvaliacaoModal} className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all">Cancelar</button>
                  <button
                    type="submit"
                    disabled={!canSaveAvaliacao}
                    className={`flex-1 rounded-2xl py-4 font-bold transition-all shadow-lg ${
                      canSaveAvaliacao
                        ? 'bg-purple-500 text-white shadow-purple-500/20 hover:bg-purple-600'
                        : 'cursor-not-allowed bg-zinc-800 text-zinc-500 shadow-transparent'
                    }`}
                  >
                    Salvar avaliacao
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Toast notification={notification} onClose={clearNotification} />
      </ModuleSurface>
    </ModuleShell>
  );
}
