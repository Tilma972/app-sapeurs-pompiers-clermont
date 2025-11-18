/**
 * Structured Data (JSON-LD) pour le SEO
 * Aide Google à mieux comprendre votre organisation
 */

export function OrganizationJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Amicale des Sapeurs-Pompiers de Clermont-l\'Hérault',
    alternateName: 'Amicale SP Clermont-l\'Hérault',
    url: 'https://pompiers34800.com',
    logo: 'https://pompiers34800.com/logo.svg',
    description: 'Association de soutien aux sapeurs-pompiers de Clermont-l\'Hérault et des 20 communes desservies',

    address: {
      '@type': 'PostalAddress',
      streetAddress: '15 Rue du Sauvignon',
      addressLocality: 'Clermont-l\'Hérault',
      postalCode: '34800',
      addressRegion: 'Occitanie',
      addressCountry: 'FR',
    },

    geo: {
      '@type': 'GeoCoordinates',
      latitude: 43.6283,
      longitude: 3.4316,
    },

    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+33-4-67-44-99-70',
      contactType: 'customer service',
      email: 'contact@pompiers34800.com',
      availableLanguage: 'French',
    },

    areaServed: {
      '@type': 'AdministrativeArea',
      name: 'Hérault',
      geo: {
        '@type': 'GeoCircle',
        geoMidpoint: {
          '@type': 'GeoCoordinates',
          latitude: 43.6283,
          longitude: 3.4316,
        },
        geoRadius: '20000', // 20km
      },
    },

    sameAs: [
      'https://www.facebook.com/amicalepompiersclermont',
      'https://www.instagram.com/amicalepompiersclermont',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
