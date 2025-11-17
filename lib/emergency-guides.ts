export type GuideKey = "18" | "15" | "112"

export interface GuideSection {
  title?: string
  paragraphs?: string[]
  list?: string[]
}

export interface Guide {
  key: GuideKey
  title: string
  emoji?: string
  intro?: string
  sections: GuideSection[]
  footer?: string
}

export const EMERGENCY_GUIDES: Record<GuideKey, Guide> = {
  "18": {
    key: "18",
    title: "J'appelle le 18 - Pompiers",
    emoji: "🔥",
    intro: "Quand appeler les pompiers et comment donner les bonnes informations.",
    sections: [
      {
        title: "✅ Dans quelles situations ?",
        list: [
          "Un feu (maison, voiture, forêt...)",
          "Un accident de la route",
          "Une personne en danger (chute, noyade...)",
          "Une fuite de gaz ou produit dangereux",
          "Une personne coincée (ascenseur, porte...)",
        ],
      },
      {
        title: "📞 Comment bien communiquer ?",
        paragraphs: [
          "Respirez un coup — c'est normal d'être stressé, parlez calmement pour être compris.",
        ],
        list: [
          "Où ça se passe ? (adresse complète + points de repère)",
          "Qu'est‑ce qui se passe ? (feu, accident, malaise...)",
          "Combien de personnes ? (blessés, coincés...)",
          "Y a‑t‑il un danger immédiat ? (feu qui se propage, personne inconsciente...)",
        ],
      },
      {
        title: "Restez en ligne",
        paragraphs: ["Ne raccrochez pas tant qu'on ne vous le dit pas. On peut avoir besoin de détails."],
      },
      {
        title: "💡 Facilitez notre arrivée",
        list: [
          "Envoyez quelqu'un guider les secours depuis la rue",
          "Allumez les lumières extérieures",
          "Ouvrez les portails/portes d'accès",
          "Éloignez les animaux domestiques",
          "Notez le code du portail/interphone",
        ],
      },
      {
        title: "⚠️ Règle d'or",
        paragraphs: ["Ne raccrochez JAMAIS en premier. C'est nous qui vous dirons quand raccrocher."],
      },
    ],
    footer: "En savoir plus sur https://www.sdis34.fr",
  },
  "15": {
    key: "15",
    title: "J'appelle le 15 - SAMU",
    emoji: "🏥",
    intro: "Quand contacter le SAMU et quelles infos transmettre au médecin régulateur.",
    sections: [
      {
        title: "✅ Dans quelles situations ?",
        list: [
          "Malaise, douleur à la poitrine",
          "Difficulté à respirer",
          "Perte de connaissance",
          "Saignement important qu'on n'arrive pas à arrêter",
          "Brûlure grave ou étendue",
          "Intoxication (médicament, produit...)",
          "Accouchement qui commence",
        ],
      },
      {
        title: "📞 Comment bien communiquer ?",
        paragraphs: [
          "Pas de panique — vous allez parler à un médecin régulateur qui vous guidera.",
        ],
        list: [
          "Où êtes‑vous ? (adresse précise)",
          "Qui est concerné ? (âge, sexe)",
          "Que se passe‑t‑il ? (symptômes, depuis quand)",
          "La personne est consciente ? Elle respire ?",
          "Y a‑t‑il du sang ? Combien (peu, beaucoup, qui gicle) ?",
        ],
      },
      {
        title: "Suivez les consignes",
        paragraphs: ["Le médecin peut vous donner des gestes à faire en attendant. Écoutez bien et appliquez."],
      },
      {
        title: "En attendant les secours",
        list: [
          "Allongez la personne si elle se sent mal",
          "Ne donnez rien à boire ou à manger",
          "Surveillez la respiration et la conscience",
          "Si la personne vomit → position latérale de sécurité",
        ],
      },
      {
        title: "⚠️ Arrêt cardiaque ?",
        paragraphs: [
          "Si la personne ne respire plus : Massage cardiaque immédiatement (le SAMU vous guidera au téléphone)",
        ],
      },
    ],
    footer: "En savoir plus sur https://www.sdis34.fr",
  },
  "112": {
    key: "112",
    title: "J'appelle le 112 - Numéro européen",
    emoji: "🇪🇺",
    intro: "Le 112 redirige vers le service adapté en Europe — utile si vous hésitez ou êtes à l'étranger.",
    sections: [
      {
        title: "✅ Dans quelles situations ?",
        paragraphs: [
          "Depuis un mobile : si vous n'avez pas de réseau avec votre opérateur mais qu'il y a un réseau concurrent, le 112 peut fonctionner.",
          "À l'étranger : le 112 marche dans toute l'Europe et vous met en contact avec les secours locaux.",
        ],
      },
      {
        title: "📞 Comment ça marche ?",
        list: [
          "Un opérateur centralisateur évalue la situation",
          "Il vous transfère vers le bon service (pompiers, SAMU, police)",
          "Il peut rester en ligne pendant le transfert",
        ],
      },
      {
        title: "Les consignes sont les mêmes",
        list: [
          "Donnez votre localisation précise",
          "Expliquez ce qui se passe",
          "Suivez les instructions données",
          "Ne raccrochez pas en premier",
        ],
      },
      {
        title: "⚠️ Bon à savoir",
        paragraphs: [
          "Le 112 fonctionne même sans crédit sur votre mobile et même sans carte SIM (si un réseau est disponible).",
        ],
      },
    ],
    footer: "En savoir plus sur https://www.sdis34.fr",
  },
}

export const GUIDE_KEYS: GuideKey[] = ["18", "15", "112"]
