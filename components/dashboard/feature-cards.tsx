"use client";

import { FeatureCard, type Feature } from "@/components/feature-card";

export function FeatureCardsGrid(props: {
  annoncesCount?: number;
  photosCount?: number;
  eventsCount?: number;
  offersCount?: number;
  profileComplete?: boolean;
  globalCalendarsDistributed?: number;
  ideasCount?: number;
  isTreasurer?: boolean;
}) {
  const features: Feature[] = [
    {
      title: "Tournées & Distribution",
      description: "Calendriers distribués",
      iconKey: "calendar",
      href: "/calendriers",
      gradient: "from-sky-500 to-blue-600",
      badges: [
        typeof props.globalCalendarsDistributed === "number"
          ? `${props.globalCalendarsDistributed.toLocaleString("fr-FR")} distribués`
          : "Bientôt",
      ],
    },
    {
      title: "Petites Annonces",
      description: "Publiez et consultez entre membres",
      iconKey: "shopping-bag",
      href: "/annonces",
      gradient: "from-green-500 to-emerald-600",
      badges: [
        typeof props.annoncesCount === "number"
          ? `${props.annoncesCount} annonces`
          : "Bientôt",
      ],
    },
    {
      title: "Boîte à Idées",
      description: "Partagez vos idées et suggestions",
      iconKey: "lightbulb",
      href: "/idees",
      gradient: "from-yellow-500 to-amber-600",
      badges: [
        typeof props.ideasCount === "number"
          ? `${props.ideasCount} idées`
          : "Nouveau",
      ],
    },
    {
      title: "Galerie Photos",
      description: "Partagez les moments forts du centre",
      iconKey: "camera",
      href: "/galerie",
      gradient: "from-amber-500 to-orange-600",
      badges: [
        typeof props.photosCount === "number"
          ? `${props.photosCount} photos`
          : "Bientôt",
      ],
    },
    {
      title: "Événements",
      description: "Annonces et vie associative",
      iconKey: "calendar",
      href: "/associative",
      gradient: "from-rose-500 to-red-600",
      badges: [
        typeof props.eventsCount === "number"
          ? `${props.eventsCount} à venir`
          : "Bientôt",
      ],
    },
    {
      title: "Mon Compte SP",
      description: "Portefeuille et demandes de paiement",
      iconKey: "wallet",
      href: "/mon-compte",
      gradient: "from-slate-500 to-gray-600",
      badges: [props.profileComplete ? "Profil complet" : "Profil incomplet"],
    },
    {
      title: "Partenaires & Avantages",
      description: "Catalogue d'offres locales",
      iconKey: "gift",
      href: "/partenaires",
      gradient: "from-purple-500 to-fuchsia-600",
      badges: [
        typeof props.offersCount === "number"
          ? `${props.offersCount} offres`
          : "Bientôt",
      ],
    },
  ];

  // Ajouter la carte Trésorerie uniquement pour les trésoriers/admins
  if (props.isTreasurer) {
    features.push({
      title: "Trésorerie",
      description: "Gestion des demandes de versement",
      iconKey: "wallet",
      href: "/tresorerie",
      gradient: "from-indigo-500 to-blue-700",
      badges: ["Accès Trésorier"],
    });
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {features.map((f) => (
        <FeatureCard key={f.title} feature={f} />
      ))}
    </div>
  );
}

export default FeatureCardsGrid;
