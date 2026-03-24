'use client';

// AnamneseModule REFATORADO — JSX original preservado, lógica no hook useAnamneses
import React from 'react';
import {
  ClipboardList,
  Plus,
  Loader2,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  ArrowLeft,
  Save,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAnamneses } from '@/hooks/useAnamneses';
import { Toast } from '@/components/ui';

export default function AnamneseModule() {
  const {
    anamneses,
    alunos,
    loading,
    searchTerm,
    setSearchTerm,
    showAddModal,
    setShowAddModal,
    showViewModal,
    setShowViewModal,
    selectedAnamnese,
    viewAnamnese,
    newAnamnese,
    setNewAnamnese,
    handleSave,
    notification,
    clearNotification,
  } = useAnamneses();

  // PDF export (UI-level, no DB)
  const exportToPDF = async (anamnese: any) => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const date = new Date().toLocaleDateString('pt-BR');

    doc.setFillColor(249, 115, 22);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('ANAMNESE NUTRICIONAL', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Gerado em: ${date}`, 105, 30, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text('Informações do Aluno', 14, 50);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Aluno: ${anamnese.students?.nome || 'Não informado'}`, 14, 60);
    doc.text(`Data: ${new Date(anamnese.data).toLocaleDateString('pt-BR')}`, 14, 67);
    doc.text(`Objetivo: ${anamnese.objetivo_nutricional || 'Não informado'}`, 14, 74);

    let currentY = 85;
    const addSection = (title: string, data: [string, string][]) => {
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(title, 14, currentY);
      currentY += 5;
      (autoTable as any)(doc, { startY: currentY, body: data, theme: 'plain', styles: { fontSize: 9, cellPadding: 1 }, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } }, margin: { left: 14 } });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    };

    addSection('Dados de Saúde', [
      ['Doenças Crônicas', anamnese.doencas_cronicas || '-'],
      ['Problemas de Saúde', anamnese.problemas_saude || '-'],
      ['Cirurgias', anamnese.cirurgias || '-'],
      ['Condições Hormonais', anamnese.condicoes_hormonais || '-'],
      ['Alergias', anamnese.alergias || '-'],
      ['Medicamentos', anamnese.medicamentos || '-'],
    ]);
    addSection('Hábitos Alimentares', [
      ['Consumo de Água', anamnese.consumo_agua || '-'],
      ['Frequência Refeições', anamnese.frequencia_refeicoes || '-'],
      ['Consumo Fastfood', anamnese.consumo_fastfood || '-'],
      ['Consumo Doces', anamnese.consumo_doces || '-'],
      ['Consumo Álcool', anamnese.consumo_alcool || '-'],
      ['Suplementos', anamnese.uso_suplementos || '-'],
    ]);
    addSection('Estilo de Vida', [
      ['Atividade Física', anamnese.atividade_fisica || '-'],
      ['Frequência', anamnese.frequencia_atividade_fisica || '-'],
      ['Rotina de Sono', anamnese.rotina_sono || '-'],
      ['Nível de Estresse', anamnese.nivel_estresse || '-'],
    ]);
    if (anamnese.observacoes) {
      addSection('Observações', [['Obs', anamnese.observacoes]]);
    }

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text('Sistema de Gestão Fitness - Profissional', 105, 285, { align: 'center' });
    }

    doc.save(`Anamnese_${anamnese.students?.nome || 'Aluno'}_${anamnese.data}.pdf`);
  };

  return (
    <div className="p-8 space-y-8 bg-black min-h-screen text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Anamnese Nutricional</h2>
          <p className="text-zinc-500">Gerencie o histórico de saúde e hábitos alimentares dos alunos.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-black font-bold px-6 py-3 rounded-2xl transition-all active:scale-95 shadow-lg shadow-orange-500/20"
        >
          <Plus size={20} />
          Nova Anamnese
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-hover:text-orange-500 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Buscar por aluno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
          />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="text-orange-500 animate-spin" size={40} />
            <p className="text-zinc-500 font-medium">Carregando anamneses...</p>
          </div>
        ) : anamneses.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Aluno</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Data</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Objetivo</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-zinc-500 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {anamneses.map((anamnese: any) => (
                  <tr key={anamnese.id} className="hover:bg-zinc-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-orange-500 font-bold border border-zinc-700">
                          {anamnese.students?.nome?.charAt(0) || <User size={16} />}
                        </div>
                        <p className="font-bold text-white">{anamnese.students?.nome || 'Aluno não encontrado'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Calendar size={14} className="text-zinc-600" />
                        {new Date(anamnese.data).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400">
                      {anamnese.objetivo_nutricional || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => viewAnamnese(anamnese)}
                          className="px-4 py-2 bg-zinc-800 hover:bg-orange-500 hover:text-black rounded-xl text-xs font-bold transition-all"
                        >
                          Ver Detalhes
                        </button>
                        <button
                          onClick={() => exportToPDF(anamnese)}
                          className="p-2 text-zinc-500 hover:text-orange-500 hover:bg-orange-500/10 rounded-xl transition-colors"
                          title="Exportar PDF"
                        >
                          <Save size={20} />
                        </button>
                        <button className="p-2 text-zinc-500 hover:text-orange-500 hover:bg-orange-500/10 rounded-xl transition-colors">
                          <MoreVertical size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mb-4">
              <ClipboardList size={40} className="text-zinc-600" />
            </div>
            <h3 className="text-xl font-bold text-white">Nenhuma anamnese encontrada</h3>
            <p className="text-zinc-500 max-w-md">
              Você ainda não cadastrou nenhuma anamnese ou a busca não retornou resultados.
            </p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showViewModal && selectedAnamnese && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-900/50">
                <div>
                  <h3 className="text-xl font-bold text-white">Detalhes da Anamnese</h3>
                  <p className="text-sm text-zinc-500">Aluno: {selectedAnamnese.students?.nome}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => exportToPDF(selectedAnamnese)}
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-black font-bold px-4 py-2 rounded-xl transition-all active:scale-95 shadow-lg shadow-orange-500/20"
                  >
                    <Save size={18} />
                    PDF
                  </button>
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
                  >
                    <ArrowLeft size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto space-y-8">
                {/* Seção Dados de Saúde */}
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-orange-500 border-b border-zinc-800 pb-2">Histórico de Saúde</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Doenças Crônicas</p>
                      <p className="text-white">{selectedAnamnese.doencas_cronicas || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Problemas de Saúde</p>
                      <p className="text-white">{selectedAnamnese.problemas_saude || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Cirurgias</p>
                      <p className="text-white">{selectedAnamnese.cirurgias || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Medicamentos</p>
                      <p className="text-white">{selectedAnamnese.medicamentos || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Seção Hábitos Alimentares */}
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-orange-500 border-b border-zinc-800 pb-2">Hábitos Alimentares</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Consumo de Água</p>
                      <p className="text-white">{selectedAnamnese.consumo_agua || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Frequência de Refeições</p>
                      <p className="text-white">{selectedAnamnese.frequencia_refeicoes || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Restrições Alimentares</p>
                      <p className="text-white">{selectedAnamnese.restricoes_alimentares || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Suplementos</p>
                      <p className="text-white">{selectedAnamnese.uso_suplementos || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Seção Estilo de Vida */}
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-orange-500 border-b border-zinc-800 pb-2">Estilo de Vida</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Atividade Física</p>
                      <p className="text-white">{selectedAnamnese.atividade_fisica || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Rotina de Sono</p>
                      <p className="text-white">{selectedAnamnese.rotina_sono || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Nível de Estresse</p>
                      <p className="text-white">{selectedAnamnese.nivel_estresse || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* Observações */}
                {selectedAnamnese.observacoes && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-orange-500 border-b border-zinc-800 pb-2">Observações Gerais</h4>
                    <p className="text-zinc-300 bg-black/40 p-4 rounded-2xl border border-zinc-800 italic">
                      &quot;{selectedAnamnese.observacoes}&quot;
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between shrink-0">
                <h3 className="text-xl font-bold text-white">Nova Anamnese</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <form id="anamnese-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-8">

                  {/* Dados Básicos */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-orange-500 border-b border-zinc-800 pb-2">Dados Básicos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Aluno *</label>
                        <select
                          required
                          value={newAnamnese.student_id || ''}
                          onChange={(e) => setNewAnamnese({ ...newAnamnese, student_id: e.target.value })}
                          className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                        >
                          <option value="">Selecione um aluno</option>
                          {alunos.map((aluno: any) => (
                            <option key={aluno.id} value={aluno.id}>{aluno.nome}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Data da Anamnese *</label>
                        <input
                          type="date"
                          required
                          value={newAnamnese.data || ''}
                          onChange={(e) => setNewAnamnese({ ...newAnamnese, data: e.target.value })}
                          className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Peso (kg)</label>
                        <input type="number" step="0.1" value={newAnamnese.peso || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, peso: parseFloat(e.target.value) })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Altura (m)</label>
                        <input type="number" step="0.01" value={newAnamnese.altura || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, altura: parseFloat(e.target.value) })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-zinc-400">Objetivo Nutricional</label>
                        <input type="text" value={newAnamnese.objetivo_nutricional || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, objetivo_nutricional: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all" placeholder="Ex: Hipertrofia, Emagrecimento..." />
                      </div>
                    </div>
                  </div>

                  {/* Histórico Médico e Saúde */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-orange-500 border-b border-zinc-800 pb-2">Histórico Médico e Saúde</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Doenças Crônicas</label>
                        <input type="text" value={newAnamnese.doencas_cronicas || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, doencas_cronicas: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Problemas de Saúde</label>
                        <input type="text" value={newAnamnese.problemas_saude || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, problemas_saude: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Cirurgias</label>
                        <input type="text" value={newAnamnese.cirurgias || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, cirurgias: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Condições Hormonais</label>
                        <input type="text" value={newAnamnese.condicoes_hormonais || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, condicoes_hormonais: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Histórico Familiar</label>
                        <input type="text" value={newAnamnese.historico_familiar || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, historico_familiar: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Alergias</label>
                        <input type="text" value={newAnamnese.alergias || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, alergias: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-zinc-400">Medicamentos</label>
                        <input type="text" value={newAnamnese.medicamentos || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, medicamentos: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Acompanhamento Psicológico</label>
                        <input type="text" value={newAnamnese.acompanhamento_psicologico || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, acompanhamento_psicologico: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Distúrbios Alimentares</label>
                        <input type="text" value={newAnamnese.disturbios_alimentares || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, disturbios_alimentares: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Grávida/Amamentando</label>
                        <input type="text" value={newAnamnese.gravida_amamentando || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, gravida_amamentando: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Acompanhamento Prévio</label>
                        <input type="text" value={newAnamnese.acompanhamento_previo || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, acompanhamento_previo: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* Hábitos Alimentares */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-orange-500 border-b border-zinc-800 pb-2">Hábitos Alimentares</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-zinc-400">Hábitos Alimentares Gerais</label>
                        <textarea value={newAnamnese.habitos_alimentares || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, habitos_alimentares: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none min-h-[80px]" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-zinc-400">Restrições Alimentares</label>
                        <input type="text" value={newAnamnese.restricoes_alimentares || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, restricoes_alimentares: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Consumo de Água</label>
                        <input type="text" value={newAnamnese.consumo_agua || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, consumo_agua: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Frequência de Refeições</label>
                        <input type="text" value={newAnamnese.frequencia_refeicoes || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, frequencia_refeicoes: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Horários de Refeições</label>
                        <input type="text" value={newAnamnese.horarios_refeicoes || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, horarios_refeicoes: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Consumo Fastfood</label>
                        <input type="text" value={newAnamnese.consumo_fastfood || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, consumo_fastfood: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Consumo Doces</label>
                        <input type="text" value={newAnamnese.consumo_doces || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, consumo_doces: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Consumo Bebidas Açucaradas</label>
                        <input type="text" value={newAnamnese.consumo_bebidas_acucaradas || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, consumo_bebidas_acucaradas: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Consumo Álcool</label>
                        <input type="text" value={newAnamnese.consumo_alcool || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, consumo_alcool: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Gosta de Cozinhar?</label>
                        <input type="text" value={newAnamnese.gosta_cozinhar || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, gosta_cozinhar: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Consumo Café</label>
                        <input type="text" value={newAnamnese.consumo_cafe || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, consumo_cafe: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Uso de Suplementos</label>
                        <input type="text" value={newAnamnese.uso_suplementos || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, uso_suplementos: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Lanches Fora</label>
                        <input type="text" value={newAnamnese.lanches_fora || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, lanches_fora: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Fome Fora de Horário</label>
                        <input type="text" value={newAnamnese.fome_fora_horario || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, fome_fora_horario: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Come Emocional</label>
                        <input type="text" value={newAnamnese.come_emocional || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, come_emocional: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Beliscar</label>
                        <input type="text" value={newAnamnese.beliscar || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, beliscar: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Compulsão Alimentar</label>
                        <input type="text" value={newAnamnese.compulsao_alimentar || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, compulsao_alimentar: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-zinc-400">Alimentos Preferidos</label>
                        <input type="text" value={newAnamnese.alimentos_preferidos || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, alimentos_preferidos: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-zinc-400">Alimentos Evitados</label>
                        <input type="text" value={newAnamnese.alimentos_evitados || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, alimentos_evitados: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* Estilo de Vida e Treino */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-orange-500 border-b border-zinc-800 pb-2">Estilo de Vida e Treino</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Atividade Física</label>
                        <input type="text" value={newAnamnese.atividade_fisica || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, atividade_fisica: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Frequência Atividade Física</label>
                        <input type="text" value={newAnamnese.frequencia_atividade_fisica || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, frequencia_atividade_fisica: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Objetivos de Treino</label>
                        <input type="text" value={newAnamnese.objetivos_treino || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, objetivos_treino: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Rotina de Sono</label>
                        <input type="text" value={newAnamnese.rotina_sono || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, rotina_sono: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Nível de Estresse</label>
                        <input type="text" value={newAnamnese.nivel_estresse || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, nivel_estresse: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Tempo Sentado</label>
                        <input type="text" value={newAnamnese.tempo_sentado || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, tempo_sentado: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* Medidas e Metas */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-orange-500 border-b border-zinc-800 pb-2">Medidas e Metas</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Circunferência Abdominal</label>
                        <input type="text" value={newAnamnese.circunferencia_abdominal || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, circunferencia_abdominal: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Circunferência Quadril</label>
                        <input type="text" value={newAnamnese.circunferencia_quadril || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, circunferencia_quadril: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Outras Medidas</label>
                        <input type="text" value={newAnamnese.medidas_corpo || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, medidas_corpo: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Estratégias Controle Peso</label>
                        <input type="text" value={newAnamnese.estrategias_controle_peso || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, estrategias_controle_peso: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Meta Peso/Medidas</label>
                        <input type="text" value={newAnamnese.meta_peso_medidas || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, meta_peso_medidas: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Disposição a Mudanças</label>
                        <input type="text" value={newAnamnese.disposicao_mudancas || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, disposicao_mudancas: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Dificuldade com Dietas</label>
                        <input type="text" value={newAnamnese.dificuldade_dietas || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, dificuldade_dietas: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-400">Preferência de Dietas</label>
                        <input type="text" value={newAnamnese.preferencia_dietas || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, preferencia_dietas: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-zinc-400">Expectativas</label>
                        <input type="text" value={newAnamnese.expectativas || ''} onChange={(e) => setNewAnamnese({ ...newAnamnese, expectativas: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* Observações Gerais */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-orange-500 border-b border-zinc-800 pb-2">Observações Gerais</h4>
                    <div className="space-y-2">
                      <textarea
                        value={newAnamnese.observacoes || ''}
                        onChange={(e) => setNewAnamnese({ ...newAnamnese, observacoes: e.target.value })}
                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all min-h-[100px]"
                        placeholder="Adicione qualquer outra informação relevante..."
                      />
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-zinc-800 flex justify-end gap-3 shrink-0 bg-zinc-900">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 rounded-xl font-bold text-white hover:bg-zinc-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="anamnese-form"
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-black font-bold px-6 py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-orange-500/20"
                >
                  <Save size={20} />
                  Salvar Anamnese
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Toast notification={notification} onClose={clearNotification} />
    </div>
  );
}
