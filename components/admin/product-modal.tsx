"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Loader2 } from "lucide-react"
import { createProduct, updateProduct, uploadProductImage, type ProductFormData } from "@/app/actions/products/manage-product"
import toast from "react-hot-toast"
import Image from "next/image"

type Product = {
  id: string
  name: string
  category: string
  description: string
  price: number
  stock: number
  image_url?: string
  badge_text?: string
  badge_variant?: "preorder" | "new" | "promo" | null
}

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  product?: Product | null
  onSuccess: () => void
}

const CATEGORIES = ["Calendriers", "Écussons", "Textiles", "Autres"]
const BADGE_VARIANTS = [
  { value: "none", label: "Aucun" },
  { value: "preorder", label: "Précommande" },
  { value: "new", label: "Nouveau" },
  { value: "promo", label: "Promotion" },
]

export function ProductModal({ isOpen, onClose, product, onSuccess }: ProductModalProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    id: product?.id,
    name: product?.name || "",
    category: product?.category || "Autres",
    description: product?.description || "",
    price: product?.price || 0,
    stock: product?.stock || 0,
    image_url: product?.image_url || "",
    badge_text: product?.badge_text || "",
    badge_variant: product?.badge_variant || null,
  })
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [previewImage, setPreviewImage] = useState<string>(product?.image_url || "")

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const result = await uploadProductImage(formData)

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.url) {
        setFormData(prev => ({ ...prev, image_url: result.url }))
        setPreviewImage(result.url)
        toast.success("Image uploadée avec succès")
      }
    } catch (error) {
      console.error("Error uploading:", error)
      toast.error("Erreur lors de l'upload")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const result = product?.id
        ? await updateProduct(formData)
        : await createProduct(formData)

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(product?.id ? "Produit mis à jour" : "Produit créé")
      onSuccess()
      onClose()
    } catch (error) {
      console.error("Error saving product:", error)
      toast.error("Erreur lors de l'enregistrement")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product?.id ? "Modifier le produit" : "Ajouter un produit"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du produit *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="Ex: Calendrier 2025"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Catégorie *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description du produit..."
              rows={3}
              className="bg-background text-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Prix (€) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock *</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="badge_text">Texte du badge</Label>
              <Input
                id="badge_text"
                value={formData.badge_text || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, badge_text: e.target.value }))}
                placeholder="Ex: NOUVEAU"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="badge_variant">Type de badge</Label>
              <Select
                value={formData.badge_variant || "none"}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  badge_variant: value === "none" ? null : value as "preorder" | "new" | "promo"
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BADGE_VARIANTS.map((variant) => (
                    <SelectItem key={variant.value} value={variant.value}>
                      {variant.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Image du produit</Label>
            <div className="flex items-center gap-4">
              {previewImage && (
                <div className="relative w-24 h-24 rounded border">
                  <Image
                    src={previewImage}
                    alt="Preview"
                    fill
                    className="object-cover rounded"
                  />
                </div>
              )}
              <div className="flex-1">
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-muted transition-colors">
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    <span>{isUploading ? "Upload en cours..." : "Choisir une image"}</span>
                  </div>
                </Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="hidden"
                />
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
                product?.id ? "Mettre à jour" : "Créer le produit"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
