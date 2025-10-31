export type HeroSlide = {
  id: number;
  title: string;
  subtitle: string;
  image: string; // Supabase public URL
  cta?: {
    primary?: { text: string; href: string };
    secondary?: { text: string; href: string };
  };
};

export const heroSlides: HeroSlide[] = [
  {
    id: 1,
    title: "Prêts à intervenir 24h/24",
    subtitle: "L'amicale qui soutient nos sapeurs-pompiers",
    image:
      "https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/24_24.jpeg",
    cta: {
      primary: { text: "Découvrir nos actions", href: "#actions" },
      secondary: { text: "Nous soutenir", href: "#contact" },
    },
  },
  {
    id: 2,
    title: "Au cœur de l'action",
    subtitle: "Solidarité et professionnalisme",
    image:
      "https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/coeur_action.webp",
    cta: {
      primary: { text: "Découvrir nos actions", href: "#actions" },
      secondary: { text: "Nous soutenir", href: "#contact" },
    },
  },
  {
    id: 3,
    title: "L'esprit pompier",
    subtitle: "Une communauté unie pour servir",
    image:
      "https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/esprit_pompiers.jpeg",
    cta: {
      primary: { text: "Découvrir nos actions", href: "#actions" },
      secondary: { text: "Nous soutenir", href: "#contact" },
    },
  },
];
