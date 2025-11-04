/**
 * ShareButton - Bouton pour partager une idée
 */

"use client";

import { useState } from "react";
import { Share2, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import toast from "react-hot-toast";

interface ShareButtonProps {
  ideaId: string;
  title: string;
}

export function ShareButton({ ideaId, title }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const url = typeof window !== "undefined" 
    ? `${window.location.origin}/idees/${ideaId}` 
    : "";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Lien copié !");
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Erreur copie:", error);
      toast.error("Impossible de copier le lien");
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      handleCopyLink();
      return;
    }

    try {
      await navigator.share({
        title: title,
        text: `Découvrez cette idée : ${title}`,
        url: url,
      });
    } catch {
      // User cancelled or error - do nothing
      console.log("Partage annulé");
    }
  };

  // Si l'API Web Share est disponible (mobile)
  const hasNativeShare = typeof navigator !== "undefined" && navigator.share;

  if (hasNativeShare) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleNativeShare}
        className="flex items-center gap-2"
      >
        <Share2 className="h-4 w-4" />
        Partager
      </Button>
    );
  }

  // Sinon, dropdown menu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Partager
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2 text-green-600" />
              Lien copié !
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copier le lien
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
