'use client';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { 
  Plus, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Filter, 
  Calendar,
  MoreVertical,
  Edit2,
  Trash2,
  X,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Banknote,
  QrCode,
  FileText,
  Download,
  Receipt,
  FilterX,
  PieChart,
  ShoppingBag,
  Home,
  Users,
  Wrench,
  Activity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSettings } from '@/lib/SettingsContext';
import { toast } from 'sonner';
import { StatusBadge } from '@/components/StatusBadge';
import { ConfirmModal } from '@/components/ConfirmModal';

import { supabase } from '@/lib/supabase';

const CATEGORY_ICONS: Record<string, any> = {
  'Mensalidade': CreditCard,
  'Equipamentos': Activity,
  'Aluguel': Home,
  'Marketing': TrendingUp,
  'Salários': Users,
  'Suplementos': ShoppingBag,
  'Manutenção': Wrench,
  'Outros': Plus,
};

const CATEGORY_COLORS: Record<string, string> = {
  'Mensalidade': 'text-emerald-500 bg-emerald-500/10',
  'Equipamentos': 'text-blue-500 bg-blue-500/10',
  'Aluguel': 'text-purple-500 bg-purple-500/10',
  'Marketing': 'text-orange-500 bg-orange-500/10',
  'Salários': 'text-indigo-500 bg-indigo-500/10',
  'Suplementos': 'text-pink-500 bg-pink-500/10',
  'Manutenção': 'text-yellow-500 bg-yellow-500/10',
  'Outros': 'text-gray-500 bg-gray-500/10',
};

const paymentSchema = z.object({
  student_id: z.string().min(1, 'Selecione um aluno'),
  student_name: z.string().min(1, 'Selecione um aluno'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  due_date: z.string().min(1, 'Data de vencimento é obrigatória'),
  payment_date: z.string().optional(),
  status: z.enum(['paid', 'pending', 'overdue']),
  method: z.enum(['pix', 'cash', 'card', 'boleto']).optional(),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.status === 'paid') {
    if (!data.payment_date || data.payment_date === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data de pagamento é obrigatória para status 'Pago'",
        path: ['payment_date'],
      });
    }
    
    if (!data.method) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Método de pagamento é obrigatório para status 'Pago'",
        path: ['method'],
      });
    }

    if (data.payment_date && data.due_date && data.payment_date < data.due_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A data de pagamento deve ser posterior ou igual à data de vencimento",
        path: ['payment_date'],
      });
    }
  }
});

const transactionSchema = z.object({
  description: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Selecione uma categoria'),
  date: z.string().min(1, 'Data é obrigatória'),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;
type TransactionFormValues = z.infer<typeof transactionSchema>;

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string;
  status: 'completed' | 'pending';
}

interface Membership {
  id: string;
  student_id: string;
  student_name: string;
  amount: number;
  due_date: string;
  payment_date?: string;
  status: 'paid' | 'pending' | 'overdue';
  method?: 'pix' | 'cash' | 'card' | 'boleto';
  notes?: string;
}

export default function FinancialPage() {
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = React.useState<'flow' | 'memberships'>('flow');
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [memberships, setMemberships] = React.useState<Membership[]>([]);
  const [students, setStudents] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [transRes, membRes, studRes] = await Promise.all([
        supabase.from('transactions').select('*').order('date', { ascending: false }),
        supabase.from('memberships').select('*').order('due_date', { ascending: false }),
        supabase.from('students').select('id, name').eq('status', 'Ativo')
      ]);

      if (transRes.error) throw transRes.error;
      if (membRes.error) throw membRes.error;
      if (studRes.error) throw studRes.error;

      setTransactions(transRes.data || []);
      setMemberships(membRes.data || []);
      setStudents(studRes.data || []);
    } catch (error: any) {
      console.error('Erro ao buscar dados financeiros:', error);
      toast.error('Erro ao carregar dados financeiros');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);
  const [editingItem, setEditingItem] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [filterCategory, setFilterCategory] = React.useState<string>('all');
  const [dateRange, setDateRange] = React.useState<{ start: string; end: string }>({ start: '', end: '' });
  const [isReceiptOpen, setIsReceiptOpen] = React.useState(false);
  const [viewingReceipt, setViewingReceipt] = React.useState<Membership | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<{ isOpen: boolean; id: string; type: 'flow' | 'membership' }>({
    isOpen: false,
    id: '',
    type: 'flow'
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      status: 'pending',
      method: 'pix',
    }
  });

  const { 
    register: registerFlow, 
    handleSubmit: handleSubmitFlow, 
    reset: resetFlow, 
    setValue: setValueFlow,
    formState: { errors: errorsFlow } 
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'income',
      date: format(new Date(), 'yyyy-MM-dd'),
    }
  });

  React.useEffect(() => {
    if (editingItem) {
      if (activeTab === 'memberships') {
        setValue('student_id', editingItem.student_id);
        setValue('student_name', editingItem.student_name);
        setValue('amount', editingItem.amount);
        setValue('due_date', editingItem.due_date);
        setValue('payment_date', editingItem.payment_date || '');
        setValue('status', editingItem.status);
        setValue('method', editingItem.method || 'pix');
        setValue('notes', editingItem.notes || '');
      } else {
        setValueFlow('description', editingItem.description);
        setValueFlow('amount', editingItem.amount);
        setValueFlow('type', editingItem.type);
        setValueFlow('category', editingItem.category);
        setValueFlow('date', editingItem.date);
      }
    } else {
      reset({
        student_id: '',
        student_name: '',
        amount: 0,
        due_date: format(new Date(), 'yyyy-MM-dd'),
        payment_date: '',
        status: 'pending',
        method: 'pix',
        notes: '',
      });
      resetFlow({
        description: '',
        amount: 0,
        type: 'income',
        category: '',
        date: format(new Date(), 'yyyy-MM-dd'),
      });
    }
  }, [editingItem, setValue, setValueFlow, reset, resetFlow, activeTab]);

  const formatCurrency = (value: number) => {
    const symbol = settings.currency === 'BRL' ? 'R$' : settings.currency === 'USD' ? '$' : '€';
    return `${symbol} ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const totalTransactionIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalMembershipIncome = memberships.filter(m => m.status === 'paid').reduce((acc, m) => acc + m.amount, 0);
  const totalIncome = totalTransactionIncome + totalMembershipIncome;
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || t.category === filterCategory;
    
    let matchesDate = true;
    if (dateRange.start) matchesDate = matchesDate && t.date >= dateRange.start;
    if (dateRange.end) matchesDate = matchesDate && t.date <= dateRange.end;

    return matchesSearch && matchesCategory && matchesDate;
  });

  const filteredMemberships = memberships.filter(m => {
    const matchesSearch = m.student_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || m.status === filterStatus;
    
    let matchesDate = true;
    if (dateRange.start) matchesDate = matchesDate && m.due_date >= dateRange.start;
    if (dateRange.end) matchesDate = matchesDate && m.due_date <= dateRange.end;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterCategory('all');
    setDateRange({ start: '', end: '' });
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      const { error } = await supabase
        .from('memberships')
        .update({
          status: 'paid',
          payment_date: format(new Date(), 'yyyy-MM-dd'),
          method: 'pix'
        })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(`Pagamento marcado como pago!`);
      fetchData();
    } catch (error: any) {
      console.error('Erro ao marcar como pago:', error);
      toast.error('Erro ao atualizar pagamento');
    }
  };

  const exportToCSV = () => {
    const dataToExport = activeTab === 'flow' ? filteredTransactions : filteredMemberships;
    const headers = activeTab === 'flow' 
      ? ['Descrição', 'Valor', 'Tipo', 'Categoria', 'Data', 'Status']
      : ['Aluno', 'Valor', 'Vencimento', 'Pagamento', 'Método', 'Status'];
    
    const csvRows = [
      headers.join(','),
      ...dataToExport.map((item: any) => {
        if (activeTab === 'flow') {
          return [
            item.description,
            item.amount,
            item.type,
            item.category,
            item.date,
            item.status
          ].join(',');
        } else {
          return [
            item.student_name,
            item.amount,
            item.due_date,
            item.payment_date || '-',
            item.method || '-',
            item.status
          ].join(',');
        }
      })
    ];
    
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `financeiro_${activeTab}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const onSavePayment = async (data: PaymentFormValues) => {
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('memberships')
          .update(data)
          .eq('id', editingItem.id);
        
        if (error) throw error;
        toast.success('Pagamento atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('memberships')
          .insert([data]);
        
        if (error) throw error;
        toast.success('Novo pagamento registrado!');
      }
      
      fetchData();
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (error: any) {
      console.error('Erro ao salvar pagamento:', error);
      toast.error('Erro ao salvar pagamento');
    }
  };

  const onSaveTransaction = async (data: TransactionFormValues) => {
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('transactions')
          .update(data)
          .eq('id', editingItem.id);
        
        if (error) throw error;
        toast.success('Transação atualizada com sucesso!');
      } else {
        const { error } = await supabase
          .from('transactions')
          .insert([{ ...data, status: 'completed' }]);
        
        if (error) throw error;
        toast.success('Nova transação registrada!');
      }
      
      fetchData();
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (error: any) {
      console.error('Erro ao salvar transação:', error);
      toast.error('Erro ao salvar transação');
    }
  };

  const confirmDeleteAction = async () => {
    try {
      const table = confirmDelete.type === 'flow' ? 'transactions' : 'memberships';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', confirmDelete.id);
      
      if (error) throw error;
      
      toast.success(confirmDelete.type === 'flow' ? 'Transação excluída' : 'Pagamento excluído');
      fetchData();
    } catch (error: any) {
      console.error('Erro ao excluir item:', error);
      toast.error('Erro ao excluir item');
    }
  };

  const getMethodIcon = (method?: string) => {
    switch (method) {
      case 'pix': return <QrCode size={14} />;
      case 'cash': return <Banknote size={14} />;
      case 'card': return <CreditCard size={14} />;
      case 'boleto': return <FileText size={14} />;
      default: return null;
    }
  };

  const getMethodLabel = (method?: string) => {
    switch (method) {
      case 'pix': return 'PIX';
      case 'cash': return 'Dinheiro';
      case 'card': return 'Cartão';
      case 'boleto': return 'Boleto';
      default: return '-';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#0f1117] text-white font-sans">
      <Sidebar />
      
      <main className="flex-1 flex flex-col">
        <Header />
        
        <div className="p-4 md:p-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gestão Financeira</h1>
              <p className="text-gray-500 text-sm">Controle seu fluxo de caixa e pagamentos em um só lugar.</p>
            </div>
            <button 
              onClick={() => { setEditingItem(null); setIsModalOpen(true); }}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-orange-500/20"
            >
              <Plus size={20} />
              {activeTab === 'flow' ? 'Nova Transação' : 'Novo Pagamento'}
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-[#1a1d26]/40 backdrop-blur-md p-6 rounded-3xl border border-white/10 space-y-4 relative overflow-hidden group shadow-lg"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all" />
              <div className="flex items-center justify-between relative z-10">
                <div className="space-y-1">
                  <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Total Entradas</span>
                  <p className="text-2xl font-bold text-emerald-500">{formatCurrency(totalIncome)}</p>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl group-hover:scale-110 transition-transform">
                  <TrendingUp size={24} />
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between relative z-10">
                <p className="text-[10px] text-gray-500 flex items-center gap-1">
                  <ArrowUpRight size={12} className="text-emerald-500" />
                  <span className="text-emerald-500 font-bold">+12%</span> vs mês anterior
                </p>
                <div className="h-1 w-16 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-3/4" />
                </div>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-[#1a1d26]/40 backdrop-blur-md p-6 rounded-3xl border border-white/10 space-y-4 relative overflow-hidden group shadow-lg"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl -mr-16 -mt-16 group-hover:bg-red-500/20 transition-all" />
              <div className="flex items-center justify-between relative z-10">
                <div className="space-y-1">
                  <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Total Saídas</span>
                  <p className="text-2xl font-bold text-red-500">{formatCurrency(totalExpense)}</p>
                </div>
                <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl group-hover:scale-110 transition-transform">
                  <TrendingDown size={24} />
                </div>
              </div>
              <div className="pt-2 flex items-center justify-between relative z-10">
                <p className="text-[10px] text-gray-500 flex items-center gap-1">
                  <ArrowDownLeft size={12} className="text-red-500" />
                  <span className="text-red-500 font-bold">-5%</span> vs mês anterior
                </p>
                <div className="h-1 w-16 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 w-1/2" />
                </div>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-[#1a1d26]/40 backdrop-blur-md p-6 rounded-3xl border border-white/10 space-y-4 relative overflow-hidden group shadow-lg"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-3xl -mr-16 -mt-16 group-hover:bg-orange-500/20 transition-all" />
              <div className="flex items-center justify-between relative z-10">
                <div className="space-y-1">
                  <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Saldo Atual</span>
                  <p className="text-2xl font-bold text-white">{formatCurrency(balance)}</p>
                </div>
                <div className="p-3 bg-orange-500/10 text-orange-500 rounded-2xl group-hover:scale-110 transition-transform">
                  <DollarSign size={24} />
                </div>
              </div>
              <div className="pt-2 space-y-2 relative z-10">
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>Meta Mensal</span>
                  <span>75%</span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '75%' }}
                    className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full" 
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Tabs */}
          <div className="flex gap-8 border-b border-white/5">
            <button 
              onClick={() => { setActiveTab('flow'); setSearchTerm(''); }}
              className={cn(
                "pb-4 px-2 text-sm font-bold transition-all relative",
                activeTab === 'flow' ? "text-orange-500" : "text-gray-500 hover:text-gray-300"
              )}
            >
              Fluxo de Caixa
              {activeTab === 'flow' && <motion.div layoutId="finTab" className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 rounded-full" />}
            </button>
            <button 
              onClick={() => { setActiveTab('memberships'); setSearchTerm(''); }}
              className={cn(
                "pb-4 px-2 text-sm font-bold transition-all relative",
                activeTab === 'memberships' ? "text-orange-500" : "text-gray-500 hover:text-gray-300"
              )}
            >
              Pagamentos de Alunos
              {activeTab === 'memberships' && <motion.div layoutId="finTab" className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 rounded-full" />}
            </button>
          </div>

          {/* Content */}
          <div className="bg-[#1a1d26]/40 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 bg-[#0f1117]/60 px-4 py-2.5 rounded-2xl border border-white/10 w-full md:w-96 focus-within:border-orange-500/50 transition-all">
                <Search size={18} className="text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Buscar transações ou alunos..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm text-white w-full placeholder:text-gray-600" 
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 bg-[#0f1117] px-3 py-2 rounded-xl border border-white/5">
                  <Calendar size={14} className="text-gray-500" />
                  <input 
                    type="date" 
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="bg-transparent border-none outline-none text-[10px] text-white w-24"
                  />
                  <span className="text-gray-600">-</span>
                  <input 
                    type="date" 
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="bg-transparent border-none outline-none text-[10px] text-white w-24"
                  />
                </div>
                {activeTab === 'flow' ? (
                  <select 
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-[#0f1117] text-xs text-gray-400 border border-white/5 rounded-xl px-3 py-2 outline-none focus:border-orange-500 transition-all"
                  >
                    <option value="all">Todas Categorias</option>
                    {Object.keys(CATEGORY_ICONS).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                ) : (
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-[#0f1117] text-xs text-gray-400 border border-white/5 rounded-xl px-3 py-2 outline-none focus:border-orange-500 transition-all"
                  >
                    <option value="all">Todos Status</option>
                    <option value="paid">Pagos</option>
                    <option value="pending">Pendentes</option>
                    <option value="overdue">Atrasados</option>
                  </select>
                )}
                <button 
                  onClick={clearFilters}
                  className="p-2 text-gray-400 hover:text-white bg-[#0f1117] rounded-xl border border-white/5 flex items-center gap-2 text-xs font-bold transition-all"
                  title="Limpar Filtros"
                >
                  <FilterX size={16} />
                </button>
                <button 
                  onClick={exportToCSV}
                  className="p-2 text-gray-400 hover:text-white bg-[#0f1117] rounded-xl border border-white/5 flex items-center gap-2 text-xs font-bold transition-all"
                >
                  <Download size={16} />
                  Exportar
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-[#0f1117]/50">
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                      {activeTab === 'flow' ? 'Descrição' : 'Aluno'}
                    </th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Valor</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                      {activeTab === 'flow' ? 'Data' : 'Vencimento'}
                    </th>
                    {activeTab === 'memberships' && <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Método</th>}
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="p-4"><div className="h-10 bg-white/5 rounded-xl w-48" /></td>
                        <td className="p-4"><div className="h-6 bg-white/5 rounded-lg w-24" /></td>
                        <td className="p-4"><div className="h-6 bg-white/5 rounded-lg w-32" /></td>
                        {activeTab === 'memberships' && <td className="p-4"><div className="h-6 bg-white/5 rounded-lg w-20" /></td>}
                        <td className="p-4"><div className="h-6 bg-white/5 rounded-lg w-24" /></td>
                        <td className="p-4 text-right"><div className="h-8 bg-white/5 rounded-lg w-16 ml-auto" /></td>
                      </tr>
                    ))
                  ) : activeTab === 'flow' ? (
                    filteredTransactions.length > 0 ? (
                      filteredTransactions.map((t) => {
                        const Icon = CATEGORY_ICONS[t.category] || Plus;
                        const colorClass = CATEGORY_COLORS[t.category] || 'text-gray-500 bg-gray-500/10';
                        
                        return (
                          <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className={cn("p-2 rounded-xl", colorClass)}>
                                  <Icon size={16} />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-white">{t.description}</p>
                                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">{t.category}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={cn("text-sm font-bold", t.type === 'income' ? "text-emerald-500" : "text-red-500")}>
                                {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-gray-400">
                              {format(new Date(t.date), 'dd MMM, yyyy', { locale: ptBR })}
                            </td>
                            <td className="p-4">
                              <StatusBadge status={t.status} />
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => { setEditingItem(t); setIsModalOpen(true); }} className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all"><Edit2 size={16} /></button>
                                <button onClick={() => setConfirmDelete({ isOpen: true, id: t.id, type: 'flow' })} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={16} /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-12 text-center">
                          <div className="flex flex-col items-center gap-3 text-gray-500">
                            <AlertCircle size={48} className="opacity-20" />
                            <p className="text-sm font-medium">Nenhuma transação encontrada.</p>
                          </div>
                        </td>
                      </tr>
                    )
                  ) : (
                    filteredMemberships.length > 0 ? (
                      filteredMemberships.map((m) => (
                        <tr key={m.id} className="hover:bg-white/5 transition-colors group">
                          <td className="p-4">
                            <div>
                              <p className="text-sm font-bold text-white">{m.student_name}</p>
                              {m.notes && <p className="text-[10px] text-gray-500 truncate max-w-[200px]">{m.notes}</p>}
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-sm font-bold text-white">{formatCurrency(m.amount)}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-400">{format(new Date(m.due_date), 'dd/MM/yyyy')}</span>
                              {m.payment_date && (
                                <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                                  <CheckCircle2 size={10} />
                                  Pago em {format(new Date(m.payment_date), 'dd/MM')}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2 text-gray-400">
                              {getMethodIcon(m.method)}
                              <span className="text-xs">{getMethodLabel(m.method)}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <StatusBadge status={m.status} />
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {m.status !== 'paid' && (
                                <button 
                                  onClick={() => handleMarkAsPaid(m.id)}
                                  title="Marcar como Pago Manualmente" 
                                  className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all"
                                >
                                  <CheckCircle2 size={16} />
                                </button>
                              )}
                              <button 
                                onClick={() => { setViewingReceipt(m); setIsReceiptOpen(true); }}
                                title="Ver Recibo" 
                                className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all"
                              >
                                <FileText size={16} />
                              </button>
                              <button onClick={() => { setEditingItem(m); setIsModalOpen(true); }} className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all"><Edit2 size={16} /></button>
                              <button onClick={() => setConfirmDelete({ isOpen: true, id: m.id, type: 'membership' })} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-12 text-center">
                          <div className="flex flex-col items-center gap-3 text-gray-500">
                            <AlertCircle size={48} className="opacity-20" />
                            <p className="text-sm font-medium">Nenhum pagamento encontrado para os filtros selecionados.</p>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* CRUD Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-2xl bg-[#1a1d26] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {editingItem ? 'Editar' : 'Novo'} {activeTab === 'flow' ? 'Transação' : 'Pagamento'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white"><X size={24} /></button>
              </div>
              
              {activeTab === 'flow' ? (
                <form onSubmit={handleSubmitFlow(onSaveTransaction)} className="p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Descrição</label>
                    <input {...registerFlow('description')} placeholder="Ex: Aluguel, Mensalidade..." className={cn("w-full bg-[#0f1117] border rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all", errorsFlow.description ? "border-red-500" : "border-white/5")} />
                    {errorsFlow.description && <p className="text-red-500 text-[10px]">{errorsFlow.description.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Valor (R$)</label>
                      <input {...registerFlow('amount', { valueAsNumber: true })} type="number" step="0.01" placeholder="0,00" className={cn("w-full bg-[#0f1117] border rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all", errorsFlow.amount ? "border-red-500" : "border-white/5")} />
                      {errorsFlow.amount && <p className="text-red-500 text-[10px]">{errorsFlow.amount.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tipo</label>
                      <select {...registerFlow('type')} className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all appearance-none">
                        <option value="income">Entrada</option>
                        <option value="expense">Saída</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Categoria</label>
                      <select {...registerFlow('category')} className={cn("w-full bg-[#0f1117] border rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all appearance-none", errorsFlow.category ? "border-red-500" : "border-white/5")}>
                        <option value="">Selecione...</option>
                        <option value="Mensalidade">Mensalidade</option>
                        <option value="Infraestrutura">Infraestrutura</option>
                        <option value="Equipamentos">Equipamentos</option>
                        <option value="Utilidades">Utilidades</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Outros">Outros</option>
                      </select>
                      {errorsFlow.category && <p className="text-red-500 text-[10px]">{errorsFlow.category.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Data</label>
                      <input {...registerFlow('date')} type="date" className={cn("w-full bg-[#0f1117] border rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all", errorsFlow.date ? "border-red-500" : "border-white/5")} />
                      {errorsFlow.date && <p className="text-red-500 text-[10px]">{errorsFlow.date.message}</p>}
                    </div>
                  </div>
                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 rounded-xl font-bold text-gray-400 hover:bg-white/5 transition-all">Cancelar</button>
                    <button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-orange-500/20">Salvar</button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleSubmit(onSavePayment)} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Aluno</label>
                      <select 
                        {...register('student_id')} 
                        onChange={(e) => {
                          const selectedStudent = students.find(s => s.id === e.target.value);
                          if (selectedStudent) {
                            setValue('student_name', selectedStudent.name);
                          }
                          register('student_id').onChange(e);
                        }}
                        className={cn("w-full bg-[#0f1117] border rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all appearance-none", errors.student_id ? "border-red-500" : "border-white/5")}
                      >
                        <option value="">Selecione um aluno...</option>
                        {students.map(student => (
                          <option key={student.id} value={student.id}>{student.name}</option>
                        ))}
                      </select>
                      {errors.student_id && <p className="text-red-500 text-[10px]">{errors.student_id.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Valor (R$)</label>
                      <input {...register('amount', { valueAsNumber: true })} type="number" step="0.01" placeholder="0,00" className={cn("w-full bg-[#0f1117] border rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all", errors.amount ? "border-red-500" : "border-white/5")} />
                      {errors.amount && <p className="text-red-500 text-[10px]">{errors.amount.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Data de Vencimento</label>
                      <input {...register('due_date')} type="date" className={cn("w-full bg-[#0f1117] border rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all", errors.due_date ? "border-red-500" : "border-white/5")} />
                      {errors.due_date && <p className="text-red-500 text-[10px]">{errors.due_date.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Data do Pagamento {watch('status') === 'paid' ? '(Obrigatório)' : '(Opcional)'}
                      </label>
                      <input {...register('payment_date')} type="date" className={cn("w-full bg-[#0f1117] border rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all", errors.payment_date ? "border-red-500" : "border-white/5")} />
                      {errors.payment_date && <p className="text-red-500 text-[10px]">{errors.payment_date.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Status</label>
                      <select {...register('status')} className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all appearance-none">
                        <option value="pending">Pendente</option>
                        <option value="paid">Pago</option>
                        <option value="overdue">Atrasado</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Método de Pagamento</label>
                      <select {...register('method')} className={cn("w-full bg-[#0f1117] border rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all appearance-none", errors.method ? "border-red-500" : "border-white/5")}>
                        <option value="pix">PIX</option>
                        <option value="cash">Dinheiro</option>
                        <option value="card">Cartão</option>
                        <option value="boleto">Boleto</option>
                      </select>
                      {errors.method && <p className="text-red-500 text-[10px]">{errors.method.message}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Observações</label>
                    <textarea {...register('notes')} placeholder="Alguma observação importante..." rows={3} className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all resize-none" />
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 rounded-xl font-bold text-gray-400 hover:bg-white/5 transition-all">Cancelar</button>
                    <button type="submit" className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-orange-500/20">Salvar Pagamento</button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Receipt View Modal */}
      <AnimatePresence>
        {isReceiptOpen && viewingReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsReceiptOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-md bg-[#1a1d26] rounded-3xl border border-white/10 shadow-2xl overflow-hidden p-8">
              <div className="flex justify-between items-start mb-8">
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-orange-500">Recibo de Pagamento</h2>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">{settings.studioName}</p>
                </div>
                <button onClick={() => setIsReceiptOpen(false)} className="text-gray-500 hover:text-white"><X size={24} /></button>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-[#0f1117] rounded-2xl border border-white/5">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Aluno</p>
                  <p className="text-lg font-bold">{viewingReceipt.student_name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#0f1117] rounded-2xl border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Valor</p>
                    <p className="text-lg font-bold text-emerald-500">{formatCurrency(viewingReceipt.amount)}</p>
                  </div>
                  <div className="p-4 bg-[#0f1117] rounded-2xl border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Status</p>
                    <p className={cn(
                      "text-sm font-bold uppercase",
                      viewingReceipt.status === 'paid' ? "text-emerald-500" : viewingReceipt.status === 'pending' ? "text-orange-500" : "text-red-500"
                    )}>
                      {viewingReceipt.status === 'paid' ? 'Pago' : viewingReceipt.status === 'pending' ? 'Pendente' : 'Atrasado'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#0f1117] rounded-2xl border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Vencimento</p>
                    <p className="text-sm font-medium">{format(new Date(viewingReceipt.due_date), 'dd/MM/yyyy')}</p>
                  </div>
                  <div className="p-4 bg-[#0f1117] rounded-2xl border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Pagamento</p>
                    <p className="text-sm font-medium">{viewingReceipt.payment_date ? format(new Date(viewingReceipt.payment_date), 'dd/MM/yyyy') : '-'}</p>
                  </div>
                </div>

                {viewingReceipt.method && (
                  <div className="p-4 bg-[#0f1117] rounded-2xl border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Método</p>
                    <div className="flex items-center gap-2">
                      {getMethodIcon(viewingReceipt.method)}
                      <p className="text-sm font-medium">{getMethodLabel(viewingReceipt.method)}</p>
                    </div>
                  </div>
                )}

                {viewingReceipt.notes && (
                  <div className="p-4 bg-[#0f1117] rounded-2xl border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Observações</p>
                    <p className="text-sm text-gray-400 italic">&quot;{viewingReceipt.notes}&quot;</p>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-8 border-t border-white/5 flex gap-3">
                <button 
                  onClick={() => window.print()}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-bold transition-all"
                >
                  <Download size={18} />
                  Baixar PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <ConfirmModal 
        isOpen={confirmDelete.isOpen}
        onClose={() => setConfirmDelete({ ...confirmDelete, isOpen: false })}
        onConfirm={confirmDeleteAction}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir este ${confirmDelete.type === 'flow' ? 'registro de fluxo' : 'pagamento'}? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}
