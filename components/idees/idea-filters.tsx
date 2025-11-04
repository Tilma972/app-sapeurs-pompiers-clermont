/**
 * IdeaFilters - Composant filtres et recherche pour le feed
 */

"use client";

import { Search, SlidersHorizontal, TrendingUp, Clock, ThumbsUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const SORT_OPTIONS = [
  { value: "recent", label: "Récent", icon: Clock },
  { value: "popular", label: "Populaire", icon: ThumbsUp },
  { value: "trending", label: "Tendance", icon: TrendingUp },
] as const;

type SortValue = typeof SORT_OPTIONS[number]["value"];

interface IdeaFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  sortBy: SortValue;
  onSortChange: (sort: SortValue) => void;
  resultCount?: number;
}

export function IdeaFilters({
  searchQuery,
  onSearchChange,
  selectedCategories,
  onCategoriesChange,
  sortBy,
  onSortChange,
  resultCount,
}: IdeaFiltersProps) {
  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoriesChange(selectedCategories.filter((c) => c !== category));
    } else {
      onCategoriesChange([...selectedCategories, category]);
    }
  };

  const clearFilters = () => {
    onSearchChange("");
    onCategoriesChange([]);
    onSortChange("recent");
  };

  const hasActiveFilters = searchQuery || selectedCategories.length > 0 || sortBy !== "recent";

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher une idée..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-4"
        />
      </div>

      {/* Tri */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {SORT_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <Button
              key={option.value}
              variant={sortBy === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => onSortChange(option.value)}
              className="flex items-center gap-1.5 flex-shrink-0"
            >
              <Icon className="h-3.5 w-3.5" />
              {option.label}
            </Button>
          );
        })}
      </div>

      {/* Catégories */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <SlidersHorizontal className="h-4 w-4" />
            Catégories
            {selectedCategories.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {selectedCategories.length}
              </Badge>
            )}
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs h-auto py-1"
            >
              Réinitialiser
            </Button>
          )}
        </div>
        
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

      {/* Résultats count */}
      {resultCount !== undefined && (
        <p className="text-sm text-muted-foreground">
          {resultCount} idée{resultCount > 1 ? "s" : ""} trouvée{resultCount > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
