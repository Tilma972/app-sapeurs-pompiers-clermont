/**
 * Filtres pour la page Avantages (style chips horizontaux)
 * Design compact avec scroll horizontal
 */

'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { PartnerCategory, OfferType } from '@/lib/types/avantages.types';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfferFiltersProps {
  onFilterChange: (filters: {
    category?: PartnerCategory;
    type?: OfferType;
    search?: string;
  }) => void;
}

const CATEGORIES: { value: PartnerCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'restaurant', label: 'Restaurants' },
  { value: 'commerce', label: 'Shopping' },
  { value: 'service', label: 'Services' },
  { value: 'loisir', label: 'Loisirs' },
  { value: 'sante', label: 'Santé' },
];

export function OfferFilters({ onFilterChange }: OfferFiltersProps) {
  const [selectedCategory, setSelectedCategory] = useState<PartnerCategory | 'all'>('all');
  const [search, setSearch] = useState('');

  const handleCategoryClick = (category: PartnerCategory | 'all') => {
    setSelectedCategory(category);
    onFilterChange({
      category: category === 'all' ? undefined : category,
      search: search || undefined,
    });
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onFilterChange({
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      search: value || undefined,
    });
  };

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher par partenaire, mot-clé..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 h-12 bg-card shadow-sm"
        />
      </div>

      {/* Category Chips (scroll horizontal) */}
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        <style jsx global>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
        
        {CATEGORIES.map((category) => (
          <button
            key={category.value}
            onClick={() => handleCategoryClick(category.value)}
            className={cn(
              'flex h-10 shrink-0 items-center justify-center rounded-full px-4 text-sm font-medium transition-all',
              selectedCategory === category.value
                ? 'bg-primary text-white shadow-md'
                : 'bg-card text-foreground shadow-sm hover:shadow-md'
            )}
          >
            {category.label}
          </button>
        ))}
      </div>
    </div>
  );
}
