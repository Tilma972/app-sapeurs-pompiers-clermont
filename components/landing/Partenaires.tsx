'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { partners as partenairesSource } from '@/data/partners';
import { Handshake, Award, Star, TrendingUp, Heart } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

interface Partner {
  id: number;
  name: string;
  logo: string;
  tier: 'platinum' | 'gold' | 'bronze';
  sector: string;
  since: number;
  testimonial?: string;
  website?: string;
}

export function Partenaires() {
  const [headerRef, headerInView] = useInView({ triggerOnce: true, threshold: 0.3 });
  const [statsRef, statsInView] = useInView({ triggerOnce: true, threshold: 0.3 });
  const [hoveredPartner, setHoveredPartner] = useState<number | null>(null);

  // Source de vérité: partners-section.tsx (logos + URLs)
  // Map vers le schéma local (tier/sector/since par défaut pour l'affichage)
  const partenaires: Partner[] = partenairesSource.map((p, idx) => ({
    id: p.id,
    name: p.name,
    logo: p.logo,
    tier: idx % 3 === 0 ? 'platinum' : idx % 3 === 1 ? 'gold' : 'bronze',
    sector: 'Local',
    since: 2020 + (idx % 5),
    website: p.website,
  }));

  const tierColors = {
    platinum: { bg: 'bg-gradient-to-br from-slate-200 to-slate-400', border: 'border-slate-400', text: 'text-slate-700', icon: '💎' },
    gold: { bg: 'bg-gradient-to-br from-yellow-200 to-yellow-500', border: 'border-yellow-500', text: 'text-yellow-700', icon: '🥇' },
    bronze: { bg: 'bg-gradient-to-br from-orange-200 to-orange-400', border: 'border-orange-400', text: 'text-orange-700', icon: '🥉' },
  };

  // Infinite carousel animation
  const controls = useAnimation();
  
  useEffect(() => {
    const animation = controls.start({
      x: [0, -100 * partenaires.length],
      transition: {
        x: {
          repeat: Infinity,
          repeatType: "loop",
          duration: 20,
          ease: "linear",
        },
      },
    });
    
    return () => {
      animation.then(ctrl => ctrl.stop());
    };
  }, [controls, partenaires.length]);

  return (
    <section className="py-12 md:py-24 bg-brandCream dark:bg-darkBg transition-colors overflow-hidden" id="partenaires">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header avec stats d'impact */}
        <motion.div
          ref={headerRef}
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 dark:bg-brandOrange/20 rounded-full mb-4">
            <Heart className="w-4 h-4 text-primary dark:text-brandOrange" />
            <span className="text-sm font-semibold text-primary dark:text-brandOrange">Ensemble, nous sommes plus forts</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-montserrat font-bold text-brandBrown dark:text-darkText mb-4">
            Nos Partenaires de Confiance
          </h2>
          <p className="text-lg text-brandBrown/70 dark:text-darkText/80 max-w-2xl mx-auto">
            Ils croient en nos valeurs et soutiennent activement notre mission au quotidien.
          </p>
        </motion.div>

        {/* Statistiques d'impact */}
        <div
          ref={statsRef}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-16"
        >
          {[
            { value: '5 000+', label: 'Calendriers', icon: Award },
            { value: '20 000', label: 'Habitants touchés*', icon: TrendingUp },
            { value: '365', label: 'Jours visibles', icon: Star },
            { value: '~2¢', label: 'Coût / contact*', icon: Handshake },
          ].map((stat, i) => (
            <motion.div
              key={i}
              className="bg-white dark:bg-darkSurface rounded-xl p-4 md:p-6 text-center shadow-md"
              initial={{ opacity: 0, y: 30 }}
              animate={statsInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <stat.icon className="w-8 h-8 mx-auto mb-2 text-primary dark:text-brandOrange" />
              <div className="text-2xl md:text-3xl font-bold text-primary dark:text-brandOrange mb-1">{stat.value}</div>
              <div className="text-xs md:text-sm text-brandBrown/70 dark:text-darkText/80">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Carousel infini des logos avec tiers */}
        <div className="mb-12 md:mb-16">
          <h3 className="text-xl md:text-2xl font-montserrat font-bold text-center text-brandBrown dark:text-darkText mb-8">
            Ils nous font confiance
          </h3>
          <div className="relative">
            {/* Gradient overlays */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-brandCream dark:from-darkBg to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-brandCream dark:from-darkBg to-transparent z-10" />
            
            <motion.div
              className="flex gap-8 md:gap-12"
              animate={controls}
              onHoverStart={() => controls.stop()}
              onHoverEnd={() => controls.start({
                x: [-100 * partenaires.length],
                transition: { x: { repeat: Infinity, repeatType: "loop", duration: 20, ease: "linear" } },
              })}
            >
              {/* Duplicate for seamless loop */}
              {[...partenaires, ...partenaires].map((partner, idx) => {
                const tier = tierColors[partner.tier];
                return (
                  <motion.div
                    key={`${partner.id}-${idx}`}
                    className="relative shrink-0 group"
                    onMouseEnter={() => setHoveredPartner(partner.id)}
                    onMouseLeave={() => setHoveredPartner(null)}
                    whileHover={{ scale: 1.05 }}
                  >
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block cursor-pointer"
                      title={`Visiter le site de ${partner.name}`}
                    >
                      <div className={`relative bg-white dark:bg-darkSurface rounded-xl p-6 shadow-md border-2 ${tier.border} min-w-[200px] transition-all hover:shadow-xl`}>
                        {/* Tier badge */}
                        <div className={`absolute -top-3 -right-3 w-10 h-10 ${tier.bg} rounded-full flex items-center justify-center text-xl shadow-lg`}>
                          {tier.icon}
                        </div>
                        
                        <Image
                          src={partner.logo}
                          alt={`Logo ${partner.name}`}
                          width={140}
                          height={70}
                          className="h-16 w-auto mx-auto grayscale group-hover:grayscale-0 transition-all duration-300"
                        />
                        
                        {/* Hover tooltip */}
                        {hoveredPartner === partner.id && (
                          <motion.div
                            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-brandBrown dark:bg-darkText text-white dark:text-darkBg px-4 py-2 rounded-lg shadow-xl text-sm whitespace-nowrap z-20 pointer-events-none"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                          >
                            <div className="font-semibold">{partner.name}</div>
                            <div className="text-xs opacity-80">{partner.sector} • Depuis {partner.since}</div>
                            <div className="text-xs opacity-90 mt-1">🔗 Cliquer pour visiter</div>
                            {/* Arrow */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-brandBrown dark:border-t-darkText" />
                          </motion.div>
                        )}
                      </div>
                    </a>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>

        {/* CTA simple - Devenir partenaire */}
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-base text-brandBrown/80 dark:text-darkText/80 mb-4">
            Intéressé par un partenariat avec l&apos;amicale ?
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/dashboard/partenaires"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary dark:bg-brandOrange text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              <Handshake className="w-5 h-5" />
              Devenir partenaire
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
