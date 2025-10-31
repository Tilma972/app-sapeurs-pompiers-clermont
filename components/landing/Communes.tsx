'use client';

import { MapPin, Star, X, Users, Flame, Clock, AlertTriangle, Activity } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { modalSpring } from '@/lib/animations';
import inseeCommunes from '@/data/insee-communes.json';
import communes21 from '@/data/communes-21.json';

interface CommuneData {
  name: string;
  isHeadquarters: boolean;
  population: number;
  interventions2024: number;
  avgResponseTime: string;
  mainRisks: string[];
  interventionTypes: {
    secours: number;
    incendie: number;
    accidents: number;
  };
  distance: string;
}

// Données par défaut (statistiques/risques/distances) pour certaines communes.
// La liste affichée est désormais alignée sur le référentiel des 21 communes (data/communes-21.json).
// On fusionne ces valeurs par défaut quand disponibles et on complète avec des valeurs neutres.
const defaultCommunes: CommuneData[] = [
  {
    name: 'Clermont-l\'Hérault',
    isHeadquarters: true,
    population: 9200,
    interventions2024: 850,
    avgResponseTime: '3 min',
    mainRisks: ['Risques urbains', 'Inondations', 'Accidents routiers'],
    interventionTypes: { secours: 58, incendie: 12, accidents: 30 },
    distance: '0 km (Caserne)',
  },
  {
    name: 'Aspiran',
    isHeadquarters: false,
    population: 2845,
    interventions2024: 142,
    avgResponseTime: '8 min',
    mainRisks: ['Feux de forêt', 'Accidents routiers'],
    interventionTypes: { secours: 52, incendie: 18, accidents: 30 },
    distance: '6 km',
  },
  {
    name: 'Brignac',
    isHeadquarters: false,
    population: 680,
    interventions2024: 38,
    avgResponseTime: '12 min',
    mainRisks: ['Feux de végétation', 'Secours rural'],
    interventionTypes: { secours: 45, incendie: 25, accidents: 30 },
    distance: '9 km',
  },
  {
    name: 'Canet',
    isHeadquarters: false,
    population: 3420,
    interventions2024: 168,
    avgResponseTime: '7 min',
    mainRisks: ['Risques industriels', 'Accidents'],
    interventionTypes: { secours: 60, incendie: 15, accidents: 25 },
    distance: '5 km',
  },
  {
    name: 'Ceyras',
    isHeadquarters: false,
    population: 1150,
    interventions2024: 68,
    avgResponseTime: '10 min',
    mainRisks: ['Feux de forêt', 'Secours montagne'],
    interventionTypes: { secours: 50, incendie: 22, accidents: 28 },
    distance: '8 km',
  },
  {
    name: 'Fontès',
    isHeadquarters: false,
    population: 1580,
    interventions2024: 89,
    avgResponseTime: '11 min',
    mainRisks: ['Feux agricoles', 'Accidents routiers'],
    interventionTypes: { secours: 48, incendie: 20, accidents: 32 },
    distance: '10 km',
  },
  {
    name: 'Lacoste',
    isHeadquarters: false,
    population: 420,
    interventions2024: 28,
    avgResponseTime: '14 min',
    mainRisks: ['Feux de végétation', 'Secours rural'],
    interventionTypes: { secours: 42, incendie: 28, accidents: 30 },
    distance: '12 km',
  },
  {
    name: 'Le Bosc',
    isHeadquarters: false,
    population: 890,
    interventions2024: 52,
    avgResponseTime: '13 min',
    mainRisks: ['Feux de forêt', 'Secours personne'],
    interventionTypes: { secours: 55, incendie: 20, accidents: 25 },
    distance: '11 km',
  },
  {
    name: 'Liausson',
    isHeadquarters: false,
    population: 310,
    interventions2024: 22,
    avgResponseTime: '15 min',
    mainRisks: ['Feux de végétation', 'Secours isolé'],
    interventionTypes: { secours: 40, incendie: 30, accidents: 30 },
    distance: '13 km',
  },
  {
    name: 'Mérifons',
    isHeadquarters: false,
    population: 520,
    interventions2024: 34,
    avgResponseTime: '13 min',
    mainRisks: ['Feux agricoles', 'Secours rural'],
    interventionTypes: { secours: 44, incendie: 26, accidents: 30 },
    distance: '11 km',
  },
  {
    name: 'Mourèze',
    isHeadquarters: false,
    population: 180,
    interventions2024: 18,
    avgResponseTime: '16 min',
    mainRisks: ['Feux de garrigue', 'Secours montagne'],
    interventionTypes: { secours: 38, incendie: 35, accidents: 27 },
    distance: '14 km',
  },
  {
    name: 'Nébian',
    isHeadquarters: false,
    population: 1680,
    interventions2024: 95,
    avgResponseTime: '9 min',
    mainRisks: ['Risques urbains', 'Accidents'],
    interventionTypes: { secours: 54, incendie: 16, accidents: 30 },
    distance: '7 km',
  },
  {
    name: 'Octon',
    isHeadquarters: false,
    population: 420,
    interventions2024: 32,
    avgResponseTime: '17 min',
    mainRisks: ['Feux de forêt', 'Risques naturels'],
    interventionTypes: { secours: 46, incendie: 28, accidents: 26 },
    distance: '15 km',
  },
  {
    name: 'Paulhan',
    isHeadquarters: false,
    population: 3850,
    interventions2024: 210,
    avgResponseTime: '6 min',
    mainRisks: ['Risques urbains', 'Accidents routiers'],
    interventionTypes: { secours: 62, incendie: 13, accidents: 25 },
    distance: '4 km',
  },
  {
    name: 'Péret',
    isHeadquarters: false,
    population: 1240,
    interventions2024: 72,
    avgResponseTime: '10 min',
    mainRisks: ['Feux agricoles', 'Secours personne'],
    interventionTypes: { secours: 50, incendie: 20, accidents: 30 },
    distance: '8 km',
  },
  {
    name: 'Salasc',
    isHeadquarters: false,
    population: 280,
    interventions2024: 24,
    avgResponseTime: '16 min',
    mainRisks: ['Feux de garrigue', 'Secours isolé'],
    interventionTypes: { secours: 42, incendie: 32, accidents: 26 },
    distance: '14 km',
  },
  {
    name: 'St-André-de-Sangonis',
    isHeadquarters: false,
    population: 5200,
    interventions2024: 285,
    avgResponseTime: '10 min',
    mainRisks: ['Risques urbains', 'Inondations'],
    interventionTypes: { secours: 58, incendie: 14, accidents: 28 },
    distance: '9 km',
  },
  {
    name: 'St-Félix-de-Lodez',
    isHeadquarters: false,
    population: 380,
    interventions2024: 28,
    avgResponseTime: '18 min',
    mainRisks: ['Feux de forêt', 'Secours rural'],
    interventionTypes: { secours: 40, incendie: 30, accidents: 30 },
    distance: '16 km',
  },
  {
    name: 'Usclas-d\'Hérault',
    isHeadquarters: false,
    population: 620,
    interventions2024: 42,
    avgResponseTime: '14 min',
    mainRisks: ['Feux de végétation', 'Accidents'],
    interventionTypes: { secours: 48, incendie: 24, accidents: 28 },
    distance: '12 km',
  },
  {
    name: 'Valmascle',
    isHeadquarters: false,
    population: 450,
    interventions2024: 32,
    avgResponseTime: '15 min',
    mainRisks: ['Feux agricoles', 'Secours rural'],
    interventionTypes: { secours: 44, incendie: 26, accidents: 30 },
    distance: '13 km',
  },
  {
    name: 'Villeneuvette',
    isHeadquarters: false,
    population: 190,
    interventions2024: 16,
    avgResponseTime: '12 min',
    mainRisks: ['Patrimoine historique', 'Feux de forêt'],
    interventionTypes: { secours: 50, incendie: 25, accidents: 25 },
    distance: '3 km',
  },
];

// Helpers: Normalize names to match INSEE dataset
const normalizeName = (name: string) =>
  name
    .replace(/^St-/i, 'Saint-')
    .replace(/^St\s/i, 'Saint ')
    .replace('St-André', 'Saint-André')
    .replace('St-Félix', 'Saint-Félix');

type InseeItem = { name: string; code: string; population: number | null; lat?: number | null; lon?: number | null };
const inseeByName = new Map<string, InseeItem>(
  (inseeCommunes as InseeItem[]).map((c) => [normalizeName(c.name), c])
);

// Construire l'ensemble final aligné sur les 21 communes
const defaultByName = new Map<string, CommuneData>(
  defaultCommunes.map((c) => [normalizeName(c.name), c])
);

// Parse distance in km from strings like "11 km" or "0 km (Caserne)"
const parseDistanceKm = (d: string) => {
  const m = d.match(/([0-9]+(?:\.[0-9]+)?)/);
  return m ? parseFloat(m[1]) : 0;
};

// Compute time range in minutes given distance (km)
const computeTimeRange = (km: number) => {
  if (km <= 0.5) return [3, 5] as const; // délai incompressible en urbain
  const low = Math.max(3, Math.round((km / 70) * 60)); // trafic fluide
  const high = Math.round((km / 45) * 60); // conditions moins favorables
  return [low, Math.max(high, low + 1)] as const;
};

// Merge: référentiel des 21 + données INSEE + valeurs par défaut
const enrichedCommunes: CommuneData[] = (communes21 as { name: string; code: string }[]).map(({ name }) => {
  const key = normalizeName(name);
  const base = defaultByName.get(key);
  const insee = inseeByName.get(key);
  const isHQ = key === normalizeName("Clermont-l'Hérault");
  return {
    name,
    isHeadquarters: isHQ,
    population: (insee?.population ?? base?.population ?? 0),
    interventions2024: base?.interventions2024 ?? 0,
    avgResponseTime: base?.avgResponseTime ?? '—',
    mainRisks: base?.mainRisks ?? [],
    interventionTypes: base?.interventionTypes ?? { secours: 50, incendie: 25, accidents: 25 },
    distance: base?.distance ?? (isHQ ? '0 km (Caserne)' : '—'),
  };
});

export function Communes() {
  const [selectedCommune, setSelectedCommune] = useState<CommuneData | null>(null);
  // Somme dynamique des habitants à partir des données enrichies
  const totalPopulation = enrichedCommunes.reduce((sum, c) => sum + (c.population ?? 0), 0);

  const handleCommuneClick = (commune: CommuneData) => {
    setSelectedCommune(commune);
  };

  const closeModal = () => {
    setSelectedCommune(null);
  };

  return (
    <>
      <section className="py-12 md:py-16 bg-gradient-to-b from-white to-[#FEF9F3] dark:from-[#2C1E1D] dark:to-[#5C3A38] transition-colors" id="communes">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          {/* En-tête */}
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-[family-name:var(--font-montserrat)] font-bold text-[#4A2E2C] dark:text-[#F5DCC8] mb-2">
              Nos 21 Communes Protégées
            </h2>
            <p className="text-sm md:text-base text-gray-600 dark:text-[#F5DCC8]/80">
              Cliquez sur votre commune pour découvrir les données d&apos;intervention locales
            </p>
          </div>

          {/* Grille de badges */}
          <div className="bg-white dark:bg-[#5C3A38] rounded-xl shadow-sm border border-gray-100 dark:border-[#5C3A38] p-4 md:p-6 mb-6">
            <div className="flex flex-wrap gap-2 md:gap-3 justify-center">
              {enrichedCommunes.map((commune) => (
                <button
                  key={commune.name}
                  onClick={() => handleCommuneClick(commune)}
                  className={`
                    inline-flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5
                    rounded-full font-medium text-sm md:text-base
                    transition-all duration-200
                    ${
                      commune.isHeadquarters
                        ? 'bg-[#C44539] text-white hover:bg-[#C44539]/90 hover:scale-105 shadow-md'
                        : 'bg-[#FEF9F3] dark:bg-[#2C1E1D] text-[#4A2E2C] dark:text-[#F5DCC8] hover:bg-[#C44539]/10 dark:hover:bg-[#D85A3C]/20 hover:scale-105 border border-gray-200 dark:border-[#5C3A38]'
                    }
                  `}
                >
                  {commune.isHeadquarters ? (
                    <Star className="w-4 h-4 fill-current" />
                  ) : (
                    <MapPin className="w-4 h-4" />
                  )}
                  {commune.name}
                </button>
              ))}
            </div>
            <p className="text-center text-xs md:text-sm text-gray-500 dark:text-[#F5DCC8]/70 mt-4">
              💡 Astuce : Cliquez sur une commune pour voir ses statistiques d&apos;intervention
            </p>
          </div>

          {/* Statistiques compactes */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#C44539]"></div>
              <span className="text-sm md:text-base text-[#4A2E2C]/80 dark:text-[#F5DCC8]/90">
                <strong className="text-[#C44539] dark:text-[#D85A3C] font-bold">21</strong> communes
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#C44539]"></div>
              <span className="text-sm md:text-base text-[#4A2E2C]/80 dark:text-[#F5DCC8]/90">
                <strong className="text-[#C44539] dark:text-[#D85A3C] font-bold">{totalPopulation.toLocaleString('fr-FR')}</strong> habitants
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#C44539]"></div>
              <span className="text-sm md:text-base text-[#4A2E2C]/80 dark:text-[#F5DCC8]/90">
                <strong className="text-[#C44539] dark:text-[#D85A3C] font-bold">24/7</strong> disponible
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Modal de détails - Compact */}
      <AnimatePresence>
        {selectedCommune && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={closeModal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="bg-white dark:bg-[#5C3A38] rounded-xl max-w-lg md:max-w-2xl w-full shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 50, opacity: 0 }}
              transition={modalSpring}
            >
            {/* En-tête du modal - Compact */}
            <div className="bg-gradient-to-r from-[#C44539] to-[#D85A3C] text-white p-4 md:p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                  {selectedCommune.isHeadquarters ? (
                    <Star className="w-6 h-6 md:w-7 md:h-7 fill-current" />
                  ) : (
                    <MapPin className="w-6 h-6 md:w-7 md:h-7" />
                  )}
                  <div>
                    <h3 className="text-lg md:text-xl font-[family-name:var(--font-montserrat)] font-bold">
                      {selectedCommune.name}
                    </h3>
                    {selectedCommune.isHeadquarters && (
                      <p className="text-xs text-white/90 flex items-center gap-1">
                        <Star className="w-3 h-3" /> Siège de la caserne
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Contenu du modal - Compact sans scroll */}
            <div className="p-4 md:p-5 space-y-4">
              {/* Statistiques principales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#FEF9F3] p-4 rounded-xl text-center">
                  <Users className="w-6 h-6 text-[#C42D2D] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-[#4A2E2C]">
                    {selectedCommune.population.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600">Habitants</p>
                </div>
                <div className="bg-[#FEF9F3] p-4 rounded-xl text-center">
                  <Activity className="w-6 h-6 text-[#C42D2D] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-[#4A2E2C]">
                    {selectedCommune.interventions2024}
                  </p>
                  <p className="text-xs text-gray-600">Interventions 2024</p>
                </div>
                <div className="bg-[#FEF9F3] p-4 rounded-xl text-center">
                  <Clock className="w-6 h-6 text-[#C42D2D] mx-auto mb-2" />
                  {(() => {
                    const km = parseDistanceKm(selectedCommune.distance);
                    const [lo, hi] = computeTimeRange(km);
                    return (
                      <>
                        <p className="text-2xl font-bold text-[#4A2E2C]">{lo}–{hi} min</p>
                        <p className="text-xs text-gray-600">Temps estimé*</p>
                      </>
                    );
                  })()}
                </div>
                <div className="bg-[#FEF9F3] p-4 rounded-xl text-center">
                  <MapPin className="w-6 h-6 text-[#C42D2D] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-[#4A2E2C]">
                    {parseDistanceKm(selectedCommune.distance)} km
                  </p>
                  <p className="text-xs text-gray-600">Distance</p>
                </div>
              </div>

              {/* Types d'interventions - Compact */}
              <div className="bg-gray-50 p-4 rounded-xl">
                <h4 className="font-semibold text-[#4A2E2C] mb-3 flex items-center gap-2 text-sm">
                  <Activity className="w-4 h-4 text-[#C42D2D]" />
                  Répartition des interventions
                </h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-2xl font-bold text-[#45B39D] mb-1">
                      {selectedCommune.interventionTypes.secours}%
                    </div>
                    <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                      <Activity className="w-3 h-3" />
                      Secours
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#E67E22] mb-1">
                      {selectedCommune.interventionTypes.incendie}%
                    </div>
                    <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                      <Flame className="w-3 h-3" />
                      Incendies
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#C42D2D] mb-1">
                      {selectedCommune.interventionTypes.accidents}%
                    </div>
                    <div className="text-xs text-gray-600 flex items-center justify-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Accidents
                    </div>
                  </div>
                </div>
              </div>

              {/* Risques identifiés - Compact */}
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                <h4 className="font-semibold text-[#4A2E2C] mb-2 flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Risques principaux
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCommune.mainRisks.map((risk, index) => (
                    <span key={index} className="text-xs bg-white px-2 py-1 rounded-full text-gray-700 border border-amber-200">
                      {risk}
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-[11px] italic text-gray-600">
                  * Temps et distances donnés à titre indicatif, sujets à variation selon circulation, météo et contexte opérationnel.
                </p>
              </div>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
