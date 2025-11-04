import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PartnerForm } from '@/components/avantages/admin/partner-form';
import { getPartnerById } from '@/lib/supabase/partners';
import { createClient } from '@/lib/supabase/server';

interface PartnerEditPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PartnerEditPage({ params }: PartnerEditPageProps) {
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

  // Récupérer le partenaire
  const partner = await getPartnerById(id);

  if (!partner) {
    notFound();
  }

  return (
    <div className="container py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/avantages">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Edit className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Modifier le partenaire</h1>
        </div>
      </div>

      {/* Formulaire */}
      <PartnerForm partner={partner} />
    </div>
  );
}
