"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Baby,
  Calendar,
  Check,
  Clock,
  Heart,
  Info,
  MapPin,
  Package,
  User,
  Users,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
// Pas de composant Textarea dans ce projet, on utilise l'élément natif
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Evenement {
  id: string;
  titre: string;
  description: string;
  date: string;
  heure: string;
  lieu: string;
  organisateur: string;
  participants: string[];
  max_participants?: number;
  type: "assemblee" | "soiree" | "sortie" | "formation";
  statut: "a_venir" | "en_cours" | "termine";
}

interface Naissance {
  id: string;
  nom_parent: string;
  prenom_bebe: string;
  date_naissance: string;
  poids?: string;
  message?: string;
  photo_url?: string;
  equipe: string;
}

interface PretMateriel {
  id: string;
  nom_materiel: string;
  description: string;
  disponible: boolean;
  emprunte_par?: string;
  date_emprunt?: string;
  date_retour_prevue?: string;
  caution: number;
  etat: "excellent" | "bon" | "correct" | "a_reviser";
  numero_inventaire: string;
}

interface InfoPratique {
  id: string;
  titre: string;
  contenu: string;
  auteur: string;
  date_creation: string;
  priorite: "normale" | "importante" | "urgente";
  valide_jusqu?: string;
}

// Données mock
const mockEvenements: Evenement[] = [
  {
    id: "1",
    titre: "Assemblée Générale 2024",
    description:
      "Bilan de l'année et projets 2025. Présence obligatoire pour tous les membres.",
    date: "2024-02-15",
    heure: "19:00",
    lieu: "Salle polyvalente - Caserne Centrale",
    organisateur: "Bureau de l'amicale",
    participants: ["user1", "user2", "user3"],
    type: "assemblee",
    statut: "a_venir",
  },
  {
    id: "2",
    titre: "Soirée galette des rois",
    description:
      "Moment convivial entre collègues autour de la traditionnelle galette.",
    date: "2024-01-20",
    heure: "18:30",
    lieu: "Mess - Caserne Nord",
    organisateur: "Équipe Alpha",
    participants: ["user1", "user4", "user5"],
    max_participants: 25,
    type: "soiree",
    statut: "a_venir",
  },
];

const mockNaissances: Naissance[] = [
  {
    id: "1",
    nom_parent: "Marc et Sophie D.",
    prenom_bebe: "Emma",
    date_naissance: "2024-01-10",
    poids: "3,2 kg",
    message:
      "Nous sommes heureux de vous annoncer la naissance de notre petite Emma !",
    equipe: "Équipe Alpha",
  },
  {
    id: "2",
    nom_parent: "Thomas L.",
    prenom_bebe: "Lucas",
    date_naissance: "2024-01-05",
    poids: "3,8 kg",
    equipe: "Équipe Charlie",
  },
];

const mockMaterielPret: PretMateriel[] = [
  {
    id: "1",
    nom_materiel: "Tente 4 places",
    description: "Tente de camping familiale, parfaite pour les sorties weekend",
    disponible: true,
    caution: 50,
    etat: "bon",
    numero_inventaire: "MAT-001",
  },
  {
    id: "2",
    nom_materiel: "Barbecue portable",
    description: "Barbecue à gaz portable avec bouteille",
    disponible: false,
    emprunte_par: "Julie M.",
    date_emprunt: "2024-01-12",
    date_retour_prevue: "2024-01-19",
    caution: 30,
    etat: "excellent",
    numero_inventaire: "MAT-002",
  },
  {
    id: "3",
    nom_materiel: "Sono portable",
    description: "Système audio portable avec micros sans fil",
    disponible: true,
    caution: 100,
    etat: "bon",
    numero_inventaire: "MAT-003",
  },
];

const mockInfosPratiques: InfoPratique[] = [
  {
    id: "1",
    titre: "Nouveau système de badges",
    contenu:
      "Les nouveaux badges d'accès seront distribués la semaine prochaine. Pensez à ramener vos anciens badges.",
    auteur: "Administration",
    date_creation: "2024-01-14",
    priorite: "importante",
  },
  {
    id: "2",
    titre: "Travaux parking",
    contenu:
      "Le parking principal sera en travaux du 20 au 25 janvier. Utilisez le parking secondaire.",
    auteur: "Services techniques",
    date_creation: "2024-01-13",
    priorite: "normale",
    valide_jusqu: "2024-01-25",
  },
];

export default function AnnoncesEvenementsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("evenements");
  const [showPretModal, setShowPretModal] = useState<string | null>(null);

  // États pour les données
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [naissances, setNaissances] = useState<Naissance[]>([]);
  const [materielPret, setMaterielPret] = useState<PretMateriel[]>([]);
  const [infosPratiques, setInfosPratiques] = useState<InfoPratique[]>([]);

  useEffect(() => {
    // Simulation chargement
    const t = setTimeout(() => {
      setEvenements(mockEvenements);
      setNaissances(mockNaissances);
      setMaterielPret(mockMaterielPret);
      setInfosPratiques(mockInfosPratiques);
      setLoading(false);
    }, 500);
    return () => clearTimeout(t);
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateCourt = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  };

  const getTypeEvenementColor = (type: string) => {
    switch (type) {
      case "assemblee":
        return "bg-red-100 text-red-800";
      case "soiree":
        return "bg-purple-100 text-purple-800";
      case "sortie":
        return "bg-green-100 text-green-800";
      case "formation":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeEvenementLabel = (type: string) => {
    switch (type) {
      case "assemblee":
        return "Assemblée";
      case "soiree":
        return "Soirée";
      case "sortie":
        return "Sortie";
      case "formation":
        return "Formation";
      default:
        return type;
    }
  };

  const getPrioriteColor = (priorite: string) => {
    switch (priorite) {
      case "urgente":
        return "bg-red-100 text-red-800 border-red-200";
      case "importante":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "normale":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getEtatMaterielColor = (etat: string) => {
    switch (etat) {
      case "excellent":
        return "bg-green-100 text-green-800";
      case "bon":
        return "bg-blue-100 text-blue-800";
      case "correct":
        return "bg-yellow-100 text-yellow-800";
      case "a_reviser":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleParticipation = (evenementId: string) => {
    setEvenements((prev) =>
      prev.map((event) =>
        event.id === evenementId
          ? {
              ...event,
              participants: event.participants.includes("current_user")
                ? event.participants.filter((p) => p !== "current_user")
                : [...event.participants, "current_user"],
            }
          : event,
      ),
    );
  };

  const handleDemanderPret = (materielId: string) => {
    console.log("Demande de prêt pour:", materielId);
    setShowPretModal(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-orange-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la vie associative...</p>
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
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Annonces & Événements</h1>
                <p className="text-sm text-gray-600">Vie associative & organisation</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="evenements" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Événements</span>
            </TabsTrigger>
            <TabsTrigger value="naissances" className="flex items-center space-x-2">
              <Baby className="w-4 h-4" />
              <span className="hidden sm:inline">Naissances</span>
            </TabsTrigger>
            <TabsTrigger value="materiel" className="flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Matériel</span>
            </TabsTrigger>
            <TabsTrigger value="infos" className="flex items-center space-x-2">
              <Info className="w-4 h-4" />
              <span className="hidden sm:inline">Infos</span>
            </TabsTrigger>
          </TabsList>

          {/* Onglet Événements */}
          <TabsContent value="evenements" className="space-y-4">
            {evenements.map((event) => (
              <Card key={event.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <CardTitle className="text-lg">{event.titre}</CardTitle>
                        <Badge className={getTypeEvenementColor(event.type)}>
                          {getTypeEvenementLabel(event.type)}
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm">{event.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>
                        {formatDate(event.date)} à {event.heure}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span>{event.lieu}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span>Organisé par {event.organisateur}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-500" />
                      <span>
                        {event.participants.length} participant
                        {event.participants.length > 1 ? "s" : ""}
                        {event.max_participants && ` / ${event.max_participants}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="text-sm text-gray-500">
                      {event.participants.includes("current_user") ? "Vous participez" : ""}
                    </div>
                    <Button
                      onClick={() => handleParticipation(event.id)}
                      variant={event.participants.includes("current_user") ? "outline" : "default"}
                      size="sm"
                    >
                      {event.participants.includes("current_user") ? (
                        <>
                          <X className="w-4 h-4 mr-1" />
                          Annuler
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Participer
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Onglet Naissances */}
          <TabsContent value="naissances" className="space-y-4">
            {naissances.map((naissance) => (
              <Card key={naissance.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Baby className="w-6 h-6 text-pink-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold">Naissance de {naissance.prenom_bebe}</h3>
                        <Heart className="w-4 h-4 text-pink-500" />
                      </div>
                      <p className="text-gray-600 mb-2">
                        {naissance.nom_parent} - {naissance.equipe}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <span>{formatDate(naissance.date_naissance)}</span>
                        {naissance.poids && <span>{naissance.poids}</span>}
                      </div>
                      {naissance.message && (
                        <p className="text-gray-700 italic bg-pink-50 p-3 rounded-lg">&quot;{naissance.message}&quot;</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Onglet Matériel */}
          <TabsContent value="materiel" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {materielPret.map((materiel) => (
                <Card key={materiel.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{materiel.nom_materiel}</h3>
                        <p className="text-sm text-gray-600 mt-1">{materiel.description}</p>
                      </div>
                      <Badge className={getEtatMaterielColor(materiel.etat)}>{materiel.etat}</Badge>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">N° inventaire:</span>
                        <span className="font-medium">{materiel.numero_inventaire}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Caution:</span>
                        <span className="font-medium">{materiel.caution}€</span>
                      </div>

                      {!materiel.disponible && (
                        <div className="bg-orange-50 border border-orange-200 rounded p-2 mt-3">
                          <div className="flex justify-between text-xs">
                            <span>
                              Emprunté par: <strong>{materiel.emprunte_par}</strong>
                            </span>
                          </div>
                          <div className="flex justify-between text-xs mt-1">
                            <span>
                              Retour prévu: {materiel.date_retour_prevue && formatDateCourt(materiel.date_retour_prevue)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <Button
                        onClick={() => setShowPretModal(materiel.id)}
                        disabled={!materiel.disponible}
                        variant={materiel.disponible ? "default" : "outline"}
                        size="sm"
                        className="w-full"
                      >
                        {materiel.disponible ? (
                          <>
                            <Package className="w-4 h-4 mr-1" />
                            Emprunter
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 mr-1" />
                            Indisponible
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Onglet Infos Pratiques */}
          <TabsContent value="infos" className="space-y-4">
            {infosPratiques.map((info) => (
              <Card key={info.id} className={`border-l-4 ${getPrioriteColor(info.priorite)}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{info.titre}</h3>
                    <Badge variant="outline" className={getPrioriteColor(info.priorite)}>
                      {info.priorite}
                    </Badge>
                  </div>
                  <p className="text-gray-700 mb-3">{info.contenu}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Par {info.auteur} • {formatDateCourt(info.date_creation)}
                    </span>
                    {info.valide_jusqu && (
                      <span>Valide jusqu&apos;au {formatDateCourt(info.valide_jusqu)}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal Demande de Prêt */}
      {showPretModal && (
        <Dialog open={!!showPretModal} onOpenChange={() => setShowPretModal(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Demande de prêt</DialogTitle>
              <DialogDescription>
                Remplissez ce bon de prêt pour emprunter le matériel
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Matériel:</strong> {materielPret.find((m) => m.id === showPretModal)?.nom_materiel}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Caution:</strong> {materielPret.find((m) => m.id === showPretModal)?.caution}€
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Date de retour prévue</label>
                  <Input type="date" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Utilisation prévue</label>
                  <textarea
                    placeholder="Décrivez brièvement l'utilisation..."
                    rows={3}
                    className="w-full p-2 border border-input rounded-md bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Téléphone de contact</label>
                  <Input placeholder="06.XX.XX.XX.XX" />
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-orange-800">
                    En cas de casse ou de perte, la caution sera retenue. Le matériel doit être rendu dans l&apos;état où il a été emprunté.
                  </p>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowPretModal(null)} className="flex-1">
                  Annuler
                </Button>
                <Button onClick={() => handleDemanderPret(showPretModal)} className="flex-1">
                  Confirmer la demande
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
