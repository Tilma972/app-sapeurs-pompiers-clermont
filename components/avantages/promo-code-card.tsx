/**
 * Carte Code Promo pour offres type code_promo
 * Affiche le code, permet la copie, track l'utilisation
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Check, Tag } from 'lucide-react';
import { toast } from 'sonner';

interface PromoCodeCardProps {
  codePromo: string;
  partnerName: string;
  onCopy?: () => void; // Callback pour tracking
}

export function PromoCodeCard({
  codePromo,
  partnerName,
  onCopy,
}: PromoCodeCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(codePromo);
      setCopied(true);
      onCopy?.();
      toast.success('Code promo copié !');

      // Reset after 3 seconds
      setTimeout(() => {
        setCopied(false);
      }, 3000);
    } catch (error) {
      toast.error('Erreur lors de la copie');
      console.error('Copy failed:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Code Promo
        </CardTitle>
        <CardDescription>
          Utilisez ce code pour bénéficier de l&apos;offre
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Code Display */}
        <div className="relative">
          <div className="flex items-center justify-between gap-3 p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20 rounded-lg">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Votre code :</p>
              <p className="text-2xl font-bold font-mono tracking-wider text-primary">
                {codePromo}
              </p>
            </div>
            <Button
              onClick={handleCopyCode}
              size="lg"
              variant={copied ? 'default' : 'outline'}
              className="shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copier
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-semibold text-sm mb-2">Comment utiliser :</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Copiez le code promo ci-dessus</li>
            <li>Présentez-le au moment de payer ou sur leur site web</li>
            <li>La réduction sera appliquée sur votre commande</li>
          </ol>
        </div>

        {/* Partner specific info */}
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            💡 <strong>Astuce :</strong> Mentionnez que vous êtes membre de l&apos;Amicale des Sapeurs-Pompiers chez{' '}
            <strong>{partnerName}</strong>
          </p>
        </div>

        {/* Warning */}
        <p className="text-xs text-muted-foreground text-center">
          ⚠️ Code valable dans les conditions définies par le partenaire
        </p>
      </CardContent>
    </Card>
  );
}
