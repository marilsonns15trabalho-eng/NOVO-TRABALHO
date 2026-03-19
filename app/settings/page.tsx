'use client';

import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { useSettings } from '@/lib/SettingsContext';
import { 
  Save, 
  Settings as SettingsIcon, 
  Palette, 
  Bell, 
  Database, 
  Globe, 
  Building2,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { settings, updateSettings } = useSettings();
  const [formData, setFormData] = React.useState(settings);
  const [isSaved, setIsSaved] = React.useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#0f1117] text-white font-sans">
      <Sidebar />
      
      <main className="flex-1 flex flex-col">
        <Header />
        
        <div className="p-4 md:p-8 max-w-4xl mx-auto w-full space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Configurações</h1>
              <p className="text-gray-500 mt-1">Gerencie as preferências globais do seu estúdio.</p>
            </div>
            {isSaved && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20"
              >
                <CheckCircle2 size={16} />
                <span className="text-sm font-bold">Configurações salvas!</span>
              </motion.div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* General Settings */}
            <section className="bg-[#1a1d26] rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-6 border-b border-white/5 flex items-center gap-3">
                <Building2 className="text-orange-500" size={20} />
                <h2 className="text-lg font-bold">Geral</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Nome do Estúdio</label>
                  <input 
                    name="studioName"
                    value={formData.studioName}
                    onChange={handleChange}
                    className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Slogan / Subtítulo</label>
                  <input 
                    name="studioSlogan"
                    value={formData.studioSlogan}
                    onChange={handleChange}
                    className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Moeda</label>
                  <select 
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all appearance-none"
                  >
                    <option value="BRL">Real (R$)</option>
                    <option value="USD">Dólar ($)</option>
                    <option value="EUR">Euro (€)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Idioma</label>
                  <select 
                    name="language"
                    value={formData.language}
                    onChange={handleChange}
                    className="w-full bg-[#0f1117] border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none transition-all appearance-none"
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="en-US">English (US)</option>
                    <option value="es-ES">Español</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Appearance Settings */}
            <section className="bg-[#1a1d26] rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-6 border-b border-white/5 flex items-center gap-3">
                <Palette className="text-orange-500" size={20} />
                <h2 className="text-lg font-bold">Aparência</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Cor Primária</label>
                  <div className="flex flex-wrap gap-4">
                    {['#f97316', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, primaryColor: color }))}
                        className={cn(
                          "w-10 h-10 rounded-full border-2 transition-all",
                          formData.primaryColor === color ? "border-white scale-110" : "border-transparent"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <input 
                      type="color" 
                      name="primaryColor"
                      value={formData.primaryColor}
                      onChange={handleChange}
                      className="w-10 h-10 bg-transparent border-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* System Settings */}
            <section className="bg-[#1a1d26] rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-6 border-b border-white/5 flex items-center gap-3">
                <Database className="text-orange-500" size={20} />
                <h2 className="text-lg font-bold">Sistema & Notificações</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold">Notificações Push</h4>
                    <p className="text-xs text-gray-500">Receba alertas de pagamentos e vencimentos.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="notificationsEnabled"
                      checked={formData.notificationsEnabled}
                      onChange={handleChange}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold">Backup Automático</h4>
                    <p className="text-xs text-gray-500">Sincronizar dados com nuvem diariamente.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="autoBackup"
                      checked={formData.autoBackup}
                      onChange={handleChange}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
              </div>
            </section>

            <div className="flex justify-end pt-4">
              <button 
                type="submit"
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg shadow-orange-500/20"
              >
                <Save size={20} />
                Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
