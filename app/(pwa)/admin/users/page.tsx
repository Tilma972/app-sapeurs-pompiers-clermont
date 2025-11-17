'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import { Plus, Shield, RefreshCcw, CheckCircle2, AlertCircle, Clock, Copy } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { AdminPageHeader } from '@/components/admin/admin-page-header'
import { AdminCard, AdminListCard } from '@/components/admin/admin-card'
import { AdminActionSheet } from '@/components/admin/admin-action-sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

type UserRow = {
  id: string
  full_name: string | null
  display_name: string | null
  first_name: string | null
  last_name: string | null
  identity_verified: boolean | null
  verification_date: string | null
  verification_method: string | null
  role: string | null
  team_id: string | null
  team_name: string | null
  created_at: string | null
}

type Team = { id: string; nom: string }

function UserCard({ user, teams, onUpdate, onResetPassword }: {
  user: UserRow
  teams: Team[]
  onUpdate: (id: string, patch: Partial<{ role: string; team_id: string | null }>) => void
  onResetPassword: (id: string) => void
}) {
  const hasIdentity = user.first_name && user.last_name
  const isVerified = user.identity_verified

  return (
    <AdminListCard className="flex-col items-start gap-3">
      {/* En-tête */}
      <div className="flex items-start justify-between w-full gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{user.display_name || user.full_name || '—'}</p>
          {hasIdentity && (
            <p className="text-xs text-muted-foreground">
              {user.first_name} {user.last_name}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Créé le {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '—'}
          </p>
        </div>
        <div className="flex flex-col gap-1 items-end">
          {/* Badge identité */}
          {hasIdentity ? (
            <Badge variant="outline" className="text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
              Identité
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1 text-orange-500" />
              Identité manquante
            </Badge>
          )}
          {/* Badge statut */}
          {isVerified ? (
            <Badge variant="default" className="text-xs bg-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Vérifiée
            </Badge>
          ) : hasIdentity ? (
            <Badge variant="secondary" className="text-xs">
              <Clock className="h-3 w-3 mr-1" />
              En attente
            </Badge>
          ) : null}
        </div>
      </div>

      {/* Rôle et équipe */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Rôle</Label>
          <Select
            value={user.role || 'membre'}
            onValueChange={(value) => onUpdate(user.id, { role: value })}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="membre">Membre</SelectItem>
              <SelectItem value="chef_equipe">Chef d&apos;équipe</SelectItem>
              <SelectItem value="tresorier">Trésorier</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Équipe</Label>
          <Select
            value={user.team_id || 'none'}
            onValueChange={(value) => onUpdate(user.id, { team_id: value === 'none' ? null : value })}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucune</SelectItem>
              {teams.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 w-full justify-end">
        {hasIdentity && !isVerified && (
          <Button
            variant="default"
            size="sm"
            onClick={async () => {
              toast.error('Fonction de vérification non disponible')
            }}
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Vérifier
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => onResetPassword(user.id)}>
          <Copy className="h-3 w-3 mr-1" />
          Reset MDP
        </Button>
      </div>
    </AdminListCard>
  )
}

function CreateUserForm({ teams, onSuccess }: { teams: Team[]; onSuccess: () => void }) {
  const [creating, setCreating] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'membre',
    team_id: ''
  })

  async function onCreate() {
    if (!newUser.email || !newUser.password || !newUser.full_name) {
      toast.error('Champs requis manquants')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          full_name: newUser.full_name,
          role: newUser.role,
          team_id: newUser.team_id || null,
        })
      })
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'Erreur' }))
        throw new Error(error)
      }
      toast.success('Utilisateur créé')
      setNewUser({ email: '', password: '', full_name: '', role: 'membre', team_id: '' })
      onSuccess()
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <Label>Nom complet *</Label>
          <Input
            placeholder="Jean Dupont"
            value={newUser.full_name}
            onChange={e => setNewUser(s => ({ ...s, full_name: e.target.value }))}
          />
        </div>
        <div>
          <Label>Email *</Label>
          <Input
            placeholder="jean.dupont@example.com"
            type="email"
            value={newUser.email}
            onChange={e => setNewUser(s => ({ ...s, email: e.target.value }))}
          />
        </div>
        <div>
          <Label>Mot de passe temporaire *</Label>
          <Input
            placeholder="••••••••"
            type="password"
            value={newUser.password}
            onChange={e => setNewUser(s => ({ ...s, password: e.target.value }))}
          />
        </div>
        <div>
          <Label>Rôle</Label>
          <Select
            value={newUser.role}
            onValueChange={(value) => setNewUser(s => ({ ...s, role: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="membre">Membre</SelectItem>
              <SelectItem value="chef_equipe">Chef d&apos;équipe</SelectItem>
              <SelectItem value="tresorier">Trésorier</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Équipe</Label>
          <Select
            value={newUser.team_id || 'none'}
            onValueChange={(value) => setNewUser(s => ({ ...s, team_id: value === 'none' ? '' : value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucune équipe</SelectItem>
              {teams.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.nom}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={onCreate} disabled={creating} className="w-full">
        {creating ? 'Création...' : 'Créer l\'utilisateur'}
      </Button>
    </div>
  )
}

export default function AdminUsersPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserRow[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [search, setSearch] = useState('')
  const [createSheetOpen, setCreateSheetOpen] = useState(false)

  async function load() {
    setLoading(true)
    try {
      // Users
      const res = await fetch('/api/admin/users/list', { cache: 'no-store' })
      if (!res.ok) {
        throw new Error(res.status === 403 ? 'Accès refusé' : 'Erreur chargement utilisateurs')
      }
      const json = await res.json()
      setUsers(json.users || [])

      // Teams
      const { data: t } = await supabase
        .from('equipes')
        .select('id, nom')
        .eq('actif', true)
        .order('ordre_affichage')
      setTeams(t || [])
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function updateUser(id: string, patch: Partial<{ role: string; team_id: string | null }>) {
    const prev = users
    setUsers(u => u.map(x => x.id === id ? ({ ...x, ...patch } as UserRow) : x))
    const res = await fetch('/api/admin/users/update', { method: 'POST', body: JSON.stringify({ id, ...patch }) })
    if (!res.ok) {
      setUsers(prev)
      const { error } = await res.json().catch(() => ({ error: 'Erreur' }))
      toast.error(error || 'Mise à jour impossible')
    } else {
      toast.success('Mis à jour')
      // Refresh names if team changed
      if (patch.team_id !== undefined) load()
    }
  }

  async function onResetPassword(id: string) {
    const res = await fetch('/api/admin/users/reset-password', { method: 'POST', body: JSON.stringify({ id }) })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast.error(json.error || 'Échec génération lien')
      return
    }
    const link: string | undefined = json.action_link
    if (link) {
      await navigator.clipboard.writeText(link)
      toast.success('Lien de réinitialisation copié')
    } else {
      toast.success('Lien généré')
    }
  }

  const filtered = useMemo(() => {
    const s = search.toLowerCase()
    return users.filter(u =>
      (u.full_name || '').toLowerCase().includes(s) || (u.team_name || '').toLowerCase().includes(s)
    )
  }, [users, search])

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Utilisateurs"
        description="Gestion des rôles et des équipes"
        icon={<Shield className="h-6 w-6" />}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
            <AdminActionSheet
              trigger={
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Nouveau</span>
                </Button>
              }
              title="Créer un nouvel utilisateur"
              description="Remplissez les informations pour créer un compte utilisateur"
              open={createSheetOpen}
              onOpenChange={setCreateSheetOpen}
            >
              <CreateUserForm
                teams={teams}
                onSuccess={() => {
                  load()
                  setCreateSheetOpen(false)
                }}
              />
            </AdminActionSheet>
          </div>
        }
      />

      {/* Recherche */}
      <AdminCard>
        <Input
          placeholder="Rechercher un utilisateur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </AdminCard>

      {/* Liste des utilisateurs */}
      <AdminCard title={`Utilisateurs (${filtered.length})`}>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun utilisateur trouvé
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(user => (
              <UserCard
                key={user.id}
                user={user}
                teams={teams}
                onUpdate={updateUser}
                onResetPassword={onResetPassword}
              />
            ))}
          </div>
        )}
      </AdminCard>
    </div>
  )
}
