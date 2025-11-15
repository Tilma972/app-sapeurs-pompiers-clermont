'use client';

import { MapPin, Star, X, Users, AlertTriangle, Car, Mountain, Building, Home, Waves, Flame, Tractor } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { modalSpring } from '@/lib/animations';
import inseeCommunes from '@/data/insee-communes.json';
import communes21 from '@/data/communes-21.json';

interface CommuneData {
  name: string;
  isHeadquarters: boolean;
  population: number;
  distance: string;
  georisquesCodeInsee?: string;
  mainRisks: {
    name: string;
    icon: React.ElementType;
    advice: string[];
  }[];
}

// Données de prévention enrichies pour chaque commune (exemple, à compléter)
const preventionCommunes: Partial<CommuneData>[] = [
  {
    name: "Arboras",
    distance: '18 km',
    mainRisks: [
      { name: 'Feux en zone isolée', icon: Flame, advice: [
        'Village entouré de garrigue. Le débroussaillement est vital.',
        'En cas de fumée, donnez des points de repère clairs aux secours (nom de chemin, colline).',
        'Préparez un kit d\'urgence en cas d\'évacuation (papiers, eau, médicaments).',
      ] }
    ]
  },
  {
    name: "Brignac",
    distance: '9 km',
    mainRisks: [
      { name: 'Crue du Soulondres', icon: Waves, advice: [
        'Ce ruisseau peut vite réagir aux orages. Ne pas sous-estimer sa force.',
        'Ne laissez pas les enfants jouer près du cours d\'eau après de fortes pluies.'
      ] },
      { name: 'Feux de végétation', icon: Flame, advice: [
        'N\'allumez pas de barbecue en bordure de végétation.',
        'Entretenez les abords de votre maison pour créer une zone de protection.'
      ] }
    ]
  },
  {
    name: "Cabrières",
    distance: '10 km',
    mainRisks: [
      { name: 'Risque agricole et viticole', icon: Tractor, advice: [
        'Routes de campagne étroites : attention aux engins viticoles.',
        'Vigilance partagée : les travaux agricoles peuvent générer des étincelles.'
      ] },
      { name: 'Feux de forêt', icon: Flame, advice: [
        'Les chemins de vigne ne sont pas des aires de jeu pour véhicules.',
        'Un mégot jeté dans une vigne sèche peut avoir des conséquences désastreuses.'
      ] }
    ]
  },
  {
    name: "Canet",
    distance: '5 km',
    mainRisks: [
      { name: 'Crue rapide de la Lergue', icon: Waves, advice: [
        'La Lergue peut monter très vite, ne vous installez pas sur ses berges.',
        'La baignade est risquée après un orage (branches, objets).',
        'En cas d\'alerte, sécurisez caves et rez-de-chaussée.'
      ] },
      { name: 'Risque industriel', icon: Building, advice: [
        'Renseignez-vous sur le Plan Communal de Sauvegarde (PCS).',
        'En cas de sirène, confinez-vous et écoutez France Bleu Hérault.',
        'Coupez la ventilation et calfeutrez portes et fenêtres.'
      ] }
    ]
  },
  {
    name: "Ceyras",
    distance: '8 km',
    mainRisks: [
      { name: 'Feux de forêt', icon: Flame, advice: [
        'Débroussaillez votre terrain.',
        'En cas de fumée, fermez les fenêtres et calfeutrez les portes.',
        'Évacuez si les autorités le demandent.'
      ] },
      { name: 'Proximité A75', icon: Car, advice: [
        'Le trafic est dense, surtout l\'été. Prudence sur la départementale qui longe l\'autoroute.',
        'Le bruit de l\'autoroute peut couvrir celui d\'un danger, soyez attentif.'
      ] }
    ]
  },
  {
    name: "Clermont-l'Hérault",
    isHeadquarters: true,
    population: 9200,
    distance: '0 km (Caserne)',
    mainRisks: [
      { name: 'Crue de la Lergue et de l\'Ydroule', icon: Waves, advice: [
        'Ne stationnez pas en bord de rivière.',
        'Surveillez les alertes météo lors d\'épisodes cévenols.',
        'Ne vous engagez jamais sur une voie inondée (30 cm d\'eau suffisent).'
      ] },
      { name: 'Accidents (proximité A75)', icon: Car, advice: [
        'Vigilance aux échangeurs.',
        'Activez les feux de détresse si ralentissement brusque.',
        'Respectez le "corridor de sécurité" à l\'approche des secours.'
      ] }
    ]
  },
  {
    name: "Jonquières",
    distance: '12 km',
    mainRisks: [
      { name: 'Risque routier (A750)', icon: Car, advice: [
        'Zone de fort trafic. Attention aux heures de pointe.',
        'Ne vous arrêtez pas sur la bande d\'arrêt d\'urgence sauf en cas d\'extrême nécessité.'
      ] },
      { name: 'Feux de plaine agricole', icon: Flame, advice: [
        'Le vent peut propager un feu très rapidement dans les champs secs.',
        'Signalez toute fumée, même si elle vous semble anodine.'
      ] }
    ]
  },
  {
    name: "Lacoste",
    distance: '12 km',
    mainRisks: [
      { name: 'Secours en zone rurale isolée', icon: Mountain, advice: [
        'Le temps d\'arrivée des secours peut être allongé. Apprenez les gestes qui sauvent.',
        'Indiquez clairement votre adresse et les accès aux secours lors de l\'appel.'
      ] }
    ]
  },
  {
    name: "Liausson",
    distance: '13 km',
    mainRisks: [
      { name: 'Risque Barrage du Salagou', icon: AlertTriangle, advice: [
        'Connaissez les points de rassemblement en hauteur prévus par la mairie.',
        'L\'évacuation doit se faire à pied pour ne pas créer d\'embouteillage.',
        'Ne revenez jamais sur vos pas sans consigne des autorités.'
      ] },
      { name: 'Secours en zone escarpée', icon: Mountain, advice: [
        'Portez des chaussures de marche adaptées.',
        'Emportez de l\'eau en quantité suffisante, le soleil tape fort sur les "ruffes".',
        'Chargez votre téléphone avant de partir en randonnée.'
      ] }
    ]
  },
  {
    name: "Lieuran-Cabrières",
    distance: '13 km',
    mainRisks: [
      { name: 'Feux de garrigue', icon: Flame, advice: [
        'Zone très exposée. Le débroussaillement n\'est pas une option, c\'est une obligation.',
        'Ayez un plan d\'évacuation familial : où aller, qui contacter ?'
      ] }
    ]
  },
  {
    name: "Mérifons",
    distance: '11 km',
    mainRisks: [
      { name: 'Secours en zone isolée', icon: Mountain, advice: [
        'Pour toute sortie en nature, prévenez un proche de votre itinéraire.',
        'Téléchargez une application de localisation GPS (ex: GendLoc) utile aux secours.'
      ] }
    ]
  },
  {
    name: "Mourèze",
    distance: '14 km',
    mainRisks: [
      { name: 'Feux de garrigue (Cirque de Mourèze)', icon: Flame, advice: [
        'Site très sensible au feu. Un mégot peut détruire des hectares.',
        'Respectez les interdictions d\'accès au massif en période de risque.',
        'Garez-vous uniquement sur les parkings. Un pot d\'échappement chaud peut enflammer l\'herbe.'
      ] }
    ]
  },
  {
    name: "Nébian",
    distance: '7 km',
    mainRisks: [
      { name: 'Inondations locales', icon: Waves, advice: [
        'Les ruisseaux (Vignes, Nielle) peuvent déborder brutalement.',
        'Ne construisez rien et ne stockez rien de valeur en zone inondable.'
      ] },
      { name: 'Risque routier', icon: Car, advice: [
        'La traversée du village est dense. Attention aux piétons et cyclistes.'
      ] }
    ]
  },
  {
    name: "Péret",
    distance: '8 km',
    mainRisks: [
      { name: 'Crue de la Boyne', icon: Waves, advice: [
        'Cette rivière a un caractère torrentiel. Ses crues sont soudaines.',
        'Consultez Vigicrues en période de pluies intenses.'
      ] },
      { name: 'Risque viticole', icon: Tractor, advice: [
        'Partageons la route : prudence lors des vendanges avec les tracteurs.',
        'Attention aux traitements dans les vignes, respectez les délais avant de vous promener à proximité.'
      ] }
    ]
  },
  {
    name: "Saint-Félix-de-Lodez",
    distance: '16 km',
    mainRisks: [
      { name: 'Accidents (proximité A750)', icon: Car, advice: [
        'L\'échangeur est une zone à fort trafic et d\'accidents fréquents.',
        'Adaptez votre vitesse en traversant le village, un axe très fréquenté.',
        'Témoin d\'un accident ? Sécurisez (triangle, gilet), Alertez (18), Secourez (si vous êtes formé).'
      ] }
    ]
  },
  {
    name: "Saint-Guiraud",
    distance: '15 km',
    mainRisks: [
      { name: 'Feux et risque agricole', icon: Flame, advice: [
        'Combinaison dangereuse : sécheresse, vent et travaux agricoles.',
        'Agriculteurs : ayez un extincteur ou une réserve d\'eau sur vos engins.'
      ] }
    ]
  },
  {
    name: "Saint-Saturnin-de-Lucian",
    distance: '17 km',
    mainRisks: [
      { name: 'Feux ( randonnée & vignoble)', icon: Flame, advice: [
        'Les sentiers de randonnée sont des vecteurs de propagation du feu.',
        'Ne fumez pas en marchant, ni dans les vignes.'
      ] }
    ]
  },
  {
    name: "Salasc",
    distance: '14 km',
    mainRisks: [
      { name: 'Risque Barrage du Salagou', icon: AlertTriangle, advice: [
        'Sachez reconnaître la sirène d\'alerte (3 cycles de 2 min).',
        'Rejoignez les hauteurs sans attendre la montée des eaux.'
      ] }
    ]
  },
  {
    name: "Valmascle",
    distance: '13 km',
    mainRisks: [
      { name: 'Accidents (proximité A75)', icon: Car, advice: [
        'L\'accès à l\'autoroute est proche. Redoublez de vigilance.',
        'Trafic de camions important sur cet axe. Gardez vos distances.'
      ] }
    ]
  },
  {
    name: "Villeneuvette",
    distance: '3 km',
    mainRisks: [
      { name: 'Protection du patrimoine et feux', icon: Home, advice: [
        'Site historique aux accès étroits. Garez-vous intelligemment.',
        'Le risque incendie est majeur. Aucun feu n\'est toléré.',
        'Ne bloquez jamais une entrée de porche ou une voie marquée "pompiers".'
      ] }
    ]
  },
];

// Helpers
const normalizeName = (name: string) => name.replace(/^St-/i, 'Saint-').replace(/^St\s/i, 'Saint ');
type InseeItem = { name: string; code: string; population: number | null };
const inseeByName = new Map<string, InseeItem>((inseeCommunes as InseeItem[]).map((c) => [normalizeName(c.name), c]));
const preventionByName = new Map<string, Partial<CommuneData>>(preventionCommunes.map((c) => [normalizeName(c.name!), c]));

// Fusion des données officielles et de prévention
const enrichedCommunes: CommuneData[] = (communes21 as { name: string; code: string }[]).map(({ name }) => {
  const key = normalizeName(name);
  const preventionData = preventionByName.get(key) ?? {};
  const insee = inseeByName.get(key);

  const defaultRisks = [
    {
      name: 'Feux de végétation',
      icon: Flame,
      advice: [
        'Le débroussaillement est votre meilleure protection et une obligation.',
        'Ne jetez jamais vos mégots dans la nature.',
        'En cas de fumée suspecte, alertez le 18 ou le 112 en étant le plus précis possible.',
      ],
    },
  ];

  return {
    name,
    isHeadquarters: key === normalizeName("Clermont-l'Hérault"),
    population: insee?.population ?? preventionData?.population ?? 0,
    distance: preventionData?.distance ?? '—',
    georisquesCodeInsee: insee?.code,
    mainRisks: preventionData?.mainRisks?.length ? preventionData.mainRisks : defaultRisks,
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
      <section className="py-12 md:py-16 bg-gradient-to-b from-white to-[#FEF9F3] dark:from-[#2C1E1D] dark:to-[#5C3A38] transition-colors w-full" id="communes">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="max-w-5xl mx-auto">
          {/* En-tête */}
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-[family-name:var(--font-montserrat)] font-bold text-[#4A2E2C] dark:text-[#F5DCC8] mb-2">
              Nos 20 Communes Protégées
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
              💡 Astuce : Cliquez sur une commune pour voir les conseils de prévention
            </p>
          </div>

          {/* Statistiques compactes */}
          <div className="flex flex-wrap justify-center gap-4 md:gap-8 text-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#C44539]"></div>
              <span className="text-sm md:text-base text-[#4A2E2C]/80 dark:text-[#F5DCC8]/90">
                <strong className="text-[#C44539] dark:text-[#D85A3C] font-bold">20</strong> communes
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#C44539]"></div>
              <span className="text-sm md:text-base text-[#4A2E2C]/80 dark:text-[#F5DCC8]/90">
                <strong className="text-[#C44539] dark:text-[#D85A3C] font-bold">{totalPopulation.toLocaleString('fr-FR')}</strong> habitants
              </span>
            </div>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#FEF9F3] p-4 rounded-xl text-center">
                  <Users className="w-6 h-6 text-[#C42D2D] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-[#4A2E2C]">
                    {selectedCommune.population.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600">Habitants</p>
                </div>
                <div className="bg-[#FEF9F3] p-4 rounded-xl text-center">
                  <MapPin className="w-6 h-6 text-[#C42D2D] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-[#4A2E2C]">
                    {selectedCommune.distance}
                  </p>
                  <p className="text-xs text-gray-600">Distance de la caserne</p>
                </div>
              </div>

              {/* Risques identifiés - Compact */}
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                <h4 className="font-semibold text-[#4A2E2C] mb-2 flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Risques principaux
                </h4>
                <div className="flex flex-col gap-3">
                  {selectedCommune.mainRisks.map((risk, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 border border-amber-200">
                      <div className="flex items-center gap-2 mb-1">
                        <risk.icon className="w-5 h-5 text-[#C44539]" />
                        <span className="font-semibold text-[#4A2E2C]">{risk.name}</span>
                      </div>
                      <ul className="list-disc pl-6 text-xs text-gray-700 space-y-1">
                        {risk.advice.map((ad, i) => (
                          <li key={i}>{ad}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
