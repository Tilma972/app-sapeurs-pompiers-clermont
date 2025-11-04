/**
 * Page Création Nouvelle Idée
 * Formulaire pour créer une idée texte
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lightbulb, Eye, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PwaContainer } from "@/components/layouts/pwa/pwa-container";
import toast from "react-hot-toast";
import { createIdea } from "@/lib/supabase/ideas";
import type { IdeaCategory } from "@/lib/types/ideas.types";

const CATEGORIES: IdeaCategory[] = [
  "Équipement",
  "Formation",
  "Sécurité",
  "Bien-être",
  "Procédures",
  "Communauté",
  "Technologie",
];

export default function NouvelleIdeePage() {
  const router = useRouter();
  
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [anonyme, setAnonyme] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 10) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const validateForm = () => {
    if (titre.trim().length < 3) {
      toast.error("Le titre doit contenir au moins 3 caractères.");
      return false;
    }

    if (titre.length > 200) {
      toast.error("Le titre ne peut pas dépasser 200 caractères.");
      return false;
    }

    if (description.trim().length < 10) {
      toast.error("La description doit contenir au moins 10 caractères.");
      return false;
    }

    if (selectedCategories.length === 0) {
      toast.error("Veuillez sélectionner au moins une catégorie.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (status: "draft" | "published") => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      await createIdea({
        titre: titre.trim(),
        description: description.trim(),
        categories: selectedCategories,
        tags: tags,
        anonyme: anonyme,
        status: status,
      });

      const message = status === "published" 
        ? "Idée publiée ! Votre idée est maintenant visible par tous." 
        : "Brouillon enregistré. Vous pourrez le publier plus tard.";
      toast.success(message);

      router.push("/idees");
      router.refresh();
    } catch (error) {
      console.error("Erreur création idée:", error);
      toast.error("Impossible de créer l'idée. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = titre.trim().length >= 3 && description.trim().length >= 10 && selectedCategories.length > 0;

  return (
    <PwaContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Nouvelle Idée</h1>
            <p className="text-sm text-muted-foreground">
              Partagez votre idée pour améliorer la caserne
            </p>
          </div>
        </div>

        {/* Onglets Édition / Preview */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="edit" className="flex-1">
              <Lightbulb className="h-4 w-4 mr-2" />
              Édition
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex-1">
              <Eye className="h-4 w-4 mr-2" />
              Aperçu
            </TabsTrigger>
          </TabsList>

          {/* Tab Édition */}
          <TabsContent value="edit" className="space-y-6 mt-6">
            {/* Titre */}
            <div className="space-y-2">
              <Label htmlFor="titre">
                Titre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="titre"
                placeholder="Ex: Nouveau système de check-in digital"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground text-right">
                {titre.length}/200 caractères
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Décrivez votre idée en détail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={8}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {description.length} caractères (minimum 10)
              </p>
            </div>

            {/* Catégories */}
            <div className="space-y-2">
              <Label>
                Catégories <span className="text-destructive">*</span>
              </Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((category) => {
                  const isSelected = selectedCategories.includes(category);
                  return (
                    <Badge
                      key={category}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/90 transition-colors px-3 py-1.5"
                      onClick={() => toggleCategory(category)}
                    >
                      {category}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (optionnel)</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  placeholder="Ajouter un tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  disabled={tags.length >= 10}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTag}
                  disabled={!tagInput.trim() || tags.length >= 10}
                >
                  Ajouter
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeTag(tag)}
                    >
                      {tag} ✕
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {tags.length}/10 tags
              </p>
            </div>

            {/* Anonymat */}
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <Checkbox
                id="anonyme"
                checked={anonyme}
                onCheckedChange={(checked) => setAnonyme(checked === true)}
              />
              <div className="space-y-0.5">
                <Label htmlFor="anonyme" className="cursor-pointer">
                  Publier anonymement
                </Label>
                <p className="text-sm text-muted-foreground">
                  Votre nom ne sera pas affiché
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Tab Preview */}
          <TabsContent value="preview" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>{titre || "Titre de votre idée"}</CardTitle>
                <CardDescription>
                  {anonyme ? "Anonyme" : "Votre nom"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm whitespace-pre-wrap">
                  {description || "La description de votre idée apparaîtra ici..."}
                </p>
                
                {selectedCategories.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Catégories :</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCategories.map((cat) => (
                        <Badge key={cat} variant="outline">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {tags.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Tags :</p>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex gap-3 sticky bottom-0 bg-background py-4 border-t">
          <Button
            variant="outline"
            onClick={() => handleSubmit("draft")}
            disabled={loading || !isFormValid}
            className="flex-1"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Brouillon
          </Button>
          <Button
            onClick={() => handleSubmit("published")}
            disabled={loading || !isFormValid}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publication...
              </>
            ) : (
              "Publier l'idée"
            )}
          </Button>
        </div>
      </div>
    </PwaContainer>
  );
}
