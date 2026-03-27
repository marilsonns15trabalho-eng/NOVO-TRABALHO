import { supabase, getAuthenticatedUser } from '@/lib/supabase';
import { TABLES } from '@/lib/constants';
import type { Plano, PlanoFormData } from '@/types/plano';
import { assertAdminForUserId } from '@/lib/authz';

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
  const user = await getAuthenticatedUser();
  await assertAdminForUserId(user.id);

  const { error } = await supabase
    .from(TABLES.PLANS)
    .insert([{
      name: formData.name,
      price: parseFloat(formData.price),
      duration_months: parseInt(formData.duration_months, 10),
      description: formData.description,
      active: formData.active,
    }]);

  if (error) throw error;
}

/** Atualiza um plano existente */
export async function updatePlano(planoId: string, formData: PlanoFormData): Promise<void> {
  const user = await getAuthenticatedUser();
  await assertAdminForUserId(user.id);

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
  const user = await getAuthenticatedUser();
  await assertAdminForUserId(user.id);

  if (plano.active) {
    const { error } = await supabase
      .from(TABLES.PLANS)
      .update({ active: false })
      .eq('id', plano.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from(TABLES.PLANS)
      .delete()
      .eq('id', plano.id);
    if (error) throw error;
  }
}
