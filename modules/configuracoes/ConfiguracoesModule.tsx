'use client';

import React, { useRef, useState } from 'react';
import {
  Building2,
  FileText,
  Image as ImageIcon,
  Database,
  Loader2,
  Mail,
  MapPin,
  Palette,
  Phone,
  Save,
  Settings,
} from 'lucide-react';
import { motion } from 'motion/react';
import AppPermissionsPanel from '@/components/app/AppPermissionsPanel';
import { useConfiguracoes } from '@/hooks/useConfiguracoes';
import {
  ModuleHero,
  ModuleHeroAction,
  ModuleShell,
  ModuleStatCard,
  ModuleSurface,
  ModuleSectionHeading,
} from '@/components/dashboard/ModulePrimitives';
import { importLegacyLpeRefresh } from '@/services/legacyImport.service';

export default function ConfiguracoesModule() {
  const {
    config,
    setConfig,
    loading,
    saving,
    notification,
    clearNotification,
    handleSave,
  } = useConfiguracoes();
  const visualSectionRef = useRef<HTMLDivElement | null>(null);
  const [importingLegacy, setImportingLegacy] = useState(false);
  const [legacyImportFeedback, setLegacyImportFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleLegacyImport = async (dryRun: boolean) => {
    setImportingLegacy(true);
    setLegacyImportFeedback(null);

    try {
      const result = await importLegacyLpeRefresh(dryRun);
      setLegacyImportFeedback({
        type: 'success',
        message: dryRun
          ? `Simulacao concluida: ${result.imported_students.length} alunos e ${result.imported_avaliacoes.length} avaliacoes prontas para importacao.`
          : `Importacao concluida: ${result.imported_students.length} alunos e ${result.imported_avaliacoes.length} avaliacoes processadas. Senha inicial: ${result.default_password}.`,
      });
    } catch (error) {
      setLegacyImportFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Nao foi possivel executar a importacao do legado.',
      });
    } finally {
      setImportingLegacy(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-transparent">
        <Loader2 className="text-sky-400 animate-spin" size={40} />
      </div>
    );
  }

  return (
    <ModuleShell>
      <ModuleHero
        badge="Identidade do sistema"
        title="Dados da academia e identidade visual"
        description="Contato, cores, textos e informacoes institucionais do sistema."
        accent="sky"
        chips={[
          { label: 'Academia', value: config.nome_academia || 'Nao configurada' },
          { label: 'Contato', value: config.email || 'Sem e-mail' },
          { label: 'Cor primaria', value: config.cor_primaria || '#3b82f6' },
          { label: 'Cor secundaria', value: config.cor_secundaria || '#18181b' },
        ]}
        actions={
          <>
            <ModuleHeroAction
              label="Salvar configuracoes"
              subtitle="Gravar alteracoes institucionais e visuais."
              icon={Save}
              accent="sky"
              filled
              onClick={handleSave}
              disabled={saving}
            />
            <ModuleHeroAction
              label="Identidade do sistema"
              subtitle="Revisar logo, cores e textos base do app."
              icon={Settings}
              accent="sky"
              onClick={() => visualSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            />
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <ModuleStatCard
          label="Empresa"
          value={config.nome_academia || 'Sem nome'}
          detail="Nome principal exibido nas areas institucionais do sistema."
          icon={Building2}
          accent="sky"
        />
        <ModuleStatCard
          label="Canal oficial"
          value={config.telefone || config.email || 'Nao definido'}
          detail="Contato principal que aparece para equipe e alunos."
          icon={Phone}
          accent="sky"
        />
        <ModuleStatCard
          label="Boas-vindas"
          value={config.mensagem_boas_vindas ? 'Configurada' : 'Pendente'}
          detail="Mensagem inicial usada para recepcionar os alunos no aplicativo."
          icon={FileText}
          accent="sky"
        />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <ModuleSurface className="max-w-5xl space-y-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-8"
          >
            {notification && (
              <div
                className={`rounded-2xl border p-4 text-sm font-bold ${
                  notification.type === 'success'
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                    : 'border-rose-500/20 bg-rose-500/10 text-rose-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span>{notification.message}</span>
                  <button type="button" onClick={clearNotification} className="text-xs uppercase tracking-[0.18em]">
                    fechar
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <ModuleSectionHeading
                eyebrow="Institucional"
                title="Dados da empresa"
                description="Informacoes institucionais principais da academia."
              />

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Nome da academia</label>
                  <input
                    type="text"
                    value={config.nome_academia || ''}
                    onChange={(e) => setConfig({ ...config, nome_academia: e.target.value })}
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">CNPJ</label>
                  <input
                    type="text"
                    value={config.cnpj || ''}
                    onChange={(e) => setConfig({ ...config, cnpj: e.target.value })}
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-zinc-500">
                    <Phone size={14} /> Telefone
                  </label>
                  <input
                    type="text"
                    value={config.telefone || ''}
                    onChange={(e) => setConfig({ ...config, telefone: e.target.value })}
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-zinc-500">
                    <Mail size={14} /> E-mail
                  </label>
                  <input
                    type="email"
                    value={config.email || ''}
                    onChange={(e) => setConfig({ ...config, email: e.target.value })}
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-zinc-500">
                    <MapPin size={14} /> Endereco completo
                  </label>
                  <input
                    type="text"
                    value={config.endereco || ''}
                    onChange={(e) => setConfig({ ...config, endereco: e.target.value })}
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                  />
                </div>
              </div>
            </div>

            <div ref={visualSectionRef} className="space-y-6 border-t border-zinc-800 pt-8">
              <ModuleSectionHeading
                eyebrow="Visual"
                title="Aparencia"
                description="Controle de logo e paleta principal do sistema."
              />

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-zinc-500">
                    <ImageIcon size={14} /> URL da logo
                  </label>
                  <input
                    type="text"
                    value={config.logo_url || ''}
                    onChange={(e) => setConfig({ ...config, logo_url: e.target.value })}
                    className="w-full rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                    placeholder="https://exemplo.com/logo.png"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Cor primaria</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.cor_primaria || '#3b82f6'}
                      onChange={(e) => setConfig({ ...config, cor_primaria: e.target.value })}
                      className="h-12 w-12 cursor-pointer rounded-xl border-0 bg-transparent p-0"
                    />
                    <input
                      type="text"
                      value={config.cor_primaria || '#3b82f6'}
                      onChange={(e) => setConfig({ ...config, cor_primaria: e.target.value })}
                      className="flex-1 rounded-xl border border-zinc-800 bg-black px-4 py-3 font-mono uppercase text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Cor secundaria</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={config.cor_secundaria || '#18181b'}
                      onChange={(e) => setConfig({ ...config, cor_secundaria: e.target.value })}
                      className="h-12 w-12 cursor-pointer rounded-xl border-0 bg-transparent p-0"
                    />
                    <input
                      type="text"
                      value={config.cor_secundaria || '#18181b'}
                      onChange={(e) => setConfig({ ...config, cor_secundaria: e.target.value })}
                      className="flex-1 rounded-xl border border-zinc-800 bg-black px-4 py-3 font-mono uppercase text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6 border-t border-zinc-800 pt-8">
              <ModuleSectionHeading
                eyebrow="Comunicacao"
                title="Textos e contratos"
                description="Mensagens padrao do app e texto base dos contratos."
              />

              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                    Mensagem de boas-vindas
                  </label>
                  <textarea
                    rows={3}
                    value={config.mensagem_boas_vindas || ''}
                    onChange={(e) => setConfig({ ...config, mensagem_boas_vindas: e.target.value })}
                    className="w-full resize-none rounded-xl border border-zinc-800 bg-black px-4 py-3 text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                    placeholder="Ola! Seja bem-vinda ao nosso app..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                    Termos de contrato padrao
                  </label>
                  <textarea
                    rows={6}
                    value={config.termos_contrato || ''}
                    onChange={(e) => setConfig({ ...config, termos_contrato: e.target.value })}
                    className="w-full resize-none rounded-xl border border-zinc-800 bg-black px-4 py-3 font-mono text-sm text-white outline-none transition-all focus:border-sky-500 focus:ring-2 focus:ring-sky-500/30"
                    placeholder="1. O contratante concorda em..."
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6 border-t border-zinc-800 pt-8">
              <ModuleSectionHeading
                eyebrow="Aplicativo"
                title="Permissoes do celular"
                description="Revise camera e notificacoes quando estiver usando o sistema pelo aplicativo Android."
              />

              <AppPermissionsPanel />
            </div>

            <div className="space-y-6 border-t border-zinc-800 pt-8">
              <ModuleSectionHeading
                eyebrow="Migracao"
                title="Importacao do legado atualizado"
                description="Importa 56 alunos com e-mail valido e 40 avaliacoes, sem duplicar o que ja foi cadastrado."
              />

              {legacyImportFeedback ? (
                <div
                  className={`rounded-2xl border p-4 text-sm font-bold ${
                    legacyImportFeedback.type === 'success'
                      ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                      : 'border-rose-500/20 bg-rose-500/10 text-rose-300'
                  }`}
                >
                  {legacyImportFeedback.message}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <button
                  type="button"
                  disabled={importingLegacy}
                  onClick={() => handleLegacyImport(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-6 py-4 font-bold text-white transition-all hover:border-sky-500/30 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {importingLegacy ? <Loader2 className="animate-spin" size={18} /> : <Database size={18} />}
                  Simular importacao
                </button>

                <button
                  type="button"
                  disabled={importingLegacy}
                  onClick={() => handleLegacyImport(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-4 font-bold text-black transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {importingLegacy ? <Loader2 className="animate-spin" size={18} /> : <Database size={18} />}
                  Importar 56 alunos + 40 avaliacoes
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-8 py-4 font-bold text-black transition-all hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                Salvar configuracoes
              </button>
            </div>
          </form>
        </ModuleSurface>
      </motion.div>
    </ModuleShell>
  );
}
