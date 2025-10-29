"use client";

import { FeatureCard, type Feature } from "@/components/feature-card";

export function FeatureCardsGrid(props: {
  annoncesCount?: number;
  photosCount?: number;
  eventsCount?: number;
  offersCount?: number;
  profileComplete?: boolean;
}) {
  const features: Feature[] = [
    {
      title: "Petites Annonces",
      description: "Publiez et consultez entre membres",
      iconKey: "shopping-bag",
      href: "/dashboard/annonces",
      gradient: "from-green-500 to-emerald-600",
      badges: [
        typeof props.annoncesCount === "number"
          ? `${props.annoncesCount} annonces`
          : "Bientôt",
      ],
    },
    {
      title: "Galerie SP",
      description: "Partagez les moments forts du centre",
      iconKey: "camera",
      href: "/dashboard/galerie",
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
      href: "/dashboard/associative",
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
      href: "/dashboard/mon-compte",
      gradient: "from-slate-500 to-gray-600",
      badges: [props.profileComplete ? "Profil complet" : "Profil incomplet"],
    },
    {
      title: "Partenaires & Avantages",
      description: "Catalogue d'offres locales",
      iconKey: "gift",
      href: "/dashboard/partenaires",
      gradient: "from-purple-500 to-fuchsia-600",
      badges: [
        typeof props.offersCount === "number"
          ? `${props.offersCount} offres`
          : "Bientôt",
      ],
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {features.map((f) => (
        <FeatureCard key={f.title} feature={f} />
      ))}
    </div>
  );
}

export default FeatureCardsGrid;
