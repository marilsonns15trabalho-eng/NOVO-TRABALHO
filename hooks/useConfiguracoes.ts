'use client';
import { useState, useEffect, useCallback } from 'react';
import * as configService from '@/services/configuracoes.service';
import { useNotification } from '@/hooks/useNotification';
import type { ConfiguracoesFormData } from '@/types/configuracoes';

const DEFAULTS_CONFIG: ConfiguracoesFormData = {
  nome_academia: '',
  cnpj: '',
  telefone: '',
  email: '',
  endereco: '',
  logo_url: '',
  cor_primaria: '#3b82f6',
  cor_secundaria: '#18181b',
  mensagem_boas_vindas: '',
  termos_contrato: '',
};

export function useConfiguracoes() {
  const [config, setConfig] = useState<ConfiguracoesFormData>({ ...DEFAULTS_CONFIG });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { notification, showNotification, clearNotification } = useNotification();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await configService.fetchConfiguracoes();
      if (data) setConfig(data);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  /** Salva configurações */
  const handleSave = useCallback(async () => {
    if (!config.nome_academia) {
      showNotification('O nome da academia é obrigatório.', 'error');
      return;
    }

    setSaving(true);
    try {
      const result = await configService.salvarConfiguracoes(config);
      if (result) setConfig(result);
      showNotification('Configurações salvas com sucesso!', 'success');
    } catch (error: any) {
      showNotification(`Erro: ${error.message || 'Erro desconhecido'}`, 'error');
    } finally {
      setSaving(false);
    }
  }, [config, showNotification]);

  return {
    config,
    setConfig,
    loading,
    saving,
    handleSave,
    notification,
    showNotification,
    clearNotification,
  };
}
