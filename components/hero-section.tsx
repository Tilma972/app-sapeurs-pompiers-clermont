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
  overlayOpacity?: "none" | "light" | "medium" | "heavy";
  rounded?: boolean;
  objectPosition?: string; // e.g. "center" | "center 40%"
}

export function HeroSection({
  backgroundImage,
  title,
  subtitle,
  children,
  className,
  overlayOpacity = "none",
  rounded = true,
  objectPosition = "center",
}: HeroSectionProps) {
  const overlayClasses = {
    none: "",
    light: "from-transparent via-black/10 to-black/40",
    medium: "from-transparent via-black/20 to-black/50",
    heavy: "from-black/30 via-black/50 to-black/70",
  } as const;

  return (
    <div
      className={cn(
        "relative h-[240px] sm:h-[240px] overflow-hidden",
        rounded ? "rounded-none" : "rounded-xl",
        className
      )}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={backgroundImage}
          alt={title}
          fill
          className="object-cover object-center"
          priority
          unoptimized
          quality={85}
          sizes="100vw"
          style={{ objectPosition }}
        />
        {/* Dark gradient overlay (render only if requested) */}
        {overlayOpacity !== "none" && (
          <div
            className={cn("absolute inset-0 bg-gradient-to-b", overlayClasses[overlayOpacity])}
          />
        )}
      </div>

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-4 pb-6">
        <div>
          <h1
            className="text-white text-3xl sm:text-4xl font-bold drop-shadow-lg"
            style={{ textShadow: "0 4px 8px rgba(0,0,0,0.8)", WebkitTextStroke: "0px transparent" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className="text-white/95 text-base sm:text-lg mt-2"
              style={{ textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
}

export default HeroSection;
