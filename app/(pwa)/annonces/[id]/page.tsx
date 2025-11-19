"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, Heart, Share2, Star, MapPin, Clock, Phone, Mail, MessageCircle, Eye, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getAnnonceById, addToFavorites, removeFromFavorites } from "@/lib/supabase/annonces"
import { PwaContainer } from "@/components/layouts/pwa/pwa-container"

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
    annoncesActives: number
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

// Mock data supprimé - maintenant on utilise Supabase
/*
const mockAnnonces: Annonce[] = [
  {
    id: "1",
    titre: "Casque F1 en très bon état",
    description: "Casque F1 Gallet en excellent état. Peu utilisé, acheté il y a 2 ans. Toutes les normes OK. Idéal pour intervention ou collection.\n\nCaractéristiques :\n- Marque : Gallet\n- Taille : 56-58\n- Couleur : Rouge pompier\n- État : Comme neuf\n- Visière claire incluse\n- Jugulaire réglable\n\nLivré avec sa housse de protection. Possibilité de remise en main propre à la caserne.",
    prix: 150,
    categorie: "Équipement",
    photos: [
      "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&h=800&fit=crop",
      "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&h=800&fit=crop&sat=-100",
      "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&h=800&fit=crop&hue=180",
    ],
    vendeur: {
      nom: "Jean M.",
      equipe: "Équipe Alpha",
      note: 4.8,
      annoncesActives: 3,
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
    photos: ["https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&h=800&fit=crop"],
    vendeur: {
      nom: "Sophie L.",
      equipe: "Équipe Bravo",
      note: 5.0,
      annoncesActives: 1,
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
]
*/

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const maintenant = new Date()
  const diffJours = Math.floor((maintenant.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
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

export default function AnnonceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [selectedPhoto, setSelectedPhoto] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [annonce, setAnnonce] = useState<Annonce | null>(null)
  const [loading, setLoading] = useState(true)

  const { id } = use(params)

  useEffect(() => {
    loadAnnonce()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const loadAnnonce = async () => {
    try {
      setLoading(true)
      const data = await getAnnonceById(id)
      
      // Transformer pour correspondre à l'interface
      const transformedData: Annonce = {
        id: data.id,
        titre: data.titre,
        description: data.description,
        prix: data.prix,
        categorie: data.categorie,
        photos: data.photos.length > 0 ? data.photos : ["https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&h=800&fit=crop"],
        vendeur: {
          nom: data.profiles ? `${data.profiles.first_name} ${data.profiles.last_name?.charAt(0)}.` : "Utilisateur",
          equipe: data.profiles?.equipe || "Non renseigné",
          avatar: data.profiles?.avatar_url,
          note: 5.0,
          annoncesActives: 3,
        },
        date_creation: data.created_at,
        statut: data.statut as "active" | "vendue" | "reservee",
        vues: data.vues,
        favoris: data.favoris,
        contact: {
          telephone: data.telephone,
          email: "",
        },
        localisation: data.localisation,
      }
      
      setAnnonce(transformedData)
    } catch (error) {
      console.error("Erreur lors du chargement de l'annonce:", error)
      setAnnonce(null)
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        await removeFromFavorites(id)
        setIsFavorite(false)
      } else {
        await addToFavorites(id)
        setIsFavorite(true)
      }
    } catch (error) {
      console.error("Erreur lors de la gestion des favoris:", error)
    }
  }

  if (loading) {
    return (
      <PwaContainer>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </PwaContainer>
    )
  }

  if (!annonce) {
    return (
      <PwaContainer>
        <Card className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Annonce introuvable</h2>
          <p className="text-muted-foreground mb-4">Cette annonce n&apos;existe pas ou a été supprimée.</p>
          <Button onClick={() => router.push("/annonces")}>
            Retour aux annonces
          </Button>
        </Card>
      </PwaContainer>
    )
  }

  const statutBadge = getStatutBadge(annonce.statut)

  return (
    <PwaContainer>
      <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFavorite}
            >
              <Heart className={`h-5 w-5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Galerie photos */}
      <div className="relative">
        <div className="relative aspect-square bg-muted">
          <Image
            src={annonce.photos[selectedPhoto]}
            alt={annonce.titre}
            fill
            className="object-cover"
            priority
          />
          {/* Badge statut */}
          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${statutBadge.className}`}>
              {statutBadge.text}
            </span>
          </div>
          {/* Compteur photos */}
          {annonce.photos.length > 1 && (
            <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
              {selectedPhoto + 1} / {annonce.photos.length}
            </div>
          )}
        </div>

        {/* Miniatures */}
        {annonce.photos.length > 1 && (
          <div className="flex gap-2 p-4 overflow-x-auto">
            {annonce.photos.map((photo, index) => (
              <button
                key={index}
                onClick={() => setSelectedPhoto(index)}
                className={`relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                  selectedPhoto === index ? "border-primary" : "border-transparent"
                }`}
              >
                <Image
                  src={photo}
                  alt={`Photo ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="px-4 py-6 space-y-6">
        {/* Titre et prix */}
        <div>
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-2xl font-bold">{annonce.titre}</h1>
            <Badge variant="outline" className="shrink-0">
              {annonce.categorie}
            </Badge>
          </div>
          <p className="text-3xl font-bold text-primary">
            {new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "EUR",
              maximumFractionDigits: 0,
            }).format(annonce.prix)}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{annonce.vues} vues</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            <span>{annonce.favoris} favoris</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{formatDate(annonce.date_creation)}</span>
          </div>
        </div>

        <Separator />

        {/* Description */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Description</h2>
          <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
            {annonce.description}
          </p>
        </div>

        <Separator />

        {/* Localisation */}
        {annonce.localisation && (
          <>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-5 w-5" />
              <span>{annonce.localisation}</span>
            </div>
            <Separator />
          </>
        )}

        {/* Vendeur */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Vendeur</h2>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {annonce.vendeur.nom.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{annonce.vendeur.nom}</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium">{annonce.vendeur.note}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{annonce.vendeur.equipe}</p>
                  <p className="text-xs text-muted-foreground">
                    {annonce.vendeur.annoncesActives} annonce{annonce.vendeur.annoncesActives > 1 ? 's' : ''} active{annonce.vendeur.annoncesActives > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Avertissement sécurité */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900 dark:text-blue-100">
                <p className="font-medium mb-1">Conseils de sécurité</p>
                <ul className="space-y-1 text-xs">
                  <li>• Privilégiez la remise en main propre</li>
                  <li>• Vérifiez l&apos;état de l&apos;article avant achat</li>
                  <li>• Ne payez jamais à l&apos;avance sans garantie</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre d'actions fixe en bas */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-20">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            {annonce.contact.telephone && (
              <Button
                size="lg"
                variant="outline"
                className="flex-1"
                onClick={() => window.location.href = `tel:${annonce.contact.telephone}`}
              >
                <Phone className="h-5 w-5 mr-2" />
                Appeler
              </Button>
            )}
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              onClick={() => window.location.href = `mailto:${annonce.contact.email}`}
            >
              <Mail className="h-5 w-5 mr-2" />
              Email
            </Button>
            <Button
              size="lg"
              className="flex-1"
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Message
            </Button>
          </div>
        </div>
      </div>
      </div>
    </PwaContainer>
  )
}
