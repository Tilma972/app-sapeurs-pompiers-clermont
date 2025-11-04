/**
 * Filtres pour la page Avantages
 * Catégories, type d'avantage, recherche
 */

'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PartnerCategory, OfferType } from '@/lib/types/avantages.types';
import { Search, X, QrCode, Tag } from 'lucide-react';

interface OfferFiltersProps {
  onFilterChange: (filters: {
    category?: PartnerCategory;
    type?: OfferType;
    search?: string;
  }) => void;
}

const CATEGORIES: { value: PartnerCategory; label: string; emoji: string }[] = [
  { value: 'restaurant', label: 'Restaurant', emoji: '🍽️' },
  { value: 'commerce', label: 'Commerce', emoji: '🛍️' },
  { value: 'service', label: 'Service', emoji: '🔧' },
  { value: 'loisir', label: 'Loisir', emoji: '🎭' },
  { value: 'sante', label: 'Santé', emoji: '⚕️' },
  { value: 'autre', label: 'Autre', emoji: '📦' },
];

const TYPES: { value: OfferType; label: string; icon: typeof QrCode }[] = [
  { value: 'qr_code', label: 'QR Code', icon: QrCode },
  { value: 'code_promo', label: 'Code Promo', icon: Tag },
];

export function OfferFilters({ onFilterChange }: OfferFiltersProps) {
  const [selectedCategory, setSelectedCategory] = useState<PartnerCategory | undefined>();
  const [selectedType, setSelectedType] = useState<OfferType | undefined>();
  const [search, setSearch] = useState('');

  const handleCategoryClick = (category: PartnerCategory) => {
    const newCategory = selectedCategory === category ? undefined : category;
    setSelectedCategory(newCategory);
    onFilterChange({
      category: newCategory,
      type: selectedType,
      search: search || undefined,
    });
  };

  const handleTypeClick = (type: OfferType) => {
    const newType = selectedType === type ? undefined : type;
    setSelectedType(newType);
    onFilterChange({
      category: selectedCategory,
      type: newType,
      search: search || undefined,
    });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onFilterChange({
      category: selectedCategory,
      type: selectedType,
      search: value || undefined,
    });
  };

  const handleClearFilters = () => {
    setSelectedCategory(undefined);
    setSelectedType(undefined);
    setSearch('');
    onFilterChange({});
  };

  const hasActiveFilters = selectedCategory || selectedType || search;

  return (
    <div className="space-y-4 mb-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher une offre ou un partenaire..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {search && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Effacer la recherche"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Categories */}
      <div>
        <h3 className="text-sm font-medium mb-2">Catégories</h3>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <Badge
              key={category.value}
              variant={selectedCategory === category.value ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/10 transition-colors px-3 py-1.5"
              onClick={() => handleCategoryClick(category.value)}
            >
              <span className="mr-1.5">{category.emoji}</span>
              {category.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Types */}
      <div>
        <h3 className="text-sm font-medium mb-2">Type d&apos;avantage</h3>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <Badge
                key={type.value}
                variant={selectedType === type.value ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/10 transition-colors px-3 py-1.5"
                onClick={() => handleTypeClick(type.value)}
              >
                <Icon className="h-3 w-3 mr-1.5" />
                {type.label}
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Effacer les filtres
          </Button>
        </div>
      )}
    </div>
  );
}
