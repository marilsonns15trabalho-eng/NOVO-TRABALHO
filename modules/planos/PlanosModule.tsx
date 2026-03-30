'use client';

import React, { useRef } from 'react';
import { ClipboardList, Loader2, Plus, Sparkles, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePlanos } from '@/hooks/usePlanos';
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

function PlanRow({
  plano,
  onEdit,
  onDelete,
}: {
  plano: {
    id: string;
    name: string;
    description?: string | null;
    price: number | string;
    duration_months: number | string;
    active: boolean;
  };
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="grid gap-4 px-4 py-4 lg:grid-cols-[minmax(0,2fr)_150px_120px_110px_auto] lg:items-center lg:px-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-base font-bold text-white">{plano.name}</p>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${
              plano.active
                ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                : 'border border-rose-500/20 bg-rose-500/10 text-rose-300'
            }`}
          >
            {plano.active ? 'Ativo' : 'Inativo'}
          </span>
        </div>
        <p className="mt-1 truncate text-sm text-zinc-500">
          {plano.description || 'Sem descricao cadastrada.'}
        </p>
      </div>

      <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-3 lg:text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Valor</p>
        <p className="mt-1 text-sm font-bold text-white">
          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(plano.price || 0))}
        </p>
      </div>

      <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-3 lg:text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Duracao</p>
        <p className="mt-1 text-sm font-bold text-white">{plano.duration_months} meses</p>
      </div>

      <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-3 lg:text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Status</p>
        <p className={`mt-1 text-sm font-bold ${plano.active ? 'text-emerald-300' : 'text-rose-300'}`}>
          {plano.active ? 'Disponivel' : 'Pausado'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 lg:justify-end">
        <button
          onClick={onEdit}
          className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-white transition-all hover:border-indigo-500/30 hover:bg-indigo-500/10"
        >
          Editar
        </button>
        <button
          onClick={onDelete}
          className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-zinc-300 transition-all hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-white"
        >
          Excluir
        </button>
      </div>
    </div>
  );
}

export default function PlanosModule() {
  const {
    planos,
    loading,
    showAddModal,
    setShowAddModal,
    editingPlano,
    deleteConfirmation,
    setDeleteConfirmation,
    formData,
    setFormData,
    handleSave,
    startEdit,
    handleConfirmDelete,
    notification,
    clearNotification,
  } = usePlanos();
  const catalogSectionRef = useRef<HTMLDivElement | null>(null);

  const totalPlanos = planos.length;
  const planosAtivos = planos.filter((plano) => plano.active).length;
  const ticketMedio =
    planos.length > 0 ? planos.reduce((total, plano) => total + Number(plano.price || 0), 0) / planos.length : 0;

  return (
    <ModuleShell>
      <ModuleHero
        badge="Portifolio comercial"
        title="Planos e ofertas ativas"
        description="Valores, vigencia e status comercial em um unico lugar."
        accent="indigo"
        chips={[
          { label: 'Total de planos', value: String(totalPlanos) },
          { label: 'Ativos', value: String(planosAtivos) },
          { label: 'Inativos', value: String(Math.max(totalPlanos - planosAtivos, 0)) },
          {
            label: 'Ticket medio',
            value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ticketMedio),
          },
        ]}
        actions={
          <>
            <ModuleHeroAction
              label="Novo plano"
              subtitle="Adicionar uma nova oferta ao catalogo comercial."
              icon={Plus}
              accent="indigo"
              filled
              onClick={() => setShowAddModal(true)}
            />
            <ModuleHeroAction
              label="Catalogo ativo"
              subtitle="Abrir a lista de planos."
              icon={Sparkles}
              accent="indigo"
              onClick={() => catalogSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            />
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <ModuleStatCard
          label="Planos ativos"
          value={String(planosAtivos)}
          detail="Ofertas comerciais prontas para matriculas novas e renovacoes."
          icon={Sparkles}
          accent="indigo"
        />
        <ModuleStatCard
          label="Planos totais"
          value={String(totalPlanos)}
          detail="Quantidade completa de pacotes cadastrados no sistema."
          icon={ClipboardList}
          accent="indigo"
        />
        <ModuleStatCard
          label="Ticket medio"
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ticketMedio)}
          detail="Media de valor entre os planos hoje disponiveis."
          icon={Wallet}
          accent="indigo"
        />
      </div>

      <ModuleSurface className="space-y-5">
        <div ref={catalogSectionRef} />
        <ModuleSectionHeading
          eyebrow="Catalogo"
          title="Planos cadastrados"
          description="Status, valor e duracao dos planos ativos e inativos em uma leitura mais compacta."
          actionLabel="Novo plano"
          onActionClick={() => setShowAddModal(true)}
        />

        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="text-indigo-400 animate-spin" size={40} />
            <p className="text-zinc-500 font-medium">Carregando planos...</p>
          </div>
        ) : planos.length > 0 ? (
          <div className="overflow-hidden rounded-[26px] border border-zinc-800 bg-zinc-950/70 shadow-[0_28px_80px_-54px_rgba(0,0,0,0.9)]">
            {planos.map((plano) => (
              <div key={plano.id} className="border-b border-zinc-800 last:border-b-0">
                <PlanRow
                  plano={plano}
                  onEdit={() => startEdit(plano)}
                  onDelete={() => setDeleteConfirmation(plano.id)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div>
            <ModuleEmptyState
              icon={ClipboardList}
              title="Nenhum plano cadastrado"
              description="Crie o primeiro pacote comercial para estruturar matriculas e vinculacoes com mais clareza."
            />
          </div>
        )}
      </ModuleSurface>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md rounded-[30px] border border-zinc-800 bg-zinc-950 p-8 shadow-[0_36px_120px_-70px_rgba(99,102,241,0.5)]"
            >
              <h3 className="text-2xl font-bold mb-6">{editingPlano ? 'Editar plano' : 'Novo plano'}</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave();
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Nome do plano</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                    placeholder="Ex: trimestral"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Valor total</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Duracao</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={formData.duration_months}
                      onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })}
                      className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Descricao</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full resize-none rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                    placeholder="Detalhes do que esta incluso..."
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="ativo"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="h-4 w-4 rounded border-zinc-800 bg-black text-indigo-500 focus:ring-indigo-500/40"
                  />
                  <label htmlFor="ativo" className="cursor-pointer text-sm font-medium text-zinc-300">
                    Plano ativo
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 rounded-2xl bg-zinc-800 py-4 font-bold text-white transition-all hover:bg-zinc-700"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-2xl bg-indigo-500 py-4 font-bold text-white transition-all hover:bg-indigo-400"
                  >
                    Salvar plano
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirmation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmation(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm rounded-[30px] border border-zinc-800 bg-zinc-950 p-8 shadow-[0_36px_120px_-70px_rgba(0,0,0,0.75)]"
            >
              <h3 className="mb-4 text-xl font-bold">Confirmar exclusao</h3>
              <p className="mb-6 text-zinc-400">
                Tem certeza que deseja excluir este plano? Se ele estiver ativo, sera desativado. Se ja estiver
                desativado, sera excluido permanentemente.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmation(null)}
                  className="flex-1 rounded-xl bg-zinc-800 py-3 font-bold text-white transition-all hover:bg-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 rounded-xl bg-rose-500 py-3 font-bold text-white transition-all hover:bg-rose-400"
                >
                  Excluir
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Toast notification={notification} onClose={clearNotification} />
    </ModuleShell>
  );
}
