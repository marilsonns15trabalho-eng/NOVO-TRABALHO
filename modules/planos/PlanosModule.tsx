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
              subtitle="Veja rapidamente quais pacotes estao prontos para venda."
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
          description="Status, valor e duracao dos planos ativos e inativos."
          actionLabel="Novo plano"
          onActionClick={() => setShowAddModal(true)}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="col-span-full p-20 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="text-indigo-400 animate-spin" size={40} />
              <p className="text-zinc-500 font-medium">Carregando planos...</p>
            </div>
          ) : planos.length > 0 ? (
            planos.map((plano) => (
              <div
                key={plano.id}
                className={`relative flex flex-col overflow-hidden rounded-[28px] border p-7 shadow-[0_26px_90px_-60px_rgba(0,0,0,0.95)] transition-all ${
                  plano.active
                    ? 'border-zinc-800 bg-zinc-950/85 hover:border-indigo-500/40'
                    : 'border-rose-500/20 bg-zinc-950/60 opacity-80'
                }`}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-indigo-500/12 via-indigo-500/0 to-transparent" />

                {!plano.active && (
                  <div className="absolute right-5 top-5 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-rose-300">
                    Inativo
                  </div>
                )}

                <div className="flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-zinc-500">Plano</p>
                  <h3 className="mt-3 pr-16 text-2xl font-bold text-white">{plano.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-500">{plano.description || 'Sem descricao cadastrada.'}</p>

                  <div className="mt-8 flex items-end gap-2">
                    <span className="text-4xl font-bold tracking-tight text-white">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(plano.price || 0))}
                    </span>
                    <span className="pb-1 text-sm text-zinc-500">/ {plano.duration_months} meses</span>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => startEdit(plano)}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-white transition-all hover:border-indigo-500/30 hover:bg-indigo-500/10"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setDeleteConfirmation(plano.id)}
                    className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-zinc-300 transition-all hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-white"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <ModuleEmptyState
                icon={ClipboardList}
                title="Nenhum plano cadastrado"
                description="Crie o primeiro pacote comercial para estruturar matriculas e vinculacoes com mais clareza."
              />
            </div>
          )}
        </div>
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
