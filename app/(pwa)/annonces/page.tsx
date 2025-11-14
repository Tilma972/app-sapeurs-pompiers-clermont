"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, SlidersHorizontal, Heart, Plus, Star, MapPin, Clock, Phone, Mail, MessageCircle, User } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { PwaContainer } from "@/components/layouts/pwa/pwa-container"
import Image from "next/image"
import { getAnnonces, addToFavorites, removeFromFavorites } from "@/lib/supabase/annonces"

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

const categories = ["Tous", "Équipement", "Vêtements", "Sport", "Bricolage", "Électronique", "Maison", "Auto/Moto", "Divers"]

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
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Tous")
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [annonces, setAnnonces] = useState<Annonce[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const ITEMS_PER_PAGE = 20

  useEffect(() => {
    setPage(0)
    setAnnonces([])
    loadAnnonces(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, searchQuery])

  const loadAnnonces = async (pageToLoad: number) => {
    try {
      setLoading(true)
      const result = await getAnnonces({
        categorie: selectedCategory !== "Tous" ? selectedCategory : undefined,
        search: searchQuery || undefined,
        limit: ITEMS_PER_PAGE,
        offset: pageToLoad * ITEMS_PER_PAGE,
      })
      
      const data = result.data
      
      const transformedData: Annonce[] = data.map(item => ({
        id: item.id,
        titre: item.titre,
        description: item.description,
        prix: item.prix,
        categorie: item.categorie,
        photos: item.photos.length > 0 ? item.photos : ["https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=400&h=400&fit=crop"],
        vendeur: {
          nom: item.profiles ? `${item.profiles.first_name} ${item.profiles.last_name?.charAt(0)}.` : "Utilisateur",
          equipe: item.profiles?.equipe || "Non renseigné",
          avatar: item.profiles?.avatar_url,
        },
        date_creation: item.created_at,
        statut: item.statut as "active" | "vendue" | "reservee",
        vues: item.vues,
        favoris: item.favoris,
        contact: {
          telephone: item.telephone,
          email: "",
        },
        localisation: item.localisation,
      }))
      
      if (pageToLoad === 0) {
        setAnnonces(transformedData)
      } else {
        setAnnonces(prev => [...prev, ...transformedData])
      }
      
      setHasMore(result.hasMore)
    } catch (error) {
      console.error("Erreur lors du chargement des annonces:", error)
      if (pageToLoad === 0) {
        setAnnonces([])
      }
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    loadAnnonces(nextPage)
  }

  const toggleFavorite = async (id: string) => {
    try {
      if (favorites.has(id)) {
        await removeFromFavorites(id)
        setFavorites(prev => {
          const newFavorites = new Set(prev)
          newFavorites.delete(id)
          return newFavorites
        })
        // Mettre à jour le compteur localement
        setAnnonces(prev => prev.map(a => 
          a.id === id ? { ...a, favoris: Math.max(0, a.favoris - 1) } : a
        ))
      } else {
        await addToFavorites(id)
        setFavorites(prev => new Set(prev).add(id))
        // Mettre à jour le compteur localement
        setAnnonces(prev => prev.map(a => 
          a.id === id ? { ...a, favoris: a.favoris + 1 } : a
        ))
      }
    } catch (error) {
      console.error("Erreur lors de la gestion des favoris:", error)
    }
  }

  return (
    <PwaContainer>
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Petites Annonces</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Achetez et vendez entre pompiers
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            placeholder="Que recherchez-vous ?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            aria-label="Rechercher une annonce"
          />
        </div>

      <div className="flex gap-2 px-4 py-3 border-b">
        <Button
          variant="default"
          size="sm"
          className="flex-1"
          onClick={() => router.push("/annonces/nouvelle")}
          aria-label="Publier une nouvelle annonce"
        >
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Publier
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => router.push("/annonces/mes-annonces")}
          aria-label="Voir mes annonces"
        >
          <User className="h-4 w-4 mr-2" aria-hidden="true" />
          Mes annonces
        </Button>
      </div>

      <div className="flex gap-3 px-4 py-3 overflow-x-auto border-b">
        <Button variant="secondary" size="sm" className="shrink-0">
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

        {/* Dernières Annonces */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight pb-3 pt-2">
            Dernières Annonces
          </h2>

        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <span>
            {loading ? "Chargement..." : `${annonces.length} annonce${annonces.length > 1 ? "s" : ""} trouvée${annonces.length > 1 ? "s" : ""}`}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs">Confiance SP</span>
          </span>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && annonces.length > 0 && (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-4">
            {annonces.map((annonce) => {
              const statutBadge = getStatutBadge(annonce.statut)
              return (
                <Card 
                  key={annonce.id} 
                  className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/annonces/${annonce.id}`)}
                >
                  <div className="relative aspect-square">
                    <Image
                      src={annonce.photos[0]}
                      alt={annonce.titre}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                    <div className="absolute top-2 left-2">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${statutBadge.className}`}>
                        {statutBadge.text}
                      </span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 text-white"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(annonce.id)
                      }}
                      aria-label={favorites.has(annonce.id) ? "Retirer des favoris" : "Ajouter aux favoris"}
                    >
                      <Heart className={`h-4 w-4 ${favorites.has(annonce.id) ? "fill-white" : ""}`} aria-hidden="true" />
                    </Button>
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-semibold">
                      {new Intl.NumberFormat("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                        maximumFractionDigits: 0,
                      }).format(annonce.prix)}
                    </div>
                  </div>
                  <CardContent className="p-3 space-y-2">
                    <h3 className="font-bold text-base leading-tight line-clamp-1">
                      {annonce.titre}
                    </h3>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {annonce.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        {annonce.vendeur.avatar ? (
                          <Image
                            src={annonce.vendeur.avatar}
                            alt={annonce.vendeur.nom}
                            width={24}
                            height={24}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-primary" />
                          </div>
                        )}
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
                        <span className="text-[10px] text-muted-foreground">5.0</span>
                      </div>
                    </div>

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
                              e.stopPropagation()
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
                            e.stopPropagation()
                            window.location.href = `mailto:${annonce.contact.email}`
                          }}
                        >
                          <Mail className="w-3 h-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => e.stopPropagation()}
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
        )}

        {/* Bouton Charger plus */}
        {!loading && hasMore && annonces.length > 0 && (
          <div className="flex justify-center py-6">
            <Button
              variant="outline"
              onClick={loadMore}
              aria-label="Charger plus d'annonces"
            >
              Charger plus
            </Button>
          </div>
        )}

        {!loading && annonces.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              Aucune annonce trouvée
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              {searchQuery || selectedCategory !== "Tous" 
                ? "Essayez de modifier vos critères de recherche" 
                : "Soyez le premier à publier une annonce !"}
            </p>
            <Button onClick={() => router.push("/annonces/nouvelle")}>
              <Plus className="h-4 w-4 mr-2" />
              Publier une annonce
            </Button>
          </div>
        )}
        </div>
      </div>
    </PwaContainer>
  )
}
