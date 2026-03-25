// Camada de serviço para Configurações
import { supabase, getAuthenticatedUser } from '@/lib/supabase';
import { TABLES } from '@/lib/constants';
import type { Configuracoes, ConfiguracoesFormData } from '@/types/configuracoes';
import { assertNotProfessorForUserId } from '@/lib/authz';

/** Busca as configurações do sistema (retorna a primeira row) */
export async function fetchConfiguracoes(): Promise<Partial<Configuracoes> | null> {
  const { data, error } = await supabase
    .from(TABLES.CONFIGURACOES)
    .select('*')
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Erro ao buscar configurações:', error);
    return null;
  }

  return data || null;
}

/** Salva configurações (cria ou atualiza) */
export async function salvarConfiguracoes(config: ConfiguracoesFormData): Promise<Configuracoes | null> {
  const user = await getAuthenticatedUser();
  await assertNotProfessorForUserId(user.id);

  if (config.id) {
    // Update
    const { error } = await supabase
      .from(TABLES.CONFIGURACOES)
      .update(config)
      .eq('id', config.id);

    if (error) throw error;
    return config as Configuracoes;
  } else {
    // Insert
    const { data, error } = await supabase
      .from(TABLES.CONFIGURACOES)
      .insert([{ ...config, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
