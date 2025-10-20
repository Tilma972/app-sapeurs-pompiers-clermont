'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateEquipeSettings(
  equipeId: string,
  settings: {
    enable_retribution: boolean;
    pourcentage_minimum_pot: number;
    pourcentage_recommande_pot: number;
    mode_transparence: 'prive' | 'equipe' | 'anonyme';
  }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Non authentifié');
  }

  // Vérifier que l'utilisateur est chef de cette équipe OU admin
  const { data: equipe } = await supabase
    .from('equipes')
    .select('chef_equipe_id')
    .eq('id', equipeId)
    .single();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isChef = equipe?.chef_equipe_id === user.id;
  const isAdmin = profile?.role === 'admin';

  if (!isChef && !isAdmin) {
    throw new Error('Vous n\'avez pas les permissions pour modifier cette équipe');
  }

  // Validation
  if (settings.pourcentage_minimum_pot < 0 || settings.pourcentage_minimum_pot > 100) {
    throw new Error('Le minimum doit être entre 0 et 100');
  }

  if (settings.pourcentage_recommande_pot < settings.pourcentage_minimum_pot) {
    throw new Error('La recommandation doit être supérieure ou égale au minimum');
  }

  if (settings.pourcentage_recommande_pot > 100) {
    throw new Error('La recommandation ne peut pas dépasser 100%');
  }

  // Mise à jour
  const { error } = await supabase
    .from('equipes')
    .update({
      enable_retribution: settings.enable_retribution,
      pourcentage_minimum_pot: settings.pourcentage_minimum_pot,
      pourcentage_recommande_pot: settings.pourcentage_recommande_pot,
      mode_transparence: settings.mode_transparence,
      updated_at: new Date().toISOString(),
    })
    .eq('id', equipeId);

  if (error) {
    console.error('Erreur mise à jour équipe:', error);
    throw new Error('Erreur lors de la mise à jour');
  }

  revalidatePath('/dashboard/admin/equipes');
  revalidatePath('/dashboard/mon-compte');
  revalidatePath('/dashboard/pot-equipe');
  return { success: true };
}
