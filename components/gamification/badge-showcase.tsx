"use client";

import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, CheckCircle2, TrendingUp } from "lucide-react";
import type { BadgeWithProgress, BadgeCategory, BadgeRarity } from "@/lib/types/gamification.types";
import { Progress } from "@/components/ui/progress";

interface BadgeShowcaseProps {
  badges: BadgeWithProgress[];
  className?: string;
}

// Configuration des couleurs par rareté
const RARITY_CONFIG: Record<BadgeRarity, { label: string; color: string; bg: string; border: string }> = {
  common: {
    label: 'Commun',
    color: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-800',
    border: 'border-gray-300 dark:border-gray-700',
  },
  rare: {
    label: 'Rare',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950',
    border: 'border-blue-300 dark:border-blue-700',
  },
  epic: {
    label: 'Épique',
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950',
    border: 'border-purple-300 dark:border-purple-700',
  },
  legendary: {
    label: 'Légendaire',
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-950',
    border: 'border-yellow-300 dark:border-yellow-700',
  },
};

// Labels des catégories
const CATEGORY_LABELS: Record<BadgeCategory, string> = {
  starter: 'Démarrage',
  montant: 'Montant',
  social: 'Social',
  streak: 'Séries',
  excellence: 'Excellence',
  special: 'Spéciaux',
};

export function BadgeShowcase({ badges, className }: BadgeShowcaseProps) {
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all');
  const [showOnlyUnlocked, setShowOnlyUnlocked] = useState(false);

  // Statistiques
  const stats = useMemo(() => {
    const unlocked = badges.filter((b) => b.unlocked).length;
    const total = badges.length;
    const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;

    return { unlocked, total, percentage };
  }, [badges]);

  // Filtrage
  const filteredBadges = useMemo(() => {
    let filtered = badges;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((b) => b.category === selectedCategory);
    }

    if (showOnlyUnlocked) {
      filtered = filtered.filter((b) => b.unlocked);
    }

    return filtered;
  }, [badges, selectedCategory, showOnlyUnlocked]);

  // Catégories disponibles
  const categories = useMemo(() => {
    const cats = new Set(badges.map((b) => b.category));
    return Array.from(cats).sort();
  }, [badges]);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl sm:text-2xl">Collection de badges</CardTitle>
            <CardDescription>
              {stats.unlocked} / {stats.total} badges débloqués ({stats.percentage}%)
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-lg px-3 py-1">
            {stats.percentage}%
          </Badge>
        </div>

        {/* Barre de progression globale */}
        <div className="mt-4">
          <Progress value={stats.percentage} className="h-3" />
        </div>
      </CardHeader>

      <CardContent>
        {/* Filtres */}
        <div className="space-y-4 mb-6">
          {/* Filtre par catégorie */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              Tous
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
              >
                {CATEGORY_LABELS[cat]}
              </Button>
            ))}
          </div>

          {/* Toggle débloqués uniquement */}
          <Button
            variant={showOnlyUnlocked ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShowOnlyUnlocked(!showOnlyUnlocked)}
            className="flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Débloqués uniquement
          </Button>
        </div>

        {/* Grille de badges */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredBadges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>

        {filteredBadges.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Aucun badge trouvé avec ces filtres</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Composant individuel de badge
function BadgeCard({ badge }: { badge: BadgeWithProgress }) {
  const rarityConfig = RARITY_CONFIG[badge.rarity];
  const isLocked = !badge.unlocked;

  const progressPercentage = badge.current_progress !== undefined && badge.unlock_criteria?.threshold
    ? Math.min((badge.current_progress / badge.unlock_criteria.threshold) * 100, 100)
    : 0;

  return (
    <div
      className={`relative p-4 rounded-lg border-2 transition-all hover:scale-105 ${
        isLocked
          ? 'bg-muted/50 border-border opacity-60'
          : `${rarityConfig.bg} ${rarityConfig.border}`
      }`}
    >
      {/* Icône de badge */}
      <div className="flex flex-col items-center space-y-2">
        <div
          className={`text-4xl sm:text-5xl ${isLocked ? 'grayscale blur-sm' : ''} transition-all`}
          aria-label={badge.name}
        >
          {badge.icon || '🏆'}
        </div>

        {/* Nom du badge */}
        <div className="text-center">
          <h4 className={`text-sm font-bold line-clamp-2 ${rarityConfig.color}`}>
            {badge.name}
          </h4>
          {badge.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {badge.description}
            </p>
          )}
        </div>

        {/* Rareté */}
        <Badge variant="outline" className={`text-xs ${rarityConfig.color}`}>
          {rarityConfig.label}
        </Badge>

        {/* XP Reward */}
        {badge.xp_reward > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            <span>+{badge.xp_reward} XP</span>
          </div>
        )}

        {/* État de déblocage */}
        {isLocked ? (
          <div className="flex flex-col items-center gap-1 w-full">
            <Lock className="h-4 w-4 text-muted-foreground" />
            {badge.current_progress !== undefined && badge.unlock_criteria && (
              <>
                <div className="w-full mt-2">
                  <Progress value={progressPercentage} className="h-1.5" />
                </div>
                <span className="text-xs text-muted-foreground text-center">
                  {badge.current_progress} / {badge.unlock_criteria.threshold}
                </span>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-medium">Débloqué</span>
          </div>
        )}

        {/* Date de déblocage */}
        {badge.unlocked_at && (
          <span className="text-xs text-muted-foreground">
            {new Date(badge.unlocked_at).toLocaleDateString('fr-FR')}
          </span>
        )}
      </div>
    </div>
  );
}
