// Camada de serviço para Planos
import { supabase } from '@/lib/supabase';
import { TABLES } from '@/lib/constants';
import type { Plano, PlanoFormData } from '@/types/plano';

/** Busca todos os planos ordenados por preço */
export async function fetchPlanos(): Promise<Plano[]> {
  const { data, error } = await supabase
    .from(TABLES.PLANS)
    .select('*')
    .order('price', { ascending: true });

  if (error) {
    console.error('Erro ao buscar planos:', JSON.stringify(error, null, 2));
    return [];
  }

  return data || [];
}

/** Cria um novo plano */
export async function createPlano(formData: PlanoFormData): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { error } = await supabase
    .from(TABLES.PLANS)
    .insert([{
      name: formData.name,
      price: parseFloat(formData.price),
      duration_months: parseInt(formData.duration_months, 10),
      description: formData.description,
      active: formData.active,
      user_id: user.id,
    }]);

  if (error) throw error;
}

/** Atualiza um plano existente */
export async function updatePlano(planoId: string, formData: PlanoFormData): Promise<void> {
  const { error } = await supabase
    .from(TABLES.PLANS)
    .update({
      name: formData.name,
      price: parseFloat(formData.price),
      duration_months: parseInt(formData.duration_months, 10),
      description: formData.description,
      active: formData.active,
    })
    .eq('id', planoId);

  if (error) throw error;
}

/** Desativa um plano ativo ou exclui um plano já inativo */
export async function deleteOrDeactivatePlano(plano: Plano): Promise<void> {
  if (plano.active) {
    // Desativar
    const { error } = await supabase
      .from(TABLES.PLANS)
      .update({ active: false })
      .eq('id', plano.id);
    if (error) throw error;
  } else {
    // Excluir permanentemente
    const { error } = await supabase
      .from(TABLES.PLANS)
      .delete()
      .eq('id', plano.id);
    if (error) throw error;
  }
}
