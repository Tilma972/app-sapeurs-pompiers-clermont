'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { enregistrerDepotDirectAction } from '@/app/actions/depot-fonds'
import { createClient } from '@/lib/supabase/client'

interface UserWithFonds {
  id: string
  full_name: string
  montant_non_depose: number
}

export function EnregistrerDepotDirectButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [users, setUsers] = useState<UserWithFonds[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)

  const [selectedUserId, setSelectedUserId] = useState('')
  const [montantRecu, setMontantRecu] = useState('')
  const [notes, setNotes] = useState('')

  // Charger la liste des utilisateurs avec des fonds non déposés
  useEffect(() => {
    if (!open) return

    async function loadUsersWithFonds() {
      setIsLoadingUsers(true)
      try {
        const supabase = createClient()

        // Récupérer tous les utilisateurs avec des tournées complétées
        const { data: tourneesData } = await supabase
          .from('tournees')
          .select('user_id, montant_collecte')
          .eq('statut', 'completed')

        if (!tourneesData) {
          setUsers([])
          return
        }

        // Grouper par user_id et calculer le total collecté
        const totauxParUser = tourneesData.reduce((acc, t) => {
          if (!acc[t.user_id]) {
            acc[t.user_id] = 0
          }
          acc[t.user_id] += t.montant_collecte || 0
          return acc
        }, {} as Record<string, number>)

        // Récupérer les dépôts déjà validés
        const { data: depotsData } = await supabase
          .from('demandes_depot_fonds')
          .select('user_id, montant_recu')
          .eq('statut', 'valide')

        const depotsParUser = (depotsData || []).reduce((acc, d) => {
          if (!acc[d.user_id]) {
            acc[d.user_id] = 0
          }
          acc[d.user_id] += d.montant_recu || 0
          return acc
        }, {} as Record<string, number>)

        // Calculer montant non déposé et récupérer les profils
        const userIds = Object.keys(totauxParUser)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds)

        const usersWithFonds = (profiles || [])
          .map((p) => ({
            id: p.id,
            full_name: p.full_name || 'Utilisateur inconnu',
            montant_non_depose: (totauxParUser[p.id] || 0) - (depotsParUser[p.id] || 0),
          }))
          .filter((u) => u.montant_non_depose > 0)
          .sort((a, b) => a.full_name.localeCompare(b.full_name))

        setUsers(usersWithFonds)
      } catch (err) {
        console.error('Erreur chargement utilisateurs:', err)
        toast.error('Erreur lors du chargement des utilisateurs')
      } finally {
        setIsLoadingUsers(false)
      }
    }

    loadUsersWithFonds()
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedUserId) {
      toast.error('Veuillez sélectionner un utilisateur')
      return
    }

    const montantRecuNum = Number(montantRecu)
    if (isNaN(montantRecuNum) || montantRecuNum <= 0) {
      toast.error('Montant invalide')
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading('Enregistrement du dépôt...')

    try {
      const result = await enregistrerDepotDirectAction({
        user_id: selectedUserId,
        montant_recu: montantRecuNum,
        notes_tresorier: notes.trim() || undefined,
      })

      if (!result.ok) {
        toast.error(result.error || 'Erreur lors de l\'enregistrement', { id: toastId })
        return
      }

      toast.success('✅ Dépôt enregistré avec succès', { id: toastId, duration: 5000 })

      // Réinitialiser et fermer
      setSelectedUserId('')
      setMontantRecu('')
      setNotes('')
      setOpen(false)
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur'
      toast.error(message, { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMontantChange = (value: string) => {
    let val = value.replace(',', '.')
    val = val.replace(/[^0-9.]/g, '')
    const parts = val.split('.')
    if (parts.length > 2) {
      val = parts[0] + '.' + parts.slice(1).join('')
    }
    setMontantRecu(val)
  }

  const selectedUser = users.find((u) => u.id === selectedUserId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Enregistrer un dépôt direct
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Enregistrer un dépôt direct</DialogTitle>
          <DialogDescription>
            Pour les utilisateurs qui viennent en permanence sans demande préalable
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sélection utilisateur */}
          <div className="space-y-2">
            <Label htmlFor="user">Utilisateur *</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={isSubmitting || isLoadingUsers}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingUsers ? "Chargement..." : "Sélectionner un utilisateur"} />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name} ({user.montant_non_depose.toFixed(2)}€ à déposer)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {users.length === 0 && !isLoadingUsers && (
              <p className="text-sm text-muted-foreground">
                Aucun utilisateur avec des fonds à déposer
              </p>
            )}
          </div>

          {/* Montant reçu */}
          {selectedUser && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm">
                <span className="text-muted-foreground">Montant non déposé :</span>{' '}
                <span className="font-bold">{selectedUser.montant_non_depose.toFixed(2)}€</span>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="montant_recu">Montant reçu (€) *</Label>
            <Input
              id="montant_recu"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={montantRecu}
              onChange={(e) => handleMontantChange(e.target.value)}
              required
              disabled={isSubmitting || !selectedUserId}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes_tresorier">Notes (optionnel)</Label>
            <Textarea
              id="notes_tresorier"
              placeholder="Commentaires..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !selectedUserId || !montantRecu}
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer le dépôt'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
