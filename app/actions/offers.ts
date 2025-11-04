/**
 * Server Actions pour la gestion des offres partenaires
 * Actions CRUD côté serveur
 */

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { OfferFormData } from '@/lib/types/avantages.types';

export async function createOfferAction(formData: OfferFormData) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('partner_offers')
      .insert(formData)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/admin/avantages');
    revalidatePath('/avantages');
    revalidatePath(`/avantages/${data.id}`);

    return { success: true, data };
  } catch (error) {
    console.error('Create offer error:', error);
    return { success: false, error: 'Erreur lors de la création' };
  }
}

export async function updateOfferAction(id: string, formData: Partial<OfferFormData>) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('partner_offers')
      .update(formData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/admin/avantages');
    revalidatePath('/avantages');
    revalidatePath(`/avantages/${id}`);

    return { success: true, data };
  } catch (error) {
    console.error('Update offer error:', error);
    return { success: false, error: 'Erreur lors de la mise à jour' };
  }
}

export async function deleteOfferAction(id: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('partner_offers')
      .update({ actif: false })
      .eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/admin/avantages');
    revalidatePath('/avantages');

    return { success: true };
  } catch (error) {
    console.error('Delete offer error:', error);
    return { success: false, error: 'Erreur lors de la suppression' };
  }
}

export async function getOffersAction(partnerId?: string) {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('partner_offers')
      .select(`
        *,
        partner:partners(*)
      `)
      .order('ordre_affichage', { ascending: true })
      .order('titre', { ascending: true });

    if (partnerId) {
      query = query.eq('partner_id', partnerId);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Get offers error:', error);
    return { success: false, error: 'Erreur lors de la récupération', data: [] };
  }
}
