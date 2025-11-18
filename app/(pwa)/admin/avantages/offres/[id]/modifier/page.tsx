/**
 * Page d'édition d'une offre partenaire existante
 */

import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OfferForm } from '@/components/avantages/admin/offer-form';
import { getOfferById } from '@/lib/supabase/offers';
import { getPartners } from '@/lib/supabase/partners';
import { createClient } from '@/lib/supabase/server';

interface OfferEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OfferEditPage({ params }: OfferEditPageProps) {
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
  const { id } = await params;

  // Récupérer l'offre et tous les partenaires
  const [offer, partners] = await Promise.all([
    getOfferById(id),
    getPartners({ actif: true }),
  ]);

  if (!offer) {
    notFound();
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
          <Edit className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Modifier l&apos;offre</h1>
            <p className="text-muted-foreground">
              {offer.titre}
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <OfferForm offer={offer} partners={partners} />
    </div>
  );
}
