/**
 * Server Actions pour la gestion des partenaires
 * Actions CRUD côté serveur
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { PartnerFormData } from '@/lib/types/avantages.types';

export async function createPartnerAction(formData: PartnerFormData) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('partners')
      .insert(formData)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/admin/avantages');
    revalidatePath('/avantages');

    return { success: true, data };
  } catch (error) {
    console.error('Create partner error:', error);
    return { success: false, error: 'Erreur lors de la création' };
  }
}

export async function updatePartnerAction(id: string, formData: Partial<PartnerFormData>) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('partners')
      .update(formData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/admin/avantages');
    revalidatePath('/avantages');
    revalidatePath(`/dashboard/admin/avantages/${id}/modifier`);

    return { success: true, data };
  } catch (error) {
    console.error('Update partner error:', error);
    return { success: false, error: 'Erreur lors de la mise à jour' };
  }
}

export async function deletePartnerAction(id: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('partners')
      .update({ actif: false })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/admin/avantages');
    revalidatePath('/avantages');

    return { success: true };
  } catch (error) {
    console.error('Delete partner error:', error);
    return { success: false, error: 'Erreur lors de la suppression' };
  }
}

export async function getPartnersAction() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .order('ordre_affichage', { ascending: true })
      .order('nom', { ascending: true });

    if (error) {
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Get partners error:', error);
    return { success: false, error: 'Erreur lors de la récupération', data: [] };
  }
}
