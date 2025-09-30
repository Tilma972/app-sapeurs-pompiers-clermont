"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumIconProps {
  icon: LucideIcon;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "glass" | "gradient" | "minimal" | "glow";
  className?: string;
  animate?: boolean;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12", 
  lg: "w-16 h-16",
  xl: "w-20 h-20"
};

const iconSizes = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8", 
  xl: "h-10 w-10"
};

export function PremiumIcon({ 
  icon: Icon, 
  size = "md", 
  variant = "glass",
  className,
  animate = true
}: PremiumIconProps) {
  const variantClasses = {
    glass: "glass-icon",
    gradient: "gradient-icon", 
    minimal: "minimal-icon",
    glow: "glow-icon"
  };

  const whileHover = animate ? { scale: 1.05, rotate: 3 } : undefined;

  return (
    <motion.div
      whileHover={whileHover}
      className={cn(
        "flex items-center justify-center rounded-2xl transition-all duration-300",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      <Icon className={cn("transition-colors duration-300", iconSizes[size])} />
    </motion.div>
  );
}
