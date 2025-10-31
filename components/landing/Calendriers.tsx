'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { slideInLeft, slideInRight } from '@/lib/animations';

export function Calendrier() {
  const [leftRef, leftInView] = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  const [rightRef, rightInView] = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  return (
    <section className="py-12 md:py-24 bg-brandCream dark:bg-darkSurface transition-colors" id="calendrier">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
          {/* Image */}
          <motion.div
            ref={leftRef}
            className="md:w-1/2"
            variants={slideInLeft}
            initial="hidden"
            animate={leftInView ? "visible" : "hidden"}
          >
            <motion.div
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Image
                src="https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/couverture_cal_2026%20.webp"
                alt="Calendrier des sapeurs-pompiers 2026"
                width={600}
                height={800}
                className="rounded-lg shadow-2xl w-full"
              />
            </motion.div>
          </motion.div>

          {/* Contenu */}
          <motion.div
            ref={rightRef}
            className="md:w-1/2"
            variants={slideInRight}
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
                href="#"
                className="mt-6 md:mt-8 inline-flex items-center justify-center px-6 py-3 font-medium text-white bg-brandOrange rounded-lg hover:bg-brandOrange/90 transition-all shadow-lg hover:shadow-xl group"
              >
                Pré-commander en ligne
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
