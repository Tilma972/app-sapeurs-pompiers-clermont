"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  Clock,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Shield,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// Masonry layout sans Card pour des tuiles compactes
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Photo {
  id: string;
  user_id: string;
  user_name: string;
  user_team: string;
  url: string;
  thumbnail_url: string;
  caption: string;
  category: "intervention" | "formation" | "detente";
  created_at: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  status: "pending" | "approved" | "flagged";
  reports_count?: number;
}

// Interface Comment laissée de côté pour cette ébauche

// Données mock
const mockPhotos: Photo[] = [
  {
    id: "1",
    user_id: "user1",
    user_name: "Marc D.",
    user_team: "Équipe Alpha",
    url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600",
    thumbnail_url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=300",
    caption: "Formation désincarcération ce matin. Excellent travail d'équipe !",
    category: "formation",
    created_at: "2024-01-15T10:30:00Z",
    likes_count: 12,
    comments_count: 3,
    is_liked: false,
    status: "approved",
  },
  {
    id: "2",
    user_id: "user2",
    user_name: "Julie M.",
    user_team: "Équipe Bravo",
    url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600",
    thumbnail_url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300",
    caption: "Pause bien méritée après l'intervention de ce midi",
    category: "detente",
    created_at: "2024-01-15T14:15:00Z",
    likes_count: 8,
    comments_count: 5,
    is_liked: true,
    status: "approved",
  },
  {
    id: "3",
    user_id: "user3",
    user_name: "Thomas L.",
    user_team: "Équipe Charlie",
    url: "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=600",
    thumbnail_url: "https://images.unsplash.com/photo-1590736969955-71cc94901144?w=300",
    caption: "Nouveau matériel reçu aujourd'hui",
    category: "formation",
    created_at: "2024-01-14T16:45:00Z",
    likes_count: 15,
    comments_count: 2,
    is_liked: false,
    status: "approved",
  },
];

export default function GaleriePage() {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState<string | null>(null);

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadCategory, setUploadCategory] = useState<
    "intervention" | "formation" | "detente"
  >("detente");
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  const categories = [
    { value: "all", label: "Toutes", color: "bg-gray-100" },
    { value: "intervention", label: "Intervention", color: "bg-red-100 text-red-800" },
    { value: "formation", label: "Formation", color: "bg-blue-100 text-blue-800" },
    { value: "detente", label: "Détente", color: "bg-green-100 text-green-800" },
  ];

  useEffect(() => {
    // Simulation chargement
    const t = setTimeout(() => {
      setPhotos(mockPhotos);
      setLoading(false);
    }, 500);
    return () => clearTimeout(t);
  }, []);

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const maintenant = new Date();
    const diffMs = maintenant.getTime() - date.getTime();
    const diffHeures = Math.floor(diffMs / (1000 * 60 * 60));
    const diffJours = Math.floor(diffHeures / 24);

    if (diffJours > 0) return `Il y a ${diffJours}j`;
    if (diffHeures > 0) return `Il y a ${diffHeures}h`;
    return "À l'instant";
  };

  const getCategoryBadge = (category: string) => {
    const cat = categories.find((c) => c.value === category);
    return cat ? (
      <Badge variant="outline" className={cat.color}>
        {cat.label}
      </Badge>
    ) : null;
  };

  const photosFiltered =
    selectedCategory === "all"
      ? photos
      : photos.filter((p) => p.category === selectedCategory);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setUploadPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadCaption) return;

    // Simulation upload
    console.log("Upload:", {
      file: uploadFile.name,
      caption: uploadCaption,
      category: uploadCategory,
    });

    // Reset et fermeture
    setUploadFile(null);
    setUploadCaption("");
    setUploadCategory("detente");
    setUploadPreview(null);
    setShowUploadModal(false);
  };

  const handleLike = (photoId: string) => {
    setPhotos((prev) =>
      prev.map((photo) =>
        photo.id === photoId
          ? {
              ...photo,
              is_liked: !photo.is_liked,
              likes_count: photo.is_liked
                ? photo.likes_count - 1
                : photo.likes_count + 1,
            }
          : photo,
      ),
    );
  };

  const handleReport = (photoId: string, reason: string) => {
    console.log("Signalement:", { photoId, reason });
    setShowReportModal(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la galerie...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Galerie SP</h1>
                <p className="text-sm text-gray-600">Photos & moments de caserne</p>
              </div>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Filtres */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center space-x-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category.value
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            {photosFiltered.length} photo
            {photosFiltered.length > 1 ? "s" : ""}
          </span>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Shield className="w-4 h-4 text-green-600" />
              <span>Modération active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Masonry grid (Pinterest-like) */}
      <div className="max-w-6xl mx-auto px-4 pb-6">
        <div className="columns-2 md:columns-3 lg:columns-4 gap-3 [column-fill:_balance]">
          {photosFiltered.map((photo, idx) => {
            const ratioClass = idx % 3 === 0 ? "aspect-[4/5]" : idx % 3 === 1 ? "aspect-[1/1]" : "aspect-[16/10]";
            return (
              <div
                key={photo.id}
                className="mb-3 break-inside-avoid rounded-lg overflow-hidden border border-border bg-card"
                style={{ breakInside: "avoid" }}
              >
                <div className={`relative w-full ${ratioClass}`}>
                  <Image
                    src={photo.url}
                    alt={photo.caption}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    style={{ objectFit: "cover" }}
                  />
                  {/* Overlays */}
                  <div className="absolute top-2 left-2">
                    {getCategoryBadge(photo.category)}
                  </div>
                  <button
                    onClick={() => setShowReportModal(photo.id)}
                    className="absolute top-1.5 right-1.5 p-1 rounded bg-white/80 hover:bg-white shadow"
                    aria-label="Signaler"
                  >
                    <MoreHorizontal className="w-4 h-4 text-gray-700" />
                  </button>
                  {photo.status === "flagged" && (
                    <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded text-[10px] font-medium">
                      En modération
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">
                        <User className="w-3 h-3 text-purple-700" />
                      </div>
                      <span className="text-[11px] text-white/90 truncate">{photo.user_name}</span>
                    </div>
                    <p className="text-xs text-white/95 truncate">{photo.caption}</p>
                  </div>
                </div>
                {/* Actions compacts */}
                <div className="flex items-center justify-between px-2 py-1.5">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleLike(photo.id)}
                      className="flex items-center space-x-1 p-1 rounded hover:bg-muted"
                      aria-label="Aimer"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill={photo.is_liked ? "#ef4444" : "none"}
                        stroke="currentColor"
                        strokeWidth="2"
                        className={`w-4 h-4 ${photo.is_liked ? "text-red-500" : "text-gray-600"}`}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                      </svg>
                      <span className="text-[11px] text-gray-600">{photo.likes_count}</span>
                    </button>
                    <div className="flex items-center space-x-1 p-1 rounded">
                      <MessageCircle className="w-4 h-4 text-gray-600" />
                      <span className="text-[11px] text-gray-600">{photo.comments_count}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-[10px] text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(photo.created_at)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {photosFiltered.length === 0 && (
          <div className="text-center py-12">
            <Camera className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune photo</h3>
            <p className="text-gray-600 mb-4">Soyez le premier à partager un moment !</p>
            <Button onClick={() => setShowUploadModal(true)}>
              <Camera className="w-4 h-4 mr-2" />
              Ajouter une photo
            </Button>
          </div>
        )}
      </div>

      {/* Modal Upload */}
      {showUploadModal && (
        <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Ajouter une photo</DialogTitle>
              <DialogDescription>Partagez un moment avec vos collègues</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {!uploadPreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 mb-2">Sélectionnez une photo</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="photo-upload"
                  />
                  <label htmlFor="photo-upload">
                    <Button variant="outline" className="cursor-pointer">
                      Choisir un fichier
                    </Button>
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative w-full h-48 rounded-lg overflow-hidden">
                    <Image src={uploadPreview!} alt="Preview" fill style={{ objectFit: "cover" }} />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUploadPreview(null);
                      setUploadFile(null);
                    }}
                  >
                    Changer de photo
                  </Button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Catégorie</label>
                <select
                  value={uploadCategory}
                  onChange={(e) =>
                    setUploadCategory(
                      e.target.value as "intervention" | "formation" | "detente",
                    )
                  }
                  className="w-full h-10 border border-input rounded-md bg-background px-3 text-sm"
                >
                  <option value="detente">Détente</option>
                  <option value="formation">Formation</option>
                  <option value="intervention">Intervention</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  placeholder="Décrivez ce moment..."
                  rows={3}
                  className="w-full p-2 border border-input rounded-md bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none text-sm"
                />
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowUploadModal(false)} className="flex-1">
                  Annuler
                </Button>
                <Button onClick={handleUpload} disabled={!uploadFile || !uploadCaption} className="flex-1">
                  Publier
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal Signalement */}
      {showReportModal && (
        <Dialog open={!!showReportModal} onOpenChange={() => setShowReportModal(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 text-orange-600" fill="currentColor">
                  <path d="M13.73 21a2 2 0 0 1-3.46 0L1.05 7.36A2 2 0 0 1 2.78 4h18.44a2 2 0 0 1 1.73 3.36Z" />
                </svg>
                <span>Signaler cette photo</span>
              </DialogTitle>
              <DialogDescription>
                Aidez-nous à maintenir un environnement respectueux
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                {["Contenu inapproprié", "Violation de confidentialité", "Photo de mauvaise qualité", "Spam ou hors-sujet", "Autre"].map(
                  (reason) => (
                    <button
                      key={reason}
                      onClick={() => handleReport(showReportModal, reason)}
                      className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {reason}
                    </button>
                  ),
                )}
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-orange-800">
                    Modération collaborative : 3 signalements masquent temporairement la photo en attendant validation.
                  </p>
                </div>
              </div>

              <Button variant="outline" onClick={() => setShowReportModal(null)} className="w-full">
                Annuler
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
