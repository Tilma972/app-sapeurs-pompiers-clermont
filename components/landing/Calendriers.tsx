'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function Calendrier() {
  return (
    <section className="py-12 md:py-24 bg-brandCream dark:bg-darkSurface transition-colors w-full overflow-hidden" id="calendrier">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="max-w-[1920px] mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">

            {/* Image - Centrée sur mobile, contraintes strictes pour petits écrans */}
            <div className="w-full md:w-1/2 flex justify-center md:justify-start">
              <div className="w-full max-w-[280px] sm:max-w-[320px] md:max-w-none mx-auto md:mx-0">
                <Image
                  src="https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/couverture_cal_2026%20.webp"
                  alt="Calendrier 2026 des Sapeurs-Pompiers de Clermont - 12 pages illustrées avec photos des pompiers en action"
                  width={600}
                  height={800}
                  loading="lazy"
                  className="rounded-lg shadow-2xl w-full h-auto mx-auto"
                />
              </div>
            </div>

            {/* Contenu - Centré sur mobile, max-width pour éviter débordement */}
            <div className="w-full md:w-1/2 px-2 md:px-0">
              <div className="max-w-full md:max-w-none mx-auto text-center md:text-left">
                <span className="font-bold text-primary dark:text-brandOrange text-sm block mb-2">
                  NOTRE PRODUIT PHARE
                </span>
                <h2 className="text-3xl md:text-4xl font-montserrat font-bold text-brandBrown dark:text-darkText mb-3 break-words">
                  Le Calendrier 2026 est arrivé !
                </h2>
                <p className="text-lg text-brandBrown/80 dark:text-darkText/90 leading-relaxed mb-6 break-words">
                  Plus qu&apos;une tradition, notre calendrier annuel est la principale source de
                  financement de nos actions. Chaque contribution lors de la tournée des calendriers
                  est un soutien direct à notre Amicale.
                </p>
                <div className="flex justify-center md:justify-start w-full">
                  <Link
                    href="/boutique"
                    className="inline-flex items-center justify-center px-8 py-4 text-base md:text-lg font-bold text-white bg-brandOrange rounded-lg hover:bg-brandOrange/90 transition-all shadow-lg hover:shadow-xl group max-w-full"
                  >
                    <span className="whitespace-nowrap">Pré-commander en ligne</span>
                    <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform flex-shrink-0" size={20} />
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

