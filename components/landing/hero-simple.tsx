"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

const heroSlides = [
  {
    id: 1,
    title: "Prêts à intervenir 24h/24",
    subtitle: "L'amicale qui soutient nos sapeurs-pompiers",
    image: "https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/24_24.jpeg",
        cta: {
          primary: { text: "Découvrir nos actions", href: "#actions" },
          secondary: { text: "Nous soutenir", href: "#contact" }
        }
  },
  {
    id: 2,
    title: "Au cœur de l'action",
    subtitle: "Solidarité et professionnalisme",
    image: "https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/coeur_action.webp",
        cta: {
          primary: { text: "Découvrir nos actions", href: "#actions" },
          secondary: { text: "Nous soutenir", href: "#contact" }
        }
  },
  {
    id: 3,
    title: "L'esprit pompier",
    subtitle: "Une communauté unie pour servir",
    image: "https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/esprit_pompiers.jpeg",
        cta: {
          primary: { text: "Découvrir nos actions", href: "#actions" },
          secondary: { text: "Nous soutenir", href: "#contact" }
        }
  }
];

export function HeroSimple() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Autoplay simple
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <section className="relative h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          {/* Image avec effet Ken Burns */}
          <div className="absolute inset-0">
            <Image
              src={heroSlides[currentSlide].image}
              alt={heroSlides[currentSlide].title}
              fill
              className="kenburns-image object-cover"
              priority={currentSlide === 0}
              sizes="100vw"
              quality={90}
            />
          </div>

          {/* Overlay sombre */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/30 to-black/70" />

          {/* Contenu */}
          <div className="relative z-10 h-full flex items-center justify-center">
            <div className="text-center max-w-4xl px-4">
              <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="space-y-8"
              >
                {/* Titre principal simple */}
                    <motion.h1
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                      className="text-6xl lg:text-8xl xl:text-9xl font-bold text-white leading-tight mb-6"
                    >
                      {heroSlides[currentSlide].title}
                    </motion.h1>

                {/* Sous-titre */}
                <motion.p
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="text-2xl lg:text-3xl xl:text-4xl text-white/90 max-w-4xl mx-auto leading-relaxed mb-8"
                >
                  {heroSlides[currentSlide].subtitle}
                </motion.p>

                {/* CTA Buttons */}
                    <motion.div
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.7 }}
                      className="flex flex-col sm:flex-row gap-4 justify-center"
                    >
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors glass-button"
                      >
                        <Link href={heroSlides[currentSlide].cta.primary.href} className="flex items-center">
                          {heroSlides[currentSlide].cta.primary.text}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-8 py-3 border border-primary text-primary rounded-lg font-medium hover:bg-primary/10 transition-colors glass-button"
                      >
                        <Link href={heroSlides[currentSlide].cta.secondary.href} className="flex items-center">
                          <Heart className="mr-2 h-4 w-4" />
                          {heroSlides[currentSlide].cta.secondary.text}
                        </Link>
                      </motion.button>
                    </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation dots */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-3">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-white scale-125' 
                : 'bg-white/40 hover:bg-white/60'
            }`}
            onClick={() => goToSlide(index)}
            aria-label={`Aller au slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
