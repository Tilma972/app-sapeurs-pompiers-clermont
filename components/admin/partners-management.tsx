"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import Image from "next/image"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PartnerModal } from "./partner-modal"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import toast from "react-hot-toast"
import { deletePartner } from "@/app/actions/partners/manage-partner"

type Partner = {
  id: number
  name: string
  logo: string
  website?: string
  tier: "platinum" | "gold" | "bronze"
  sector: string
  since: number
}

interface PartnersManagementProps {
  initialPartners: Partner[]
}

export function PartnersManagement({ initialPartners }: PartnersManagementProps) {
  const [partners, setPartners] = useState<Partner[]>(initialPartners)
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [partnerToDelete, setPartnerToDelete] = useState<Partner | null>(null)

  const filteredPartners = partners.filter((partner) =>
    partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.sector.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddPartner = () => {
    setSelectedPartner(null)
    setIsModalOpen(true)
  }

  const handleEditPartner = (partner: Partner) => {
    setSelectedPartner(partner)
    setIsModalOpen(true)
  }

  const handleDeleteClick = (partner: Partner) => {
    setPartnerToDelete(partner)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!partnerToDelete) return

    const result = await deletePartner(partnerToDelete.id)

    if (result.error) {
      toast.error(result.error)
      return
    }

    setPartners(partners.filter((p) => p.id !== partnerToDelete.id))
    toast.success("Partenaire supprimé avec succès")
    setDeleteDialogOpen(false)
    setPartnerToDelete(null)
  }

  const handleSuccess = () => {
    // Recharger les partenaires
    window.location.reload()
  }

  const tierLabels = {
    platinum: "Platine",
    gold: "Or",
    bronze: "Bronze",
  }

  const tierColors = {
    platinum: "bg-slate-200 text-slate-700",
    gold: "bg-yellow-200 text-yellow-700",
    bronze: "bg-orange-200 text-orange-700",
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un partenaire..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleAddPartner} className="gap-2 bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Ajouter un partenaire
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Logo</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Secteur</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Depuis</TableHead>
              <TableHead>Site web</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPartners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Aucun partenaire trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredPartners.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell>
                    <div className="relative w-16 h-12 bg-muted rounded overflow-hidden">
                      <Image
                        src={partner.logo}
                        alt={partner.name}
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{partner.name}</TableCell>
                  <TableCell>{partner.sector}</TableCell>
                  <TableCell>
                    <Badge className={tierColors[partner.tier]}>
                      {tierLabels[partner.tier]}
                    </Badge>
                  </TableCell>
                  <TableCell>{partner.since}</TableCell>
                  <TableCell>
                    {partner.website ? (
                      <a
                        href={partner.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm"
                      >
                        Visiter
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPartner(partner)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(partner)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Total : {filteredPartners.length} partenaire{filteredPartners.length !== 1 ? "s" : ""}
      </div>

      {/* Modal */}
      <PartnerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        partner={selectedPartner}
        onSuccess={handleSuccess}
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement le partenaire{" "}
              <strong>{partnerToDelete?.name}</strong>. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
