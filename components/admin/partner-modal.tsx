"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Loader2 } from "lucide-react"
import { createPartner, updatePartner, uploadPartnerLogo, type PartnerFormData } from "@/app/actions/partners/manage-partner"
import toast from "react-hot-toast"
import Image from "next/image"

type Partner = {
  id: number
  name: string
  logo: string
  website?: string
  tier: "platinum" | "gold" | "bronze"
  sector: string
  since: number
}

interface PartnerModalProps {
  isOpen: boolean
  onClose: () => void
  partner?: Partner | null
  onSuccess: () => void
}

const TIERS = [
  { value: "platinum", label: "Platine 💎" },
  { value: "gold", label: "Or 🥇" },
  { value: "bronze", label: "Bronze 🥉" },
]

export function PartnerModal({ isOpen, onClose, partner, onSuccess }: PartnerModalProps) {
  const [formData, setFormData] = useState<PartnerFormData>({
    id: partner?.id,
    name: partner?.name || "",
    logo: partner?.logo || "",
    website: partner?.website || "",
    tier: partner?.tier || "bronze",
    sector: partner?.sector || "",
    since: partner?.since || new Date().getFullYear(),
  })
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [previewLogo, setPreviewLogo] = useState<string>(partner?.logo || "")

  // Réinitialiser le formulaire quand le modal s'ouvre avec un nouveau partenaire
  useEffect(() => {
    if (isOpen) {
      setFormData({
        id: partner?.id,
        name: partner?.name || "",
        logo: partner?.logo || "",
        website: partner?.website || "",
        tier: partner?.tier || "bronze",
        sector: partner?.sector || "",
        since: partner?.since || new Date().getFullYear(),
      })
      setPreviewLogo(partner?.logo || "")
    }
  }, [isOpen, partner])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const result = await uploadPartnerLogo(formData)

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.url) {
        setFormData(prev => ({ ...prev, logo: result.url }))
        setPreviewLogo(result.url)
        toast.success("Logo uploadé avec succès")
      }
    } catch (error) {
      console.error("Error uploading:", error)
      toast.error("Erreur lors de l'upload du logo")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.logo || !formData.sector) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }

    setIsSaving(true)
    try {
      const result = partner?.id
        ? await updatePartner(formData)
        : await createPartner(formData)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(partner?.id ? "Partenaire mis à jour" : "Partenaire créé")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error saving:", error)
      toast.error("Erreur lors de l'enregistrement")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {partner?.id ? "Modifier le partenaire" : "Ajouter un partenaire"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du partenaire *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="Ex: Électricité Hérault"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sector">Secteur d&apos;activité *</Label>
              <Input
                id="sector"
                value={formData.sector}
                onChange={(e) => setFormData(prev => ({ ...prev, sector: e.target.value }))}
                required
                placeholder="Ex: Électricité"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tier">Catégorie</Label>
              <Select
                value={formData.tier}
                onValueChange={(value: "platinum" | "gold" | "bronze") => 
                  setFormData(prev => ({ ...prev, tier: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIERS.map((tier) => (
                    <SelectItem key={tier.value} value={tier.value}>
                      {tier.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="since">Partenaire depuis</Label>
              <Input
                id="since"
                type="number"
                min="1990"
                max={new Date().getFullYear()}
                value={formData.since}
                onChange={(e) => setFormData(prev => ({ ...prev, since: parseInt(e.target.value) || new Date().getFullYear() }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Site web</Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://www.exemple.fr"
            />
          </div>

          <div className="space-y-2">
            <Label>Logo du partenaire *</Label>
            <div className="flex items-center gap-4">
              {previewLogo && (
                <div className="relative w-32 h-20 rounded border bg-muted">
                  <Image
                    src={previewLogo}
                    alt="Preview"
                    fill
                    className="object-contain p-2"
                  />
                </div>
              )}
              <div className="flex-1">
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-muted transition-colors">
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span>{isUploading ? "Upload en cours..." : "Choisir un logo"}</span>
                  </div>
                </Label>
                <Input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={isUploading}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Format recommandé : PNG avec fond transparent, ratio 2:1
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSaving || isUploading}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                partner?.id ? "Mettre à jour" : "Créer le partenaire"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
