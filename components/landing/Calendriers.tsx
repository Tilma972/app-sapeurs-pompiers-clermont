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

  // Variants simples pour mobile (pas d'animation, juste affichage)
  const mobileVariants = {
    hidden: { opacity: 1 },
    visible: { opacity: 1 }
  };

  return (
    <section className="py-12 md:py-24 bg-brandCream dark:bg-darkSurface transition-colors w-full" id="calendrier">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="max-w-[1920px] mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          {/* Image */}
          <motion.div
            ref={leftRef}
            className="md:w-1/2"
            variants={isMobile ? mobileVariants : slideInLeft}
            initial="hidden"
            animate={leftInView ? "visible" : "hidden"}
          >
            <motion.div
              whileHover={isMobile ? {} : { scale: 1.05, rotate: 2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Image
                src="https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/couverture_cal_2026%20.webp"
                alt="Calendrier 2026 des Sapeurs-Pompiers de Clermont - 12 pages illustrées avec photos des pompiers en action"
                width={600}
                height={800}
                loading="lazy"
                className="rounded-lg shadow-2xl w-full"
              />
            </motion.div>
          </motion.div>

          {/* Contenu */}
          <motion.div
            ref={rightRef}
            className="md:w-1/2"
            variants={isMobile ? mobileVariants : slideInRight}
            initial="hidden"
            animate={rightInView ? "visible" : "hidden"}
          >
            <span className="font-bold text-primary dark:text-brandOrange text-sm">NOTRE PRODUIT PHARE</span>
            <h2 className="mt-2 text-2xl md:text-4xl font-montserrat font-bold text-brandBrown dark:text-darkText">
              Le Calendrier 2026 est arrivé !
            </h2>
            <p className="mt-3 md:mt-4 text-base md:text-lg text-brandBrown/80 dark:text-darkText/90">
              Plus qu&apos;une tradition, notre calendrier annuel est la principale source de 
              financement de nos actions. Chaque contribution lors de la tournée des calendriers 
              est un soutien direct à notre Amicale.
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/boutique"
                className="mt-6 md:mt-8 inline-flex items-center justify-center px-6 py-3 font-medium text-white bg-brandOrange rounded-lg hover:bg-brandOrange/90 transition-all shadow-lg hover:shadow-xl group"
              >
                Pré-commander en ligne
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
              </Link>
            </motion.div>
          </motion.div>
        </div>
        </div>
      </div>
    </section>
  );
}
