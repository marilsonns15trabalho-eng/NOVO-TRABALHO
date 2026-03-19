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
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useSettings } from '@/lib/SettingsContext';

const paymentSchema = z.object({
  studentName: z.string().min(1, 'Selecione um aluno'),
  amount: z.number().min(0.01, 'Valor deve ser maior que zero'),
  dueDate: z.string().min(1, 'Data de vencimento é obrigatória'),
  paymentDate: z.string().optional(),
  status: z.enum(['paid', 'pending', 'overdue']),
  method: z.enum(['pix', 'cash', 'card', 'boleto']).optional(),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.status === 'paid') {
    if (!data.paymentDate || data.paymentDate === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data de pagamento é obrigatória para status 'Pago'",
        path: ['paymentDate'],
      });
    }
    
    if (!data.method) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Método de pagamento é obrigatório para status 'Pago'",
        path: ['method'],
      });
    }

    if (data.paymentDate && data.dueDate && data.paymentDate < data.dueDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A data de pagamento deve ser posterior ou igual à data de vencimento",
        path: ['paymentDate'],
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
  studentName: string;
  amount: number;
  dueDate: string;
  paymentDate?: string;
  status: 'paid' | 'pending' | 'overdue';
  method?: 'pix' | 'cash' | 'card' | 'boleto';
  notes?: string;
}

const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', description: 'Mensalidade - Ana Souza', amount: 300, type: 'income', category: 'Mensalidade', date: '2024-03-18', status: 'completed' },
  { id: '2', description: 'Aluguel Sala', amount: 2500, type: 'expense', category: 'Infraestrutura', date: '2024-03-15', status: 'completed' },
  { id: '3', description: 'Equipamentos Novos', amount: 1200, type: 'expense', category: 'Equipamentos', date: '2024-03-12', status: 'completed' },
  { id: '4', description: 'Mensalidade - Lucas Pereira', amount: 250, type: 'income', category: 'Mensalidade', date: '2024-03-10', status: 'completed' },
  { id: '5', description: 'Energia Elétrica', amount: 450, type: 'expense', category: 'Utilidades', date: '2024-03-05', status: 'pending' },
];

const INITIAL_MEMBERSHIPS: Membership[] = [
  { id: '1', studentName: 'Ana Souza', amount: 300, dueDate: '2024-03-20', paymentDate: '2024-03-18', status: 'paid', method: 'pix', notes: 'Pago via PIX antecipado' },
  { id: '2', studentName: 'Lucas Pereira', amount: 250, dueDate: '2024-03-18', status: 'overdue', notes: 'Aguardando contato' },
  { id: '3', studentName: 'Carla Mendes', amount: 180, dueDate: '2024-03-22', status: 'pending' },
  { id: '4', studentName: 'João Lima', amount: 150, dueDate: '2024-03-25', status: 'pending' },
];

const STUDENTS_LIST = [
  'Ana Souza',
  'Lucas Pereira',
  'Carla Mendes',
  'João Lima',
  'Mariana Silva',
  'Ricardo Oliveira',
  'Beatriz Santos'
];

const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

export default function FinancialPage() {
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = React.useState<'flow' | 'memberships'>('flow');
  const [transactions, setTransactions] = React.useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [memberships, setMemberships] = React.useState<Membership[]>(INITIAL_MEMBERSHIPS);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<string>('all');
  const [dateRange, setDateRange] = React.useState<{ start: string; end: string }>({ start: '', end: '' });
  const [isReceiptOpen, setIsReceiptOpen] = React.useState(false);
  const [viewingReceipt, setViewingReceipt] = React.useState<Membership | null>(null);

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
        setValue('studentName', editingItem.studentName);
        setValue('amount', editingItem.amount);
        setValue('dueDate', editingItem.dueDate);
        setValue('paymentDate', editingItem.paymentDate || '');
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
        studentName: '',
        amount: 0,
        dueDate: format(new Date(), 'yyyy-MM-dd'),
        paymentDate: '',
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

  const filteredTransactions = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMemberships = memberships.filter(m => {
    const matchesSearch = m.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || m.status === filterStatus;
    
    let matchesDate = true;
    if (dateRange.start) {
      matchesDate = matchesDate && m.dueDate >= dateRange.start;
    }
    if (dateRange.end) {
      matchesDate = matchesDate && m.dueDate <= dateRange.end;
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleMarkAsPaid = (id: string) => {
    setMemberships(prev => prev.map(m => {
      if (m.id === id) {
        return {
          ...m,
          status: 'paid',
          paymentDate: format(new Date(), 'yyyy-MM-dd'),
          method: 'pix'
        };
      }
      return m;
    }));
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
            item.studentName,
            item.amount,
            item.dueDate,
            item.paymentDate || '-',
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

  const onSavePayment = (data: PaymentFormValues) => {
    const newItem: Membership = {
      id: editingItem ? editingItem.id : generateId('pay'),
      ...data,
    };

    if (editingItem) {
      setMemberships(memberships.map(m => m.id === editingItem.id ? newItem : m));
    } else {
      setMemberships([newItem, ...memberships]);
    }
    
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const onSaveTransaction = (data: TransactionFormValues) => {
    const newItem: Transaction = {
      id: editingItem ? editingItem.id : generateId('flow'),
      ...data,
      status: 'completed',
    };

    if (editingItem) {
      setTransactions(transactions.map(t => t.id === editingItem.id ? newItem : t));
    } else {
      setTransactions([newItem, ...transactions]);
    }
    
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm('Excluir esta transação?')) {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const handleDeleteMembership = (id: string) => {
    if (confirm('Excluir este pagamento?')) {
      setMemberships(memberships.filter(m => m.id !== id));
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
            <div className="bg-[#1a1d26] p-6 rounded-2xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm font-medium">Total Entradas</span>
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                  <TrendingUp size={18} />
                </div>
              </div>
              <p className="text-3xl font-bold text-emerald-500">{formatCurrency(totalIncome)}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <ArrowUpRight size={12} className="text-emerald-500" />
                +12% em relação ao mês anterior
              </p>
            </div>

            <div className="bg-[#1a1d26] p-6 rounded-2xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm font-medium">Total Saídas</span>
                <div className="p-2 bg-red-500/10 text-red-500 rounded-lg">
                  <TrendingDown size={18} />
                </div>
              </div>
              <p className="text-3xl font-bold text-red-500">{formatCurrency(totalExpense)}</p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <ArrowDownLeft size={12} className="text-red-500" />
                -5% em relação ao mês anterior
              </p>
            </div>

            <div className="bg-[#1a1d26] p-6 rounded-2xl border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm font-medium">Saldo Atual</span>
                <div className="p-2 bg-orange-500/10 text-orange-500 rounded-lg">
                  <DollarSign size={18} />
                </div>
              </div>
              <p className="text-3xl font-bold text-white">{formatCurrency(balance)}</p>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: '75%' }} />
              </div>
            </div>
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
          <div className="bg-[#1a1d26] rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 bg-[#0f1117] px-4 py-2 rounded-xl border border-white/5 w-full md:w-96">
                <Search size={16} className="text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-white w-full" 
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 bg-[#0f1117] px-3 py-2 rounded-lg border border-white/5">
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
                {activeTab === 'memberships' && (
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-[#0f1117] text-xs text-gray-400 border border-white/5 rounded-lg px-3 py-2 outline-none focus:border-orange-500 transition-all"
                  >
                    <option value="all">Todos Status</option>
                    <option value="paid">Pagos</option>
                    <option value="pending">Pendentes</option>
                    <option value="overdue">Atrasados</option>
                  </select>
                )}
                <button 
                  onClick={exportToCSV}
                  className="p-2 text-gray-400 hover:text-white bg-[#0f1117] rounded-lg border border-white/5 flex items-center gap-2 text-xs font-bold"
                >
                  <Download size={16} />
                  Exportar
                </button>
                <button className="p-2 text-gray-400 hover:text-white bg-[#0f1117] rounded-lg border border-white/5"><Filter size={18} /></button>
                <button className="p-2 text-gray-400 hover:text-white bg-[#0f1117] rounded-lg border border-white/5"><Calendar size={18} /></button>
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
                  {activeTab === 'flow' ? (
                    filteredTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                        <td className="p-4">
                          <div>
                            <p className="text-sm font-bold text-white">{t.description}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{t.category}</p>
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
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                            t.status === 'completed' ? "bg-emerald-500/10 text-emerald-500" : "bg-orange-500/10 text-orange-500"
                          )}>
                            {t.status === 'completed' ? 'Concluído' : 'Pendente'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => { setEditingItem(t); setIsModalOpen(true); }} className="p-2 text-gray-500 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all"><Edit2 size={16} /></button>
                            <button onClick={() => handleDeleteTransaction(t.id)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    filteredMemberships.map((m) => (
                      <tr key={m.id} className="hover:bg-white/5 transition-colors group">
                        <td className="p-4">
                          <div>
                            <p className="text-sm font-bold text-white">{m.studentName}</p>
                            {m.notes && <p className="text-[10px] text-gray-500 truncate max-w-[200px]">{m.notes}</p>}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm font-bold text-white">{formatCurrency(m.amount)}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-400">{format(new Date(m.dueDate), 'dd/MM/yyyy')}</span>
                            {m.paymentDate && (
                              <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                                <CheckCircle2 size={10} />
                                Pago em {format(new Date(m.paymentDate), 'dd/MM')}
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
                            {m.status === 'paid' && <CheckCircle2 size={14} className="text-emerald-500" />}
                            {m.status === 'pending' && <Clock size={14} className="text-orange-500" />}
                            {m.status === 'overdue' && <AlertCircle size={14} className="text-red-500" />}
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-wider",
                              m.status === 'paid' ? "text-emerald-500" : m.status === 'pending' ? "text-orange-500" : "text-red-500"
                            )}>
                              {m.status === 'paid' ? 'Pago' : m.status === 'pending' ? 'Pendente' : 'Atrasado'}
                            </span>
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
                            <button onClick={() => handleDeleteMembership(m.id)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
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
                      <select {...register('studentName')} className={cn("w-full bg-[#0f1117] border rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all appearance-none", errors.studentName ? "border-red-500" : "border-white/5")}>
                        <option value="">Selecione um aluno...</option>
                        {STUDENTS_LIST.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                      {errors.studentName && <p className="text-red-500 text-[10px]">{errors.studentName.message}</p>}
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
                      <input {...register('dueDate')} type="date" className={cn("w-full bg-[#0f1117] border rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all", errors.dueDate ? "border-red-500" : "border-white/5")} />
                      {errors.dueDate && <p className="text-red-500 text-[10px]">{errors.dueDate.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        Data do Pagamento {watch('status') === 'paid' ? '(Obrigatório)' : '(Opcional)'}
                      </label>
                      <input {...register('paymentDate')} type="date" className={cn("w-full bg-[#0f1117] border rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all", errors.paymentDate ? "border-red-500" : "border-white/5")} />
                      {errors.paymentDate && <p className="text-red-500 text-[10px]">{errors.paymentDate.message}</p>}
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
                  <p className="text-lg font-bold">{viewingReceipt.studentName}</p>
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
                    <p className="text-sm font-medium">{format(new Date(viewingReceipt.dueDate), 'dd/MM/yyyy')}</p>
                  </div>
                  <div className="p-4 bg-[#0f1117] rounded-2xl border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Pagamento</p>
                    <p className="text-sm font-medium">{viewingReceipt.paymentDate ? format(new Date(viewingReceipt.paymentDate), 'dd/MM/yyyy') : '-'}</p>
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
    </div>
  );
}
