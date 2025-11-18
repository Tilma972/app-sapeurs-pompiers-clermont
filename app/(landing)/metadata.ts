import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pompiers34800.com';

export const landingMetadata: Metadata = {
  metadataBase: new URL(siteUrl),

  // SEO de base
  title: 'Amicale des Sapeurs-Pompiers de Clermont-l\'Hérault | Soutien & Solidarité',
  description: 'L\'Amicale des Sapeurs-Pompiers de Clermont-l\'Hérault soutient les pompiers et leurs familles. Découvrez nos actions, calendriers 2026 et événements. 20 communes protégées dans l\'Hérault.',

  keywords: [
    'sapeurs-pompiers',
    'Clermont-l\'Hérault',
    'amicale pompiers',
    'pompiers 34',
    'Hérault',
    'calendrier pompiers 2026',
    'soutien pompiers',
    'solidarité pompiers',
    'prévention incendie',
    'numéros d\'urgence',
    '18 15 112',
    'SDIS 34'
  ],

  authors: [{ name: 'Amicale des Sapeurs-Pompiers de Clermont-l\'Hérault' }],
  creator: 'Amicale des Sapeurs-Pompiers de Clermont-l\'Hérault',
  publisher: 'Amicale des Sapeurs-Pompiers de Clermont-l\'Hérault',

  // Open Graph (Facebook, LinkedIn)
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: siteUrl,
    siteName: 'Amicale des Sapeurs-Pompiers de Clermont-l\'Hérault',
    title: 'Amicale des Sapeurs-Pompiers de Clermont-l\'Hérault',
    description: 'L\'Amicale des Sapeurs-Pompiers de Clermont-l\'Hérault soutient les pompiers et leurs familles. Découvrez nos actions, calendriers 2026 et événements.',
    images: [
      {
        url: `${siteUrl}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Amicale des Sapeurs-Pompiers de Clermont-l\'Hérault',
      },
    ],
  },

  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Amicale des Sapeurs-Pompiers de Clermont-l\'Hérault',
    description: 'Soutien, solidarité et actions au service des pompiers et de nos 20 communes.',
    images: [`${siteUrl}/og-image.jpg`],
  },

  // Robots & Indexation
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Géolocalisation
  other: {
    'geo.region': 'FR-34',
    'geo.placename': 'Clermont-l\'Hérault',
    'geo.position': '43.6283;3.4316',
  },
};
