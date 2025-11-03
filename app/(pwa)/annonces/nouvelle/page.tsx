"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowLeft, Upload, X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

const categories = [
  "Équipement",
  "Vêtements",
  "Sport",
  "Bricolage",
  "Électronique",
  "Maison",
  "Auto/Moto",
  "Divers",
]

export default function NouvelleAnnoncePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [formData, setFormData] = useState({
    titre: "",
    description: "",
    prix: "",
    categorie: "",
    localisation: "",
    telephone: "",
  })

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    // Limiter à 5 photos
    if (photos.length + files.length > 5) {
      alert("Vous ne pouvez ajouter que 5 photos maximum")
      return
    }

    // Convertir les fichiers en URLs
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotos(prev => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Validation basique
    if (!formData.titre || !formData.prix || !formData.categorie || photos.length === 0) {
      alert("Veuillez remplir tous les champs obligatoires et ajouter au moins une photo")
      setIsSubmitting(false)
      return
    }

    // Simulation d'envoi (à remplacer par appel API/Supabase)
    setTimeout(() => {
      console.log("Annonce créée:", { ...formData, photos })
      setIsSubmitting(false)
      router.push("/annonces")
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header sticky */}
      <div className="sticky top-[64px] z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">Nouvelle annonce</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-6 space-y-6">
        {/* Photos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Photos *</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                  <Image
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-1 hover:bg-black"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {index === 0 && (
                    <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded">
                      Principal
                    </div>
                  )}
                </div>
              ))}
              
              {photos.length < 5 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors cursor-pointer flex flex-col items-center justify-center gap-2">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground text-center px-2">
                    Ajouter
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Ajoutez jusqu&apos;à 5 photos. La première sera la photo principale.
            </p>
          </CardContent>
        </Card>

        {/* Informations principales */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations principales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titre">Titre de l&apos;annonce *</Label>
              <Input
                id="titre"
                placeholder="Ex: Casque F1 en très bon état"
                value={formData.titre}
                onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
                maxLength={100}
                required
              />
              <p className="text-xs text-muted-foreground">
                {formData.titre.length}/100 caractères
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categorie">Catégorie *</Label>
              <Select
                value={formData.categorie}
                onValueChange={(value: string) => setFormData({ ...formData, categorie: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prix">Prix (€) *</Label>
              <Input
                id="prix"
                type="number"
                placeholder="0"
                min="0"
                step="1"
                value={formData.prix}
                onChange={(e) => setFormData({ ...formData, prix: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Décrivez votre article en détail : état, caractéristiques, raison de la vente..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                maxLength={1000}
                required
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/1000 caractères
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Localisation et contact */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Localisation et contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="localisation">Localisation</Label>
              <Input
                id="localisation"
                placeholder="Ex: Caserne de Lyon"
                value={formData.localisation}
                onChange={(e) => setFormData({ ...formData, localisation: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone (optionnel)</Label>
              <Input
                id="telephone"
                type="tel"
                placeholder="06.12.34.56.78"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Si renseigné, il sera visible par les acheteurs potentiels
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Conseils */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <p className="font-medium mb-2">Conseils pour une bonne annonce :</p>
            <ul className="text-xs space-y-1">
              <li>• Prenez des photos nettes et bien éclairées</li>
              <li>• Décrivez précisément l&apos;état de l&apos;article</li>
              <li>• Fixez un prix juste et cohérent</li>
              <li>• Répondez rapidement aux messages</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Boutons d'action */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-20">
          <div className="max-w-2xl mx-auto flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Publication...
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5 mr-2" />
                  Publier
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
