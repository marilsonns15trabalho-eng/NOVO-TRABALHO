'use client';
import React from 'react';
import {
  Settings,
  Save,
  Loader2,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Palette,
  Image as ImageIcon,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useConfiguracoes } from '@/hooks/useConfiguracoes';

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

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="text-blue-500 animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-black min-h-screen text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Configurações do Sistema</h2>
          <p className="text-zinc-500">Personalize os dados e a aparência da sua academia.</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-xl max-w-4xl"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-8">
          {notification && (
            <div className={`p-4 rounded-xl text-sm font-bold ${notification.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
              {notification.message}
            </div>
          )}

          <div className="space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2 text-blue-500">
              <Building2 size={24} />
              Dados da Empresa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Nome da Academia</label>
                <input type="text" value={config.nome_academia || ''} onChange={(e) => setConfig({...config, nome_academia: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">CNPJ</label>
                <input type="text" value={config.cnpj || ''} onChange={(e) => setConfig({...config, cnpj: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1"><Phone size={14}/> Telefone</label>
                <input type="text" value={config.telefone || ''} onChange={(e) => setConfig({...config, telefone: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1"><Mail size={14}/> E-mail</label>
                <input type="email" value={config.email || ''} onChange={(e) => setConfig({...config, email: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1"><MapPin size={14}/> Endereço Completo</label>
                <input type="text" value={config.endereco || ''} onChange={(e) => setConfig({...config, endereco: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all" />
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-8 space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2 text-blue-500">
              <Palette size={24} />
              Aparência
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1"><ImageIcon size={14}/> URL da Logo</label>
                <input type="text" value={config.logo_url || ''} onChange={(e) => setConfig({...config, logo_url: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all" placeholder="https://exemplo.com/logo.png" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Cor Primária</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={config.cor_primaria || '#3b82f6'} onChange={(e) => setConfig({...config, cor_primaria: e.target.value})} className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-0 p-0" />
                  <input type="text" value={config.cor_primaria || '#3b82f6'} onChange={(e) => setConfig({...config, cor_primaria: e.target.value})} className="flex-1 bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all uppercase font-mono" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Cor Secundária</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={config.cor_secundaria || '#18181b'} onChange={(e) => setConfig({...config, cor_secundaria: e.target.value})} className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-0 p-0" />
                  <input type="text" value={config.cor_secundaria || '#18181b'} onChange={(e) => setConfig({...config, cor_secundaria: e.target.value})} className="flex-1 bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all uppercase font-mono" />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-800 pt-8 space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2 text-blue-500">
              <FileText size={24} />
              Textos e Contratos
            </h3>
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Mensagem de Boas-vindas (App do Aluno)</label>
                <textarea rows={3} value={config.mensagem_boas_vindas || ''} onChange={(e) => setConfig({...config, mensagem_boas_vindas: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all resize-none" placeholder="Olá! Seja bem-vindo à nossa academia..." />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Termos de Contrato Padrão</label>
                <textarea rows={6} value={config.termos_contrato || ''} onChange={(e) => setConfig({...config, termos_contrato: e.target.value})} className="w-full bg-black border border-zinc-800 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all resize-none font-mono text-sm" placeholder="1. O CONTRATANTE concorda em..." />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-8 py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-blue-500/20"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Salvar Configurações
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
