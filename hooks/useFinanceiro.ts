'use client';

// Hook customizado para o módulo Financeiro
import { useState, useEffect, useCallback } from 'react';
import * as financeiroService from '@/services/financeiro.service';
import { useNotification } from '@/hooks/useNotification';
import type { Pagamento, Boleto, FinanceiroStudent, PagamentoFormData, BoletoFormData } from '@/types/financeiro';

type TabFinanceiro = 'overview' | 'boletos' | 'alunos';

export function useFinanceiro() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [alunos, setAlunos] = useState<FinanceiroStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabFinanceiro>('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // Modais
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBoletoModal, setShowBoletoModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

  // Formulário de transação
  const [newPagamento, setNewPagamento] = useState<PagamentoFormData>({
    valor: 0,
    data_vencimento: new Date().toISOString().split('T')[0],
    status: 'pendente',
    tipo: 'receita',
    descricao: '',
  });

  // Formulário de boleto
  const [newBoleto, setNewBoleto] = useState<BoletoFormData>({
    student_id: '',
    amount: 0,
    due_date: new Date().toISOString().split('T')[0],
  });

  const { notification, showNotification, clearNotification } = useNotification();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await financeiroService.fetchFinanceiroData();
      setPagamentos(data.pagamentos);
      setBoletos(data.boletos);
      setAlunos(data.alunos);
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /** Cria uma nova transação */
  const handleCreateTransacao = useCallback(async () => {
    try {
      await financeiroService.createTransacao(newPagamento);
      showNotification('Transação registrada com sucesso!', 'success');
      setShowAddModal(false);
      setNewPagamento({
        valor: 0,
        data_vencimento: new Date().toISOString().split('T')[0],
        status: 'pendente',
        tipo: 'receita',
        descricao: '',
      });
      await loadData();
    } catch (error: any) {
      showNotification(`Erro: ${error.message}`, 'error');
    }
  }, [newPagamento, loadData, showNotification]);

  /** Gera um boleto manualmente */
  const handleGerarBoleto = useCallback(async () => {
    try {
      await financeiroService.gerarBoleto(newBoleto);
      showNotification('Boleto gerado com sucesso!', 'success');
      setShowBoletoModal(false);
      setNewBoleto({ student_id: '', amount: 0, due_date: new Date().toISOString().split('T')[0] });
      await loadData();
    } catch (error: any) {
      showNotification(`Erro: ${error.message}`, 'error');
    }
  }, [newBoleto, loadData, showNotification]);

  /** Gera 3 boletos futuros para um aluno */
  const handleGerar3Boletos = useCallback(async (studentId: string) => {
    try {
      const count = await financeiroService.gerar3Boletos(studentId, alunos, boletos);
      showNotification(`${count} boletos gerados com sucesso!`, 'success');
      await loadData();
    } catch (error: any) {
      showNotification(`Erro: ${error.message}`, 'error');
    }
  }, [alunos, boletos, loadData, showNotification]);

  /** Gera boletos em lote */
  const handleGerarLote = useCallback(async () => {
    try {
      const count = await financeiroService.gerarBoletosEmLote(alunos);
      if (count === 0) {
        showNotification('Todos os alunos já possuem cobrança neste mês.', 'error');
      } else {
        showNotification(`${count} boletos gerados com sucesso!`, 'success');
      }
      await loadData();
    } catch (error: any) {
      showNotification(`Erro: ${error.message}`, 'error');
    }
  }, [alunos, loadData, showNotification]);

  /** Dá baixa manual em um boleto */
  const handleDarBaixa = useCallback(async (boleto: Boleto) => {
    try {
      await financeiroService.darBaixaManual(boleto);
      showNotification('Baixa realizada com sucesso!', 'success');
      await loadData();
    } catch (error: any) {
      showNotification(`Erro: ${error.message}`, 'error');
    }
  }, [loadData, showNotification]);

  /** Exclui um boleto */
  const handleExcluirBoleto = useCallback(async () => {
    if (!deleteConfirmation) return;
    try {
      await financeiroService.excluirBoleto(deleteConfirmation);
      showNotification('Boleto excluído.', 'success');
      setDeleteConfirmation(null);
      await loadData();
    } catch (error: any) {
      showNotification(`Erro: ${error.message}`, 'error');
    }
  }, [deleteConfirmation, loadData, showNotification]);

  return {
    pagamentos,
    boletos,
    alunos,
    loading,
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
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
    showNotification,
    clearNotification,
  };
}
