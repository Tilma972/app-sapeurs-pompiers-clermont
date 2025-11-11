"use client"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Camera, Loader2, X } from "lucide-react"
import { toast } from "react-hot-toast"

interface AvatarUploadProps {
  currentAvatarUrl?: string | null
  initials: string
  userId: string
}

export function AvatarUpload({ currentAvatarUrl, initials, userId }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl || null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validation
    const maxSize = 2 * 1024 * 1024 // 2MB
    if (file.size > maxSize) {
      toast.error("L'image ne doit pas dépasser 2MB")
      return
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      toast.error("Format non supporté. Utilisez JPG, PNG ou WEBP")
      return
    }

    // Preview local
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload
    uploadAvatar(file)
  }

  const uploadAvatar = async (file: File) => {
    setUploading(true)
    try {
      // Nom du fichier: user_id/avatar.ext
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/avatar.${fileExt}`

      // Upload dans Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          upsert: true, // Remplace si existe déjà
          contentType: file.type,
        })

      if (uploadError) throw uploadError

      // Construire l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Mettre à jour le profil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: fileName })
        .eq('id', userId)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      toast.success("Photo de profil mise à jour !")
      
      // Recharger la page pour mettre à jour l'avatar partout
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      console.error('Erreur upload avatar:', error)
      toast.error("Erreur lors de l'upload de l'avatar")
      setPreviewUrl(null)
    } finally {
      setUploading(false)
    }
  }

  const removeAvatar = async () => {
    if (!confirm("Supprimer votre photo de profil ?")) return

    setUploading(true)
    try {
      // Supprimer du Storage
      if (avatarUrl) {
        const fileName = `${userId}/avatar.${avatarUrl.split('.').pop()}`
        await supabase.storage.from('avatars').remove([fileName])
      }

      // Supprimer de la DB
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId)

      if (error) throw error

      setAvatarUrl(null)
      setPreviewUrl(null)
      toast.success("Photo de profil supprimée")
      
      // Recharger
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      console.error('Erreur suppression avatar:', error)
      toast.error("Erreur lors de la suppression")
    } finally {
      setUploading(false)
    }
  }

  const displayUrl = previewUrl || (avatarUrl ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${avatarUrl}` : null)

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-24 w-24 border-2 border-primary">
          {displayUrl ? (
            <AvatarImage src={displayUrl} alt="Avatar" />
          ) : null}
          <AvatarFallback className="text-2xl font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Bouton caméra overlay */}
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </Button>

        {/* Bouton supprimer (si avatar existe) */}
        {avatarUrl && !uploading && (
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-md"
            onClick={removeAvatar}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
        disabled={uploading}
      />

      <div className="text-center space-y-1">
        <p className="text-sm font-medium">Photo de profil</p>
        <p className="text-xs text-muted-foreground">
          JPG, PNG ou WEBP • Max 2MB
        </p>
      </div>
    </div>
  )
}
