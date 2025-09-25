"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { startNewTournee } from "@/app/actions/tournee-actions";

export function StartTourneeButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStartTournee = async () => {
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('zone', 'Zone par défaut'); // TODO: Permettre à l'utilisateur de choisir
      
      const result = await startNewTournee(formData);
      
      if (result.success) {
        // Rediriger vers la page ma-tournee
        router.push('/dashboard/ma-tournee');
      } else {
        console.error('Erreur lors du démarrage de la tournée:', result.errors);
        // TODO: Afficher un message d'erreur à l'utilisateur
      }
    } catch (error) {
      console.error('Erreur:', error);
      // TODO: Afficher un message d'erreur à l'utilisateur
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleStartTournee}
      disabled={isLoading}
      className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700"
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
          Démarrage...
        </>
      ) : (
        <>
          <Play className="h-4 w-4 mr-2" />
          Démarrer une tournée
        </>
      )}
    </Button>
  );
}
