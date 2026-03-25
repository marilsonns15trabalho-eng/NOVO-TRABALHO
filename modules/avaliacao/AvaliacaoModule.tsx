'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Activity, 
  Plus, 
  Loader2,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  User,
  Scale,
  Ruler,
  TrendingUp,
  BarChart as BarChartIcon,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ChartWrapper from './ChartWrapper';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart,
  Bar,
  Cell
} from 'recharts';

interface Avaliacao {
  id: string;
  student_id: string;
  data: string;
  peso: number;
  altura: number;
  
  // Perímetros
  ombro?: number;
  torax?: number;
  braco_direito?: number;
  braco_esquerdo?: number;
  antebraco_direito?: number;
  antebraco_esquerdo?: number;
  cintura?: number;
  abdome?: number;
  quadril?: number;
  coxa_direita?: number;
  coxa_esquerda?: number;
  panturrilha_direita?: number;
  panturrilha_esquerda?: number;

  // Dobras Cutâneas (4 dobras Faulkner)
  tricipital?: number;
  subescapular?: number;
  supra_iliaca?: number;
  abdominal?: number;

  observacoes?: string;
  
  // Resultados (calculados)
  imc?: number;
  percentual_gordura?: number;
  massa_gorda?: number;
  massa_magra?: number;
  soma_dobras?: number;
  protocolo?: 'faulkner' | 'pollock7' | 'pollock3';
  
  created_at: string;
  students?: { nome: string, sexo?: string, data_nascimento?: string };
}

export default function AvaliacaoModule() {
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAvaliacao, setEditingAvaliacao] = useState<Avaliacao | null>(null);
  const [newAvaliacao, setNewAvaliacao] = useState<Partial<Avaliacao>>({
    student_id: '',
    data: new Date().toISOString().split('T')[0],
    protocolo: 'faulkner'
  });
  const [alunosList, setAlunosList] = useState<{id: string, nome: string, sexo?: string, data_nascimento?: string}[]>([]);
  
  // Estado para o modal de relatório detalhado
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Avaliacao | null>(null);
  const [historicoAluno, setHistoricoAluno] = useState<Avaliacao[]>([]);
  const [loadingHistorico, setLoadingHistorico] = useState(false);

  // Estados para o seletor de aluno no formulário
  const [alunoSearch, setAlunoSearch] = useState('');
  const [showAlunoDropdown, setShowAlunoDropdown] = useState(false);

  // Estados para filtros de visualização
  const [filterAluno, setFilterAluno] = useState('');
  const [filterDataInicio, setFilterDataInicio] = useState('');
  const [filterDataFim, setFilterDataFim] = useState('');

  const fetchAvaliacoes = async () => {
    const { data, error } = await supabase
      .from('avaliacoes')
      .select(`
        *,
        students (
          nome: name
        )
      `)
      .order('data', { ascending: false });

    if (error) {
      console.error('Erro ao buscar avaliações:', error.message);
    } else {
      // Mapear dados JSONB de volta para o formato flat da UI
      const flattenedData = (data || []).map((item: any) => {
        const peso = item.peso || 0;
        const massa_magra = item.massa_magra || 0;
        const massa_gorda = parseFloat((peso - massa_magra).toFixed(2));
        
        return {
          ...item,
          ...item.medidas,
          ...item.dobras,
          percentual_gordura: item.gordura_corporal,
          soma_dobras: item.dobras?.soma_dobras,
          massa_gorda: massa_gorda
        };
      });
      setAvaliacoes(flattenedData);
    }
    setLoading(false);
  };

  const fetchAlunosList = async () => {
    try {
      const { data, error } = await supabase.from('students').select('*').order('name', { ascending: true });
      
      if (error) {
        console.warn('Erro ao buscar alunos por "name", tentando "nome":', error.message);
        const { data: dataNome, error: errorNome } = await supabase.from('students').select('*').order('nome', { ascending: true });
        if (errorNome) throw errorNome;
        setAlunosList(dataNome?.map(a => ({ id: a.id, nome: a.nome || a.name, sexo: a.sexo, data_nascimento: a.data_nascimento })) || []);
      } else {
        setAlunosList(data?.map(a => ({ id: a.id, nome: a.name || a.nome, sexo: a.sexo, data_nascimento: a.data_nascimento })) || []);
      }
    } catch (err) {
      console.error('Erro fatal ao buscar lista de alunos:', err);
    }
  };

  useEffect(() => {
    fetchAvaliacoes();
    fetchAlunosList();
  }, []);

  // Cálculo automático de resultados (IMC, %Gordura, Massa Gorda, Massa Magra)
  useEffect(() => {
    if (newAvaliacao.peso && newAvaliacao.altura) {
      // Ajuste de altura se estiver em cm
      const alturaMetros = newAvaliacao.altura > 3 ? newAvaliacao.altura / 100 : newAvaliacao.altura;
      const imc = parseFloat((newAvaliacao.peso / (alturaMetros * alturaMetros)).toFixed(2));
      
      let percentual_gordura = newAvaliacao.percentual_gordura || 0;
      let soma_dobras = 0;
      
      // Se tiver as 4 dobras do Faulkner, calcula o %Gordura
      if (newAvaliacao.protocolo === 'faulkner' && 
          newAvaliacao.tricipital && 
          newAvaliacao.subescapular && 
          newAvaliacao.supra_iliaca && 
          newAvaliacao.abdominal) {
        soma_dobras = parseFloat((newAvaliacao.tricipital + newAvaliacao.subescapular + newAvaliacao.supra_iliaca + newAvaliacao.abdominal).toFixed(1));
        percentual_gordura = parseFloat((soma_dobras * 0.153 + 5.783).toFixed(2));
      }

      const massa_gorda = parseFloat((newAvaliacao.peso * (percentual_gordura / 100)).toFixed(2));
      const massa_magra = parseFloat((newAvaliacao.peso - massa_gorda).toFixed(2));

      // Só atualiza se houver mudança real para evitar loops
      if (imc !== newAvaliacao.imc || 
          percentual_gordura !== newAvaliacao.percentual_gordura || 
          massa_gorda !== newAvaliacao.massa_gorda || 
          massa_magra !== newAvaliacao.massa_magra ||
          soma_dobras !== newAvaliacao.soma_dobras) {
        setNewAvaliacao(prev => ({
          ...prev,
          imc,
          percentual_gordura,
          massa_gorda,
          massa_magra,
          soma_dobras
        }));
      }
    }
  }, [
    newAvaliacao.peso, 
    newAvaliacao.altura, 
    newAvaliacao.tricipital, 
    newAvaliacao.subescapular, 
    newAvaliacao.supra_iliaca, 
    newAvaliacao.abdominal,
    newAvaliacao.protocolo,
    newAvaliacao.imc,
    newAvaliacao.percentual_gordura,
    newAvaliacao.massa_gorda,
    newAvaliacao.massa_magra,
    newAvaliacao.soma_dobras
  ]);

  const handleViewReport = async (avaliacao: Avaliacao) => {
    setSelectedReport(avaliacao);
    setShowReportModal(true);
    setLoadingHistorico(true);
    
    try {
      const { data, error } = await supabase
        .from('avaliacoes')
        .select('*')
        .eq('student_id', avaliacao.student_id)
        .order('data', { ascending: true });
        
      if (error) throw error;

      // Mapear dados JSONB de volta para o formato flat da UI para o histórico
      const flattenedHistory = (data || []).map((item: any) => {
        const peso = item.peso || 0;
        const massa_magra = item.massa_magra || 0;
        const massa_gorda = parseFloat((peso - massa_magra).toFixed(2));

        return {
          ...item,
          ...item.medidas,
          ...item.dobras,
          percentual_gordura: item.gordura_corporal,
          soma_dobras: item.dobras?.soma_dobras,
          massa_gorda: massa_gorda
        };
      });

      setHistoricoAluno(flattenedHistory);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    } finally {
      setLoadingHistorico(false);
    }
  };

  const exportToPDF = async (avaliacao: Avaliacao) => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Cabeçalho
    doc.setFillColor(147, 51, 234); // Purple 600
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('RELATÓRIO DE AVALIAÇÃO FÍSICA', 15, 25);
    
    doc.setFontSize(10);
    doc.text(`Data: ${new Date(avaliacao.data).toLocaleDateString('pt-BR')}`, 15, 33);

    // Dados do Aluno
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text('Dados do Aluno', 15, 55);
    doc.setDrawColor(147, 51, 234);
    doc.line(15, 57, 60, 57);

    doc.setFontSize(11);
    doc.text(`Nome: ${avaliacao.students?.nome}`, 15, 65);
    doc.text(`Peso: ${avaliacao.peso} kg`, 15, 72);
    doc.text(`Altura: ${avaliacao.altura} m`, 15, 79);
    doc.text(`IMC: ${avaliacao.imc}`, 15, 86);

    // Composição Corporal
    doc.setFontSize(14);
    doc.text('Composição Corporal (Faulkner)', 110, 55);
    doc.line(110, 57, 180, 57);

    doc.setFontSize(11);
    doc.text(`% Gordura: ${avaliacao.percentual_gordura}%`, 110, 65);
    doc.text(`Massa Magra: ${avaliacao.massa_magra} kg`, 110, 72);
    doc.text(`Massa Gorda: ${avaliacao.massa_gorda} kg`, 110, 79);

    // Gráfico de Composição Corporal (Simples)
    const chartX = 110;
    const chartY = 85;
    const chartWidth = 80;
    const chartHeight = 15;
    
    // Fundo do gráfico
    doc.setFillColor(240, 240, 240);
    doc.rect(chartX, chartY, chartWidth, chartHeight, 'F');
    
    // Barra de Massa Magra
    const pesoVal = avaliacao.peso || 1;
    const magraVal = avaliacao.massa_magra || 0;
    const gordaVal = avaliacao.massa_gorda || 0;

    const magraWidth = Math.max(0, Math.min(chartWidth, (magraVal / pesoVal) * chartWidth));
    const gordaWidth = Math.max(0, Math.min(chartWidth - magraWidth, (gordaVal / pesoVal) * chartWidth));

    if (!isNaN(magraWidth) && magraWidth > 0) {
      doc.setFillColor(16, 185, 129); // Emerald 500
      doc.rect(chartX, chartY, magraWidth, chartHeight, 'F');
    }
    
    if (!isNaN(gordaWidth) && gordaWidth > 0) {
      doc.setFillColor(239, 68, 68); // Red 500
      doc.rect(chartX + magraWidth, chartY, gordaWidth, chartHeight, 'F');
    }
    
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text('Verde: Massa Magra | Vermelho: Massa Gorda', chartX, chartY + chartHeight + 5);
    doc.setTextColor(0, 0, 0);

    // Tabela de Perímetros
    doc.setFontSize(14);
    doc.text('Perímetros (cm)', 15, 105);
    
    const perimetrosData = [
      ['Ombro', avaliacao.ombro || '-'],
      ['Tórax', avaliacao.torax || '-'],
      ['Cintura', avaliacao.cintura || '-'],
      ['Abdome', avaliacao.abdome || '-'],
      ['Quadril', avaliacao.quadril || '-'],
      ['Braço D/E', `${avaliacao.braco_direito || '-'} / ${avaliacao.braco_esquerdo || '-'}`],
      ['Coxa D/E', `${avaliacao.coxa_direita || '-'} / ${avaliacao.coxa_esquerda || '-'}`],
      ['Panturrilha D/E', `${avaliacao.panturrilha_direita || '-'} / ${avaliacao.panturrilha_esquerda || '-'}`],
    ];

    autoTable(doc, {
      startY: 110,
      head: [['Medida', 'Valor']],
      body: perimetrosData,
      theme: 'striped',
      headStyles: { fillColor: [147, 51, 234] },
      margin: { left: 15 },
      tableWidth: 85
    });

    // Tabela de Dobras
    doc.setFontSize(14);
    doc.text('Dobras Cutâneas (mm)', 110, 105);

    const dobrasData = [
      ['Tricipital', avaliacao.tricipital || '-'],
      ['Subescapular', avaliacao.subescapular || '-'],
      ['Supra-ilíaca', avaliacao.supra_iliaca || '-'],
      ['Abdominal', avaliacao.abdominal || '-'],
    ];

    autoTable(doc, {
      startY: 110,
      head: [['Dobra', 'Valor']],
      body: dobrasData,
      theme: 'striped',
      headStyles: { fillColor: [147, 51, 234] },
      margin: { left: 110 },
      tableWidth: 85
    });

    // Observações
    if (avaliacao.observacoes) {
      const finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.text('Observações', 15, finalY);
      doc.setFontSize(10);
      doc.text(avaliacao.observacoes, 15, finalY + 7, { maxWidth: 180 });
    }

    // Rodapé
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('Sistema de Gestão Fitness - Relatório Profissional', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }

    doc.save(`Avaliacao_${avaliacao.students?.nome}_${avaliacao.data}.pdf`);
  };

  const handleEdit = (avaliacao: Avaliacao) => {
    setEditingAvaliacao(avaliacao);
    setNewAvaliacao(avaliacao);
    setAlunoSearch(avaliacao.students?.nome || '');
    setShowAddModal(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const mockUserId = '00000000-0000-0000-0000-000000000000';

    // Mapeamento para a estrutura JSONB do seu banco de dados
    const payload = {
      student_id: newAvaliacao.student_id,
      data: newAvaliacao.data,
      peso: newAvaliacao.peso,
      altura: newAvaliacao.altura,
      imc: newAvaliacao.imc,
      gordura_corporal: newAvaliacao.percentual_gordura,
      massa_magra: newAvaliacao.massa_magra,
      medidas: {
        ombro: newAvaliacao.ombro,
        torax: newAvaliacao.torax,
        cintura: newAvaliacao.cintura,
        abdome: newAvaliacao.abdome,
        quadril: newAvaliacao.quadril,
        braco_direito: newAvaliacao.braco_direito,
        braco_esquerdo: newAvaliacao.braco_esquerdo,
        coxa_direita: newAvaliacao.coxa_direita,
        coxa_esquerda: newAvaliacao.coxa_esquerda,
        panturrilha_direita: newAvaliacao.panturrilha_direita,
        panturrilha_esquerda: newAvaliacao.panturrilha_esquerda,
      },
      dobras: {
        tricipital: newAvaliacao.tricipital,
        subescapular: newAvaliacao.subescapular,
        supra_iliaca: newAvaliacao.supra_iliaca,
        abdominal: newAvaliacao.abdominal,
        soma_dobras: newAvaliacao.soma_dobras,
      }
    };

    try {
      if (editingAvaliacao) {
        const { error } = await supabase
          .from('avaliacoes')
          .update(payload)
          .eq('id', editingAvaliacao.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('avaliacoes')
          .insert([payload]);
        if (error) throw error;
      }
      
      setShowAddModal(false);
      setEditingAvaliacao(null);
      setNewAvaliacao({ student_id: '', data: new Date().toISOString().split('T')[0] });
      setAlunoSearch('');
      
      fetchAvaliacoes();
    } catch (error: any) {
      console.error('Erro ao salvar avaliação:', error);
      alert(`Erro ao salvar: ${error.message}`);
    }
  };

  // Filtros de visualização
  const filteredAvaliacoes = avaliacoes.filter(a => {
    const matchAluno = filterAluno ? (a.students?.nome || '').toLowerCase().includes(filterAluno.toLowerCase()) : true;
    const matchInicio = filterDataInicio ? new Date(a.data) >= new Date(filterDataInicio) : true;
    const matchFim = filterDataFim ? new Date(a.data) <= new Date(filterDataFim) : true;
    return matchAluno && matchInicio && matchFim;
  });

  // Filtro para o seletor de aluno no modal
  const filteredAlunosList = alunosList.filter(a => 
    (a.nome || '').toLowerCase().includes((alunoSearch || '').toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 bg-black min-h-screen text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Avaliação Física</h2>
          <p className="text-zinc-500">Acompanhe a evolução corporal e os resultados dos seus alunos.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white font-bold px-6 py-3 rounded-2xl transition-all active:scale-95 shadow-lg shadow-purple-500/20"
        >
          <Plus size={20} />
          Nova Avaliação
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-hover:text-purple-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome do aluno..." 
            value={filterAluno}
            onChange={(e) => setFilterAluno(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all"
          />
        </div>
        <div className="flex gap-2">
          <input type="date" value={filterDataInicio} onChange={(e) => setFilterDataInicio(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all [color-scheme:dark]" />
          <input type="date" value={filterDataFim} onChange={(e) => setFilterDataFim(e.target.value)} className="bg-zinc-900 border border-zinc-800 rounded-2xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all [color-scheme:dark]" />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="text-purple-500 animate-spin" size={40} />
            <p className="text-zinc-500 font-medium">Carregando avaliações...</p>
          </div>
        ) : filteredAvaliacoes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Aluno</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Data</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Peso / Altura</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">BF (%)</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredAvaliacoes.map((avaliacao) => (
                  <tr key={avaliacao.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-500/20 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                          <User size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-white group-hover:text-purple-400 transition-colors">{avaliacao.students?.nome}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-zinc-300">
                        <Calendar size={14} className="text-zinc-500" />
                        {new Date(avaliacao.data).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20">
                        <Activity size={12} />
                        {avaliacao.percentual_gordura ? `${avaliacao.percentual_gordura}%` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleViewReport(avaliacao)}
                        className="px-4 py-2 bg-purple-500/10 text-purple-500 hover:bg-purple-500 hover:text-white rounded-xl text-xs font-bold transition-all mr-2"
                      >
                        Ver Relatório
                      </button>
                      <button 
                        onClick={() => handleEdit(avaliacao)}
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold transition-all mr-2"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-20 text-center space-y-4">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
              <Activity className="text-zinc-600" size={32} />
            </div>
            <h3 className="text-xl font-bold">Nenhuma avaliação cadastrada</h3>
            <p className="text-zinc-500">Registre a primeira avaliação física para acompanhar a evolução.</p>
          </div>
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
                <div>
                  <h3 className="text-3xl font-bold text-white">{selectedReport.students?.nome}</h3>
                  <p className="text-zinc-500">Relatório de Avaliação Física - {new Date(selectedReport.data).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => exportToPDF(selectedReport)}
                    className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2"
                  >
                    Exportar PDF
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
                  {historicoAluno.length > 1 && historicoAluno.findIndex(a => a.id === selectedReport.id) > 0 && (
                    (() => {
                      const currentIndex = historicoAluno.findIndex(a => a.id === selectedReport.id);
                      const prevEval = historicoAluno[currentIndex - 1];
                      if (!prevEval || prevEval.percentual_gordura === undefined) return null;
                      const diff = selectedReport.percentual_gordura! - prevEval.percentual_gordura!;
                      return (
                        <div className={`absolute top-4 right-4 text-xs font-bold flex items-center gap-1 ${
                          diff < 0 ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                          {diff < 0 ? '↓' : '↑'}
                          {Math.abs(diff).toFixed(1)}%
                        </div>
                      );
                    })()
                  )}
                </div>
                <div className="bg-black/40 border border-zinc-800 p-6 rounded-2xl text-center relative">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Massa Magra</p>
                  <p className="text-4xl font-black text-emerald-500">{selectedReport.massa_magra || 0} kg</p>
                  {historicoAluno.length > 1 && historicoAluno.findIndex(a => a.id === selectedReport.id) > 0 && (
                    (() => {
                      const currentIndex = historicoAluno.findIndex(a => a.id === selectedReport.id);
                      const prevEval = historicoAluno[currentIndex - 1];
                      if (!prevEval || prevEval.massa_magra === undefined) return null;
                      const diff = selectedReport.massa_magra! - prevEval.massa_magra!;
                      return (
                        <div className={`absolute top-4 right-4 text-xs font-bold flex items-center gap-1 ${
                          diff > 0 ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                          {diff > 0 ? '↑' : '↓'}
                          {Math.abs(diff).toFixed(1)}kg
                        </div>
                      );
                    })()
                  )}
                </div>
                <div className="bg-black/40 border border-zinc-800 p-6 rounded-2xl text-center relative">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Massa Gorda</p>
                  <p className="text-4xl font-black text-red-500">{selectedReport.massa_gorda || 0} kg</p>
                  {historicoAluno.length > 1 && historicoAluno.findIndex(a => a.id === selectedReport.id) > 0 && (
                    (() => {
                      const currentIndex = historicoAluno.findIndex(a => a.id === selectedReport.id);
                      const prevEval = historicoAluno[currentIndex - 1];
                      if (!prevEval || prevEval.massa_gorda === undefined) return null;
                      const diff = selectedReport.massa_gorda! - prevEval.massa_gorda!;
                      return (
                        <div className={`absolute top-4 right-4 text-xs font-bold flex items-center gap-1 ${
                          diff < 0 ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                          {diff < 0 ? '↓' : '↑'}
                          {Math.abs(diff).toFixed(1)}kg
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>

              {/* Dashboard de Evolução */}
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
                          tickFormatter={(val) => new Date(val).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        />
                        <YAxis stroke="#71717a" fontSize={10} domain={['auto', 'auto']} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                          labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                          labelFormatter={(val) => new Date(val).toLocaleDateString('pt-BR')}
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
                          tickFormatter={(val) => new Date(val).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        />
                        <YAxis stroke="#71717a" fontSize={10} domain={[0, 'auto']} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                          labelStyle={{ color: '#a1a1aa', fontWeight: 'bold' }}
                          labelFormatter={(val) => new Date(val).toLocaleDateString('pt-BR')}
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

        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-zinc-900 border border-zinc-800 rounded-3xl p-8 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-bold mb-6">Nova Avaliação</h3>
              <form onSubmit={handleAdd} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5 relative">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Aluno *</label>
                      <input 
                        required 
                        type="text" 
                        value={alunoSearch}
                        onChange={(e) => {
                          setAlunoSearch(e.target.value);
                          setShowAlunoDropdown(true);
                        }}
                        onFocus={() => setShowAlunoDropdown(true)}
                        className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all" 
                        placeholder="Digite ou selecione o aluno..."
                      />
                      {showAlunoDropdown && (
                        <div className="absolute z-20 w-full bg-zinc-900 border border-zinc-800 rounded-xl mt-1 max-h-48 overflow-y-auto shadow-2xl">
                          {filteredAlunosList.length > 0 ? (
                            filteredAlunosList.map(aluno => (
                              <div 
                                key={aluno.id}
                                onClick={() => {
                                  setNewAvaliacao({...newAvaliacao, student_id: aluno.id});
                                  setAlunoSearch(aluno.nome);
                                  setShowAlunoDropdown(false);
                                }}
                                className="px-4 py-2 hover:bg-purple-500/20 cursor-pointer text-sm text-white"
                              >
                                {aluno.nome}
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
                    <input required type="date" value={newAvaliacao.data || ''} onChange={(e) => setNewAvaliacao({...newAvaliacao, data: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all [color-scheme:dark]" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Protocolo</label>
                    <select 
                      value={newAvaliacao.protocolo} 
                      onChange={(e) => setNewAvaliacao({...newAvaliacao, protocolo: e.target.value as any})}
                      className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all"
                    >
                      <option value="faulkner">Faulkner (4 Dobras)</option>
                      <option value="pollock7">Pollock (7 Dobras) - Em breve</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Peso (kg) *</label>
                    <input required type="number" step="0.1" value={newAvaliacao.peso || ''} onChange={(e) => setNewAvaliacao({...newAvaliacao, peso: parseFloat(e.target.value)})} className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all" placeholder="75.5" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Altura (m) *</label>
                    <input required type="number" step="0.01" value={newAvaliacao.altura || ''} onChange={(e) => setNewAvaliacao({...newAvaliacao, altura: parseFloat(e.target.value)})} className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all" placeholder="1.75" />
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-4">
                  <h4 className="text-lg font-bold mb-4 text-purple-500">Perímetros (cm)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Ombro</label>
                      <input type="number" step="0.1" value={newAvaliacao.ombro || ''} onChange={(e) => setNewAvaliacao({...newAvaliacao, ombro: parseFloat(e.target.value)})} className="w-full bg-black border border-zinc-800 rounded-xl py-2 px-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Tórax</label>
                      <input type="number" step="0.1" value={newAvaliacao.torax || ''} onChange={(e) => setNewAvaliacao({...newAvaliacao, torax: parseFloat(e.target.value)})} className="w-full bg-black border border-zinc-800 rounded-xl py-2 px-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Cintura</label>
                      <input type="number" step="0.1" value={newAvaliacao.cintura || ''} onChange={(e) => setNewAvaliacao({...newAvaliacao, cintura: parseFloat(e.target.value)})} className="w-full bg-black border border-zinc-800 rounded-xl py-2 px-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Abdome</label>
                      <input type="number" step="0.1" value={newAvaliacao.abdome || ''} onChange={(e) => setNewAvaliacao({...newAvaliacao, abdome: parseFloat(e.target.value)})} className="w-full bg-black border border-zinc-800 rounded-xl py-2 px-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Quadril</label>
                      <input type="number" step="0.1" value={newAvaliacao.quadril || ''} onChange={(e) => setNewAvaliacao({...newAvaliacao, quadril: parseFloat(e.target.value)})} className="w-full bg-black border border-zinc-800 rounded-xl py-2 px-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Braço Dir.</label>
                      <input type="number" step="0.1" value={newAvaliacao.braco_direito || ''} onChange={(e) => setNewAvaliacao({...newAvaliacao, braco_direito: parseFloat(e.target.value)})} className="w-full bg-black border border-zinc-800 rounded-xl py-2 px-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Braço Esq.</label>
                      <input type="number" step="0.1" value={newAvaliacao.braco_esquerdo || ''} onChange={(e) => setNewAvaliacao({...newAvaliacao, braco_esquerdo: parseFloat(e.target.value)})} className="w-full bg-black border border-zinc-800 rounded-xl py-2 px-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Coxa Dir.</label>
                      <input type="number" step="0.1" value={newAvaliacao.coxa_direita || ''} onChange={(e) => setNewAvaliacao({...newAvaliacao, coxa_direita: parseFloat(e.target.value)})} className="w-full bg-black border border-zinc-800 rounded-xl py-2 px-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Coxa Esq.</label>
                      <input type="number" step="0.1" value={newAvaliacao.coxa_esquerda || ''} onChange={(e) => setNewAvaliacao({...newAvaliacao, coxa_esquerda: parseFloat(e.target.value)})} className="w-full bg-black border border-zinc-800 rounded-xl py-2 px-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Panturrilha Dir.</label>
                      <input type="number" step="0.1" value={newAvaliacao.panturrilha_direita || ''} onChange={(e) => setNewAvaliacao({...newAvaliacao, panturrilha_direita: parseFloat(e.target.value)})} className="w-full bg-black border border-zinc-800 rounded-xl py-2 px-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Panturrilha Esq.</label>
                      <input type="number" step="0.1" value={newAvaliacao.panturrilha_esquerda || ''} onChange={(e) => setNewAvaliacao({...newAvaliacao, panturrilha_esquerda: parseFloat(e.target.value)})} className="w-full bg-black border border-zinc-800 rounded-xl py-2 px-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-4">
                  <h4 className="text-lg font-bold mb-4 text-purple-500">Dobras Cutâneas (mm)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Tricipital</label>
                      <input type="number" step="0.1" value={newAvaliacao.tricipital || ''} onChange={(e) => setNewAvaliacao({...newAvaliacao, tricipital: parseFloat(e.target.value)})} className="w-full bg-black border border-zinc-800 rounded-xl py-2 px-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Subescapular</label>
                      <input type="number" step="0.1" value={newAvaliacao.subescapular || ''} onChange={(e) => setNewAvaliacao({...newAvaliacao, subescapular: parseFloat(e.target.value)})} className="w-full bg-black border border-zinc-800 rounded-xl py-2 px-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Supra-ilíaca</label>
                      <input type="number" step="0.1" value={newAvaliacao.supra_iliaca || ''} onChange={(e) => setNewAvaliacao({...newAvaliacao, supra_iliaca: parseFloat(e.target.value)})} className="w-full bg-black border border-zinc-800 rounded-xl py-2 px-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Abdominal</label>
                      <input type="number" step="0.1" value={newAvaliacao.abdominal || ''} onChange={(e) => setNewAvaliacao({...newAvaliacao, abdominal: parseFloat(e.target.value)})} className="w-full bg-black border border-zinc-800 rounded-xl py-2 px-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-800 pt-4">
                  <h4 className="text-lg font-bold mb-4 text-purple-500">Resultados</h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Soma Dobras</label>
                      <input type="number" readOnly value={newAvaliacao.soma_dobras || ''} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-400 cursor-not-allowed outline-none" placeholder="0.0" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">IMC</label>
                      <input type="number" readOnly value={newAvaliacao.imc || ''} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-400 cursor-not-allowed outline-none" placeholder="Calculado auto." />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">% Gordura (BF)</label>
                      <input type="number" step="0.1" value={newAvaliacao.percentual_gordura || ''} onChange={(e) => setNewAvaliacao({...newAvaliacao, percentual_gordura: parseFloat(e.target.value)})} className="w-full bg-black border border-zinc-800 rounded-xl py-2 px-3 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Massa Gorda (kg)</label>
                      <input type="number" readOnly value={newAvaliacao.massa_gorda || ''} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-400 cursor-not-allowed outline-none" placeholder="Calculado auto." />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Massa Magra (kg)</label>
                      <input type="number" readOnly value={newAvaliacao.massa_magra || ''} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-2 px-3 text-zinc-400 cursor-not-allowed outline-none" placeholder="Calculado auto." />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Observações</label>
                  <textarea value={newAvaliacao.observacoes || ''} onChange={(e) => setNewAvaliacao({...newAvaliacao, observacoes: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all min-h-[100px]" placeholder="Observações gerais..."></textarea>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all">Cancelar</button>
                  <button type="submit" className="flex-1 py-4 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-purple-500/20">Salvar Avaliação</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
