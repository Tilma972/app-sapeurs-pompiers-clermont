'use client';

import { Users, Heart, PartyPopper } from 'lucide-react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations';

export function Missions() {
  const missions = [
    {
      icon: Users,
      title: 'Cohésion & Entraide',
      description:
        "Organisation d'événements conviviaux pour renforcer l'esprit d'équipe et la solidarité entre les pompiers et leurs familles.",
    },
    {
      icon: Heart,
      title: 'Soutien Social',
      description:
        'Aide aux membres et à leurs proches dans les moments difficiles (blessure, maladie, etc.) grâce à une caisse de secours dédiée.',
    },
    {
      icon: PartyPopper,
      title: 'Vie de la caserne',
      description:
        'Amélioration du quotidien des pompiers en finançant du matériel pour les locaux de vie et les activités sportives.',
    },
  ];

  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  const [titleRef, titleInView] = useInView({
    triggerOnce: true,
    threshold: 0.5,
  });

  return (
    <section className="py-12 md:py-24 bg-brandCream dark:bg-darkBg transition-colors" id="actions">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={titleRef}
          className="text-center mb-8 md:mb-12"
          variants={fadeInUp}
          initial="hidden"
          animate={titleInView ? "visible" : "hidden"}
        >
          <h2 className="text-2xl md:text-4xl font-[family-name:var(--font-montserrat)] font-bold text-brandBrown dark:text-darkText">
            Nos missions au cœur de l&apos;Amicale
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-brandBrown/80 dark:text-darkText/90">
            Au-delà des interventions, nous renforçons les liens et soutenons nos membres.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {missions.map((mission, index) => {
            const Icon = mission.icon;
            return (
              <motion.div
                key={index}
                className="bg-white dark:bg-darkSurface p-6 md:p-8 rounded-lg shadow-md hover:shadow-xl transition-all group cursor-pointer"
                variants={staggerItem}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <motion.div
                  className="flex items-center justify-center h-12 w-12 md:h-16 md:w-16 rounded-full bg-primary/10 dark:bg-brandOrange/20 mb-4 md:mb-6"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  <Icon className="text-3xl text-primary dark:text-brandOrange" size={28} />
                </motion.div>
                <h3 className="text-lg md:text-xl font-[family-name:var(--font-montserrat)] font-bold text-brandBrown dark:text-darkText mb-2 group-hover:text-primary dark:group-hover:text-brandOrange transition-colors">
                  {mission.title}
                </h3>
                <p className="text-sm md:text-base text-brandBrown/80 dark:text-darkText/80">{mission.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
