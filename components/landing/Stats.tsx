'use client';

import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import CountUp from 'react-countup';
import { staggerContainer, staggerItem } from '@/lib/animations';

export function Stats() {
  const stats = [
    { value: 1976, suffix: '+', label: 'Interventions par an', duration: 2.5 },
    { value: 98, suffix: '', label: 'Sapeurs-Pompiers volontaires', duration: 2 },
    { value: 21, suffix: '', label: 'Communes desservies', duration: 1.5 },
  ];

  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  return (
    <section className="py-8 md:py-12 bg-gray-50 dark:bg-[#5C3A38] transition-colors">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-center"
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="p-4 md:p-6"
              variants={staggerItem}
            >
              <p className="text-4xl md:text-5xl font-[family-name:var(--font-montserrat)] font-bold text-primary dark:text-accent-orange">
                {inView ? (
                  <>
                    <CountUp
                      end={stat.value}
                      duration={stat.duration}
                      separator="," 
                      useEasing
                      easingFn={(t: number, b: number, c: number, d: number) => {
                        // easeOutExpo
                        return c * (-Math.pow(2, -10 * t / d) + 1) + b;
                      }}
                    />
                    {stat.suffix}
                  </>
                ) : (
                  '0'
                )}
              </p>
              <p className="mt-2 text-base md:text-lg text-[#4A2E2C] dark:text-dark-text/90">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
