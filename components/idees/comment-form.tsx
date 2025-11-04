/**
 * CommentForm - Formulaire d'ajout de commentaire
 */

"use client";

import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import toast from "react-hot-toast";

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
}

export function CommentForm({ onSubmit, placeholder = "Partagez votre point de vue..." }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error("Veuillez saisir un commentaire");
      return;
    }

    if (content.length > 2000) {
      toast.error("Le commentaire ne peut pas dépasser 2000 caractères");
      return;
    }

    try {
      setLoading(true);
      await onSubmit(content.trim());
      setContent("");
      toast.success("Commentaire ajouté");
    } catch (error) {
      console.error("Erreur ajout commentaire:", error);
      toast.error("Impossible d'ajouter le commentaire");
    } finally {
      setLoading(false);
    }
  };

  const remainingChars = 2000 - content.length;
  const isNearLimit = remainingChars < 200;

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            className="min-h-[100px] resize-none"
            maxLength={2000}
            disabled={loading}
          />
          
          <div className="flex items-center justify-between gap-2">
            <p className={`text-xs ${isNearLimit ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'}`}>
              {remainingChars} caractères restants
            </p>
            
            <Button
              type="submit"
              size="sm"
              disabled={loading || !content.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Publier
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
