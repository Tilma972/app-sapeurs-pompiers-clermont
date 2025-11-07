/**
 * Composant LikeButton - Bouton like présentationnel avec animation Framer Motion
 * Version simplifiée : reçoit l'état via props, appelle un callback
 */

"use client";

import { Heart } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
  liked: boolean;
  onToggle: () => void | Promise<void>;
  variant?: "compact" | "overlay";
  showCount?: boolean;
  count?: number;
}

export function LikeButton({
  liked,
  onToggle,
  variant = "compact",
  showCount = false,
  count = 0,
}: LikeButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!liked) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    }

    await onToggle();
  };

  // Particules flottantes (effet Instagram)
  const particles = Array.from({ length: 6 }, (_, i) => i);

  if (variant === "overlay") {
    return (
      <div className="relative inline-block">
        <motion.button
          onClick={handleClick}
          whileTap={{ scale: 0.9 }}
          className={cn(
            "p-2 rounded-full",
            "backdrop-blur-md transition-colors duration-200",
            "shadow-lg",
            liked 
              ? "bg-red-500/90 text-white" 
              : "bg-white/90 text-gray-700 hover:bg-white"
          )}
          aria-label={liked ? "Unlike" : "Like"}
        >
          <motion.div
            animate={{ scale: isAnimating ? [1, 1.3, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            <Heart 
              className={cn(
                "w-5 h-5 transition-all duration-200",
                liked && "fill-current"
              )}
            />
          </motion.div>
        </motion.button>

        {/* Particules animées avec Framer Motion */}
        <AnimatePresence>
          {isAnimating && particles.map((i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 bg-red-500 rounded-full pointer-events-none"
              initial={{ 
                x: 0, 
                y: 0, 
                opacity: 1, 
                scale: 0 
              }}
              animate={{
                x: Math.cos((i * 60) * Math.PI / 180) * 30,
                y: Math.sin((i * 60) * Math.PI / 180) * 30,
                opacity: 0,
                scale: 1.5
              }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 0.6,
                ease: "easeOut",
                delay: i * 0.05
              }}
              style={{
                left: '50%',
                top: '50%',
              }}
            />
          ))}
        </AnimatePresence>
      </div>
    );
  }

  // Variant compact
  return (
    <motion.button
      onClick={handleClick}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-lg",
        "border transition-all duration-200",
        liked
          ? "bg-red-50 border-red-500 text-red-600"
          : "bg-background border-border hover:border-red-300"
      )}
    >
      <motion.div
        animate={{ scale: isAnimating ? [1, 1.2, 1] : 1 }}
        transition={{ duration: 0.3 }}
      >
        <Heart 
          className={cn(
            "w-4 h-4 transition-transform duration-200",
            liked && "fill-current"
          )}
        />
      </motion.div>
      {showCount && <span className="text-xs font-medium">{count}</span>}
    </motion.button>
  );
}
