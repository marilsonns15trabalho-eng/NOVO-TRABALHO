'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Calendar,
  Loader2,
  Plus,
  Ruler,
  Scale,
  Search,
  Trash2,
  TrendingUp,
  User,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ProfileAvatar from '@/components/account/ProfileAvatar';
import AssessmentPhotoGallery from '@/components/avaliacao/AssessmentPhotoGallery';
import AssessmentPhotoUploader from '@/components/avaliacao/AssessmentPhotoUploader';
import ChartWrapper from '@/components/ChartWrapper';
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
import { createPhotoDraftMap, revokePhotoDraftUrls } from '@/lib/assessmentPhotos';
import {
  calcularBiometria,
  getAvaliacaoProtocolLabel,
  getBiometriaValidationMessage,
} from '@/lib/biometrics';
import {
  compareDateOnly,
  diffDateOnlyInDays,
  extractDateOnly,
  formatDateDayMonthPtBr,
  formatDatePtBr,
  isSameMonthDate,
} from '@/lib/date';
import type { FileDownloadResult } from '@/lib/external-links';
import { captureAssessmentPhotoFile, pickAssessmentPhotoFromGallery } from '@/lib/native-app';
import { exportAvaliacaoEvolutionPdf } from '@/lib/pdf/exportAvaliacaoEvolutionPdf';
import { exportAvaliacaoPdf } from '@/lib/pdf/exportAvaliacaoPdf';
import { useAvaliacoes } from '@/hooks/useAvaliacoes';
import { useNativeApp } from '@/hooks/useNativeApp';
import { useUserRole } from '@/hooks/useUserRole';
import { syncAvaliacaoPhotos } from '@/services/avaliacoes.service';
import type {
  Avaliacao,
  AvaliacaoPhotoDraftMap,
  AvaliacaoPhotoPosition,
} from '@/types/avaliacao';

function parseOptionalDecimal(value: string) {
  if (!value.trim()) {
    return undefined;
  }

  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getPdfFeedbackMessage(result: FileDownloadResult | null, label: string) {
  if (!result) {
    return `${label} gerado com sucesso.`;
  }

  if (result.kind === 'saved') {
    return `${label} salvo no celular na pasta Lioness.`;
  }

  if (result.kind === 'shared') {
    return `${label} pronto para compartilhar no aparelho.`;
  }

  return `${label} baixado com sucesso.`;
}

interface StudentHistoryGroup {
  studentId: string;
  studentName: string;
  avatarUrl?: string | null;
  latestAvaliacao: Avaliacao;
  avaliacoes: Avaliacao[];
}

const COMPARISON_METRICS: Array<{
  key:
    | 'peso'
    | 'altura'
    | 'imc'
    | 'percentual_gordura'
    | 'massa_gorda'
    | 'massa_magra'
    | 'cintura'
    | 'abdome'
    | 'quadril'
    | 'rcq';
  label: string;
  suffix: string;
  precision: number;
  mode: 'higher_better' | 'lower_better' | 'direction';
  threshold: number;
}> = [
  { key: 'peso', label: 'Peso', suffix: 'kg', precision: 1, mode: 'direction', threshold: 0.1 },
  { key: 'altura', label: 'Altura', suffix: 'm', precision: 2, mode: 'direction', threshold: 0.01 },
  { key: 'imc', label: 'IMC', suffix: '', precision: 2, mode: 'lower_better', threshold: 0.05 },
  { key: 'percentual_gordura', label: 'BF', suffix: '%', precision: 1, mode: 'lower_better', threshold: 0.1 },
  { key: 'massa_gorda', label: 'Massa gorda', suffix: 'kg', precision: 1, mode: 'lower_better', threshold: 0.1 },
  { key: 'massa_magra', label: 'Massa magra', suffix: 'kg', precision: 1, mode: 'higher_better', threshold: 0.1 },
  { key: 'cintura', label: 'Cintura', suffix: 'cm', precision: 1, mode: 'lower_better', threshold: 0.3 },
  { key: 'abdome', label: 'Abdome', suffix: 'cm', precision: 1, mode: 'lower_better', threshold: 0.3 },
  { key: 'quadril', label: 'Quadril', suffix: 'cm', precision: 1, mode: 'direction', threshold: 0.3 },
  { key: 'rcq', label: 'RCQ', suffix: '', precision: 2, mode: 'lower_better', threshold: 0.01 },
];

const TOP_CHANGE_METRIC_KEYS = ['peso', 'cintura', 'quadril', 'abdome'] as const;

const TOP_CHANGE_VALUE_CLASSNAMES: Record<(typeof TOP_CHANGE_METRIC_KEYS)[number], string> = {
  peso: 'text-fuchsia-300',
  cintura: 'text-emerald-300',
  quadril: 'text-sky-300',
  abdome: 'text-amber-300',
};

type ComparisonTone = 'improved' | 'worsened' | 'stable' | 'up' | 'down';

const COMPARISON_TONE_STYLES: Record<
  ComparisonTone,
  {
    badgeClassName: string;
    panelClassName: string;
    label: string;
  }
> = {
  improved: {
    badgeClassName: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    panelClassName: 'border-emerald-500/20 bg-emerald-500/[0.07]',
    label: 'Melhorou',
  },
  worsened: {
    badgeClassName: 'border-rose-500/30 bg-rose-500/10 text-rose-200',
    panelClassName: 'border-rose-500/20 bg-rose-500/[0.07]',
    label: 'Piorou',
  },
  stable: {
    badgeClassName: 'border-sky-500/30 bg-sky-500/10 text-sky-200',
    panelClassName: 'border-sky-500/20 bg-sky-500/[0.06]',
    label: 'Estavel',
  },
  up: {
    badgeClassName: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
    panelClassName: 'border-amber-500/20 bg-amber-500/[0.06]',
    label: 'Subiu',
  },
  down: {
    badgeClassName: 'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200',
    panelClassName: 'border-fuchsia-500/20 bg-fuchsia-500/[0.06]',
    label: 'Desceu',
  },
};

function formatMetricValue(
  value: number | null | undefined,
  suffix = '',
  maximumFractionDigits = 1,
) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '-';
  }

  const rounded = Number(value.toFixed(maximumFractionDigits));
  const formatted = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(rounded);

  return suffix ? `${formatted} ${suffix}` : formatted;
}

function getMetricDelta(
  currentValue: number | null | undefined,
  baseValue: number | null | undefined,
  precision = 1,
) {
  if (
    typeof currentValue !== 'number' ||
    !Number.isFinite(currentValue) ||
    typeof baseValue !== 'number' ||
    !Number.isFinite(baseValue)
  ) {
    return null;
  }

  return Number((currentValue - baseValue).toFixed(precision));
}

function getComparisonTone(
  delta: number,
  metric: (typeof COMPARISON_METRICS)[number],
): ComparisonTone {
  if (Math.abs(delta) < metric.threshold) {
    return 'stable';
  }

  if (metric.mode === 'higher_better') {
    return delta > 0 ? 'improved' : 'worsened';
  }

  if (metric.mode === 'lower_better') {
    return delta < 0 ? 'improved' : 'worsened';
  }

  return delta > 0 ? 'up' : 'down';
}

function getDefaultComparisonId(historico: Avaliacao[], currentId?: string | null) {
  if (!currentId) {
    return '';
  }

  const currentIndex = historico.findIndex((item) => item.id === currentId);
  return currentIndex > 0 ? historico[currentIndex - 1]?.id ?? '' : '';
}

function buildDefaultPdfSelectionIds(
  historico: Avaliacao[],
  selectedReport: Avaliacao | null,
  comparisonEntries: Avaliacao[],
) {
  const seededIds =
    comparisonEntries.length >= 2
      ? comparisonEntries.map((item) => item.id)
      : selectedReport
        ? [selectedReport.id, getDefaultComparisonId(historico, selectedReport.id)]
        : [];

  return Array.from(new Set(seededIds.filter(Boolean)));
}

function buildStudentHistoryGroups(avaliacoes: Avaliacao[]): StudentHistoryGroup[] {
  const groups = new Map<string, StudentHistoryGroup>();

  avaliacoes.forEach((avaliacao) => {
    if (!avaliacao.student_id) {
      return;
    }

    const current = groups.get(avaliacao.student_id);
    if (!current) {
      groups.set(avaliacao.student_id, {
        studentId: avaliacao.student_id,
        studentName: avaliacao.students?.nome || 'Aluno sem nome',
        avatarUrl: avaliacao.students?.avatar_url ?? null,
        latestAvaliacao: avaliacao,
        avaliacoes: [avaliacao],
      });
      return;
    }

    current.avaliacoes.push(avaliacao);
    if (compareDateOnly(avaliacao.data, current.latestAvaliacao.data) > 0) {
      current.latestAvaliacao = avaliacao;
    }
  });

  return Array.from(groups.values())
    .map((group) => {
      const sortedAvaliacoes = [...group.avaliacoes].sort((a, b) =>
        compareDateOnly(b.data, a.data),
      );

      return {
        ...group,
        latestAvaliacao: sortedAvaliacoes[0] ?? group.latestAvaliacao,
        avaliacoes: sortedAvaliacoes,
      };
    })
    .sort((a, b) => compareDateOnly(b.latestAvaliacao.data, a.latestAvaliacao.data));
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
    setSelectedAvaliacao,
    historico: historicoAluno,
    viewAvaliacao: handleViewReport,
    deleteConfirmation,
    setDeleteConfirmation,
    handleDelete,
    deletingId,
    notification,
    showNotification,
    clearNotification,
  } = useAvaliacoes();

  const [filterDataInicio, setFilterDataInicio] = useState('');
  const [filterDataFim, setFilterDataFim] = useState('');
  const [alunoSearch, setAlunoSearch] = useState('');
  const [showAlunoDropdown, setShowAlunoDropdown] = useState(false);
  const [photoDrafts, setPhotoDrafts] = useState<AvaliacaoPhotoDraftMap>(() =>
    createPhotoDraftMap(),
  );
  const [capturingPhotoPosition, setCapturingPhotoPosition] =
    useState<AvaliacaoPhotoPosition | null>(null);
  const [pickingGalleryPhotoPosition, setPickingGalleryPhotoPosition] =
    useState<AvaliacaoPhotoPosition | null>(null);
  const [primaryComparisonId, setPrimaryComparisonId] = useState('');
  const [extraComparisonIds, setExtraComparisonIds] = useState<string[]>([]);
  const [showPdfSelectionModal, setShowPdfSelectionModal] = useState(false);
  const [pdfSelectionIds, setPdfSelectionIds] = useState<string[]>([]);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [comparisonWorkspaceTab, setComparisonWorkspaceTab] = useState<'top_changes' | 'matrix'>(
    'top_changes',
  );
  const alunoPickerRef = useRef<HTMLDivElement | null>(null);

  const historicoOrdenadoDesc = useMemo(
    () => [...historicoAluno].sort((a, b) => compareDateOnly(b.data, a.data)),
    [historicoAluno],
  );

  const primaryComparisonBase = useMemo(() => {
    if (!primaryComparisonId) {
      return null;
    }

    return historicoAluno.find((item) => item.id === primaryComparisonId) ?? null;
  }, [historicoAluno, primaryComparisonId]);

  const extraComparisonBases = useMemo(
    () =>
      extraComparisonIds
        .map((comparisonId) => historicoAluno.find((item) => item.id === comparisonId) ?? null)
        .filter(Boolean) as Avaliacao[],
    [extraComparisonIds, historicoAluno],
  );

  const comparisonEntries = useMemo(
    () =>
      [selectedReport, primaryComparisonBase, ...extraComparisonBases].filter(Boolean) as Avaliacao[],
    [extraComparisonBases, primaryComparisonBase, selectedReport],
  );

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

  const handlePickPhotoFromGallery = async (position: AvaliacaoPhotoPosition) => {
    try {
      setPickingGalleryPhotoPosition(position);
      const file = await pickAssessmentPhotoFromGallery(position);
      handlePhotoPick(position, file);
      showNotification('Foto selecionada da galeria com sucesso.', 'success');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Nao foi possivel abrir a galeria para selecionar a foto.';
      showNotification(message, 'error');
    } finally {
      setPickingGalleryPhotoPosition(null);
    }
  };

  useEffect(() => {
    if (!showAddModal) {
      return;
    }

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
  }, [editingAvaliacao, showAddModal]);

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

  useEffect(() => {
    if (!showReportModal || !selectedReport) {
      setPrimaryComparisonId('');
      setExtraComparisonIds([]);
      setShowPdfSelectionModal(false);
      setPdfSelectionIds([]);
      setComparisonWorkspaceTab('top_changes');
      return;
    }

    setPrimaryComparisonId((currentValue) => {
      if (
        currentValue &&
        currentValue !== selectedReport.id &&
        historicoAluno.some((item) => item.id === currentValue && item.id !== selectedReport.id)
      ) {
        return currentValue;
      }

      return getDefaultComparisonId(historicoAluno, selectedReport.id);
    });
  }, [historicoAluno, selectedReport, showReportModal]);

  useEffect(() => {
    if (!showReportModal || !selectedReport) {
      setExtraComparisonIds([]);
      return;
    }

    setExtraComparisonIds((currentValue) =>
      currentValue.filter(
        (comparisonId) =>
          comparisonId !== selectedReport.id &&
          comparisonId !== primaryComparisonId &&
          historicoAluno.some((item) => item.id === comparisonId),
      ),
    );
  }, [historicoAluno, primaryComparisonId, selectedReport, showReportModal]);

  const handleOpenStudentWorkspace = (
    group: StudentHistoryGroup,
    focusAvaliacao?: Avaliacao,
  ) => {
    void handleViewReport(focusAvaliacao ?? group.latestAvaliacao);
  };

  const handleSelectHistoryAvaliacao = (avaliacaoId: string) => {
    const nextAvaliacao = historicoAluno.find((item) => item.id === avaliacaoId);
    if (!nextAvaliacao) {
      return;
    }

    setSelectedAvaliacao(nextAvaliacao);
    setPrimaryComparisonId((currentValue) => {
      if (
        currentValue &&
        currentValue !== nextAvaliacao.id &&
        historicoAluno.some((item) => item.id === currentValue && item.id !== nextAvaliacao.id)
      ) {
        return currentValue;
      }

      return getDefaultComparisonId(historicoAluno, nextAvaliacao.id);
    });
  };

  const handlePrimaryComparisonChange = (avaliacaoId: string) => {
    if (!avaliacaoId) {
      setPrimaryComparisonId('');
      setExtraComparisonIds([]);
      return;
    }

    setPrimaryComparisonId(avaliacaoId);
    setExtraComparisonIds((currentValue) =>
      currentValue.filter((comparisonId) => comparisonId !== avaliacaoId),
    );
  };

  const toggleExtraComparison = (avaliacaoId: string) => {
    if (!selectedReport || avaliacaoId === selectedReport.id || avaliacaoId === primaryComparisonId) {
      return;
    }

    setExtraComparisonIds((currentValue) =>
      currentValue.includes(avaliacaoId)
        ? currentValue.filter((comparisonId) => comparisonId !== avaliacaoId)
        : [...currentValue, avaliacaoId],
    );
  };

  const handleStartEditFromWorkspace = (avaliacao: Avaliacao) => {
    setShowReportModal(false);
    void startEdit(avaliacao);
  };

  const handleOpenPdfSelectionModal = () => {
    if (historicoOrdenadoDesc.length < 2) {
      showNotification('Selecione uma aluna com pelo menos duas avaliacoes.', 'error');
      return;
    }

    setPdfSelectionIds(
      buildDefaultPdfSelectionIds(historicoOrdenadoDesc, selectedReport, comparisonEntries),
    );
    setShowPdfSelectionModal(true);
  };

  const handleTogglePdfSelection = (avaliacaoId: string) => {
    setPdfSelectionIds((currentValue) =>
      currentValue.includes(avaliacaoId)
        ? currentValue.filter((id) => id !== avaliacaoId)
        : [...currentValue, avaliacaoId],
    );
  };

  const filteredAvaliacoes = avaliacoes.filter((avaliacao) => {
    const avaliacaoDate = extractDateOnly(avaliacao.data);
    const matchInicio = filterDataInicio
      ? compareDateOnly(avaliacaoDate, filterDataInicio) >= 0
      : true;
    const matchFim = filterDataFim ? compareDateOnly(avaliacaoDate, filterDataFim) <= 0 : true;
    return matchInicio && matchFim;
  });

  const studentHistoryGroups = useMemo(
    () => buildStudentHistoryGroups(filteredAvaliacoes),
    [filteredAvaliacoes],
  );

  const filteredAlunosList = alunos.filter((aluno) =>
    (aluno.nome || '').toLowerCase().includes((alunoSearch || '').toLowerCase()),
  );
  const selectedAluno = alunos.find((aluno) => aluno.id === newAvaliacao.student_id);
  const protocoloSelecionadoLabel = getAvaliacaoProtocolLabel(newAvaliacao.protocolo);
  const biometriaHint = getBiometriaValidationMessage({
    ...(newAvaliacao as Record<string, unknown>),
    student_gender:
      newAvaliacao.student_gender ?? selectedAluno?.gender ?? selectedAluno?.sexo ?? null,
    student_birth_date:
      newAvaliacao.student_birth_date ??
      selectedAluno?.birth_date ??
      selectedAluno?.data_nascimento ??
      null,
  });
  const shouldShowBiometriaHint =
    newAvaliacao.protocolo === 'navy' &&
    Boolean(
      newAvaliacao.student_id ||
        newAvaliacao.cintura ||
        newAvaliacao.pescoco ||
        newAvaliacao.quadril,
    );

  const totalAvaliacoes = filteredAvaliacoes.length;
  const alunosAvaliados = studentHistoryGroups.length;
  const avaliacoesNoMes = filteredAvaliacoes.filter((avaliacao) =>
    isSameMonthDate(avaliacao.data),
  ).length;
  const canSaveAvaliacao =
    Boolean(newAvaliacao.student_id) &&
    Boolean(newAvaliacao.data) &&
    Number(newAvaliacao.peso) > 0 &&
    Number(newAvaliacao.altura) > 0;
  const selectedReportPosition = selectedReport
    ? historicoOrdenadoDesc.findIndex((item) => item.id === selectedReport.id)
    : -1;
  const availableComparisonOptions = historicoOrdenadoDesc.filter(
    (avaliacao) => avaliacao.id !== selectedReport?.id,
  );
  const comparisonIntervalDays =
    selectedReport && primaryComparisonBase
      ? Math.abs(diffDateOnlyInDays(primaryComparisonBase.data, selectedReport.data) ?? 0)
      : null;
  const selectedPdfAvaliacoes = useMemo(
    () =>
      historicoOrdenadoDesc.filter((avaliacao) => pdfSelectionIds.includes(avaliacao.id)).sort((a, b) =>
        compareDateOnly(a.data, b.data),
      ),
    [historicoOrdenadoDesc, pdfSelectionIds],
  );
  const canChoosePdfComparativo = historicoOrdenadoDesc.length >= 2;
  const topChangeCards = useMemo(
    () =>
      TOP_CHANGE_METRIC_KEYS.map((key) => {
        const metric = COMPARISON_METRICS.find((item) => item.key === key);
        const currentValue = selectedReport?.[key] as number | null | undefined;
        const baseValue = primaryComparisonBase?.[key] as number | null | undefined;
        const delta = metric ? getMetricDelta(currentValue, baseValue, metric.precision) : null;
        const tone = metric && delta !== null ? getComparisonTone(delta, metric) : null;
        const toneStyles = tone ? COMPARISON_TONE_STYLES[tone] : null;

        return {
          key,
          label: metric?.label || key,
          suffix: metric?.suffix || '',
          precision: metric?.precision ?? 1,
          currentValue,
          baseValue,
          delta,
          tone,
          toneStyles,
          valueClassName: TOP_CHANGE_VALUE_CLASSNAMES[key],
        };
      }),
    [primaryComparisonBase, selectedReport],
  );

  const handleExportCurrentPdf = async (avaliacao: Avaliacao) => {
    try {
      const result = await exportAvaliacaoPdf(avaliacao);
      showNotification(getPdfFeedbackMessage(result, 'PDF da avaliacao'), 'success');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Nao foi possivel gerar o PDF da avaliacao.';
      showNotification(message, 'error');
    }
  };

  const handleExportEvolutionPdf = async (avaliacoesSelecionadas: Avaliacao[]) => {
    try {
      const orderedSelection = [...avaliacoesSelecionadas].sort((a, b) =>
        compareDateOnly(a.data, b.data),
      );

      if (orderedSelection.length < 2) {
        throw new Error('Selecione pelo menos duas avaliacoes para gerar o comparativo.');
      }

      const result = await exportAvaliacaoEvolutionPdf(orderedSelection);
      showNotification(getPdfFeedbackMessage(result, 'PDF comparativo'), 'success');
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Nao foi possivel gerar o PDF comparativo.';
      showNotification(message, 'error');
      return false;
    }
  };

  const handleConfirmPdfSelection = async () => {
    if (selectedPdfAvaliacoes.length < 2) {
      showNotification('Selecione pelo menos duas avaliacoes para gerar o comparativo.', 'error');
      return;
    }

    try {
      setPdfExporting(true);
      const exported = await handleExportEvolutionPdf(selectedPdfAvaliacoes);
      if (exported) {
        setShowPdfSelectionModal(false);
      }
    } finally {
      setPdfExporting(false);
    }
  };

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
            <ModuleHeroAction
              label="Nova avaliacao"
              subtitle="Registrar medidas corporais e atualizar historico."
              icon={Plus}
              accent="rose"
              filled
              onClick={handleOpenNovaAvaliacao}
            />
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
          description="Pesquise por aluna, protocolo ou data e abra o workspace de historico quando precisar."
          actionLabel={canManageRecords ? 'Nova avaliacao' : undefined}
          onActionClick={canManageRecords ? handleOpenNovaAvaliacao : undefined}
        />

        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1 group">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors group-hover:text-rose-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Buscar por nome, data ou protocolo..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:w-[320px]">
            <input
              type="date"
              value={filterDataInicio}
              onChange={(event) => setFilterDataInicio(event.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all [color-scheme:dark]"
            />
            <input
              type="date"
              value={filterDataFim}
              onChange={(event) => setFilterDataFim(event.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500 transition-all [color-scheme:dark]"
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/70 shadow-xl">
          {loading ? (
            <div className="flex flex-col items-center justify-center space-y-4 p-16">
              <Loader2 className="text-purple-500 animate-spin" size={40} />
              <p className="text-zinc-500 font-medium">Carregando avaliacoes...</p>
            </div>
          ) : studentHistoryGroups.length > 0 ? (
            <div className="-mx-4 overflow-x-auto md:mx-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/60">
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500 md:px-6">
                      Aluna
                    </th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500 md:px-6">
                      Ultimo registro
                    </th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500 md:px-6">
                      Resumo atual
                    </th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500 md:px-6">
                      Datas disponiveis
                    </th>
                    <th className="px-4 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500 text-right md:px-6">
                      Acoes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {studentHistoryGroups.map((group) => {
                    const latestAvaliacao = group.latestAvaliacao;
                    const recentDates = group.avaliacoes.slice(0, 3);
                    const remainingDates = Math.max(
                      group.avaliacoes.length - recentDates.length,
                      0,
                    );

                    return (
                      <tr
                        key={group.studentId}
                        className="hover:bg-zinc-800/30 transition-colors group"
                      >
                        <td className="px-4 py-4 md:px-6">
                          <div className="flex items-center gap-3">
                            <ProfileAvatar
                              displayName={group.studentName}
                              avatarUrl={group.avatarUrl}
                              className="h-10 w-10 rounded-xl border border-purple-500/20 bg-purple-500/10"
                              textClassName="text-sm"
                            />
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => handleOpenStudentWorkspace(group)}
                                className="truncate text-left font-bold text-white transition-colors group-hover:text-purple-400 hover:text-purple-300"
                              >
                                {group.studentName}
                              </button>
                              <p className="text-xs text-zinc-500">
                                {group.avaliacoes.length} avaliacoes encontradas com os filtros
                                atuais
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 md:px-6">
                          <div className="space-y-1 text-sm text-zinc-300">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-zinc-500" />
                              {formatDatePtBr(latestAvaliacao.data)}
                            </div>
                            <p className="text-xs text-zinc-500">
                              {getAvaliacaoProtocolLabel(latestAvaliacao.protocolo)}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-4 md:px-6">
                          <div className="flex flex-col gap-1 text-sm text-zinc-300">
                            <div className="flex items-center gap-2">
                              <Scale size={14} className="text-zinc-500" />
                              {formatMetricValue(latestAvaliacao.peso, 'kg')}
                            </div>
                            <div className="flex items-center gap-2">
                              <Ruler size={14} className="text-zinc-500" />
                              {formatMetricValue(latestAvaliacao.altura, 'm', 2)}
                            </div>
                            <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-300">
                              <Activity size={12} />
                              {latestAvaliacao.percentual_gordura !== undefined &&
                              latestAvaliacao.percentual_gordura !== null
                                ? formatMetricValue(latestAvaliacao.percentual_gordura, '%')
                                : 'BF indisponivel'}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 md:px-6">
                          <div className="flex flex-wrap gap-2">
                            {recentDates.map((avaliacao) => (
                              <button
                                key={avaliacao.id}
                                type="button"
                                onClick={() => handleOpenStudentWorkspace(group, avaliacao)}
                                className="rounded-full border border-zinc-800 bg-black/30 px-3 py-1 text-xs font-medium text-zinc-300 transition-colors hover:border-purple-500/30 hover:text-white"
                              >
                                {formatDatePtBr(avaliacao.data)}
                              </button>
                            ))}
                            {remainingDates > 0 ? (
                              <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-500">
                                +{remainingDates} datas
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right md:px-6">
                          <button
                            onClick={() => handleOpenStudentWorkspace(group)}
                            className="px-4 py-2 bg-purple-500/10 text-purple-500 hover:bg-purple-500 hover:text-white rounded-xl text-xs font-bold transition-all mr-2"
                          >
                            Abrir historico
                          </button>
                          {canManageRecords ? (
                            <button
                              onClick={() => void startEdit(latestAvaliacao)}
                              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold transition-all"
                            >
                              Editar ultima
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
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
          {showReportModal && selectedReport ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowReportModal(false)}
                className="absolute inset-0 bg-black/90 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-6xl shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="mb-8 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex items-start gap-4">
                    <ProfileAvatar
                      displayName={selectedReport.students?.nome}
                      avatarUrl={selectedReport.students?.avatar_url}
                      className="h-14 w-14 shrink-0 rounded-2xl border border-zinc-800"
                      textClassName="text-lg"
                    />
                    <div>
                      <h3 className="text-3xl font-bold text-white">
                        {selectedReport.students?.nome}
                      </h3>
                      <p className="text-zinc-500">
                        Workspace de avaliacoes - {formatDatePtBr(selectedReport.data)}
                      </p>
                      <p className="mt-2 text-sm text-zinc-500">
                        {historicoAluno.length} registros disponiveis para consulta, comparacao e
                        exportacao.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => void handleExportCurrentPdf(selectedReport)}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2"
                    >
                      PDF avaliacao
                    </button>
                    <button
                      onClick={handleOpenPdfSelectionModal}
                      disabled={!canChoosePdfComparativo}
                      className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
                        canChoosePdfComparativo
                          ? 'bg-white/10 text-white hover:bg-white/15'
                          : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                      }`}
                      title={
                        canChoosePdfComparativo
                          ? 'Escolha as avaliacoes que deseja incluir no PDF comparativo.'
                          : 'A aluna precisa ter pelo menos duas avaliacoes para gerar o PDF comparativo.'
                      }
                    >
                      PDF evolucao
                    </button>
                    {canManageRecords ? (
                      <button
                        onClick={() => handleStartEditFromWorkspace(selectedReport)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2 rounded-xl font-bold transition-all"
                      >
                        Editar atual
                      </button>
                    ) : null}
                    {canManageRecords ? (
                      <button
                        onClick={() => setDeleteConfirmation(selectedReport.id)}
                        className="bg-rose-500/10 text-rose-300 hover:bg-rose-500 hover:text-white px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2"
                      >
                        <Trash2 size={16} />
                        Excluir
                      </button>
                    ) : null}
                    <button
                      onClick={() => setShowReportModal(false)}
                      className="text-zinc-500 hover:text-white p-2"
                    >
                      <Plus className="rotate-45" size={24} />
                    </button>
                  </div>
                </div>

                <div className="mb-8 grid gap-6 xl:grid-cols-[300px,minmax(0,1fr)]">
                  <div className="rounded-3xl border border-zinc-800 bg-black/20 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                          Datas da aluna
                        </p>
                        <p className="mt-1 text-sm text-zinc-400">
                          Clique em uma data para abrir aquela avaliacao.
                        </p>
                      </div>
                      <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs font-bold text-zinc-400">
                        {historicoOrdenadoDesc.length}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                      {historicoOrdenadoDesc.map((avaliacao) => {
                        const isActive = selectedReport.id === avaliacao.id;
                        const isPrimaryBase = primaryComparisonBase?.id === avaliacao.id;
                        const extraIndex = extraComparisonIds.findIndex(
                          (comparisonId) => comparisonId === avaliacao.id,
                        );
                        const isExtraComparison = extraIndex >= 0;

                        return (
                          <div
                            key={avaliacao.id}
                            className={`rounded-2xl border p-3 transition-colors ${
                              isActive
                                ? 'border-purple-500/40 bg-purple-500/10'
                                : 'border-zinc-800 bg-zinc-950/70 hover:border-zinc-700'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleSelectHistoryAvaliacao(avaliacao.id)}
                              className="w-full text-left"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-bold text-white">
                                  {formatDatePtBr(avaliacao.data)}
                                </p>
                                <div className="flex flex-wrap justify-end gap-1">
                                  {isActive ? (
                                    <span className="rounded-full border border-purple-500/30 bg-purple-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-purple-200">
                                      Em foco
                                    </span>
                                  ) : null}
                                  {isPrimaryBase ? (
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-200">
                                      Base principal
                                    </span>
                                  ) : null}
                                  {isExtraComparison ? (
                                    <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-sky-200">
                                      Extra {extraIndex + 1}
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                              <p className="mt-2 text-xs text-zinc-400">
                                {formatMetricValue(avaliacao.peso, 'kg')} - BF{' '}
                                {avaliacao.percentual_gordura !== undefined &&
                                avaliacao.percentual_gordura !== null
                                  ? formatMetricValue(avaliacao.percentual_gordura, '%')
                                  : 'indisponivel'}
                              </p>
                              <p className="mt-1 text-xs text-zinc-500">
                                {getAvaliacaoProtocolLabel(avaliacao.protocolo)}
                              </p>
                            </button>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {!isActive ? (
                                <button
                                  type="button"
                                  onClick={() => handlePrimaryComparisonChange(avaliacao.id)}
                                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                                    isPrimaryBase
                                      ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                                      : 'border border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white'
                                  }`}
                                >
                                  {isPrimaryBase ? 'Base principal' : 'Tornar base'}
                                </button>
                              ) : null}

                              {!isActive && !isPrimaryBase ? (
                                <button
                                  type="button"
                                  onClick={() => toggleExtraComparison(avaliacao.id)}
                                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                                    isExtraComparison
                                      ? 'border border-sky-500/30 bg-sky-500/10 text-sky-200'
                                      : 'border border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white'
                                  }`}
                                >
                                  {isExtraComparison ? 'Remover extra' : 'Adicionar extra'}
                                </button>
                              ) : null}

                              {canManageRecords ? (
                                <button
                                  type="button"
                                  onClick={() => handleStartEditFromWorkspace(avaliacao)}
                                  className="rounded-xl border border-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
                                >
                                  Editar esta data
                                </button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-3">
                      <div className="rounded-3xl border border-zinc-800 bg-black/20 p-5">
                        <label className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                          Avaliacao em foco
                        </label>
                        <select
                          value={selectedReport.id}
                          onChange={(event) =>
                            handleSelectHistoryAvaliacao(event.target.value)
                          }
                          className="mt-3 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
                        >
                          {historicoOrdenadoDesc.map((avaliacao) => (
                            <option key={avaliacao.id} value={avaliacao.id}>
                              {formatDatePtBr(avaliacao.data)} -{' '}
                              {getAvaliacaoProtocolLabel(avaliacao.protocolo)}
                            </option>
                          ))}
                        </select>
                        <p className="mt-2 text-xs text-zinc-500">
                          Escolha qual avaliacao deseja abrir no painel principal.
                        </p>
                      </div>

                      <div className="rounded-3xl border border-zinc-800 bg-black/20 p-5">
                        <label className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                          Base principal
                        </label>
                        <select
                          value={primaryComparisonId}
                          onChange={(event) =>
                            handlePrimaryComparisonChange(event.target.value)
                          }
                          className="mt-3 w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30"
                        >
                          <option value="">Sem base</option>
                          {availableComparisonOptions.map((avaliacao) => (
                            <option key={avaliacao.id} value={avaliacao.id}>
                              {formatDatePtBr(avaliacao.data)} -{' '}
                              {getAvaliacaoProtocolLabel(avaliacao.protocolo)}
                            </option>
                          ))}
                        </select>
                        <p className="mt-2 text-xs text-zinc-500">
                          Ela define o comparativo principal, as fotos lado a lado e o PDF de
                          evolucao.
                        </p>
                      </div>

                      <div className="rounded-3xl border border-zinc-800 bg-black/20 p-5">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                            Datas extras
                          </p>
                          {extraComparisonIds.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => setExtraComparisonIds([])}
                              className="text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:text-white"
                            >
                              Limpar
                            </button>
                          ) : null}
                        </div>
                        {extraComparisonBases.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {extraComparisonBases.map((avaliacao, index) => (
                              <button
                                key={avaliacao.id}
                                type="button"
                                onClick={() => toggleExtraComparison(avaliacao.id)}
                                className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-bold text-sky-200 transition-colors hover:bg-sky-500/15"
                              >
                                Extra {index + 1}: {formatDatePtBr(avaliacao.data)}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-3 text-sm text-zinc-400">
                            Adicione datas extras pela lista lateral quando quiser comparar 3 ou
                            mais avaliacoes ao mesmo tempo.
                          </p>
                        )}
                      </div>
                    </div>

                    {primaryComparisonBase ? (
                      <div className="rounded-3xl border border-emerald-500/15 bg-emerald-500/5 p-5">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-200">
                            {comparisonEntries.length} avaliacoes selecionadas
                          </span>
                          <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-300">
                            Base: {formatDatePtBr(primaryComparisonBase.data)}
                          </span>
                          {comparisonIntervalDays !== null ? (
                            <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-300">
                              {comparisonIntervalDays} dias ate a data em foco
                            </span>
                          ) : null}
                        </div>
                        <p className="text-sm text-zinc-200">
                          O comparativo principal usa a base selecionada, enquanto a matriz e o
                          PDF levam junto todas as datas extras marcadas neste workspace.
                        </p>
                        <p className="mt-2 text-sm text-zinc-400">
                          Se quiser um PDF somente entre duas datas, deixe apenas a data em foco e
                          a base principal selecionadas.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-zinc-800 bg-black/20 p-5 text-sm text-zinc-400">
                        Escolha uma segunda data para iniciar a comparacao. Depois voce pode
                        adicionar quantas datas extras quiser.
                      </div>
                    )}

                    <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-black/20">
                      <div className="border-b border-zinc-800 px-5 py-4">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                              Painel comparativo
                            </p>
                            <p className="mt-1 text-sm text-zinc-400">
                              Use uma aba dedicada para acompanhar as principais mudancas ou abrir
                              a matriz completa lado a lado.
                            </p>
                          </div>
                          <div className="inline-flex w-full rounded-2xl border border-zinc-800 bg-zinc-950/80 p-1 xl:w-auto">
                            <button
                              type="button"
                              onClick={() => setComparisonWorkspaceTab('top_changes')}
                              className={`flex-1 rounded-xl px-4 py-2 text-sm font-bold transition-colors xl:flex-none ${
                                comparisonWorkspaceTab === 'top_changes'
                                  ? 'bg-purple-500 text-white'
                                  : 'text-zinc-400 hover:text-white'
                              }`}
                            >
                              Top 4 mudancas
                            </button>
                            <button
                              type="button"
                              onClick={() => setComparisonWorkspaceTab('matrix')}
                              className={`flex-1 rounded-xl px-4 py-2 text-sm font-bold transition-colors xl:flex-none ${
                                comparisonWorkspaceTab === 'matrix'
                                  ? 'bg-white text-zinc-950'
                                  : 'text-zinc-400 hover:text-white'
                              }`}
                            >
                              Matriz comparativa
                            </button>
                          </div>
                        </div>
                      </div>

                      {comparisonWorkspaceTab === 'top_changes' ? (
                        <div className="p-5">
                          <div className="mb-4 flex flex-wrap items-center gap-2">
                            <TrendingUp className="text-purple-500" />
                            <h4 className="text-xl font-bold">Top 4 mudancas</h4>
                            <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                              Peso, cintura, quadril e abdome
                            </span>
                            {primaryComparisonBase ? (
                              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-200">
                                Base: {formatDatePtBr(primaryComparisonBase.data)}
                              </span>
                            ) : null}
                          </div>

                          {!primaryComparisonBase ? (
                            <div className="mb-5 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-400">
                              Escolha uma base principal para calcular as mudancas. Os cards ja
                              ficam separados aqui para essa leitura ficar sempre facil.
                            </div>
                          ) : null}

                          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                            {topChangeCards.map((card) => (
                              <div
                                key={card.key}
                                className={`rounded-2xl border p-6 ${
                                  card.toneStyles?.panelClassName || 'border-zinc-800 bg-black/40'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                                      {card.label}
                                    </p>
                                    <p className={`mt-2 text-4xl font-black ${card.valueClassName}`}>
                                      {formatMetricValue(
                                        card.currentValue,
                                        card.suffix,
                                        card.precision,
                                      )}
                                    </p>
                                  </div>
                                  {card.delta !== null ? (
                                    <div className="flex items-center gap-1 text-xs font-bold">
                                      {card.delta > 0 ? (
                                        <ArrowUp size={12} />
                                      ) : card.delta < 0 ? (
                                        <ArrowDown size={12} />
                                      ) : null}
                                      {card.delta > 0 ? '+' : ''}
                                      {formatMetricValue(card.delta, card.suffix, card.precision)}
                                    </div>
                                  ) : null}
                                </div>

                                <p className="mt-2 text-xs text-zinc-500">
                                  Base principal:{' '}
                                  {formatMetricValue(card.baseValue, card.suffix, card.precision)}
                                </p>

                                {card.toneStyles ? (
                                  <span
                                    className={`mt-3 inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${card.toneStyles.badgeClassName}`}
                                  >
                                    {card.toneStyles.label}
                                  </span>
                                ) : (
                                  <p className="mt-3 text-xs text-zinc-500">
                                    Selecione uma base principal para ver a mudanca.
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : primaryComparisonBase ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-[980px] w-full text-left">
                            <thead className="bg-zinc-950/70">
                              <tr className="border-b border-zinc-800">
                                <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                                  Metrica
                                </th>
                                {comparisonEntries.map((avaliacao, index) => {
                                  const roleLabel =
                                    index === 0
                                      ? 'Em foco'
                                      : index === 1
                                        ? 'Base principal'
                                        : `Extra ${index - 1}`;
                                  const roleClassName =
                                    index === 0
                                      ? 'border-purple-500/20 bg-purple-500/10 text-purple-200'
                                      : index === 1
                                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200'
                                        : 'border-sky-500/20 bg-sky-500/10 text-sky-200';

                                  return (
                                    <th
                                      key={avaliacao.id}
                                      className="px-5 py-4 text-xs font-bold uppercase tracking-[0.18em] text-zinc-500"
                                    >
                                      <div
                                        className={`inline-flex rounded-full border px-2.5 py-1 ${roleClassName}`}
                                      >
                                        {roleLabel}
                                      </div>
                                      <div className="mt-1 text-sm font-semibold normal-case tracking-normal text-white">
                                        {formatDatePtBr(avaliacao.data)}
                                      </div>
                                      <div className="mt-1 text-[11px] font-medium normal-case tracking-normal text-zinc-500">
                                        {getAvaliacaoProtocolLabel(avaliacao.protocolo)}
                                      </div>
                                    </th>
                                  );
                                })}
                              </tr>
                            </thead>
                            <tbody>
                              {COMPARISON_METRICS.map((metric) => (
                                <tr
                                  key={metric.key}
                                  className="border-b border-zinc-800/70 last:border-b-0"
                                >
                                  <td className="px-5 py-4 text-sm font-semibold text-zinc-200">
                                    <div>{metric.label}</div>
                                    <div className="mt-1 text-[11px] font-medium text-zinc-500">
                                      Base principal como referencia visual
                                    </div>
                                  </td>
                                  {comparisonEntries.map((avaliacao, index) => {
                                    const delta =
                                      index !== 1 && primaryComparisonBase
                                        ? getMetricDelta(
                                            avaliacao[metric.key],
                                            primaryComparisonBase[metric.key],
                                            metric.precision,
                                          )
                                        : null;
                                    const tone =
                                      delta !== null ? getComparisonTone(delta, metric) : null;
                                    const toneStyles = tone
                                      ? COMPARISON_TONE_STYLES[tone]
                                      : null;
                                    const panelBaseClassName =
                                      index === 0
                                        ? 'border-purple-500/20 bg-purple-500/[0.06]'
                                        : index === 1
                                          ? 'border-emerald-500/20 bg-emerald-500/[0.06]'
                                          : 'border-zinc-800 bg-zinc-950/40';
                                    const panelClassName = toneStyles
                                      ? `${panelBaseClassName} ${toneStyles.panelClassName}`
                                      : panelBaseClassName;

                                    return (
                                      <td
                                        key={`${avaliacao.id}-${metric.key}`}
                                        className="px-5 py-4 align-top"
                                      >
                                        <div
                                          className={`rounded-2xl border px-3 py-3 ${panelClassName}`}
                                        >
                                          <div className="text-sm font-bold text-white">
                                            {formatMetricValue(
                                              avaliacao[metric.key],
                                              metric.suffix,
                                              metric.precision,
                                            )}
                                          </div>

                                          {index === 1 ? (
                                            <div className="mt-2 text-xs font-medium text-emerald-200/90">
                                              Referencia principal
                                            </div>
                                          ) : delta !== null && toneStyles ? (
                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                              <span
                                                className={`inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${toneStyles.badgeClassName}`}
                                              >
                                                {toneStyles.label}
                                              </span>
                                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-200">
                                                {delta > 0 ? (
                                                  <ArrowUp size={12} />
                                                ) : delta < 0 ? (
                                                  <ArrowDown size={12} />
                                                ) : null}
                                                {delta > 0 ? '+' : ''}
                                                {formatMetricValue(
                                                  delta,
                                                  metric.suffix,
                                                  metric.precision,
                                                )}
                                              </span>
                                            </div>
                                          ) : (
                                            <div className="mt-2 text-xs text-zinc-500">
                                              Sem base numerica para esta metrica
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="px-5 py-8 text-sm text-zinc-400">
                          Escolha uma base principal para liberar a matriz comparativa completa.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedReport.photos?.length || primaryComparisonBase?.photos?.length ? (
                  <div className="mb-10 grid gap-6 lg:grid-cols-2">
                    {primaryComparisonBase ? (
                      <AssessmentPhotoGallery
                        title="Fotos base"
                        subtitle={`Registro selecionado em ${formatDatePtBr(primaryComparisonBase.data)}`}
                        photos={primaryComparisonBase.photos}
                      />
                    ) : null}

                    <AssessmentPhotoGallery
                      title={primaryComparisonBase ? 'Fotos em foco' : 'Fotos da avaliacao'}
                      subtitle={
                        primaryComparisonBase
                          ? `Registro principal de ${formatDatePtBr(selectedReport.data)}`
                          : 'Clique em uma foto para ampliar e conferir os angulos.'
                      }
                      photos={selectedReport.photos}
                    />
                  </div>
                ) : null}

                <div className="mb-12 space-y-6">
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <TrendingUp className="text-purple-500" />
                    <h4 className="text-xl font-bold">Dashboard de evolucao</h4>
                    {selectedReportPosition >= 0 ? (
                      <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                        Registro {selectedReportPosition + 1} de {historicoOrdenadoDesc.length}
                      </span>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-black/40 border border-zinc-800 p-6 rounded-3xl h-[300px] relative">
                      <p className="text-sm font-bold text-zinc-500 mb-6 uppercase tracking-widest">
                        Evolucao do Peso (kg)
                      </p>
                      <ChartWrapper minHeight={200}>
                        <LineChart data={historicoAluno}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#27272a"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="data"
                            stroke="#71717a"
                            fontSize={10}
                            tickFormatter={(value) => formatDateDayMonthPtBr(value)}
                          />
                          <YAxis stroke="#71717a" fontSize={10} domain={['auto', 'auto']} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#18181b',
                              border: '1px solid #27272a',
                              borderRadius: '12px',
                            }}
                            labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                            labelFormatter={(value) => formatDatePtBr(value)}
                          />
                          <Line
                            type="monotone"
                            dataKey="peso"
                            stroke="#a855f7"
                            strokeWidth={3}
                            dot={{ fill: '#a855f7', r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ChartWrapper>
                    </div>

                    <div className="bg-black/40 border border-zinc-800 p-6 rounded-3xl h-[300px] relative">
                      <p className="text-sm font-bold text-zinc-500 mb-6 uppercase tracking-widest">
                        Evolucao do BF (%)
                      </p>
                      <ChartWrapper minHeight={200}>
                        <LineChart data={historicoAluno}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#27272a"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="data"
                            stroke="#71717a"
                            fontSize={10}
                            tickFormatter={(value) => formatDateDayMonthPtBr(value)}
                          />
                          <YAxis stroke="#71717a" fontSize={10} domain={[0, 'auto']} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#18181b',
                              border: '1px solid #27272a',
                              borderRadius: '12px',
                            }}
                            labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                            labelFormatter={(value) => formatDatePtBr(value)}
                          />
                          <Line
                            type="monotone"
                            dataKey="percentual_gordura"
                            stroke="#ec4899"
                            strokeWidth={3}
                            dot={{ fill: '#ec4899', r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ChartWrapper>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h4 className="text-xl font-bold border-b border-zinc-800 pb-2">
                      Perimetros
                    </h4>
                    <div className="grid grid-cols-2 gap-y-3">
                      <div className="flex justify-between pr-4 border-r border-zinc-800">
                        <span className="text-zinc-500">Pescoco:</span>
                        <span className="font-bold">
                          {formatMetricValue(selectedReport.pescoco, 'cm')}
                        </span>
                      </div>
                      <div className="flex justify-between pl-4">
                        <span className="text-zinc-500">RCQ:</span>
                        <span className="font-bold">
                          {formatMetricValue(selectedReport.rcq, '', 2)}
                        </span>
                      </div>
                      <div className="flex justify-between pr-4 border-r border-zinc-800">
                        <span className="text-zinc-500">Ombro:</span>
                        <span className="font-bold">
                          {formatMetricValue(selectedReport.ombro, 'cm')}
                        </span>
                      </div>
                      <div className="flex justify-between pl-4">
                        <span className="text-zinc-500">Torax:</span>
                        <span className="font-bold">
                          {formatMetricValue(selectedReport.torax, 'cm')}
                        </span>
                      </div>
                      <div className="flex justify-between pr-4 border-r border-zinc-800">
                        <span className="text-zinc-500">Cintura:</span>
                        <span className="font-bold">
                          {formatMetricValue(selectedReport.cintura, 'cm')}
                        </span>
                      </div>
                      <div className="flex justify-between pl-4">
                        <span className="text-zinc-500">Abdome:</span>
                        <span className="font-bold">
                          {formatMetricValue(selectedReport.abdome, 'cm')}
                        </span>
                      </div>
                      <div className="flex justify-between pr-4 border-r border-zinc-800">
                        <span className="text-zinc-500">Quadril:</span>
                        <span className="font-bold">
                          {formatMetricValue(selectedReport.quadril, 'cm')}
                        </span>
                      </div>
                      <div className="flex justify-between pl-4">
                        <span className="text-zinc-500">Braco D:</span>
                        <span className="font-bold">
                          {formatMetricValue(selectedReport.braco_direito, 'cm')}
                        </span>
                      </div>
                      <div className="flex justify-between pr-4 border-r border-zinc-800">
                        <span className="text-zinc-500">Braco E:</span>
                        <span className="font-bold">
                          {formatMetricValue(selectedReport.braco_esquerdo, 'cm')}
                        </span>
                      </div>
                      <div className="flex justify-between pl-4">
                        <span className="text-zinc-500">Coxa D:</span>
                        <span className="font-bold">
                          {formatMetricValue(selectedReport.coxa_direita, 'cm')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-xl font-bold border-b border-zinc-800 pb-2">
                      Dobras cutaneas
                    </h4>
                    <div className="grid grid-cols-2 gap-y-3">
                      <div className="flex justify-between pr-4 border-r border-zinc-800">
                        <span className="text-zinc-500">Tricipital:</span>
                        <span className="font-bold">
                          {formatMetricValue(selectedReport.tricipital, 'mm')}
                        </span>
                      </div>
                      <div className="flex justify-between pl-4">
                        <span className="text-zinc-500">Subescapular:</span>
                        <span className="font-bold">
                          {formatMetricValue(selectedReport.subescapular, 'mm')}
                        </span>
                      </div>
                      <div className="flex justify-between pr-4 border-r border-zinc-800">
                        <span className="text-zinc-500">Supra-iliaca:</span>
                        <span className="font-bold">
                          {formatMetricValue(selectedReport.supra_iliaca, 'mm')}
                        </span>
                      </div>
                      <div className="flex justify-between pl-4">
                        <span className="text-zinc-500">Abdominal:</span>
                        <span className="font-bold">
                          {formatMetricValue(selectedReport.abdominal, 'mm')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedReport.observacoes ? (
                  <div className="mt-8 p-6 bg-black/20 border border-zinc-800 rounded-2xl">
                    <h4 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-2">
                      Observacoes
                    </h4>
                    <p className="text-zinc-300 italic">{selectedReport.observacoes}</p>
                  </div>
                ) : null}
              </motion.div>
            </div>
          ) : null}

          {showPdfSelectionModal && selectedReport ? (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !pdfExporting && setShowPdfSelectionModal(false)}
                className="absolute inset-0 bg-black/85 backdrop-blur-md"
              />
              <motion.div
                initial={{ scale: 0.94, opacity: 0, y: 18 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.94, opacity: 0, y: 18 }}
                className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl"
              >
                <div className="border-b border-zinc-800 px-6 py-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                        PDF comparativo
                      </p>
                      <h4 className="mt-1 text-2xl font-bold text-white">
                        Escolha as avaliacoes do comparativo
                      </h4>
                      <p className="mt-2 text-sm text-zinc-400">
                        Selecione 2 ou mais datas da {selectedReport.students?.nome} para gerar o
                        PDF de evolucao exatamente do jeito que voce quiser.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => !pdfExporting && setShowPdfSelectionModal(false)}
                      className="p-2 text-zinc-500 transition-colors hover:text-white"
                    >
                      <Plus className="rotate-45" size={24} />
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-300">
                      {selectedPdfAvaliacoes.length} selecionadas
                    </span>
                    {selectedPdfAvaliacoes.length >= 2 ? (
                      <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-200">
                        Pronto para exportar
                      </span>
                    ) : (
                      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-200">
                        Minimo de 2 datas
                      </span>
                    )}
                    {selectedPdfAvaliacoes.length >= 2 ? (
                      <span className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-300">
                        Periodo: {formatDatePtBr(selectedPdfAvaliacoes[0].data)} ate{' '}
                        {formatDatePtBr(selectedPdfAvaliacoes[selectedPdfAvaliacoes.length - 1].data)}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="border-b border-zinc-800 px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPdfSelectionIds(historicoOrdenadoDesc.map((item) => item.id))}
                      className="rounded-xl border border-zinc-800 px-3 py-2 text-xs font-bold text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
                    >
                      Selecionar todas
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPdfSelectionIds(
                          buildDefaultPdfSelectionIds(
                            historicoOrdenadoDesc,
                            selectedReport,
                            comparisonEntries,
                          ),
                        )
                      }
                      className="rounded-xl border border-zinc-800 px-3 py-2 text-xs font-bold text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
                    >
                      Usar selecao atual do painel
                    </button>
                    <button
                      type="button"
                      onClick={() => setPdfSelectionIds([])}
                      className="rounded-xl border border-zinc-800 px-3 py-2 text-xs font-bold text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                <div className="max-h-[52vh] overflow-y-auto px-6 py-5">
                  <div className="space-y-3">
                    {historicoOrdenadoDesc.map((avaliacao) => {
                      const isChecked = pdfSelectionIds.includes(avaliacao.id);

                      return (
                        <label
                          key={avaliacao.id}
                          className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-colors ${
                            isChecked
                              ? 'border-purple-500/35 bg-purple-500/10'
                              : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePdfSelection(avaliacao.id)}
                            className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-950 text-purple-500 focus:ring-purple-500"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-bold text-white">
                                {formatDatePtBr(avaliacao.data)}
                              </p>
                              {selectedReport.id === avaliacao.id ? (
                                <span className="rounded-full border border-purple-500/30 bg-purple-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-purple-200">
                                  Em foco
                                </span>
                              ) : null}
                              {primaryComparisonId === avaliacao.id ? (
                                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-200">
                                  Base principal
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-2 text-sm text-zinc-400">
                              {getAvaliacaoProtocolLabel(avaliacao.protocolo)} · Peso{' '}
                              {formatMetricValue(avaliacao.peso, 'kg')} · Cintura{' '}
                              {formatMetricValue(avaliacao.cintura, 'cm')} · Quadril{' '}
                              {formatMetricValue(avaliacao.quadril, 'cm')} · Abdome{' '}
                              {formatMetricValue(avaliacao.abdome, 'cm')}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800 px-6 py-5">
                  <p className="text-sm text-zinc-400">
                    O PDF vai respeitar somente as datas marcadas aqui.
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowPdfSelectionModal(false)}
                      disabled={pdfExporting}
                      className="rounded-2xl bg-zinc-800 px-5 py-3 font-bold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleConfirmPdfSelection()}
                      disabled={selectedPdfAvaliacoes.length < 2 || pdfExporting}
                      className={`rounded-2xl px-5 py-3 font-bold transition-colors ${
                        selectedPdfAvaliacoes.length >= 2 && !pdfExporting
                          ? 'bg-purple-500 text-white hover:bg-purple-600'
                          : 'cursor-not-allowed bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {pdfExporting ? 'Gerando PDF...' : 'Gerar PDF comparativo'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          ) : null}

          {canManageRecords && showAddModal ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleCloseAvaliacaoModal}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <h3 className="text-2xl font-bold mb-6">
                  {editingAvaliacao ? 'Editar avaliacao' : 'Nova avaliacao'}
                </h3>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
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
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                        Aluno *
                      </label>
                      <input
                        required
                        type="text"
                        value={alunoSearch}
                        onChange={(event) => {
                          setAlunoSearch(event.target.value);
                          setShowAlunoDropdown(true);
                        }}
                        onFocus={() => setShowAlunoDropdown(true)}
                        aria-expanded={showAlunoDropdown}
                        className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all"
                        placeholder="Digite ou selecione o aluno..."
                      />
                      {showAlunoDropdown ? (
                        <div className="absolute z-20 w-full bg-zinc-900 border border-zinc-800 rounded-xl mt-1 max-h-48 overflow-y-auto shadow-2xl">
                          {filteredAlunosList.length > 0 ? (
                            filteredAlunosList.map((aluno) => (
                              <div
                                key={aluno.id}
                                onClick={() => {
                                  setNewAvaliacao((prev) => {
                                    const atualizado = {
                                      ...prev,
                                      student_id: aluno.id,
                                      student_gender: aluno.gender ?? aluno.sexo ?? null,
                                      student_birth_date:
                                        aluno.birth_date ?? aluno.data_nascimento ?? null,
                                    };
                                    const calculado = calcularBiometria(
                                      atualizado as Record<string, unknown>,
                                    );
                                    return { ...atualizado, ...calculado };
                                  });
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
                                    {aluno.birth_date || aluno.gender
                                      ? 'Cadastro encontrado'
                                      : 'Selecionar'}
                                  </p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-sm text-zinc-500">
                              Nenhum aluno encontrado
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                        Data da Avaliacao *
                      </label>
                      <input
                        required
                        type="date"
                        value={newAvaliacao.data || ''}
                        onChange={(event) =>
                          handleAvaliacaoFieldChange('data', event.target.value)
                        }
                        className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all [color-scheme:dark]"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                        Protocolo
                      </label>
                      <select
                        value={newAvaliacao.protocolo}
                        onChange={(event) =>
                          handleAvaliacaoFieldChange('protocolo', event.target.value)
                        }
                        className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all"
                      >
                        <option value="faulkner">Faulkner (4 Dobras)</option>
                        <option value="navy">US Navy (Circunferencias)</option>
                      </select>
                      <p className="text-xs text-zinc-500">
                        {newAvaliacao.protocolo === 'navy'
                          ? 'US Navy usa altura, cintura e pescoco. Para mulheres, tambem quadril.'
                          : 'Faulkner usa tricipital, subescapular, supra-iliaca e abdominal.'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                        Peso (kg) *
                      </label>
                      <input
                        required
                        type="number"
                        step="0.1"
                        value={newAvaliacao.peso ?? ''}
                        onChange={(event) =>
                          handleAvaliacaoFieldChange(
                            'peso',
                            parseOptionalDecimal(event.target.value),
                          )
                        }
                        className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all"
                        placeholder="75.5"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                        Altura (m ou cm) *
                      </label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        value={newAvaliacao.altura ?? ''}
                        onChange={(event) =>
                          handleAvaliacaoFieldChange(
                            'altura',
                            parseOptionalDecimal(event.target.value),
                          )
                        }
                        className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all"
                        placeholder="1.75 m ou 175 cm"
                      />
                    </div>
                  </div>

                  <div className="border-t border-zinc-800 pt-4">
                    <h4 className="text-lg font-bold mb-4 text-purple-500">Perimetros (cm)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                          Pescoco
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={newAvaliacao.pescoco ?? ''}
                          onChange={(event) =>
                            handleAvaliacaoFieldChange(
                              'pescoco',
                              parseOptionalDecimal(event.target.value),
                            )
                          }
                          className="w-full bg-black border border-zinc-800 rounded-xl py-2 px-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all"
                        />
                      </div>
                      {[
                        { key: 'ombro', label: 'Ombro' },
                        { key: 'torax', label: 'Torax' },
                        { key: 'cintura', label: 'Cintura' },
                        { key: 'abdome', label: 'Abdome' },
                        { key: 'quadril', label: 'Quadril' },
                        { key: 'braco_direito', label: 'Braco Dir.' },
                        { key: 'braco_esquerdo', label: 'Braco Esq.' },
                        { key: 'coxa_direita', label: 'Coxa Dir.' },
                        { key: 'coxa_esquerda', label: 'Coxa Esq.' },
                        { key: 'panturrilha_direita', label: 'Panturrilha Dir.' },
                        { key: 'panturrilha_esquerda', label: 'Panturrilha Esq.' },
                      ].map(({ key, label }) => (
                        <div key={key} className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                            {label}
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={(newAvaliacao as Record<string, number | undefined>)[key] ?? ''}
                            onChange={(event) => {
                              const value =
                                event.target.value === ''
                                  ? undefined
                                  : parseFloat(event.target.value);
                              handleAvaliacaoFieldChange(
                                key,
                                value !== undefined && !Number.isNaN(value)
                                  ? value
                                  : undefined,
                              );
                            }}
                            className="w-full bg-black border border-zinc-800 rounded-xl py-2 px-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-zinc-800 pt-4">
                    <h4 className="text-lg font-bold mb-4 text-purple-500">
                      Dobras cutaneas (mm)
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { key: 'tricipital', label: 'Tricipital' },
                        { key: 'subescapular', label: 'Subescapular' },
                        { key: 'supra_iliaca', label: 'Supra-iliaca' },
                        { key: 'abdominal', label: 'Abdominal' },
                      ].map(({ key, label }) => (
                        <div key={key} className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                            {label}
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={(newAvaliacao as Record<string, number | undefined>)[key] ?? ''}
                            onChange={(event) => {
                              const value =
                                event.target.value === ''
                                  ? undefined
                                  : parseFloat(event.target.value);
                              handleAvaliacaoFieldChange(
                                key,
                                value !== undefined && !Number.isNaN(value)
                                  ? value
                                  : undefined,
                              );
                            }}
                            className="w-full bg-black border border-zinc-800 rounded-xl py-2 px-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-zinc-800 pt-4">
                    <h4 className="text-lg font-bold mb-4 text-purple-500">Resultados</h4>
                    <div className="mb-4 rounded-2xl border border-zinc-800 bg-black/40 px-4 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                        Protocolo aplicado
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {protocoloSelecionadoLabel}
                      </p>
                      {shouldShowBiometriaHint && biometriaHint ? (
                        <p className="mt-2 text-xs text-amber-300">{biometriaHint}</p>
                      ) : null}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                          Soma Dobras
                        </label>
                        <input
                          type="number"
                          readOnly
                          value={newAvaliacao.soma_dobras ?? ''}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-400 cursor-not-allowed outline-none"
                          placeholder="0.0"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                          IMC
                        </label>
                        <input
                          type="number"
                          readOnly
                          value={newAvaliacao.imc ?? ''}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-400 cursor-not-allowed outline-none"
                          placeholder="Calculado auto."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                          % Gordura (BF)
                        </label>
                        <input
                          type="number"
                          readOnly
                          value={newAvaliacao.percentual_gordura ?? ''}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-400 cursor-not-allowed outline-none"
                          placeholder="Calculado auto."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                          Massa Gorda (kg)
                        </label>
                        <input
                          type="number"
                          readOnly
                          value={newAvaliacao.massa_gorda ?? ''}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-400 cursor-not-allowed outline-none"
                          placeholder="Calculado auto."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                          Massa Magra (kg)
                        </label>
                        <input
                          type="number"
                          readOnly
                          value={newAvaliacao.massa_magra ?? ''}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-400 cursor-not-allowed outline-none"
                          placeholder="Calculado auto."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                          RCQ
                        </label>
                        <input
                          type="number"
                          readOnly
                          value={newAvaliacao.rcq ?? ''}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-400 cursor-not-allowed outline-none"
                          placeholder="Calculado auto."
                        />
                      </div>
                    </div>
                  </div>

                  <AssessmentPhotoUploader
                    drafts={photoDrafts}
                    onPickFile={handlePhotoPick}
                    onCapturePhoto={nativeApp ? handleCapturePhoto : undefined}
                    onPickGalleryPhoto={nativeApp ? handlePickPhotoFromGallery : undefined}
                    capturingPosition={capturingPhotoPosition}
                    pickingGalleryPosition={pickingGalleryPhotoPosition}
                    onRemove={handlePhotoRemove}
                  />

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                      Observacoes
                    </label>
                    <textarea
                      value={newAvaliacao.observacoes || ''}
                      onChange={(event) =>
                        handleAvaliacaoFieldChange('observacoes', event.target.value)
                      }
                      className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all min-h-[100px]"
                      placeholder="Observacoes gerais..."
                    />
                  </div>

                  {!canSaveAvaliacao ? (
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                      Preencha aluno, data, peso e altura para liberar o salvamento.
                    </div>
                  ) : null}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseAvaliacaoModal}
                      className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all"
                    >
                      Cancelar
                    </button>
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
          ) : null}
        </AnimatePresence>

        <Toast notification={notification} onClose={clearNotification} />
        <ConfirmDialog
          isOpen={!!deleteConfirmation}
          onClose={() => setDeleteConfirmation(null)}
          onConfirm={handleDelete}
          title="Excluir avaliacao?"
          message="Tem certeza que deseja excluir esta avaliacao? Esta acao tambem removera as fotos vinculadas e nao pode ser desfeita."
          confirmText="Excluir avaliacao"
          cancelText="Cancelar"
          variant="danger"
          loading={!!deletingId}
        />
      </ModuleSurface>
    </ModuleShell>
  );
}
