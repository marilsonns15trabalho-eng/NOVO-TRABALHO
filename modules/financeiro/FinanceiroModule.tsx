'use client';
import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  RefreshCw,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { useFinanceiro } from '@/hooks/useFinanceiro';
import type { Boleto } from '@/types/financeiro';
import {
  ModuleHero,
  ModuleHeroAction,
  ModuleShell,
  ModuleStatCard,
} from '@/components/dashboard/ModulePrimitives';

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

  // Estado local de UI (não afeta dados)
  const [activeTab, setActiveTab] = useState<'geral' | 'alunos'>('geral');
  const [batchLoading, setBatchLoading] = useState(false);
  const [showConfirmLote, setShowConfirmLote] = useState(false);
  const [boletoToPay, setBoletoToPay] = useState<Boleto | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  // Agrupar boletos por aluno
  const boletosPorAluno = useMemo(() => alunos.map(aluno => {
    const studentBoletos = boletos.filter(b => b.student_id === aluno.id);
    const sorted = studentBoletos.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    const pendingOrLate = sorted.find(b => b.status === 'pending' || b.status === 'late');
    const displayBoleto = pendingOrLate || sorted[sorted.length - 1];
    return { ...aluno, boletos: studentBoletos, displayBoleto };
  }), [alunos, boletos]);

  const totalReceitas = pagamentos.filter(p => p.tipo === 'receita' && p.status === 'pago').reduce((acc, curr) => acc + curr.valor, 0);
  const totalDespesas = pagamentos.filter(p => p.tipo === 'despesa' && p.status === 'pago').reduce((acc, curr) => acc + curr.valor, 0);
  const saldo = totalReceitas - totalDespesas;

  const generatePDF = (boleto: Boleto) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Boleto de Pagamento', 20, 20);
    doc.setFontSize(12);
    doc.text(`Aluno: ${boleto.students?.name || 'N/A'}`, 20, 40);
    doc.text(`Valor: R$ ${boleto.amount.toFixed(2)}`, 20, 50);
    doc.text(`Vencimento: ${new Date(boleto.due_date).toLocaleDateString('pt-BR')}`, 20, 60);
    doc.text(`Código: ${boleto.code}`, 20, 70);
    doc.save(`boleto_${boleto.code}.pdf`);
  };

  const onGerarLote = async () => {
    setBatchLoading(true);
    setShowConfirmLote(false);
    await handleGerarLote();
    setBatchLoading(false);
  };

  const onDarBaixa = async () => {
    if (!boletoToPay) return;
    await handleDarBaixa(boletoToPay);
    setBoletoToPay(null);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-black">
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
      {error && (
        <div className="flex items-center justify-between gap-4 rounded-3xl border border-rose-500/20 bg-rose-500/10 p-5">
          <div>
            <p className="font-bold text-rose-400">Falha ao carregar o financeiro</p>
            <p className="text-sm text-zinc-300">{error}</p>
          </div>
          <button
            onClick={() => void loadData()}
            className="rounded-2xl bg-zinc-800 px-5 py-3 font-bold text-white transition-all hover:bg-zinc-700"
          >
            Tentar novamente
          </button>
        </div>
      )}

      <div className="lioness-toolbar flex items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Financeiro Completo</h2>
          <p className="text-zinc-500">Gestão de transações e boletos.</p>
        </div>
        <div className="lioness-toolbar flex gap-3">
          <button 
            onClick={() => setShowConfirmLote(true)} 
            disabled={batchLoading}
            className="flex items-center gap-2 rounded-2xl bg-zinc-800 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-zinc-700 disabled:opacity-50"
          >
            {batchLoading ? <Loader2 className="animate-spin" size={20} /> : <RefreshCw size={20} />}
            Gerar em Lote
          </button>
          <button onClick={() => setShowBoletoModal(true)} className="flex items-center gap-2 rounded-2xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-black transition-all hover:bg-amber-600">
            <FileText size={20} />
            Gerar Boleto
          </button>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-black transition-all hover:bg-emerald-600">
            <Plus size={20} />
            Nova Transação
          </button>
        </div>
      </div>

      <ModuleHero
        badge="Operacao financeira"
        title="Receitas, despesas e cobrancas"
        description="Visao do caixa, lancamentos e boletos do periodo."
        accent="emerald"
        chips={[
          { label: 'Receitas', value: `R$ ${totalReceitas.toFixed(2)}` },
          { label: 'Despesas', value: `R$ ${totalDespesas.toFixed(2)}` },
          { label: 'Saldo', value: `R$ ${saldo.toFixed(2)}` },
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
              subtitle="Abrir cobranca individual para um aluno."
              icon={FileText}
              accent="amber"
              filled
              onClick={() => setShowBoletoModal(true)}
            />
            <ModuleHeroAction
              label="Nova transacao"
              subtitle="Registrar uma nova entrada ou saida."
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
          value={`R$ ${totalReceitas.toFixed(2)}`}
          detail="Entradas liquidadas consideradas no consolidado atual."
          icon={TrendingUp}
          accent="emerald"
        />
        <ModuleStatCard
          label="Despesas pagas"
          value={`R$ ${totalDespesas.toFixed(2)}`}
          detail="Saidas pagas consideradas no fechamento do periodo."
          icon={TrendingDown}
          accent="rose"
        />
        <ModuleStatCard
          label="Saldo atual"
          value={`R$ ${saldo.toFixed(2)}`}
          detail="Resultado liquido entre receitas e despesas registradas."
          icon={DollarSign}
          accent="amber"
        />
      </div>

      {/* Modal de Boleto */}
      <AnimatePresence>
        {showBoletoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowBoletoModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-2xl shadow-2xl"
            >
              <h3 className="text-2xl font-bold mb-6">Gerar Novo Boleto</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleGerarBoleto(); }} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Aluno *</label>
                  <select 
                    required 
                    value={newBoleto.student_id} 
                    onChange={(e) => setNewBoleto({ ...newBoleto, student_id: e.target.value })}
                    className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all"
                  >
                    <option value="">Selecione um aluno...</option>
                    {alunos.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Valor (R$) *</label>
                    <input required type="number" step="0.01" value={newBoleto.amount || ''} onChange={(e) => setNewBoleto({...newBoleto, amount: parseFloat(e.target.value)})} className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Vencimento *</label>
                    <input required type="date" value={newBoleto.due_date || ''} onChange={(e) => setNewBoleto({...newBoleto, due_date: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 outline-none transition-all [color-scheme:dark]" />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowBoletoModal(false)} className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all">Cancelar</button>
                  <button type="submit" className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-2xl transition-all shadow-lg shadow-amber-500/20">Gerar Boleto</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cabeçalho e Abas */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold">Financeiro</h2>
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-2xl p-1">
          <button onClick={() => setActiveTab('geral')} className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'geral' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}>Geral</button>
          <button onClick={() => setActiveTab('alunos')} className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'alunos' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-white'}`}>Por Aluno</button>
        </div>
      </div>

      {activeTab === 'geral' ? (
        <>
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
              <p className="text-zinc-500 text-sm font-medium mb-1">Receitas (Pagas)</p>
              <h3 className="text-3xl font-bold text-emerald-500">R$ {totalReceitas.toFixed(2)}</h3>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
              <p className="text-zinc-500 text-sm font-medium mb-1">Despesas (Pagas)</p>
              <h3 className="text-3xl font-bold text-rose-500">R$ {totalDespesas.toFixed(2)}</h3>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
              <p className="text-zinc-500 text-sm font-medium mb-1">Saldo Atual</p>
              <h3 className="text-3xl font-bold text-white">R$ {saldo.toFixed(2)}</h3>
            </div>
          </div>

          {/* Tabelas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Transações */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
              <h3 className="p-6 text-xl font-bold border-b border-zinc-800">Transações</h3>
              <table className="w-full text-left">
                <tbody className="divide-y divide-zinc-800">
                  {pagamentos.map(p => (
                    <tr key={p.id}>
                      <td className="px-6 py-4">{p.descricao}</td>
                      <td className="px-6 py-4 font-mono">R$ {p.valor.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Boletos */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
              <h3 className="p-6 text-xl font-bold border-b border-zinc-800">Boletos</h3>
              <table className="w-full text-left">
                <tbody className="divide-y divide-zinc-800">
                  {boletos.map(b => (
                    <tr key={b.id} className="group hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold">{b.students?.name || 'N/A'}</span>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-tighter">Venc: {new Date(b.due_date).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-mono font-bold">R$ {b.amount.toFixed(2)}</span>
                          <span className={`text-[10px] font-bold uppercase ${
                            b.status === 'paid' ? 'text-emerald-500' : 
                            b.status === 'late' ? 'text-rose-500' : 'text-amber-500'
                          }`}>
                            {b.status === 'paid' ? 'Pago' : b.status === 'late' ? 'Atrasado' : 'Pendente'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {b.status !== 'paid' && (
                            <button 
                              onClick={() => setBoletoToPay(b)}
                              className="p-2 text-zinc-500 hover:text-emerald-500 transition-colors"
                              title="Dar Baixa (Pago)"
                            >
                              <CheckCircle2 size={18} />
                            </button>
                          )}
                          <button onClick={() => generatePDF(b)} className="p-2 text-zinc-500 hover:text-white transition-colors" title="Download PDF">
                            <Download size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
          <h3 className="p-6 text-xl font-bold border-b border-zinc-800">Financeiro por Aluno</h3>
          <table className="w-full text-left">
            <thead className="bg-zinc-950 text-zinc-500 text-xs uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Aluno</th>
                <th className="px-6 py-4">Boletos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {boletosPorAluno.map(aluno => (
                <tr key={aluno.id}>
                  <td className="px-6 py-4 font-bold cursor-pointer hover:text-amber-500 transition-colors" onClick={() => setSelectedStudent(aluno)}>{aluno.name}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {aluno.displayBoleto ? (
                        <div className="bg-zinc-800 px-3 py-1 rounded-lg flex items-center gap-2 text-xs">
                          <span className="font-mono">R$ {aluno.displayBoleto.amount.toFixed(2)}</span>
                          <span className={`font-bold uppercase ${
                            aluno.displayBoleto.status === 'paid' ? 'text-emerald-500' : 
                            aluno.displayBoleto.status === 'late' ? 'text-rose-500' : 'text-amber-500'
                          }`}>
                            {aluno.displayBoleto.status === 'paid' ? 'Pago' : aluno.displayBoleto.status === 'late' ? 'Atrasado' : 'Pendente'}
                          </span>
                        </div>
                      ) : <span className="text-zinc-600 text-xs">Sem boletos</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Modal de Detalhes do Aluno */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedStudent(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">{selectedStudent.name}</h3>
                <button onClick={() => handleGerar3Boletos(selectedStudent.id)} className="bg-amber-500 hover:bg-amber-600 text-black font-bold py-2 px-4 rounded-xl transition-all">Gerar 3 Boletos</button>
              </div>
              
              <table className="w-full text-left">
                <thead className="bg-zinc-950 text-zinc-500 text-xs uppercase tracking-widest">
                  <tr>
                    <th className="px-4 py-3">Vencimento</th>
                    <th className="px-4 py-3">Valor</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {selectedStudent.boletos.map((b: any) => (
                    <tr key={b.id}>
                      <td className="px-4 py-3 font-mono">{new Date(b.due_date).toLocaleDateString('pt-BR')}</td>
                      <td className="px-4 py-3 font-mono">R$ {b.amount.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`font-bold uppercase text-xs ${
                          b.status === 'paid' ? 'text-emerald-500' : 
                          b.status === 'late' ? 'text-rose-500' : 'text-amber-500'
                        }`}>
                          {b.status === 'paid' ? 'Pago' : b.status === 'late' ? 'Atrasado' : 'Pendente'}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        {b.status !== 'paid' && (
                          <button onClick={() => setBoletoToPay(b)} className="text-emerald-500 hover:text-emerald-400 font-bold text-xs">Dar Baixa</button>
                        )}
                        <button onClick={() => setDeleteConfirmation(b.id)} className="text-rose-500 hover:text-rose-400 font-bold text-xs">Excluir</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-6">
                <button onClick={() => setSelectedStudent(null)} className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all">Fechar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Transação */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-bold mb-6">Nova Transação</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleCreateTransacao(); }} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Descrição *</label>
                    <input required type="text" value={newPagamento.descricao || ''} onChange={(e) => setNewPagamento({...newPagamento, descricao: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Valor (R$) *</label>
                    <input required type="number" step="0.01" value={newPagamento.valor || ''} onChange={(e) => setNewPagamento({...newPagamento, valor: parseFloat(e.target.value)})} className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Vencimento *</label>
                    <input required type="date" value={newPagamento.data_vencimento || ''} onChange={(e) => setNewPagamento({...newPagamento, data_vencimento: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all [color-scheme:dark]" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Tipo *</label>
                    <select value={newPagamento.tipo || 'receita'} onChange={(e) => setNewPagamento({...newPagamento, tipo: e.target.value as any})} className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all">
                      <option value="receita">Receita</option>
                      <option value="despesa">Despesa</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Status *</label>
                    <select value={newPagamento.status || 'pendente'} onChange={(e) => setNewPagamento({...newPagamento, status: e.target.value as any})} className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all">
                      <option value="pendente">Pendente</option>
                      <option value="pago">Pago</option>
                      <option value="vencido">Vencido</option>
                      <option value="atrasado">Atrasado</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all">Cancelar</button>
                  <button type="submit" className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20">Salvar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmação Lote */}
      <AnimatePresence>
        {showConfirmLote && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirmLote(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-md shadow-2xl text-center">
              <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <RefreshCw size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-2">Gerar em Lote?</h3>
              <p className="text-zinc-400 mb-8">O sistema irá gerar boletos para todos os alunos que ainda não possuem cobrança neste mês.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowConfirmLote(false)} className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all">Cancelar</button>
                <button onClick={onGerarLote} className="flex-1 py-4 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-2xl transition-all">Confirmar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Baixa Manual */}
      <AnimatePresence>
        {boletoToPay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setBoletoToPay(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-md shadow-2xl text-center">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-2">Confirmar Baixa?</h3>
              <p className="text-zinc-400 mb-1">Deseja confirmar o recebimento de:</p>
              <p className="text-xl font-bold text-white mb-8">R$ {boletoToPay.amount.toFixed(2)} - {boletoToPay.students?.name}</p>
              <div className="flex gap-3">
                <button onClick={() => setBoletoToPay(null)} className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all">Cancelar</button>
                <button onClick={onDarBaixa} className="flex-1 py-4 bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-2xl transition-all">Confirmar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notificações (Toast) — posição original: bottom-right */}
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

      {/* Modal de Confirmação Exclusão */}
      <AnimatePresence>
        {deleteConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteConfirmation(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-md shadow-2xl text-center">
              <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-2">Excluir Boleto?</h3>
              <p className="text-zinc-400 mb-8">Esta ação não pode ser desfeita. Deseja realmente excluir este boleto?</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirmation(null)} className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all">Cancelar</button>
                <button onClick={handleExcluirBoleto} className="flex-1 py-4 bg-rose-500 hover:bg-rose-600 text-black font-bold rounded-2xl transition-all">Excluir</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ModuleShell>
  );
}
