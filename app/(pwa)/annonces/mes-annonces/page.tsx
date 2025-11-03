"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Plus, Edit, Trash2, Eye, EyeOff, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getMyAnnonces, updateAnnonceStatut, deleteAnnonce } from "@/lib/supabase/annonces"

interface Annonce {
  id: string
  titre: string
  prix: number
  photo: string
  categorie: string
  statut: "active" | "desactivee" | "vendue" | "reservee"
  datePublication: string
  vues: number
  favoris: number
  messages: number
}

const getStatutBadge = (statut: string) => {
  switch (statut) {
    case "active":
      return <Badge className="bg-green-500">Active</Badge>
    case "desactivee":
      return <Badge variant="secondary">Désactivée</Badge>
    case "vendue":
      return <Badge variant="outline">Vendue</Badge>
    case "reservee":
      return <Badge className="bg-orange-500">Réservée</Badge>
    default:
      return null
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return "Hier"
  if (diffDays < 7) return `Il y a ${diffDays} jours`
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`
  return `Il y a ${Math.floor(diffDays / 30)} mois`
}

export default function MesAnnoncesPage() {
  const router = useRouter()
  const [annonces, setAnnonces] = useState<Annonce[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState("all")

  useEffect(() => {
    loadAnnonces()
  }, [])

  const loadAnnonces = async () => {
    try {
      const data = await getMyAnnonces()
      const transformedData: Annonce[] = data.map(item => ({
        id: item.id,
        titre: item.titre,
        prix: item.prix,
        photo: item.photos[0] || "",
        categorie: item.categorie,
        statut: item.statut,
        datePublication: item.created_at,
        vues: item.vues,
        favoris: item.favoris,
        messages: 0, // À implémenter avec système de messagerie
      }))
      setAnnonces(transformedData)
      setIsLoading(false)
    } catch (error) {
      console.error("Erreur lors du chargement des annonces:", error)
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAnnonce(id)
      setAnnonces(prev => prev.filter(a => a.id !== id))
      setDeleteDialog(null)
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      alert("Erreur lors de la suppression de l'annonce")
    }
  }

  const handleToggleStatut = async (id: string) => {
    const annonce = annonces.find(a => a.id === id)
    if (!annonce) return

    const newStatut = annonce.statut === "active" ? "desactivee" : "active"
    
    try {
      await updateAnnonceStatut(id, newStatut)
      setAnnonces(prev => prev.map(a => {
        if (a.id === id) {
          return { ...a, statut: newStatut }
        }
        return a
      }))
    } catch (error) {
      console.error("Erreur lors du changement de statut:", error)
      alert("Erreur lors du changement de statut")
    }
  }

  const handleMarquerVendue = async (id: string) => {
    try {
      await updateAnnonceStatut(id, "vendue")
      setAnnonces(prev => prev.map(a => {
        if (a.id === id) {
          return { ...a, statut: "vendue" as const }
        }
        return a
      }))
    } catch (error) {
      console.error("Erreur lors du marquage comme vendue:", error)
      alert("Erreur lors du marquage comme vendue")
    }
  }

  const filteredAnnonces = annonces.filter(a => {
    if (selectedTab === "all") return true
    if (selectedTab === "active") return a.statut === "active"
    if (selectedTab === "inactive") return a.statut === "desactivee"
    if (selectedTab === "sold") return a.statut === "vendue"
    return true
  })

  const stats = {
    total: annonces.length,
    active: annonces.filter(a => a.statut === "active").length,
    inactive: annonces.filter(a => a.statut === "desactivee").length,
    sold: annonces.filter(a => a.statut === "vendue").length,
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement de vos annonces...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Stats */}
      <div className="bg-primary text-primary-foreground p-6">
        <h1 className="text-2xl font-bold mb-4">Mes annonces</h1>
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs opacity-90">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.active}</div>
            <div className="text-xs opacity-90">Actives</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.inactive}</div>
            <div className="text-xs opacity-90">Pausées</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.sold}</div>
            <div className="text-xs opacity-90">Vendues</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Bouton nouvelle annonce */}
        <Button
          className="w-full"
          size="lg"
          onClick={() => router.push("/annonces/nouvelle")}
        >
          <Plus className="h-5 w-5 mr-2" />
          Publier une annonce
        </Button>

        {/* Tabs de filtrage */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Toutes</TabsTrigger>
            <TabsTrigger value="active">Actives</TabsTrigger>
            <TabsTrigger value="inactive">Pausées</TabsTrigger>
            <TabsTrigger value="sold">Vendues</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="mt-4 space-y-3">
            {filteredAnnonces.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground">Aucune annonce dans cette catégorie</p>
                </CardContent>
              </Card>
            ) : (
              filteredAnnonces.map((annonce) => (
                <Card key={annonce.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex gap-3 p-3">
                      {/* Image */}
                      <div
                        className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => router.push(`/annonces/${annonce.id}`)}
                      >
                        <Image
                          src={annonce.photo}
                          alt={annonce.titre}
                          fill
                          className="object-cover"
                        />
                        {annonce.statut === "desactivee" && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <EyeOff className="h-6 w-6 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3
                              className="font-semibold text-sm line-clamp-2 cursor-pointer hover:text-primary"
                              onClick={() => router.push(`/annonces/${annonce.id}`)}
                            >
                              {annonce.titre}
                            </h3>
                            <p className="text-lg font-bold text-primary mt-1">
                              {annonce.prix} €
                            </p>
                          </div>

                          {/* Menu d'actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/annonces/${annonce.id}`)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Voir l&apos;annonce
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/annonces/${annonce.id}/modifier`)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              {annonce.statut !== "vendue" && (
                                <>
                                  <DropdownMenuItem onClick={() => handleToggleStatut(annonce.id)}>
                                    {annonce.statut === "active" ? (
                                      <>
                                        <EyeOff className="h-4 w-4 mr-2" />
                                        Désactiver
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="h-4 w-4 mr-2" />
                                        Activer
                                      </>
                                    )}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleMarquerVendue(annonce.id)}>
                                    <Badge className="h-4 w-4 mr-2" />
                                    Marquer comme vendue
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem
                                onClick={() => setDeleteDialog(annonce.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Statut et stats */}
                        <div className="flex items-center gap-2 mt-2">
                          {getStatutBadge(annonce.statut)}
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {annonce.vues}
                          </div>
                          <div className="flex items-center gap-1">
                            ❤️ {annonce.favoris}
                          </div>
                          <div className="flex items-center gap-1">
                            💬 {annonce.messages}
                          </div>
                          <div className="ml-auto">
                            {formatDate(annonce.datePublication)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de confirmation de suppression */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l&apos;annonce ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. L&apos;annonce sera définitivement supprimée.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialog && handleDelete(deleteDialog)}
            >
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
