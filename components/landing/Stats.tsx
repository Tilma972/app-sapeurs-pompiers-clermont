'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import CountUp from 'react-countup';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { useIsMobile } from '@/hooks/use-is-mobile';

export function Stats() {
  const isMobile = useIsMobile();

  const stats = [
    { value: 1976, prefix: '', label: 'Interventions par an', duration: 2.5 },
    { value: 108, suffix: '', label: 'Sapeurs-Pompiers', duration: 2 },
    { value: 20, suffix: '', label: 'Communes desservies', duration: 1.5 },
  ];

  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  // Variants simples pour mobile (animation légère)
  const mobileVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } }
  };

  return (
    <section className="py-8 md:py-12 bg-gray-50 dark:bg-[#5C3A38] transition-colors w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <motion.div
          ref={ref}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-center max-w-[1920px] mx-auto"
          variants={isMobile ? mobileVariants : staggerContainer}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="p-4 md:p-6"
              variants={isMobile ? mobileVariants : staggerItem}
            >
              <p className="text-5xl md:text-5xl font-[family-name:var(--font-montserrat)] font-bold text-primary dark:text-accent-orange">
                {inView ? (
                  // Animation CountUp pour tous (mobile + desktop)
                  // Mobile : durée 1.8s (compromis perf/esthétique), Desktop : durée normale
                  <>
                    <CountUp
                      end={stat.value}
                      duration={isMobile ? 1.8 : stat.duration}
                      separator=","
                      useEasing
                      easingFn={(t: number, b: number, c: number, d: number) => {
                        // easeOutExpo - animation fluide et naturelle
                        return c * (-Math.pow(2, -10 * t / d) + 1) + b;
                      }}
                    />
                    {stat.suffix}
                  </>
                ) : (
                  '0'
                )}
              </p>
              <p className="mt-2 text-lg md:text-lg font-medium text-[#4A2E2C] dark:text-[#F5EAD6]">
                {stat.label}
              </p>
              {index === 0 && (
                <p className="mt-1 text-sm md:text-xs text-[#6B4A48] dark:text-[#F5EAD6]">
                  Statistiques 2024
                </p>
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
