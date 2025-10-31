"use client";

import { useState, useEffect } from "react";
import { Heart, Shield } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { PrimaryCta } from "@/components/landing/primary-cta";
import { heroSlides } from "@/components/landing/hero-slides";

export function HeroSimple({ loggedIn = false }: { loggedIn?: boolean }) {
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
    <section className="relative h-screen w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          {/* Image de fond */}
          <div className="absolute inset-0">
            <Image
              src={heroSlides[currentSlide].image}
              alt={heroSlides[currentSlide].title}
              fill
              className="object-cover animate-ken-burns"
              priority={currentSlide === 0}
              sizes="100vw"
              quality={90}
            />
          </div>

          {/* Overlay gradient chaleureux pour association solidaire */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-900/60 via-orange-800/40 to-transparent" />

          {/* Contenu aligné à gauche sur desktop */}
          <div className="relative z-10 h-full">
            <div className="container mx-auto h-full px-4 md:px-8 lg:px-12">
              <div className="flex h-full items-center md:justify-start justify-center">
                <div className="max-w-3xl text-white text-center md:text-left">
              <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="space-y-6"
              >
                {/* Titre principal */}
                    <motion.h1
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                      className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-4"
                    >
                      {heroSlides[currentSlide].title}
                    </motion.h1>

                {/* Sous-titre */}
                <motion.p
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  className="text-xl md:text-2xl text-white/90 max-w-2xl md:mx-0 mx-auto leading-relaxed mb-6"
                >
                  {heroSlides[currentSlide].subtitle}
                </motion.p>

                {/* CTA Buttons conditionnels */}
                    <motion.div
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8, delay: 0.7 }}
                      className="flex flex-col sm:flex-row gap-4 md:justify-start justify-center"
                    >
                      {loggedIn ? (
                        <>
                          <PrimaryCta href="/dashboard">
                            <span className="inline-flex items-center">
                              <Shield className="mr-2 h-5 w-5" /> Espace membre
                            </span>
                          </PrimaryCta>
                        </>
                      ) : (
                        <>
                          <PrimaryCta href="/auth/login">
                            <span className="inline-flex items-center">
                              <Heart className="mr-2 h-5 w-5" /> Soutenir l&apos;amicale
                            </span>
                          </PrimaryCta>
                        </>
                      )}
                    </motion.div>
              </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation dots - mobile centered */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-20 flex gap-3 md:hidden">
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

      {/* Navigation dots - desktop right vertical */}
      <div className="absolute bottom-8 right-8 hidden md:flex flex-col gap-3 z-20">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentSlide ? 'bg-white h-8' : 'bg-white/40 hover:bg-white/60'
            }`}
            onClick={() => goToSlide(index)}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
