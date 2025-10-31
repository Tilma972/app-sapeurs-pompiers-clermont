"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Heart, ChevronDown } from "lucide-react";
import { fadeInUp, scaleIn } from "@/lib/animations";
import { HeroSlide, heroSlides as defaultSlides } from "@/components/landing/hero-slides";

type HeroProps = {
  backgroundImage: string; // URL publique Supabase
  title: string;
  subtitle?: string;
  ctaHref?: string;
  ctaLabel?: string;
  overlayOpacity?: "none" | "light" | "medium" | "heavy";
  objectPosition?: string; // ex: "center 40%"
  showScrollIndicator?: boolean;
  slides?: HeroSlide[]; // si présent, ignore backgroundImage/title et joue un diaporama
  autoplayMs?: number;
};

const overlayMap: Record<NonNullable<HeroProps["overlayOpacity"]>, string> = {
  none: "",
  light: "from-transparent via-black/10 to-black/40",
  medium: "from-transparent via-black/20 to-black/50",
  heavy: "from-black/30 via-black/50 to-black/70",
};

export function Hero(props: HeroProps) {
  const {
    backgroundImage,
    title,
    subtitle,
    ctaHref,
    ctaLabel = "Soutenir notre Amicale",
    overlayOpacity = "light",
    objectPosition = "center",
    showScrollIndicator = true,
    slides,
    autoplayMs = 8000,
  } = props;

  const prefersReducedMotion = useReducedMotion();

  // If slides provided, run slideshow using AnimatePresence
  const useSlides = Array.isArray(slides) && slides.length > 0;
  const effectiveSlides = useSlides ? slides : undefined;

  const [current, setCurrent] = React.useState(0);
  React.useEffect(() => {
    if (!useSlides) return;
    const id = setInterval(() => {
      setCurrent((p) => (p + 1) % (effectiveSlides!.length));
    }, autoplayMs);
    return () => clearInterval(id);
  }, [useSlides, effectiveSlides, autoplayMs]);

  const active = useSlides ? effectiveSlides![current] : undefined;

  return (
    <section className="relative pt-12 pb-16 md:pt-16 md:pb-24 overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={useSlides ? active!.id : backgroundImage}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          aria-hidden
        >
          <motion.div
            className="absolute inset-0"
            initial={prefersReducedMotion ? false : { scale: 1, opacity: 1 }}
            animate={prefersReducedMotion ? undefined : { scale: 1.06, opacity: 1 }}
            transition={prefersReducedMotion ? undefined : { duration: 12, ease: "easeOut" }}
          >
            <Image
              src={useSlides ? active!.image : backgroundImage}
              alt={useSlides ? active!.title : ""}
              fill
              priority
              sizes="100vw"
              className="object-cover"
              style={{ objectPosition }}
            />
            {overlayOpacity !== "none" && (
              <div className={`absolute inset-0 bg-gradient-to-t ${overlayMap[overlayOpacity]}`} />
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Content left-aligned */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div initial="hidden" animate="visible" className="max-w-3xl text-left">
          <motion.h1
            variants={fadeInUp}
            className="text-3xl md:text-6xl font-extrabold text-white drop-shadow-[0_6px_16px_rgba(0,0,0,0.9)] leading-tight"
          >
            {useSlides ? active!.title : title}
          </motion.h1>

          <motion.p
            variants={fadeInUp}
            className="mt-4 text-base md:text-xl text-white/95 drop-shadow-[0_3px_8px_rgba(0,0,0,0.85)]"
          >
            {useSlides ? active!.subtitle : (subtitle ?? "")}
          </motion.p>

          <motion.div variants={scaleIn} className="mt-6">
            <Link
              href={useSlides ? (active!.cta?.primary?.href ?? ctaHref ?? "#") : (ctaHref ?? "#")}
              className="inline-flex items-center justify-center px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-bold text-white bg-primary rounded-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group"
            >
              <Heart className="mr-2 group-hover:scale-110 transition-transform" size={22} />
              {useSlides ? (active!.cta?.primary?.text ?? ctaLabel) : ctaLabel}
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      {showScrollIndicator && !prefersReducedMotion && (
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ opacity: { delay: 1.2, duration: 0.5 }, y: { delay: 1.2, duration: 2, repeat: Infinity, ease: "easeInOut" } }}
          aria-hidden
        >
          <ChevronDown className="w-6 h-6 text-white/95 drop-shadow" />
        </motion.div>
      )}
    </section>
  );
}

// Option: un wrapper pratique qui réutilise les slides existants
export function HeroLanding(props: Omit<HeroProps, "slides" | "backgroundImage" | "title">) {
  return <Hero slides={defaultSlides} title="" backgroundImage={defaultSlides[0].image} {...props} />;
}
