"use client";

import Image from "next/image";
import * as React from "react";
import { cn } from "@/lib/utils";

interface HeroSectionProps {
  backgroundImage: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
  overlayOpacity?: "light" | "medium" | "heavy";
}

export function HeroSection({
  backgroundImage,
  title,
  subtitle,
  children,
  className,
  overlayOpacity = "medium",
}: HeroSectionProps) {
  const overlayClasses = {
    light: "from-black/40 via-black/50 to-background",
    medium: "from-black/60 via-black/70 to-background",
    heavy: "from-black/70 via-black/80 to-background",
  } as const;

  return (
    <div className={cn("relative h-[220px] sm:h-[320px] overflow-hidden rounded-xl", className)}>
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={backgroundImage}
          alt={title}
          fill
          className="object-cover"
          priority
          quality={85}
          sizes="(max-width: 640px) 100vw, 640px"
        />
        {/* Dark gradient overlay */}
        <div
          className={cn("absolute inset-0 bg-gradient-to-b", overlayClasses[overlayOpacity])}
        />
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-5">
        <div>
          <h1 className="text-white text-2xl sm:text-3xl font-bold drop-shadow md:leading-tight">{title}</h1>
          {subtitle && <p className="text-white/85 text-sm sm:text-base mt-1 drop-shadow">{subtitle}</p>}
        </div>
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
}

export default HeroSection;
