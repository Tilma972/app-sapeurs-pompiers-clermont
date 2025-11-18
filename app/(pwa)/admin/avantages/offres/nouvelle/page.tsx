/**
 * Page de création d'une nouvelle offre partenaire
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OfferForm } from '@/components/avantages/admin/offer-form';
import { getPartners } from '@/lib/supabase/partners';
import { createClient } from '@/lib/supabase/server';

interface NouvelleOffrePageProps {
  searchParams: Promise<{
    partnerId?: string;
  }>;
}

export default async function NouvelleOffrePage({ searchParams }: NouvelleOffrePageProps) {
  // Vérifier l'authentification et le rôle admin
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Vérifier le rôle admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  // Récupérer les paramètres
  const params = await searchParams;
  const partnerId = params.partnerId;

  // Récupérer tous les partenaires actifs
  const partners = await getPartners({ actif: true });

  if (partners.length === 0) {
    return (
      <div className="container py-8 max-w-4xl">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Aucun partenaire disponible</h1>
          <p className="text-muted-foreground mb-6">
            Vous devez d&apos;abord créer des partenaires avant de pouvoir créer des offres.
          </p>
          <Link href="/dashboard/admin/avantages/nouveau">
            <Button>Créer un partenaire</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/admin/avantages">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Plus className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Nouvelle offre</h1>
            <p className="text-muted-foreground">
              Créez une nouvelle offre pour un partenaire
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <OfferForm partners={partners} defaultPartnerId={partnerId} />
    </div>
  );
}
