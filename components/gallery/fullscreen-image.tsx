/**
 * FullscreenImage - Composant pour afficher une image en plein écran
 * Avec animations fluides et gestes de fermeture
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X } from "lucide-react";

interface FullscreenImageProps {
  src: string;
  alt: string;
  children: React.ReactNode;
}

export function FullscreenImage({ src, alt, children }: FullscreenImageProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const openFullscreen = () => setIsFullscreen(true);
  const closeFullscreen = () => setIsFullscreen(false);

  return (
    <>
      {/* Image cliquable */}
      <div onClick={openFullscreen} className="cursor-zoom-in">
        {children}
      </div>

      {/* Modal plein écran */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={closeFullscreen}
          >
            {/* Bouton fermer */}
            <button
              onClick={closeFullscreen}
              className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              aria-label="Fermer"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Image en plein écran */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="relative w-full h-full p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={src}
                alt={alt}
                fill
                sizes="100vw"
                style={{ objectFit: "contain" }}
                className="cursor-zoom-out"
                onClick={closeFullscreen}
                priority
              />
            </motion.div>

            {/* Instructions (optionnel) */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
              Cliquez pour fermer
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
