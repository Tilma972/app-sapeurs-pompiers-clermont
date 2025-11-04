/**
 * Carte QR Code pour offres type qr_code
 * Affiche le QR code, permet le téléchargement, track l'utilisation
 */

'use client';

import { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, QrCode, Check } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeCardProps {
  qrCodeData: string;
  partnerName: string;
  onGenerate?: () => void; // Callback pour tracking
}

export function QRCodeCard({
  qrCodeData,
  partnerName,
  onGenerate,
}: QRCodeCardProps) {
  const [generated, setGenerated] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const handleGenerateQR = () => {
    if (!generated) {
      setGenerated(true);
      onGenerate?.();
      toast.success('QR Code généré avec succès !');
    }
  };

  const handleDownloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) {
      toast.error('Erreur lors du téléchargement');
      return;
    }

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error('Erreur lors du téléchargement');
        return;
      }

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qrcode-${partnerName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('QR Code téléchargé !');
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          QR Code
        </CardTitle>
        <CardDescription>
          Présentez ce QR Code en caisse pour bénéficier de l&apos;offre
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {!generated ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="h-48 w-48 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
              <QrCode className="h-16 w-16 text-muted-foreground/50" />
            </div>
            <Button onClick={handleGenerateQR} size="lg" className="w-full sm:w-auto">
              <QrCode className="h-4 w-4 mr-2" />
              Générer le QR Code
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Le QR Code sera généré uniquement lorsque vous en aurez besoin
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            {/* QR Code Canvas */}
            <div
              ref={qrRef}
              className="p-4 bg-white rounded-lg shadow-md border-2 border-primary/20"
            >
              <QRCodeCanvas
                value={qrCodeData}
                size={200}
                level="H"
                includeMargin={true}
                imageSettings={{
                  src: '/icon.svg', // Logo au centre du QR code
                  height: 40,
                  width: 40,
                  excavate: true,
                }}
              />
            </div>

            {/* Success badge */}
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
              <Check className="h-4 w-4" />
              <span className="font-medium">QR Code actif</span>
            </div>

            {/* Download button */}
            <Button onClick={handleDownloadQR} variant="outline" className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Télécharger le QR Code
            </Button>

            {/* Instructions */}
            <div className="bg-muted/50 rounded-lg p-4 w-full">
              <h4 className="font-semibold text-sm mb-2">Comment utiliser :</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Présentez ce QR Code au moment de payer</li>
                <li>Le personnel scannera le code</li>
                <li>La réduction sera appliquée automatiquement</li>
              </ol>
            </div>

            {/* Warning */}
            <p className="text-xs text-muted-foreground text-center">
              ⚠️ Ce QR Code est personnel et ne peut être utilisé qu&apos;une seule fois
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
