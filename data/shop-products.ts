export type ShopProduct = {
  id: string
  name: string
  category: string
  description: string
  price: number
  image: string
  badge?: {
    text: string
    variant: 'preorder' | 'new' | 'promo'
  }
  stock?: number
  status?: string
}

export const SHOP_PRODUCTS: ShopProduct[] = [
  {
    id: 'calendrier-2025',
    name: 'Calendrier 2025',
    category: 'Calendriers',
    description: "L'incontournable calendrier de nos sapeurs-pompiers. Un soutien direct à nos actions.",
    price: 10.00,
    image: 'https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/couverture_cal_2026%20.webp',
    badge: {
      text: 'PRÉCOMMANDE',
      variant: 'preorder'
    }
  },
  {
    id: 'ecusson-amicale',
    name: "Écusson de l'Amicale",
    category: 'Écussons',
    description: 'Portez fièrement les couleurs de notre amicale avec cet écusson brodé de haute qualité.',
    price: 7.50,
    image: 'https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/ecusson.png',
  },
  {
    id: 'tshirt-supporteur',
    name: 'T-Shirt Supporteur',
    category: 'Textiles',
    description: "Affichez votre soutien avec ce T-shirt en coton bio, logo de l'Amicale côté cœur.",
    price: 20.00,
    image: 'https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/tshirt.png',
  },
  {
    id: 'mug-amicale',
    name: "Mug de l'Amicale",
    category: 'Autres',
    description: "Pour le café à la caserne ou à la maison, le mug officiel de l'Amicale.",
    price: 12.00,
    image: 'https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/mug.png',
  },
  {
    id: 'casquette-pompiers',
    name: 'Casquette Pompiers',
    category: 'Textiles',
    description: 'Casquette brodée "Sapeurs-Pompiers Clermont l\'Hérault". Taille unique ajustable.',
    price: 15.00,
    image: 'https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/casquette.png',
  },
  {
    id: 'porte-cles-ecusson',
    name: 'Porte-clés Écusson',
    category: 'Autres',
    description: "Emportez un bout de l'Amicale partout avec vous grâce à ce porte-clés en PVC souple.",
    price: 5.00,
    image: 'https://npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/landing_page/porte_cles.png',
    badge: {
      text: 'NOUVEAU',
      variant: 'new'
    }
  },
]

export const SHOP_CATEGORIES = [
  'Tous les produits',
  'Écussons',
  'Calendriers',
  'Textiles',
  'Autres',
] as const

export type ShopCategory = typeof SHOP_CATEGORIES[number]
