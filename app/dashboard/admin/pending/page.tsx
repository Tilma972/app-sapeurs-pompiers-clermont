'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import { Shield, RefreshCcw } from 'lucide-react'

type PendingUser = {
  id: string
  full_name: string | null
  role: string | null
  created_at: string | null
  team_id: string | null
}

export default function AdminPendingUsersPage() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<PendingUser[]>([])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/pending/list', { cache: 'no-store' })
      if (!res.ok) throw new Error(res.status === 403 ? 'Accès refusé' : 'Erreur de chargement')
      const json = await res.json()
      setUsers(json.users || [])
    } catch (e) {
      console.error(e)
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function approve(id: string) {
    const res = await fetch('/api/admin/pending/approve', { method: 'POST', body: JSON.stringify({ id }) })
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Erreur' }))
      toast.error(error)
      return
    }
    toast.success('Utilisateur approuvé')
    setUsers(u => u.filter(x => x.id !== id))
  }

  async function reject(id: string) {
    if (!confirm('Rejeter cet utilisateur ? Cette action est définitive.')) return
    const res = await fetch('/api/admin/pending/reject', { method: 'POST', body: JSON.stringify({ id }) })
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Erreur' }))
      toast.error(error)
      return
    }
    toast.success('Utilisateur rejeté')
    setUsers(u => u.filter(x => x.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg p-6 border">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Inscriptions en attente
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Approuvez ou rejetez les nouveaux comptes</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Demandes ({users.length})</CardTitle>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCcw className="h-4 w-4 mr-2" /> Actualiser
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">Chargement...</div>
          ) : users.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">Aucune demande en attente</div>
          ) : (
            <div className="space-y-3">
              {users.map(u => (
                <div key={u.id} className="p-4 border rounded-lg flex items-center justify-between">
                  <div>
                    <div className="font-medium">{u.full_name || 'Nom non renseigné'}</div>
                    <div className="text-xs text-muted-foreground">Créé le {u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '—'}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => approve(u.id)}>Approuver</Button>
                    <Button size="sm" variant="destructive" onClick={() => reject(u.id)}>Rejeter</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
