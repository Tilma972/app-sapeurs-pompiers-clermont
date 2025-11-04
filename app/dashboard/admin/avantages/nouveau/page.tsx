/**
 * Page de création d'un nouveau partenaire
 */

import { Button } from '@/components/ui/button';
import { PartnerForm } from '@/components/avantages/admin/partner-form';
import { ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';

export default function NouveauPartnerPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
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
            <h1 className="text-3xl font-bold">Nouveau partenaire</h1>
            <p className="text-muted-foreground">
              Créez un nouveau partenaire et ses avantages
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <PartnerForm />
    </div>
  );
}
