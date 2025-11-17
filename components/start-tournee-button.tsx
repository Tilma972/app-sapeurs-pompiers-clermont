"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Play, AlertCircle } from "lucide-react";
import { startNewTournee } from "@/app/actions/tournee-actions";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "react-hot-toast";

interface StartTourneeButtonProps {
  isBlocked?: boolean;
  blockReason?: string;
}

export function StartTourneeButton({ isBlocked = false, blockReason }: StartTourneeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStartTournee = async () => {
    if (isBlocked) {
      toast.error(blockReason || "Vous devez d'abord confirmer la réception de vos calendriers");
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('zone', 'Zone par défaut'); // TODO: Permettre à l'utilisateur de choisir

      const result = await startNewTournee(formData);

      if (result.success) {
        // Rediriger vers la page ma-tournee (nouvelle route focus)
        router.push('/ma-tournee');
      } else {
        console.error('Erreur lors du démarrage de la tournée:', result.errors);
        toast.error('Erreur lors du démarrage de la tournée');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const button = (
    <Button
      onClick={handleStartTournee}
      disabled={isLoading || isBlocked}
      className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          Démarrage...
        </>
      ) : isBlocked ? (
        <>
          <AlertCircle className="h-4 w-4 mr-2" />
          Confirmer la réception requise
        </>
      ) : (
        <>
          <Play className="h-4 w-4 mr-2" />
          Démarrer une tournée
        </>
      )}
    </Button>
  );

  if (isBlocked) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>
            <p>{blockReason || "Vous devez confirmer avoir reçu vos calendriers pour démarrer une tournée"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
