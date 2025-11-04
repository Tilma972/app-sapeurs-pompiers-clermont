/**
 * Page Feed Boîte à Idées
 * Liste des idées avec filtres, recherche et pagination
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Lightbulb, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PwaContainer } from "@/components/layouts/pwa/pwa-container";
import { IdeaCard } from "@/components/idees/idea-card";
import { IdeaFilters } from "@/components/idees/idea-filters";
import { getIdeas } from "@/lib/supabase/ideas";
import type { IdeaWithAuthor } from "@/lib/types/ideas.types";

type SortValue = "recent" | "popular" | "trending";

export default function IdeesPage() {
  const router = useRouter();
  const [ideas, setIdeas] = useState<IdeaWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortValue>("recent");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  
  const ITEMS_PER_PAGE = 20;

  const loadIdeas = useCallback(async (pageToLoad: number, reset: boolean = false) => {
    try {
      setLoading(true);
      
      const result = await getIdeas({
        search: searchQuery || undefined,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        sortBy: sortBy,
        limit: ITEMS_PER_PAGE,
        offset: pageToLoad * ITEMS_PER_PAGE,
        status: "published",
      });

      if (reset) {
        setIdeas(result.ideas);
      } else {
        setIdeas((prev) => [...prev, ...result.ideas]);
      }
      
      setTotal(result.total);
      setHasMore(result.hasMore);
      setPage(pageToLoad);
    } catch (error) {
      console.error("Erreur chargement idées:", error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategories, sortBy]);

  // Charger les idées au premier rendu et quand les filtres changent
  useEffect(() => {
    setPage(0);
    loadIdeas(0, true);
  }, [loadIdeas]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadIdeas(page + 1, false);
    }
  };

  return (
    <PwaContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Boîte à Idées</h1>
            </div>
            
            <Button
              onClick={() => router.push("/idees/nouvelle")}
              size="sm"
              className="flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nouvelle idée</span>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Partagez vos idées pour améliorer notre caserne
          </p>
        </div>

        {/* Filtres */}
        <IdeaFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategories={selectedCategories}
          onCategoriesChange={setSelectedCategories}
          sortBy={sortBy}
          onSortChange={setSortBy}
          resultCount={total}
        />

        {/* Liste des idées */}
        {loading && ideas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Chargement des idées...</p>
          </div>
        ) : ideas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Lightbulb className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-semibold">Aucune idée trouvée</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {searchQuery || selectedCategories.length > 0
                  ? "Essayez de modifier vos filtres"
                  : "Soyez le premier à partager une idée !"}
              </p>
            </div>
            <Button onClick={() => router.push("/idees/nouvelle")}>
              <Plus className="h-4 w-4 mr-2" />
              Créer une idée
            </Button>
          </div>
        ) : (
          <>
            {/* Grid des idées */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ideas.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} />
              ))}
            </div>

            {/* Bouton Charger plus */}
            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="min-w-[200px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Chargement...
                    </>
                  ) : (
                    "Charger plus d'idées"
                  )}
                </Button>
              </div>
            )}

            {/* Info pagination */}
            {!hasMore && ideas.length > 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                Toutes les idées ont été chargées
              </p>
            )}
          </>
        )}
      </div>

      {/* FAB mobile pour créer une idée */}
      <Button
        onClick={() => router.push("/idees/nouvelle")}
        size="lg"
        className="fixed bottom-20 right-4 sm:hidden rounded-full w-14 h-14 shadow-lg z-10"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </PwaContainer>
  );
}
