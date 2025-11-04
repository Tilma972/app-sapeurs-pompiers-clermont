import { PwaContainer } from "@/components/layouts/pwa/pwa-container";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Gift, MapPin, Phone, Globe, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PartenairesPage() {
  // Données mock (à remplacer par une vraie DB plus tard)
  const partenaires = [
    {
      id: 1,
      nom: "Restaurant Le Sapeur",
      categorie: "Restauration",
      offre: "-10% sur l'addition",
      ville: "Clermont-Ferrand",
      telephone: "04.73.XX.XX.XX",
      site: "https://example.com",
    },
    {
      id: 2,
      nom: "Garage Auto Plus",
      categorie: "Automobile",
      offre: "-15% sur l'entretien",
      ville: "Clermont-Ferrand",
      telephone: "04.73.XX.XX.XX",
      site: null,
    },
    {
      id: 3,
      nom: "Fitness Center",
      categorie: "Sport & Bien-être",
      offre: "1 mois offert à l'inscription",
      ville: "Clermont-Ferrand",
      telephone: "04.73.XX.XX.XX",
      site: "https://example.com",
    },
  ];

  const categories = [
    { value: "all", label: "Toutes", count: partenaires.length },
    { value: "restauration", label: "Restauration", count: 1 },
    { value: "automobile", label: "Automobile", count: 1 },
    { value: "sport", label: "Sport & Bien-être", count: 1 },
  ];

  return (
    <PwaContainer>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            Partenaires & Avantages
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Profitez d&apos;offres exclusives réservées aux membres
          </p>
        </div>

        {/* Filtres */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {categories.map((cat) => (
            <Button
              key={cat.value}
              variant={cat.value === "all" ? "default" : "outline"}
              size="sm"
              className="whitespace-nowrap"
            >
              {cat.label}
              <Badge variant="secondary" className="ml-2">
                {cat.count}
              </Badge>
            </Button>
          ))}
        </div>

        {/* Liste des partenaires */}
        <div className="grid gap-4 sm:grid-cols-2">
          {partenaires.map((partenaire) => (
            <Card key={partenaire.id} className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-lg">{partenaire.nom}</h3>
                <Badge variant="secondary" className="mt-1">
                  {partenaire.categorie}
                </Badge>
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                <div className="flex items-center gap-2 text-primary font-medium">
                  <Gift className="h-4 w-4" />
                  <span>{partenaire.offre}</span>
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{partenaire.ville}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{partenaire.telephone}</span>
                </div>
                {partenaire.site && (
                  <a
                    href={partenaire.site}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    <span>Site web</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              <Button variant="outline" className="w-full mt-2">
                Voir les détails
              </Button>
            </Card>
          ))}
        </div>

        {/* Info */}
        <Card className="p-4 bg-muted/50 border-dashed">
          <div className="flex items-start gap-3">
            <Gift className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Vous êtes partenaire ?</p>
              <p>
                Contactez l&apos;amicale pour apparaître dans cette liste et proposer vos avantages exclusifs.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </PwaContainer>
  );
}
