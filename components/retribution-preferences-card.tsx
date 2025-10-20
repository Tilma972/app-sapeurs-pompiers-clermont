"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import toast from "react-hot-toast";
import { updateRetributionPreference } from "@/app/actions/retribution";

interface RetributionPreferencesCardProps {
  currentPreference: number | null;
  minimumEquipe: number;
  recommandationEquipe: number;
}

export function RetributionPreferencesCard({
  currentPreference,
  minimumEquipe,
  recommandationEquipe,
}: RetributionPreferencesCardProps) {
  const [preference, setPreference] = useState<number>(
    currentPreference ?? recommandationEquipe
  );
  const [isLoading, setIsLoading] = useState(false);

  const versPot = preference;
  const versPerso = 100 - preference;

  const handleSave = async () => {
    if (preference < minimumEquipe) {
      toast.error(`Le minimum imposé par votre équipe est de ${minimumEquipe}%`);
      return;
    }

    setIsLoading(true);
    try {
      await updateRetributionPreference(preference);
      toast.success("Préférence enregistrée !");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Préférences de rétribution</CardTitle>
        <CardDescription>
          Définissez comment répartir vos 30% de rétribution
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            Sur chaque collecte, 70% vont à l&apos;Amicale et 30% vous reviennent.
            Vous choisissez comment répartir ces 30% entre le pot d&apos;équipe et votre compte personnel.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Part au pot d&apos;équipe</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={minimumEquipe}
                  max={100}
                  value={preference}
                  onChange={(e) => setPreference(Number(e.target.value))}
                  className="w-20 text-center"
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
            <input
              type="range"
              min={minimumEquipe}
              max={100}
              step={5}
              value={preference}
              onChange={(e) => setPreference(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-muted-foreground">
              Minimum imposé par l&apos;équipe : {minimumEquipe}%
              {recommandationEquipe > minimumEquipe && (
                <> • Recommandation : {recommandationEquipe}%</>
              )}
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="text-sm font-medium">Aperçu de la répartition (sur 100€ collectés)</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">70% Amicale</div>
                <div className="text-lg font-semibold">70,00€</div>
              </div>
              <div>
                <div className="text-muted-foreground">30% Vous</div>
                <div className="text-lg font-semibold">30,00€</div>
              </div>
            </div>
            <div className="pt-2 border-t mt-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">→ Pot équipe ({versPot}%)</div>
                  <div className="font-semibold text-blue-600">
                    {((30 * versPot) / 100).toFixed(2)}€
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">→ Votre compte ({versPerso}%)</div>
                  <div className="font-semibold text-green-600">
                    {((30 * versPerso) / 100).toFixed(2)}€
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSave}
          disabled={isLoading || preference < minimumEquipe}
          className="w-full"
        >
          {isLoading ? "Enregistrement..." : "Enregistrer ma préférence"}
        </Button>
      </CardFooter>
    </Card>
  );
}
