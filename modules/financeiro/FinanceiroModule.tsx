'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Download,
  FileText,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { jsPDF } from 'jspdf';
import { Toast } from '@/components/ui';
import { useFinanceiro } from '@/hooks/useFinanceiro';
import { compareDateOnly, formatDatePtBr } from '@/lib/date';
import type { AlunoBoletos, Boleto } from '@/types/financeiro';
import {
  ModuleEmptyState,
  ModuleHero,
  ModuleHeroAction,
  ModuleSectionHeading,
  ModuleShell,
  ModuleStatCard,
  ModuleSurface,
} from '@/components/dashboard/ModulePrimitives';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function StatusBadge({ status }: { status: Boleto['status'] }) {
  const styles =
    status === 'paid'
      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
      : status === 'late'
        ? 'border-rose-500/20 bg-rose-500/10 text-rose-300'
        : 'border-amber-500/20 bg-amber-500/10 text-amber-300';

  const label = status === 'paid' ? 'Pago' : status === 'late' ? 'Atrasado' : 'Pendente';

  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${styles}`}>
      {label}
    </span>
  );
}

function ModalFrame({
  title,
  onClose,
  children,
  widthClass = 'max-w-2xl',
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  widthClass?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 20 }}
        className={`relative max-h-[94vh] w-full ${widthClass} overflow-y-auto rounded-[30px] border border-zinc-800 bg-zinc-950 p-4 shadow-2xl sm:p-5 md:p-8`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-2xl font-bold text-white">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 p-3 text-zinc-400 transition-all hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="mt-5 sm:mt-6">{children}</div>
      </motion.div>
    </div>
  );
}

export default function FinanceiroModule() {
  const {
    pagamentos,
    boletos,
    alunos,
    error,
    loading,
    showAddModal,
    setShowAddModal,
    showBoletoModal,
    setShowBoletoModal,
    deleteConfirmation,
    setDeleteConfirmation,
    newPagamento,
    setNewPagamento,
    newBoleto,
    setNewBoleto,
    handleCreateTransacao,
    handleGerarBoleto,
    handleGerar3Boletos,
    handleGerarLote,
    handleDarBaixa,
    handleExcluirBoleto,
    loadData,
    notification,
    clearNotification,
  } = useFinanceiro();

  const [activeTab, setActiveTab] = useState<'geral' | 'alunos'>('geral');
  const [batchLoading, setBatchLoading] = useState(false);
  const [showConfirmLote, setShowConfirmLote] = useState(false);
  const [boletoToPay, setBoletoToPay] = useState<Boleto | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<AlunoBoletos | null>(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  const boletosPorAluno = useMemo<AlunoBoletos[]>(
    () =>
      alunos.map((aluno) => {
        const studentBoletos = boletos.filter((boleto) => boleto.student_id === aluno.id);
        const sorted = [...studentBoletos].sort((a, b) => compareDateOnly(a.due_date, b.due_date));
        const pendingOrLate = sorted.find((boleto) => boleto.status === 'pending' || boleto.status === 'late');
        const displayBoleto = pendingOrLate || sorted[sorted.length - 1];
        return { ...aluno, boletos: studentBoletos, displayBoleto };
      }),
    [alunos, boletos],
  );
  const filteredBoletosPorAluno = useMemo(() => {
    const normalizedQuery = studentSearchTerm.trim().toLowerCase();

    if (!normalizedQuery) {
      return boletosPorAluno;
    }

    return boletosPorAluno.filter((aluno) => aluno.name.toLowerCase().includes(normalizedQuery));
  }, [boletosPorAluno, studentSearchTerm]);
  const filteredBoletos = useMemo(() => {
    const normalizedQuery = studentSearchTerm.trim().toLowerCase();

    if (!normalizedQuery) {
      return boletos;
    }

    return boletos.filter((boleto) =>
      (boleto.students?.name || '').toLowerCase().includes(normalizedQuery),
    );
  }, [boletos, studentSearchTerm]);

  const totalReceitas = pagamentos
    .filter((pagamento) => pagamento.tipo === 'receita' && pagamento.status === 'pago')
    .reduce((acc, current) => acc + current.valor, 0);
  const totalDespesas = pagamentos
    .filter((pagamento) => pagamento.tipo === 'despesa' && pagamento.status === 'pago')
    .reduce((acc, current) => acc + current.valor, 0);
  const saldo = totalReceitas - totalDespesas;

  const generatePDF = (boleto: Boleto) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Boleto de Pagamento', 20, 20);
    doc.setFontSize(12);
    doc.text(`Aluno: ${boleto.students?.name || 'N/A'}`, 20, 40);
    doc.text(`Valor: ${formatCurrency(boleto.amount)}`, 20, 50);
    doc.text(`Vencimento: ${formatDatePtBr(boleto.due_date)}`, 20, 60);
    doc.text(`Codigo: ${boleto.code}`, 20, 70);
    doc.save(`boleto_${boleto.code}.pdf`);
  };

  const onGerarLote = async () => {
    setBatchLoading(true);
    setShowConfirmLote(false);
    await handleGerarLote();
    setBatchLoading(false);
  };

  const onDarBaixa = async () => {
    if (!boletoToPay) {
      return;
    }
    await handleDarBaixa(boletoToPay);
    setBoletoToPay(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black p-8">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  if (error && pagamentos.length === 0 && boletos.length === 0 && alunos.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black p-8 text-white">
        <div className="w-full max-w-xl rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <h3 className="mb-3 text-2xl font-bold">Falha ao carregar o financeiro</h3>
          <p className="mb-6 text-sm text-zinc-400">{error}</p>
          <button
            onClick={() => void loadData()}
            className="rounded-2xl bg-emerald-500 px-6 py-3 font-bold text-black transition-all hover:bg-emerald-600"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <ModuleShell>
      {error ? (
        <div className="flex flex-col gap-3 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-bold text-rose-400">Falha ao atualizar o financeiro</p>
            <p className="text-sm text-zinc-300">{error}</p>
          </div>
          <button
            onClick={() => void loadData()}
            className="rounded-2xl bg-zinc-800 px-5 py-3 font-bold text-white transition-all hover:bg-zinc-700"
          >
            Tentar novamente
          </button>
        </div>
      ) : null}

      <ModuleHero
        badge="Operacao financeira"
        title="Receitas, despesas e cobrancas"
        description="Acompanhe o caixa, os boletos e a situacao financeira das alunas sem espalhar informacoes pela tela."
        accent="emerald"
        chips={[
          { label: 'Receitas', value: formatCurrency(totalReceitas) },
          { label: 'Despesas', value: formatCurrency(totalDespesas) },
          { label: 'Saldo', value: formatCurrency(saldo) },
          { label: 'Boletos', value: String(boletos.length) },
        ]}
        actions={
          <>
            <ModuleHeroAction
              label="Gerar em lote"
              subtitle="Criar cobrancas do mes com menos atrito."
              icon={RefreshCw}
              accent="emerald"
              onClick={() => setShowConfirmLote(true)}
              disabled={batchLoading}
            />
            <ModuleHeroAction
              label="Gerar boleto"
              subtitle="Abrir cobranca individual para uma aluna."
              icon={FileText}
              accent="amber"
              filled
              onClick={() => setShowBoletoModal(true)}
            />
            <ModuleHeroAction
              label="Nova transacao"
              subtitle="Registrar entrada ou saida manual."
              icon={Plus}
              accent="emerald"
              filled
              onClick={() => setShowAddModal(true)}
            />
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <ModuleStatCard
          label="Receitas pagas"
          value={formatCurrency(totalReceitas)}
          detail="Entradas liquidadas consideradas no consolidado atual."
          icon={TrendingUp}
          accent="emerald"
        />
        <ModuleStatCard
          label="Despesas pagas"
          value={formatCurrency(totalDespesas)}
          detail="Saidas pagas consideradas no fechamento do periodo."
          icon={TrendingDown}
          accent="rose"
        />
        <ModuleStatCard
          label="Saldo atual"
          value={formatCurrency(saldo)}
          detail="Resultado liquido entre receitas e despesas registradas."
          icon={Wallet}
          accent="amber"
        />
      </div>

      <ModuleSurface className="space-y-5">
        <ModuleSectionHeading
          eyebrow="Controle financeiro"
          title="Lancamentos e cobrancas"
          description="Use a busca por nome para localizar uma aluna rapidamente e alternar entre a visao geral e a leitura individual."
        />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-zinc-800 bg-black/30 px-4 py-3">
            <Search size={16} className="shrink-0 text-zinc-500" />
            <input
              type="text"
              value={studentSearchTerm}
              onChange={(event) => setStudentSearchTerm(event.target.value)}
              placeholder="Buscar aluna por nome"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
            />
            {studentSearchTerm ? (
              <button
                type="button"
                onClick={() => setStudentSearchTerm('')}
                className="inline-flex items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 p-1.5 text-zinc-400 transition-all hover:border-zinc-700 hover:text-white"
                aria-label="Limpar busca"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>

          <button
            onClick={() => setActiveTab('geral')}
            className={`rounded-2xl px-5 py-3 text-sm font-bold transition-all ${
              activeTab === 'geral'
                ? 'bg-zinc-100 text-zinc-950'
                : 'border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:text-white'
            }`}
          >
            Visao geral
          </button>
          <button
            onClick={() => setActiveTab('alunos')}
            className={`rounded-2xl px-5 py-3 text-sm font-bold transition-all ${
              activeTab === 'alunos'
                ? 'bg-zinc-100 text-zinc-950'
                : 'border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:text-white'
            }`}
          >
            Por aluna
          </button>
        </div>

        {activeTab === 'geral' ? (
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="overflow-hidden rounded-[26px] border border-zinc-800 bg-zinc-950/70">
              <div className="border-b border-zinc-800 px-5 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">Lancamentos</p>
                <h3 className="mt-2 text-lg font-bold text-white">Transacoes registradas</h3>
              </div>
              {pagamentos.length > 0 ? (
                <div className="divide-y divide-zinc-800">
                  {pagamentos.map((pagamento) => (
                    <div key={pagamento.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-white">{pagamento.descricao}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
                          {formatDatePtBr(pagamento.data_vencimento)} • {pagamento.tipo}
                        </p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${
                          pagamento.status === 'pago'
                            ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                            : 'border border-zinc-800 bg-zinc-900 text-zinc-400'
                        }`}
                      >
                        {pagamento.status}
                      </span>
                      <p className="font-mono text-sm font-bold text-white">{formatCurrency(pagamento.valor)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <ModuleEmptyState
                  icon={DollarSign}
                  title="Nenhuma transacao registrada"
                  description="Use nova transacao para registrar uma entrada ou uma despesa manual."
                />
              )}
            </div>

            <div className="overflow-hidden rounded-[26px] border border-zinc-800 bg-zinc-950/70">
              <div className="border-b border-zinc-800 px-5 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">Cobrancas</p>
                <h3 className="mt-2 text-lg font-bold text-white">Boletos emitidos</h3>
              </div>
              {filteredBoletos.length > 0 ? (
                <div className="divide-y divide-zinc-800">
                  {filteredBoletos.map((boleto) => (
                    <div key={boleto.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                      <div className="min-w-0">
                        <p className="truncate font-bold text-white">{boleto.students?.name || 'Sem nome'}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
                          Vence em {formatDatePtBr(boleto.due_date)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={boleto.status} />
                        <span className="font-mono text-sm font-bold text-white">{formatCurrency(boleto.amount)}</span>
                      </div>
                      <div className="flex items-center gap-2 sm:justify-end">
                        {boleto.status !== 'paid' ? (
                          <button
                            onClick={() => setBoletoToPay(boleto)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 transition-all hover:bg-emerald-500 hover:text-black"
                          >
                            <CheckCircle2 size={15} />
                            Dar baixa
                          </button>
                        ) : null}
                        <button
                          onClick={() => generatePDF(boleto)}
                          className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-bold text-white transition-all hover:border-zinc-700"
                        >
                          <Download size={15} />
                          PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ModuleEmptyState
                  icon={FileText}
                  title="Nenhum boleto emitido"
                  description={
                    studentSearchTerm
                      ? 'Nenhum boleto encontrado para a aluna pesquisada.'
                      : 'Gere um boleto individual ou em lote para comecar a acompanhar as cobrancas.'
                  }
                />
              )}
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-[26px] border border-zinc-800 bg-zinc-950/70">
            <div className="border-b border-zinc-800 px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">Leitura por aluna</p>
              <h3 className="mt-2 text-lg font-bold text-white">Financeiro individual</h3>
              <p className="mt-2 text-sm text-zinc-500">Selecione a aluna para abrir o historico completo de cobrancas.</p>
            </div>
            {filteredBoletosPorAluno.length > 0 ? (
              <div className="divide-y divide-zinc-800">
                {filteredBoletosPorAluno.map((aluno) => (
                  <button
                    key={aluno.id}
                    type="button"
                    onClick={() => setSelectedStudent(aluno)}
                    className="grid w-full gap-3 px-5 py-4 text-left transition-all hover:bg-zinc-900/70 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold text-white">{aluno.name}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-zinc-500">
                        {aluno.boletos.length > 0 ? `${aluno.boletos.length} boletos no historico` : 'Sem boletos'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      {aluno.displayBoleto ? (
                        <>
                          <StatusBadge status={aluno.displayBoleto.status} />
                          <span className="font-mono text-sm font-bold text-white">
                            {formatCurrency(aluno.displayBoleto.amount)}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-zinc-500">Sem cobranca ativa</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <ModuleEmptyState
                icon={Wallet}
                title="Nenhuma aluna encontrada"
                description={
                  studentSearchTerm
                    ? 'Nenhuma aluna corresponde ao nome pesquisado.'
                    : 'Ainda nao ha dados financeiros suficientes para montar a visao individual.'
                }
              />
            )}
          </div>
        )}
      </ModuleSurface>

      <AnimatePresence>
        {showBoletoModal ? (
          <ModalFrame title="Gerar boleto" onClose={() => setShowBoletoModal(false)}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGerarBoleto();
              }}
              className="space-y-6"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Aluna *</label>
                <select
                  required
                  value={newBoleto.student_id}
                  onChange={(e) => setNewBoleto({ ...newBoleto, student_id: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
                >
                  <option value="">Selecione uma aluna...</option>
                  {alunos.map((aluna) => (
                    <option key={aluna.id} value={aluna.id}>
                      {aluna.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Valor (R$) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={newBoleto.amount || ''}
                    onChange={(e) => setNewBoleto({ ...newBoleto, amount: parseFloat(e.target.value) })}
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Vencimento *</label>
                  <input
                    required
                    type="date"
                    value={newBoleto.due_date || ''}
                    onChange={(e) => setNewBoleto({ ...newBoleto, due_date: e.target.value })}
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setShowBoletoModal(false)}
                  className="w-full flex-1 rounded-2xl bg-zinc-800 py-4 font-bold text-white transition-all hover:bg-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full flex-1 rounded-2xl bg-amber-500 py-4 font-bold text-black transition-all hover:bg-amber-400"
                >
                  Gerar boleto
                </button>
              </div>
            </form>
          </ModalFrame>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {selectedStudent ? (
          <ModalFrame title={selectedStudent.name} onClose={() => setSelectedStudent(null)} widthClass="max-w-4xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-zinc-500">
                Consulte os boletos da aluna e gere novas cobrancas quando precisar.
              </p>
              <button
                onClick={() => handleGerar3Boletos(selectedStudent.id)}
                className="inline-flex items-center justify-center rounded-2xl bg-amber-500 px-4 py-3 text-sm font-bold text-black transition-all hover:bg-amber-400"
              >
                Gerar 3 boletos
              </button>
            </div>

            <div className="mt-6 overflow-hidden rounded-[24px] border border-zinc-800">
              <div className="hidden grid-cols-[130px_120px_120px_auto] gap-3 border-b border-zinc-800 bg-zinc-950 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500 md:grid">
                <span>Vencimento</span>
                <span>Valor</span>
                <span>Status</span>
                <span>Acoes</span>
              </div>
              {selectedStudent.boletos.length > 0 ? (
                <div className="divide-y divide-zinc-800">
                  {selectedStudent.boletos.map((boleto) => (
                    <div key={boleto.id} className="grid gap-3 px-4 py-4 md:grid-cols-[130px_120px_120px_auto] md:items-center">
                      <div className="font-mono text-sm text-white">{formatDatePtBr(boleto.due_date)}</div>
                      <div className="font-mono text-sm text-white">{formatCurrency(boleto.amount)}</div>
                      <div>
                        <StatusBadge status={boleto.status} />
                      </div>
                      <div className="flex flex-wrap gap-2 md:justify-end">
                        {boleto.status !== 'paid' ? (
                          <button
                            onClick={() => setBoletoToPay(boleto)}
                            className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 transition-all hover:bg-emerald-500 hover:text-black"
                          >
                            Dar baixa
                          </button>
                        ) : null}
                        <button
                          onClick={() => setDeleteConfirmation(boleto.id)}
                          className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 transition-all hover:bg-rose-500 hover:text-white"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ModuleEmptyState
                  icon={FileText}
                  title="Sem boletos para esta aluna"
                  description="Gere uma cobranca individual ou um pacote de boletos para iniciar o historico."
                />
              )}
            </div>
          </ModalFrame>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal ? (
          <ModalFrame title="Nova transacao" onClose={() => setShowAddModal(false)}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateTransacao();
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Descricao *</label>
                  <input
                    required
                    type="text"
                    value={newPagamento.descricao || ''}
                    onChange={(e) => setNewPagamento({ ...newPagamento, descricao: e.target.value })}
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Valor (R$) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={newPagamento.valor || ''}
                    onChange={(e) => setNewPagamento({ ...newPagamento, valor: parseFloat(e.target.value) })}
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Vencimento *</label>
                  <input
                    required
                    type="date"
                    value={newPagamento.data_vencimento || ''}
                    onChange={(e) => setNewPagamento({ ...newPagamento, data_vencimento: e.target.value })}
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 [color-scheme:dark]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Tipo *</label>
                  <select
                    value={newPagamento.tipo || 'receita'}
                    onChange={(e) => setNewPagamento({ ...newPagamento, tipo: e.target.value as typeof newPagamento.tipo })}
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                  >
                    <option value="receita">Receita</option>
                    <option value="despesa">Despesa</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Status *</label>
                  <select
                    value={newPagamento.status || 'pendente'}
                    onChange={(e) => setNewPagamento({ ...newPagamento, status: e.target.value as typeof newPagamento.status })}
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="pago">Pago</option>
                    <option value="vencido">Vencido</option>
                    <option value="atrasado">Atrasado</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-full flex-1 rounded-2xl bg-zinc-800 py-4 font-bold text-white transition-all hover:bg-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full flex-1 rounded-2xl bg-emerald-500 py-4 font-bold text-black transition-all hover:bg-emerald-400"
                >
                  Salvar transacao
                </button>
              </div>
            </form>
          </ModalFrame>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showConfirmLote ? (
          <ModalFrame title="Gerar em lote" onClose={() => setShowConfirmLote(false)} widthClass="max-w-md">
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
                <RefreshCw size={30} />
              </div>
              <p className="text-sm leading-7 text-zinc-400">
                O sistema vai gerar boletos para as alunas que ainda nao possuem cobranca neste mes.
              </p>
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  onClick={() => setShowConfirmLote(false)}
                  className="w-full flex-1 rounded-2xl bg-zinc-800 py-4 font-bold text-white transition-all hover:bg-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={onGerarLote}
                  className="w-full flex-1 rounded-2xl bg-amber-500 py-4 font-bold text-black transition-all hover:bg-amber-400"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </ModalFrame>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {boletoToPay ? (
          <ModalFrame title="Confirmar baixa" onClose={() => setBoletoToPay(null)} widthClass="max-w-md">
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 size={30} />
              </div>
              <div className="space-y-2">
                <p className="text-sm leading-7 text-zinc-400">Confirme o recebimento deste boleto.</p>
                <p className="text-xl font-bold text-white">
                  {formatCurrency(boletoToPay.amount)} • {boletoToPay.students?.name}
                </p>
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  onClick={() => setBoletoToPay(null)}
                  className="w-full flex-1 rounded-2xl bg-zinc-800 py-4 font-bold text-white transition-all hover:bg-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={onDarBaixa}
                  className="w-full flex-1 rounded-2xl bg-emerald-500 py-4 font-bold text-black transition-all hover:bg-emerald-400"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </ModalFrame>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirmation ? (
          <ModalFrame title="Excluir boleto" onClose={() => setDeleteConfirmation(null)} widthClass="max-w-md">
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-400">
                <AlertCircle size={30} />
              </div>
              <p className="text-sm leading-7 text-zinc-400">
                Esta acao nao pode ser desfeita. Deseja realmente excluir este boleto?
              </p>
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  onClick={() => setDeleteConfirmation(null)}
                  className="w-full flex-1 rounded-2xl bg-zinc-800 py-4 font-bold text-white transition-all hover:bg-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleExcluirBoleto}
                  className="w-full flex-1 rounded-2xl bg-rose-500 py-4 font-bold text-white transition-all hover:bg-rose-400"
                >
                  Excluir
                </button>
              </div>
            </div>
          </ModalFrame>
        ) : null}
      </AnimatePresence>

      <Toast notification={notification} onClose={clearNotification} />
    </ModuleShell>
  );
}
