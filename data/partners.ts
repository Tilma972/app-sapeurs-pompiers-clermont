export type Partner = {
  id: number;
  name: string;
  logo: string;
  description?: string;
  website?: string;
};

// Source de vérité pour les partenaires (logos + URLs)
export const partners: Partner[] = [
  {
    id: 0,
    name: "EMPORUS",
    logo:
      "https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/logos_partenaires/emporus_6cm_4cm.png",
    description: "Partenaire local",
    website: "https://www.emporus.fr/",
  },
  {
    id: 1,
    name: "Hyper U Clermont",
    logo: "/logos/hyper-u.png",
    description: "Supermarché local",
    website: "#",
  },
  {
    id: 9,
    name: "Irripiscine",
    logo:
      "https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/logos_partenaires/Logo_Irripiscine.png",
    description: "Magasin de piscine",
    website: "https://www.irripiscine.fr/magasins/clermont-l-herault",
  },
  {
    id: 10,
    name: "Pape Matteo",
    logo:
      "https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/logos_partenaires/PapeMateo_Noir.jpg",
    description: "Pizzeria & Restaurant",
    website: "https://papematteo.com/",
  },
  {
    id: 2,
    name: "Intermarché",
    logo: "/logos/intermarche.png",
    description: "Supermarché de proximité",
    website: "#",
  },
  {
    id: 3,
    name: "Pharmacie du Centre",
    logo: "/logos/pharmacie-centre.png",
    description: "Pharmacie de Clermont-l'Hérault",
    website: "#",
  },
  {
    id: 4,
    name: "Garage Auto Service",
    logo: "/logos/garage-auto.png",
    description: "Garage automobile local",
    website: "#",
  },
  {
    id: 5,
    name: "Boulangerie Artisanale",
    logo: "/logos/boulangerie.png",
    description: "Boulangerie traditionnelle",
    website: "#",
  },
  {
    id: 6,
    name: "Café de la Place",
    logo: "/logos/cafe-place.png",
    description: "Café-restaurant local",
    website: "#",
  },
  {
    id: 7,
    name: "Électricité Hérault",
    logo: "/logos/electricite-herault.png",
    description: "Électricien local",
    website: "#",
  },
  {
    id: 8,
    name: "Plomberie 34",
    logo: "/logos/plomberie-34.png",
    description: "Plombier de Clermont",
    website: "#",
  },
];
