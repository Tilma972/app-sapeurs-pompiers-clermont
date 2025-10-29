'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import { Plus, Shield, RefreshCcw } from 'lucide-react'

type UserRow = {
  id: string
  full_name: string | null
  role: string | null
  team_id: string | null
  team_name: string | null
  created_at: string | null
}

type Team = { id: string; nom: string }

export default function AdminUsersPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserRow[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newUser, setNewUser] = useState<{ email: string; password: string; full_name: string; role: string; team_id: string }>(
    { email: '', password: '', full_name: '', role: 'membre', team_id: '' }
  )

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

      // Teams (anon client)
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
      setShowCreate(false)
      setNewUser({ email: '', password: '', full_name: '', role: 'membre', team_id: '' })
      load()
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setCreating(false)
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
      <div className="bg-card rounded-lg p-6 border">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Utilisateurs
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Gestion des rôles et des équipes</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Liste des utilisateurs</CardTitle>
          <div className="flex items-center gap-2">
            <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9 w-48" />
            <Button variant="outline" size="sm" onClick={load} disabled={loading}>
              <RefreshCcw className="h-4 w-4 mr-2" /> Actualiser
            </Button>
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-2" /> Nouvel utilisateur
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Équipe</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.full_name || '—'}</TableCell>
                  <TableCell>
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={u.role || 'membre'}
                      onChange={(e) => updateUser(u.id, { role: e.target.value })}
                    >
                      <option value="membre">Membre</option>
                      <option value="chef_equipe">Chef d&apos;équipe</option>
                      <option value="tresorier">Trésorier</option>
                      <option value="admin">Admin</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    <select
                      className="border rounded px-2 py-1 text-sm"
                      value={u.team_id || ''}
                      onChange={(e) => updateUser(u.id, { team_id: e.target.value || null })}
                    >
                      <option value="">Aucune</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>{t.nom}</option>
                      ))}
                    </select>
                  </TableCell>
                  <TableCell>{u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => onResetPassword(u.id)}>Reset MDP</Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">Aucun utilisateur</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create user modal - simple inline panel */}
      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Créer un nouvel utilisateur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input placeholder="Nom complet" value={newUser.full_name} onChange={e => setNewUser(s => ({ ...s, full_name: e.target.value }))} />
              <Input placeholder="Email" type="email" value={newUser.email} onChange={e => setNewUser(s => ({ ...s, email: e.target.value }))} />
              <Input placeholder="Mot de passe temporaire" type="password" value={newUser.password} onChange={e => setNewUser(s => ({ ...s, password: e.target.value }))} />
              <select className="border rounded px-2 py-2 text-sm" value={newUser.role} onChange={(e) => setNewUser(s => ({ ...s, role: e.target.value }))}>
                <option value="membre">Membre</option>
                <option value="chef_equipe">Chef d&apos;équipe</option>
                <option value="tresorier">Trésorier</option>
                <option value="admin">Admin</option>
              </select>
              <select className="border rounded px-2 py-2 text-sm" value={newUser.team_id} onChange={(e) => setNewUser(s => ({ ...s, team_id: e.target.value }))}>
                <option value="">Aucune équipe</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
              <Button onClick={onCreate} disabled={creating}>{creating ? 'Création...' : 'Créer'}</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
