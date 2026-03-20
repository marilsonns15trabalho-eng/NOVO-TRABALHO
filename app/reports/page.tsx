'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { 
  BarChart as BarChartIcon, 
  TrendingUp, 
  Users, 
  Download, 
  Filter, 
  Calendar,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Trash2,
  FileText,
  MoreVertical,
  X
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ConfirmModal } from '@/components/ConfirmModal';
import { toast } from 'sonner';

const REVENUE_EXPENSE_DATA = [
  { month: 'Out', revenue: 12000, expense: 8000 },
  { month: 'Nov', revenue: 15000, expense: 9000 },
  { month: 'Dez', revenue: 18000, expense: 11000 },
  { month: 'Jan', revenue: 14000, expense: 8500 },
  { month: 'Fev', revenue: 16000, expense: 9200 },
  { month: 'Mar', revenue: 19500, expense: 10500 },
];

const STUDENT_GROWTH_DATA = [
  { month: 'Out', total: 80, new: 5 },
  { month: 'Nov', total: 88, new: 8 },
  { month: 'Dez', total: 95, new: 7 },
  { month: 'Jan', total: 102, new: 10 },
  { month: 'Fev', total: 115, new: 13 },
  { month: 'Mar', total: 124, new: 9 },
];

const PAYMENT_STATUS_DATA = [
  { name: 'Pago', value: 85, color: '#10b981' },
  { name: 'Pendente', value: 10, color: '#f97316' },
  { name: 'Atrasado', value: 5, color: '#ef4444' },
];

interface SavedReport {
  id: string;
  name: string;
  type: string;
  lastRun: string;
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState('6m');
  const [savedReports, setSavedReports] = useState<SavedReport[]>([
    { id: '1', name: 'Faturamento Mensal Q1', type: 'Financeiro', lastRun: '2024-03-15' },
    { id: '2', name: 'Taxa de Evasão 2023', type: 'Alunos', lastRun: '2024-02-28' },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newReportName, setNewReportName] = useState('');
  const [newReportType, setNewReportType] = useState('Financeiro');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);

  const handleAddReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReportName) {
      toast.error('Por favor, informe o nome do relatório.');
      return;
    }
    const newReport: SavedReport = {
      id: Date.now().toString(),
      name: newReportName,
      type: newReportType,
      lastRun: format(new Date(), 'yyyy-MM-dd'),
    };
    setSavedReports([newReport, ...savedReports]);
    setNewReportName('');
    setIsModalOpen(false);
    toast.success('Relatório salvo com sucesso!');
  };

  const handleDeleteReport = (id: string) => {
    setReportToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteReport = () => {
    if (reportToDelete) {
      setSavedReports(savedReports.filter(r => r.id !== reportToDelete));
      setReportToDelete(null);
      toast.success('Relatório excluído com sucesso!');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#0f1117] text-white font-sans">
      <Sidebar />
      
      <main className="flex-1 flex flex-col">
        <Header />
        
        <div className="p-4 md:p-8 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Relatórios & Análises</h1>
              <p className="text-gray-500 mt-1">Visão detalhada do desempenho do seu estúdio.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-[#1a1d26] p-1 rounded-xl border border-white/5">
                {['1m', '3m', '6m', '1y'].map(range => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                      dateRange === range ? "bg-orange-500 text-white shadow-lg" : "text-gray-500 hover:text-white"
                    )}
                  >
                    {range.toUpperCase()}
                  </button>
                ))}
              </div>
              <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all border border-white/5">
                <Download size={16} />
                Exportar PDF
              </button>
            </div>
          </div>

          {/* Key Metrics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Receita Total', value: 'R$ 19.500', trend: '+12%', up: true, icon: TrendingUp, color: 'orange' },
              { label: 'Novos Alunos', value: '9', trend: '-2', up: false, icon: Users, color: 'emerald' },
              { label: 'Taxa de Retenção', value: '94%', trend: '+2%', up: true, icon: BarChartIcon, color: 'blue' },
              { label: 'Ticket Médio', value: 'R$ 215', trend: '+R$ 15', up: true, icon: PieChartIcon, color: 'purple' },
            ].map((metric, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-[#1a1d26] p-6 rounded-2xl border border-white/5"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("p-2 rounded-lg bg-opacity-10", `bg-${metric.color}-500`, `text-${metric.color}-500`)}>
                    <metric.icon size={20} />
                  </div>
                  <div className={cn("flex items-center gap-1 text-xs font-bold", metric.up ? "text-emerald-500" : "text-red-500")}>
                    {metric.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {metric.trend}
                  </div>
                </div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{metric.label}</p>
                <h3 className="text-2xl font-bold mt-1">{metric.value}</h3>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Revenue vs Expense Chart */}
            <div className="bg-[#1a1d26] p-6 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-lg">Receita vs Despesas</h3>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="text-gray-400">Receita</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-gray-400">Despesas</span>
                  </div>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={REVENUE_EXPENSE_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6b7280', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      tickFormatter={(value) => `R$ ${value/1000}k`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1d26', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Student Growth Chart */}
            <div className="bg-[#1a1d26] p-6 rounded-2xl border border-white/5">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-lg">Crescimento de Alunos</h3>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">
                  <ArrowUpRight size={14} />
                  +15% este semestre
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={STUDENT_GROWTH_DATA}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6b7280', fontSize: 12 }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1d26', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}
                    />
                    <Area type="monotone" dataKey="total" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Saved Reports CRUD Section */}
            <div className="bg-[#1a1d26] p-6 rounded-2xl border border-white/5 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg">Relatórios Salvos</h3>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="p-2 bg-orange-500/10 text-orange-500 rounded-lg hover:bg-orange-500 hover:text-white transition-all"
                >
                  <Plus size={16} />
                </button>
              </div>
              
              <div className="space-y-3 flex-1">
                {savedReports.map((report) => (
                  <div 
                    key={report.id}
                    className="group flex items-center justify-between p-4 rounded-xl bg-[#0f1117] border border-white/5 hover:border-orange-500/30 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-orange-500 transition-colors">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{report.name}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">{report.type} • {report.lastRun}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button className="p-2 text-gray-400 hover:text-white transition-colors">
                        <Download size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteReport(report.id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {savedReports.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-sm italic">Nenhum relatório salvo.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Status Distribution */}
            <div className="bg-[#1a1d26] p-6 rounded-2xl border border-white/5 flex flex-col items-center">
              <h3 className="font-bold text-lg w-full mb-8 text-left">Status de Pagamentos</h3>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={PAYMENT_STATUS_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {PAYMENT_STATUS_DATA.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1d26', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-4 w-full mt-4">
                {PAYMENT_STATUS_DATA.map((item, idx) => (
                  <div key={idx} className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{item.name}</p>
                    <p className="text-lg font-bold" style={{ color: item.color }}>{item.value}%</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Categories Table */}
            <div className="lg:col-span-2 bg-[#1a1d26] p-6 rounded-2xl border border-white/5">
              <h3 className="font-bold text-lg mb-6">Maiores Despesas por Categoria</h3>
              <div className="space-y-4">
                {[
                  { category: 'Aluguel & Infraestrutura', amount: 'R$ 4.500', percentage: 45, color: 'orange' },
                  { category: 'Marketing & Vendas', amount: 'R$ 2.200', percentage: 22, color: 'blue' },
                  { category: 'Equipamentos', amount: 'R$ 1.800', percentage: 18, color: 'emerald' },
                  { category: 'Utilidades (Luz, Água, Internet)', amount: 'R$ 1.000', percentage: 10, color: 'purple' },
                  { category: 'Outros', amount: 'R$ 500', percentage: 5, color: 'gray' },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-gray-300">{item.category}</span>
                      <span className="font-bold">{item.amount}</span>
                    </div>
                    <div className="h-2 w-full bg-[#0f1117] rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.percentage}%` }}
                        transition={{ duration: 1, delay: idx * 0.1 }}
                        className={cn("h-full rounded-full", `bg-${item.color}-500`)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* New Report Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1a1d26] w-full max-w-md rounded-2xl border border-white/5 shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-bold">Salvar Novo Relatório</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddReport} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nome do Relatório</label>
                <input 
                  autoFocus
                  value={newReportName}
                  onChange={(e) => setNewReportName(e.target.value)}
                  placeholder="Ex: Faturamento Mensal..."
                  className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tipo de Dados</label>
                <select 
                  value={newReportType}
                  onChange={(e) => setNewReportType(e.target.value)}
                  className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all appearance-none"
                >
                  <option value="Financeiro">Financeiro</option>
                  <option value="Alunos">Alunos</option>
                  <option value="Treinos">Treinos</option>
                  <option value="Avaliações">Avaliações</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-bold text-gray-400 hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-orange-500/20"
                >
                  Salvar
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteReport}
        title="Excluir Relatório"
        message="Tem certeza que deseja excluir este relatório salvo? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
}
