"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Filter, Heart, Mail, MapPin, MessageCircle, Phone, Plus, Search, Star, User } from "lucide-react";

interface Annonce {
  id: string;
  titre: string;
  description: string;
  prix: number;
  categorie: string;
  photos: string[];
  vendeur: {
    nom: string;
    equipe: string;
    avatar?: string;
    note: number;
  };
  date_creation: string;
  statut: "active" | "vendue" | "reservee";
  vues: number;
  favoris: number;
  contact: {
    telephone?: string;
    email: string;
  };
  localisation?: string;
}

const mockAnnonces: Annonce[] = [
  {
    id: "1",
    titre: "Perceuse Bosch Professional",
    description:
      "Perceuse visseuse sans fil 18V, très peu utilisée. Parfait état, avec mallette et 2 batteries. Idéale pour bricolage maison.",
    prix: 85,
    categorie: "Bricolage",
    photos: ["https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=400"],
    vendeur: {
      nom: "Marc D.",
      equipe: "Équipe Alpha",
      note: 4.8,
    },
    date_creation: "2024-01-15",
    statut: "active",
    vues: 24,
    favoris: 7,
    contact: {
      telephone: "06.12.34.56.78",
      email: "marc.d@example.com",
    },
    localisation: "Caserne Centrale",
  },
  {
    id: "2",
    titre: "VTT Trek 29 pouces",
    description:
      "VTT en excellent état, révision complète faite. Parfait pour sorties détente après service. Peu de kilomètres.",
    prix: 320,
    categorie: "Sport",
    photos: ["https://images.unsplash.com/photo-1534150034764-046bf225d3fa?w=400"],
    vendeur: {
      nom: "Julie M.",
      equipe: "Équipe Bravo",
      note: 5.0,
    },
    date_creation: "2024-01-12",
    statut: "active",
    vues: 43,
    favoris: 12,
    contact: {
      email: "julie.m@example.com",
    },
    localisation: "Caserne Nord",
  },
  {
    id: "3",
    titre: "Barbecue Weber + accessoires",
    description:
      "Barbecue Weber Spirit, utilisé 2 saisons. Vendu avec housse, ustensiles et plancha. Parfait pour les soirées équipe !",
    prix: 180,
    categorie: "Maison",
    photos: ["https://images.unsplash.com/photo-1504564321107-4aa3efddb5bd?w=400"],
    vendeur: {
      nom: "Thomas L.",
      equipe: "Équipe Charlie",
      note: 4.6,
    },
    date_creation: "2024-01-10",
    statut: "reservee",
    vues: 31,
    favoris: 9,
    contact: {
      telephone: "06.98.76.54.32",
      email: "thomas.l@example.com",
    },
  },
];

export default function PetitesAnnoncesPage() {
  const router = useRouter();
  const [annonces, setAnnonces] = useState<Annonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategorie, setSelectedCategorie] = useState("Toutes");
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    "Toutes",
    "Bricolage",
    "Sport",
    "Maison",
    "Auto/Moto",
    "Électronique",
    "Vêtements",
  ];

  useEffect(() => {
    const t = setTimeout(() => {
      setAnnonces(mockAnnonces);
      setLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, []);

  const annoncesFiltrees = annonces.filter((annonce) => {
    const matchSearch =
      annonce.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      annonce.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategorie =
      selectedCategorie === "Toutes" || annonce.categorie === selectedCategorie;
    return matchSearch && matchCategorie;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const maintenant = new Date();
    const diffJours = Math.floor(
      (maintenant.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffJours === 0) return "Aujourd'hui";
    if (diffJours === 1) return "Hier";
    return `Il y a ${diffJours} jours`;
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case "active":
        return "bg-green-100 text-green-800";
      case "reservee":
        return "bg-orange-100 text-orange-800";
      case "vendue":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatutText = (statut: string) => {
    switch (statut) {
      case "active":
        return "Disponible";
      case "reservee":
        return "Réservée";
      case "vendue":
        return "Vendue";
      default:
        return statut;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des annonces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              aria-label="Retour"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
                Petites Annonces
              </h1>
              <p className="text-sm text-muted-foreground">Entre collègues SP</p>
            </div>
          </div>
          <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Publier</span>
          </button>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Rechercher une annonce..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/60"
            />
          </div>

          {/* Filtres */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCategorie}
              onChange={(e) => setSelectedCategorie(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/60"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 border border-border rounded-lg hover:bg-accent"
              aria-pressed={showFilters}
              aria-label="Afficher les filtres"
            >
              <Filter className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {annoncesFiltrees.length} annonce
            {annoncesFiltrees.length > 1 ? "s" : ""} trouvée
            {annoncesFiltrees.length > 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Confiance entre collègues</span>
          </span>
        </div>
      </div>

      {/* Liste des annonces */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {annoncesFiltrees.map((annonce) => (
          <div
            key={annonce.id}
            className="bg-card rounded-xl overflow-hidden border border-border hover:shadow-lg transition-all duration-200 group"
          >
            <div className="relative h-48 overflow-hidden">
              <Image
                src={annonce.photos?.[0] ?? "/images/placeholder.png"}
                alt={annonce.titre ?? "Annonce"}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute top-3 left-3">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatutColor(
                    annonce.statut
                  )}`}
                >
                  {getStatutText(annonce.statut)}
                </span>
              </div>
              <div className="absolute top-3 right-3">
                <button className="p-1 bg-background/80 rounded-full hover:bg-background transition-colors">
                  <Heart className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="absolute bottom-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-sm font-semibold">
                {new Intl.NumberFormat("fr-FR", {
                  style: "currency",
                  currency: "EUR",
                  maximumFractionDigits: 0,
                }).format(annonce.prix)}
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-foreground line-clamp-1">
                  {annonce.titre}
                </h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  {annonce.categorie}
                </span>
              </div>

              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {annonce.description}
              </p>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-3 h-3 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">
                      {annonce.vendeur?.nom ?? "Anonyme"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {annonce.vendeur?.equipe ?? ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-current" />
                  <span className="text-xs text-muted-foreground">
                    {annonce.vendeur?.note ?? "-"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                {annonce.localisation && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{annonce.localisation}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(annonce.date_creation)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/60">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{annonce.vues} vues</span>
                  <span>{annonce.favoris} ♥</span>
                </div>
                <div className="flex items-center gap-2">
                  {annonce.contact?.telephone && (
                    <button className="p-1 hover:bg-accent rounded" aria-label="Téléphoner">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                    </button>
                  )}
                  <button className="p-1 hover:bg-accent rounded" aria-label="Envoyer un mail">
                    <Mail className="w-3 h-3 text-muted-foreground" />
                  </button>
                  <button className="p-1 hover:bg-accent rounded" aria-label="Envoyer un message">
                    <MessageCircle className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {annoncesFiltrees.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            Aucune annonce trouvée
          </h3>
          <p className="text-muted-foreground mb-4">
            Essayez de modifier vos critères de recherche
          </p>
          <button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg">
            Publier la première annonce
          </button>
        </div>
      )}

      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center justify-center gap-2 text-green-800">
          <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center">
            <Star className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-sm font-medium">
            Transactions sécurisées entre collègues sapeurs-pompiers
          </p>
        </div>
      </div>
    </div>
  );
}
