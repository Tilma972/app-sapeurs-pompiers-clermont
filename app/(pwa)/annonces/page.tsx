"use client"

import { useState } from "react"
import { Search, SlidersHorizontal, Heart, Plus, Star, MapPin, Clock, Phone, Mail, MessageCircle, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PwaContainer } from "@/components/layouts/pwa/pwa-container"
import Image from "next/image"

// Types
interface Annonce {
  id: string
  titre: string
  description: string
  prix: number
  categorie: string
  photos: string[]
  vendeur: {
    nom: string
    equipe: string
    avatar?: string
    note: number
  }
  date_creation: string
  statut: "active" | "vendue" | "reservee"
  vues: number
  favoris: number
  contact: {
    telephone?: string
    email: string
  }
  localisation?: string
}

// Mock data
const mockAnnonces: Annonce[] = [
  {
    id: "1",
    titre: "Casque F1 en très bon état",
    description: "Casque F1 Gallet en excellent état. Peu utilisé, acheté il y a 2 ans. Toutes les normes OK. Idéal pour intervention ou collection.",
    prix: 150,
    categorie: "Équipement",
    photos: ["https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=400&h=400&fit=crop"],
    vendeur: {
      nom: "Jean M.",
      equipe: "Équipe Alpha",
      note: 4.8,
    },
    date_creation: new Date(Date.now() - 0).toISOString(),
    statut: "active",
    vues: 24,
    favoris: 7,
    contact: {
      telephone: "06.12.34.56.78",
      email: "jean.m@example.com",
    },
    localisation: "Caserne de Lyon",
  },
  {
    id: "2",
    titre: "Polo Sapeurs Pompiers T. L",
    description: "Polo officiel SP, taille L, très bon état. Lavé et repassé. Couleur bleu marine. Parfait pour sorties ou événements.",
    prix: 20,
    categorie: "Vêtements",
    photos: ["https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400&h=400&fit=crop"],
    vendeur: {
      nom: "Sophie L.",
      equipe: "Équipe Bravo",
      note: 5.0,
    },
    date_creation: new Date(Date.now() - 86400000).toISOString(),
    statut: "active",
    vues: 31,
    favoris: 12,
    contact: {
      email: "sophie.l@example.com",
    },
    localisation: "Caserne de Paris",
  },
  {
    id: "3",
    titre: "Matériel de sport peu servi",
    description: "Lot complet : haltères, corde à sauter, tapis de sol. Parfait pour entraînement à la caserne. Prix lot complet.",
    prix: 80,
    categorie: "Divers",
    photos: ["https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=400&fit=crop"],
    vendeur: {
      nom: "Marc D.",
      equipe: "Équipe Charlie",
      note: 4.6,
    },
    date_creation: new Date(Date.now() - 172800000).toISOString(),
    statut: "active",
    vues: 43,
    favoris: 9,
    contact: {
      telephone: "06.98.76.54.32",
      email: "marc.d@example.com",
    },
    localisation: "Caserne de Lille",
  },
  {
    id: "4",
    titre: "Rangers intervention T43",
    description: "Rangers noires d'intervention, pointure 43. Très bon état, entretenues régulièrement. Semelles neuves il y a 3 mois.",
    prix: 45,
    categorie: "Vêtements",
    photos: ["https://images.unsplash.com/photo-1542840410-3092f99611a3?w=400&h=400&fit=crop"],
    vendeur: {
      nom: "Thomas B.",
      equipe: "Équipe Delta",
      note: 4.9,
    },
    date_creation: new Date(Date.now() - 172800000).toISOString(),
    statut: "reservee",
    vues: 38,
    favoris: 15,
    contact: {
      telephone: "06.45.67.89.01",
      email: "thomas.b@example.com",
    },
    localisation: "Caserne de Marseille",
  },
  {
    id: "5",
    titre: "Collection d'écussons",
    description: "Belle collection de 20 écussons de différentes casernes françaises. Parfait état. Idéal pour collectionneurs.",
    prix: 30,
    categorie: "Divers",
    photos: ["https://images.unsplash.com/photo-1611195974226-ef4f6ab0f6b9?w=400&h=400&fit=crop"],
    vendeur: {
      nom: "Julie R.",
      equipe: "Équipe Echo",
      note: 4.7,
    },
    date_creation: new Date(Date.now() - 259200000).toISOString(),
    statut: "active",
    vues: 27,
    favoris: 18,
    contact: {
      email: "julie.r@example.com",
    },
    localisation: "Caserne de Lyon",
  },
  {
    id: "6",
    titre: "Ceinturon en cuir",
    description: "Ceinturon en cuir véritable, très solide. Longueur réglable. Peu porté. Boucle en métal chromé.",
    prix: 25,
    categorie: "Équipement",
    photos: ["https://images.unsplash.com/photo-1624222247344-550fb60583bb?w=400&h=400&fit=crop"],
    vendeur: {
      nom: "Pierre C.",
      equipe: "Équipe Foxtrot",
      note: 4.5,
    },
    date_creation: new Date(Date.now() - 345600000).toISOString(),
    statut: "vendue",
    vues: 52,
    favoris: 8,
    contact: {
      telephone: "06.23.45.67.89",
      email: "pierre.c@example.com",
    },
    localisation: "Caserne de Bordeaux",
  },
]

const categories = ["Tous", "Équipement", "Vêtements", "Divers"]

// Fonctions utilitaires
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const maintenant = new Date()
  const diffJours = Math.floor(
    (maintenant.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (diffJours === 0) return "Aujourd'hui"
  if (diffJours === 1) return "Hier"
  return `Il y a ${diffJours} jours`
}

const getStatutBadge = (statut: string) => {
  switch (statut) {
    case "active":
      return { text: "Disponible", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" }
    case "reservee":
      return { text: "Réservée", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" }
    case "vendue":
      return { text: "Vendue", className: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300" }
    default:
      return { text: statut, className: "bg-gray-100 text-gray-800" }
  }
}

export default function AnnoncesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Tous")
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(id)) {
        newFavorites.delete(id)
      } else {
        newFavorites.add(id)
      }
      return newFavorites
    })
  }

  const filteredAnnonces = mockAnnonces.filter(annonce => {
    const matchesSearch = 
      annonce.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      annonce.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "Tous" || annonce.categorie === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <>
      {/* Barre de recherche sticky */}
      <div className="sticky top-[64px] z-10 bg-background px-4 py-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Que recherchez-vous ?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 px-4 py-3 overflow-x-auto border-b">
        <Button
          variant="secondary"
          size="sm"
          className="shrink-0"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filtres
        </Button>
        {categories.map((category) => (
          <Badge
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            className="shrink-0 cursor-pointer px-4 py-2"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Badge>
        ))}
      </div>

      <PwaContainer>
        {/* Titre section */}
        <h2 className="text-2xl font-bold tracking-tight px-0 pb-3 pt-2">
          Dernières Annonces
        </h2>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <span>
            {filteredAnnonces.length} annonce{filteredAnnonces.length > 1 ? "s" : ""} trouvée{filteredAnnonces.length > 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs">Confiance SP</span>
          </span>
        </div>

        {/* Grille d'annonces */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-4 pb-20">
          {filteredAnnonces.map((annonce) => {
            const statutBadge = getStatutBadge(annonce.statut)
            return (
              <Card key={annonce.id} className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow">
                <div className="relative aspect-square">
                  <Image
                    src={annonce.photos[0]}
                    alt={annonce.titre}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                  {/* Badge statut */}
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${statutBadge.className}`}>
                      {statutBadge.text}
                    </span>
                  </div>
                  {/* Bouton favori */}
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 text-white"
                    onClick={(e) => {
                      e.preventDefault()
                      toggleFavorite(annonce.id)
                    }}
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        favorites.has(annonce.id) ? "fill-white" : ""
                      }`}
                    />
                  </Button>
                  {/* Prix badge */}
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-semibold">
                    {new Intl.NumberFormat("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                      maximumFractionDigits: 0,
                    }).format(annonce.prix)}
                  </div>
                </div>
                <CardContent className="p-3 space-y-2">
                  {/* Titre */}
                  <h3 className="font-bold text-base leading-tight line-clamp-1">
                    {annonce.titre}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {annonce.description}
                  </p>

                  {/* Vendeur */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 text-primary" />
                      </div>
                      <div>
                        <p className="text-[10px] font-medium">
                          {annonce.vendeur.nom}
                        </p>
                        <p className="text-[9px] text-muted-foreground">
                          {annonce.vendeur.equipe}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-[10px] text-muted-foreground">
                        {annonce.vendeur.note}
                      </span>
                    </div>
                  </div>

                  {/* Localisation et date */}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                    {annonce.localisation && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{annonce.localisation}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(annonce.date_creation)}</span>
                    </div>
                  </div>

                  {/* Stats et actions */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span>{annonce.vues} vues</span>
                      <span>{annonce.favoris} ♥</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {annonce.contact.telephone && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.preventDefault()
                            window.location.href = `tel:${annonce.contact.telephone}`
                          }}
                        >
                          <Phone className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.preventDefault()
                          window.location.href = `mailto:${annonce.contact.email}`
                        }}
                      >
                        <Mail className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={(e) => e.preventDefault()}
                      >
                        <MessageCircle className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Message si aucun résultat */}
        {filteredAnnonces.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              Aucune annonce trouvée
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Essayez de modifier vos critères de recherche
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Publier la première annonce
            </Button>
          </div>
        )}

        {/* Badge confiance */}
        {filteredAnnonces.length > 0 && (
          <div className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
            <div className="flex items-center justify-center gap-2 text-green-800 dark:text-green-200">
              <div className="w-6 h-6 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center">
                <Star className="w-4 h-4 text-green-600 dark:text-green-300 fill-current" />
              </div>
              <p className="text-xs font-medium">
                Transactions sécurisées entre collègues sapeurs-pompiers
              </p>
            </div>
          </div>
        )}
      </PwaContainer>

      {/* Bouton d'ajout flottant (FAB) */}
      <Button
        size="icon"
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50"
      >
        <Plus className="h-8 w-8" />
      </Button>
    </>
  )
}
