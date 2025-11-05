/**
 * Page de gestion des offres partenaires
 * Liste toutes les offres avec filtres et actions
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getOffersAction, deleteOfferAction } from '@/app/actions/offers';
import { OfferWithPartner } from '@/lib/types/avantages.types';
import { Plus, Search, Edit, Trash2, MoreVertical, QrCode, Tag, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function OffresListPage() {
  const [offers, setOffers] = useState<OfferWithPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    setLoading(true);
    const result = await getOffersAction();
    if (result.success) {
      setOffers(result.data as OfferWithPartner[]);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string, titre: string) => {
    if (!confirm(`Voulez-vous vraiment désactiver l'offre "${titre}" ?`)) {
      return;
    }

    const result = await deleteOfferAction(id);
    if (result.success) {
      toast.success('Offre désactivée avec succès');
      loadOffers();
    } else {
      toast.error(result.error || 'Erreur lors de la désactivation');
    }
  };

  const filteredOffers = offers.filter((offer) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      offer.titre.toLowerCase().includes(searchLower) ||
      offer.partner.nom.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: offers.length,
    actives: offers.filter((o) => o.actif).length,
    qrCode: offers.filter((o) => o.type_avantage === 'qr_code').length,
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gestion des Offres</h1>
            <p className="text-muted-foreground">
              Gérez toutes les offres partenaires
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/admin/avantages">
              <Button variant="outline" size="lg">
                Retour aux partenaires
              </Button>
            </Link>
            <Link href="/dashboard/admin/avantages/offres/nouvelle">
              <Button size="lg">
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle offre
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                Total offres
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                Offres actives
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.actives}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                QR Codes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.qrCode}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher une offre ou un partenaire..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Chargement...
            </div>
          ) : filteredOffers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {search ? 'Aucune offre trouvée' : 'Aucune offre pour le moment'}
              </p>
              {!search && (
                <Link href="/dashboard/admin/avantages/offres/nouvelle">
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer la première offre
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Partenaire</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Réduction</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOffers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{offer.titre}</p>
                        {offer.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {offer.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{offer.partner.nom}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        {offer.type_avantage === 'qr_code' ? (
                          <>
                            <QrCode className="h-3 w-3" />
                            QR Code
                          </>
                        ) : (
                          <>
                            <Tag className="h-3 w-3" />
                            Code Promo
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {offer.reduction_pourcentage && `-${offer.reduction_pourcentage}%`}
                      {offer.reduction_montant && `-${offer.reduction_montant}€`}
                      {!offer.reduction_pourcentage && !offer.reduction_montant && '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={offer.actif ? 'default' : 'secondary'}>
                        {offer.actif ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/avantages/${offer.id}`}>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir (public)
                            </DropdownMenuItem>
                          </Link>
                          <Link href={`/dashboard/admin/avantages/offres/${offer.id}/modifier`}>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem
                            onClick={() => handleDelete(offer.id, offer.titre)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Désactiver
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
