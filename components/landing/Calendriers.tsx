'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { slideInLeft, slideInRight } from '@/lib/animations';
import { useIsMobile } from '@/hooks/use-is-mobile';

export function Calendrier() {
  const isMobile = useIsMobile();

  const [leftRef, leftInView] = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  const [rightRef, rightInView] = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  // Variants simples pour mobile (animation légère fadeIn)
  const mobileVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } }
  };

  return (
    <section className="py-12 md:py-24 bg-brandCream dark:bg-darkSurface transition-colors w-full" id="calendrier">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="max-w-[1920px] mx-auto">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
          {/* Image - Centrée sur mobile */}
          <motion.div
            ref={leftRef}
            className="w-full md:w-1/2 flex justify-center md:justify-start"
            variants={isMobile ? mobileVariants : slideInLeft}
            initial="hidden"
            animate={leftInView ? "visible" : "hidden"}
          >
            <motion.div
              whileHover={isMobile ? {} : { scale: 1.05, rotate: 2 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="w-full max-w-[320px] md:max-w-none"
            >
              <Image
                src="https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/couverture_cal_2026%20.webp"
                alt="Calendrier 2026 des Sapeurs-Pompiers de Clermont - 12 pages illustrées avec photos des pompiers en action"
                width={600}
                height={800}
                loading="lazy"
                className="rounded-lg shadow-2xl w-full h-auto"
              />
            </motion.div>
          </motion.div>

          {/* Contenu - Centré sur mobile, aligné gauche sur desktop */}
          <motion.div
            ref={rightRef}
            className="w-full md:w-1/2"
            variants={isMobile ? mobileVariants : slideInRight}
            initial="hidden"
            animate={rightInView ? "visible" : "hidden"}
          >
            <div className="text-center md:text-left">
              <span className="font-bold text-primary dark:text-brandOrange text-sm block mb-2">
                NOTRE PRODUIT PHARE
              </span>
              <h2 className="text-3xl md:text-4xl font-montserrat font-bold text-brandBrown dark:text-darkText mb-3">
                Le Calendrier 2026 est arrivé !
              </h2>
              <p className="text-lg text-brandBrown/80 dark:text-darkText/90 leading-relaxed mb-6 max-w-2xl mx-auto md:mx-0">
                Plus qu&apos;une tradition, notre calendrier annuel est la principale source de
                financement de nos actions. Chaque contribution lors de la tournée des calendriers
                est un soutien direct à notre Amicale.
              </p>
              <div className="flex justify-center md:justify-start">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href="/boutique"
                    className="inline-flex items-center justify-center px-8 py-4 text-base md:text-lg font-bold text-white bg-brandOrange rounded-lg hover:bg-brandOrange/90 transition-all shadow-lg hover:shadow-xl group"
                  >
                    Pré-commander en ligne
                    <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
        </div>
      </div>
    </section>
  );
}
