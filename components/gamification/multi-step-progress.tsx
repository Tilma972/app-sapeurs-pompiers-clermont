"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Milestone {
    niveau: number;
    titre: string;
    xp_requis: number;
    icone: string;
}

interface MultiStepProgressProps {
    currentXp: number;
    milestones: Milestone[];
    className?: string;
}

export function MultiStepProgress({ currentXp, milestones, className }: MultiStepProgressProps) {
    // Calculer le pourcentage global de progression
    const maxXp = milestones[milestones.length - 1].xp_requis;
    const progressPercent = Math.min((currentXp / maxXp) * 100, 100);

    return (
        <div className={cn("w-full py-8 px-4", className)}>
            <div className="relative">
                {/* Barre de fond (grise) */}
                <div className="absolute top-1/2 left-0 w-full h-2 bg-muted rounded-full -translate-y-1/2" />

                {/* Barre de progression (animée) */}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="absolute top-1/2 left-0 h-2 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full -translate-y-1/2 z-10"
                />

                {/* Milestones */}
                <div className="relative flex justify-between w-full z-20">
                    {milestones.map((milestone, index) => {
                        const isReached = currentXp >= milestone.xp_requis;
                        const isNext = !isReached && (index === 0 || currentXp >= milestones[index - 1].xp_requis);

                        // Calculer la position relative si on voulait être précis, mais flex justify-between fait le job pour l'espacement
                        // Pour une barre précise, il faudrait positionner en absolute avec left: (xp/max)*100%

                        return (
                            <div key={milestone.niveau} className="flex flex-col items-center group">
                                {/* Node */}
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: index * 0.1 }}
                                    className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center border-4 transition-colors duration-300 bg-card",
                                        isReached
                                            ? "border-cyan-400 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                                            : isNext
                                                ? "border-blue-500/50 text-muted-foreground animate-pulse"
                                                : "border-muted text-muted-foreground"
                                    )}
                                >
                                    {isReached ? (
                                        <Check className="w-5 h-5" />
                                    ) : (
                                        <span className="text-sm font-bold">{milestone.niveau}</span>
                                    )}
                                </motion.div>

                                {/* Labels */}
                                <div className="absolute top-12 flex flex-col items-center text-center w-24">
                                    <span className={cn(
                                        "text-xs font-bold transition-colors",
                                        isReached ? "text-cyan-400" : "text-muted-foreground"
                                    )}>
                                        {milestone.titre}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {milestone.xp_requis.toLocaleString()} XP
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
