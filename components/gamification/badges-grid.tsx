"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Lock, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BadgeItem {
    id: string;
    nom: string;
    description: string;
    icone: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    unlocked: boolean;
    unlockedAt?: string;
    progression?: number; // 0-100 if locked
}

interface BadgesGridProps {
    badges: BadgeItem[];
    className?: string;
}

const RARITY_STYLES = {
    common: 'border-gray-500/30 bg-gray-500/5',
    rare: 'border-blue-500/30 bg-blue-500/5',
    epic: 'border-purple-500/30 bg-purple-500/5',
    legendary: 'border-yellow-500/30 bg-yellow-500/5 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
};

const RARITY_LABELS = {
    common: 'Commun',
    rare: 'Rare',
    epic: 'Épique',
    legendary: 'Légendaire'
};

export function BadgesGrid({ badges, className }: BadgesGridProps) {
    const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
    const [sort, setSort] = useState<'date' | 'rarity'>('date');

    // Filtrer et trier les badges
    const filteredBadges = badges
        .filter(badge => {
            if (filter === 'unlocked') return badge.unlocked;
            if (filter === 'locked') return !badge.unlocked;
            return true;
        })
        .sort((a, b) => {
            if (sort === 'date') {
                // Débloqués d'abord, puis par date
                if (a.unlocked && !b.unlocked) return -1;
                if (!a.unlocked && b.unlocked) return 1;
                if (a.unlocked && b.unlocked && a.unlockedAt && b.unlockedAt) {
                    return new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime();
                }
                return 0;
            }
            if (sort === 'rarity') {
                const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
                return rarityOrder[b.rarity] - rarityOrder[a.rarity];
            }
            return 0;
        });

    return (
        <div className={cn("space-y-6", className)}>
            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex gap-2 p-1 bg-muted/50 rounded-lg w-fit">
                    <Button
                        variant={filter === 'all' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter('all')}
                        className="text-xs"
                    >
                        Tous
                    </Button>
                    <Button
                        variant={filter === 'unlocked' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter('unlocked')}
                        className="text-xs"
                    >
                        Débloqués
                    </Button>
                    <Button
                        variant={filter === 'locked' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setFilter('locked')}
                        className="text-xs"
                    >
                        Verrouillés
                    </Button>
                </div>

                <Select value={sort} onValueChange={(v) => setSort(v as 'date' | 'rarity')}>
                    <SelectTrigger className="w-[180px] h-9 text-xs">
                        <SelectValue placeholder="Trier par" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="date">Date d&apos;obtention</SelectItem>
                        <SelectItem value="rarity">Rareté</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                    {filteredBadges.map((badge) => (
                        <motion.div
                            key={badge.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Card className={cn(
                                "h-full p-4 border transition-all duration-300 hover:scale-[1.02]",
                                badge.unlocked ? RARITY_STYLES[badge.rarity] : "border-border bg-card/50 opacity-70 grayscale hover:grayscale-0 hover:opacity-100"
                            )}>
                                <div className="flex items-start gap-4">
                                    <div className="text-4xl shrink-0">
                                        {badge.icone}
                                    </div>

                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-semibold truncate pr-2">{badge.nom}</h4>
                                            {!badge.unlocked && <Lock className="w-3 h-3 text-muted-foreground" />}
                                        </div>

                                        <p className="text-xs text-muted-foreground line-clamp-2 h-8">
                                            {badge.description}
                                        </p>

                                        <div className="flex items-center justify-between pt-2">
                                            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5",
                                                badge.rarity === 'legendary' && "text-yellow-500 border-yellow-500/30",
                                                badge.rarity === 'epic' && "text-purple-500 border-purple-500/30",
                                                badge.rarity === 'rare' && "text-blue-500 border-blue-500/30",
                                            )}>
                                                {RARITY_LABELS[badge.rarity]}
                                            </Badge>

                                            {badge.unlocked && badge.unlockedAt && (
                                                <span className="text-[10px] text-muted-foreground">
                                                    {new Date(badge.unlockedAt).toLocaleDateString('fr-FR')}
                                                </span>
                                            )}
                                        </div>

                                        {!badge.unlocked && badge.progression !== undefined && (
                                            <div className="mt-2 space-y-1">
                                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                                    <span>Progression</span>
                                                    <span>{Math.round(badge.progression)}%</span>
                                                </div>
                                                <Progress value={badge.progression} className="h-1.5" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {filteredBadges.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Aucun badge trouvé pour ce filtre</p>
                </div>
            )}
        </div>
    );
}
