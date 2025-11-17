'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminCard, AdminListCard } from '@/components/admin/admin-card';
import { Partner } from '@/lib/types/avantages.types';
import { getPartnersAction, deletePartnerAction } from '@/app/actions/partners';
import { Plus, Search, Edit, Trash2, Eye, Star, Gift, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function PartnerCard({ partner, onDelete }: { partner: Partner; onDelete: (id: string, nom: string) => void }) {
  return (
    <AdminListCard className="flex-col items-start gap-3">
      <div className="flex items-start justify-between w-full gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium truncate">{partner.nom}</p>
            {partner.featured && (
              <Badge variant="secondary" className="text-xs">
                <Star className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground capitalize">{partner.categorie}</p>
          <p className="text-sm text-muted-foreground">{partner.ville || '-'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={partner.actif ? 'default' : 'secondary'}>
            {partner.actif ? 'Actif' : 'Inactif'}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href={`/avantages?partner=${partner.id}`}>
                <DropdownMenuItem>
                  <Eye className="h-4 w-4 mr-2" />
                  Voir les offres
                </DropdownMenuItem>
              </Link>
              <Link href={`/admin/avantages/offres/nouvelle?partnerId=${partner.id}`}>
                <DropdownMenuItem>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une offre
                </DropdownMenuItem>
              </Link>
              <Link href={`/admin/avantages/${partner.id}/modifier`}>
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem
                onClick={() => onDelete(partner.id, partner.nom)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Désactiver
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </AdminListCard>
  );
}

export default function AdminAvantagesPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      setLoading(true);
      const result = await getPartnersAction();
      if (result.success) {
        setPartners(result.data);
      } else {
        toast.error(result.error || 'Erreur lors du chargement');
      }
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, nom: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir désactiver "${nom}" ?`)) {
      return;
    }

    try {
      const result = await deletePartnerAction(id);
      if (result.success) {
        toast.success('Partenaire désactivé');
        loadPartners();
      } else {
        toast.error(result.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const filteredPartners = partners.filter((p) =>
    p.nom.toLowerCase().includes(search.toLowerCase()) ||
    p.ville?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: partners.length,
    active: partners.filter((p) => p.actif).length,
    featured: partners.filter((p) => p.featured).length,
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Gestion des Avantages"
        description="Gérez les partenaires et leurs offres"
        icon={<Gift className="h-6 w-6" />}
        actions={
          <div className="flex gap-2">
            <Link href="/admin/avantages/nouveau">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Nouveau</span>
              </Button>
            </Link>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminCard className="text-center">
          <div className="flex flex-col items-center gap-2">
            <Gift className="h-8 w-8 text-muted-foreground" />
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total partenaires</p>
          </div>
        </AdminCard>
        <AdminCard className="text-center">
          <div className="flex flex-col items-center gap-2">
            <Eye className="h-8 w-8 text-muted-foreground" />
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-sm text-muted-foreground">Actifs</p>
          </div>
        </AdminCard>
        <AdminCard className="text-center">
          <div className="flex flex-col items-center gap-2">
            <Star className="h-8 w-8 text-muted-foreground" />
            <div className="text-2xl font-bold">{stats.featured}</div>
            <p className="text-sm text-muted-foreground">Featured</p>
          </div>
        </AdminCard>
      </div>

      {/* Actions rapides */}
      <AdminCard>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/admin/avantages/offres" className="flex-1">
            <Button variant="outline" className="w-full">
              <Eye className="h-4 w-4 mr-2" />
              Voir toutes les offres
            </Button>
          </Link>
          <Link href="/admin/avantages/offres/nouvelle" className="flex-1">
            <Button variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle offre
            </Button>
          </Link>
        </div>
      </AdminCard>

      {/* Search */}
      <AdminCard>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un partenaire..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </AdminCard>

      {/* Liste */}
      <AdminCard title={`Partenaires (${filteredPartners.length})`}>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        ) : filteredPartners.length === 0 ? (
          <div className="text-center py-8">
            <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {search ? 'Aucun partenaire trouvé' : 'Aucun partenaire pour le moment'}
            </p>
            {!search && (
              <Link href="/admin/avantages/nouveau">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le premier partenaire
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPartners.map((partner) => (
              <PartnerCard
                key={partner.id}
                partner={partner}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </AdminCard>
    </div>
  );
}
