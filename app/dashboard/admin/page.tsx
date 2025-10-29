import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminPage, AdminContent, AdminSection } from "@/components/admin/admin-page"
import { AdminStatCard } from "@/components/admin/admin-stat-card"
import { getGlobalStats } from "@/lib/supabase/tournee"
import Link from "next/link"
import { AlertTriangle, Users, UsersRound, Layers3, Calendar, Euro, Receipt, FileWarning, ChevronRight } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!me || !['admin','tresorier'].includes(me.role)) redirect('/dashboard')

  // Parallel queries
  const [pendingProfiles, activeProfiles, activeTeams, global, chequesPending, receiptsToSend] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', false),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('equipes').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    getGlobalStats(),
    // Approximation: cheques encaissés à déposer non suivi explicitement -> on compte les chèques complétés
    supabase.from('support_transactions').select('*', { count: 'exact', head: true })
      .eq('payment_method', 'cheque').eq('payment_status', 'completed'),
    // Reçus à envoyer: on compte les transactions avec un numéro de reçu mais non envoyées
    supabase.from('support_transactions').select('*', { count: 'exact', head: true })
      .not('receipt_number','is', null).eq('receipt_sent', false),
  ])

  const numberFr = new Intl.NumberFormat('fr-FR')
  const currencyFr = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

  const stats = [
    { title: 'Inscriptions en attente', value: pendingProfiles.count || 0, icon: <Users className="h-4 w-4" /> },
    { title: 'Utilisateurs actifs', value: activeProfiles.count || 0, icon: <UsersRound className="h-4 w-4" /> },
    { title: 'Équipes actives', value: activeTeams.count || 0, icon: <Layers3 className="h-4 w-4" /> },
    { title: 'Calendriers vendus', value: numberFr.format(global.total_calendriers_distribues), icon: <Calendar className="h-4 w-4" /> },
    { title: 'Montant collecté', value: currencyFr.format(global.total_montant_collecte), icon: <Euro className="h-4 w-4" /> },
    { title: 'Chèques à déposer', value: chequesPending.count || 0, icon: <FileWarning className="h-4 w-4" /> },
    { title: 'Tournées actives', value: global.total_tournees_actives, icon: <Layers3 className="h-4 w-4" /> },
    { title: 'Reçus à envoyer', value: receiptsToSend.count || 0, icon: <Receipt className="h-4 w-4" /> },
  ]

  const alerts: Array<{ key: string; label: string; href: string; show: boolean; icon: React.ReactNode }> = [
    { key: 'pending', label: `${pendingProfiles.count || 0} inscription(s) en attente`, href: '/dashboard/admin/pending', show: (pendingProfiles.count || 0) > 0, icon: <AlertTriangle className="h-4 w-4 text-amber-500" /> },
    { key: 'cheques', label: `${chequesPending.count || 0} chèque(s) à traiter`, href: '/dashboard/admin/cheques', show: (chequesPending.count || 0) > 0, icon: <FileWarning className="h-4 w-4 text-amber-500" /> },
    { key: 'receipts', label: `${receiptsToSend.count || 0} reçu(s) à envoyer`, href: '/dashboard/admin/receipts', show: (receiptsToSend.count || 0) > 0, icon: <Receipt className="h-4 w-4 text-amber-500" /> },
  ]

  // Accès rapides désormais rendus dans la sidebar (Administration)

  return (
    <AdminPage>
      <div className="bg-card rounded-lg p-6 border">
        <h1 className="text-2xl font-bold flex items-center gap-2">Vue d&apos;ensemble</h1>
        <p className="text-sm text-muted-foreground mt-1">Pilotage admin en un coup d&apos;œil</p>
      </div>

      <AdminContent>
        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, idx) => (
            <div key={idx} className="relative">
              <div className="absolute right-2 top-2 opacity-60">{s.icon}</div>
              <AdminStatCard title={s.title} value={s.value} />
            </div>
          ))}
        </div>

        {/* Alertes (only shown when there is at least one) */}
        {alerts.some(a => a.show) && (
          <AdminSection title="Alertes" description="Actions urgentes">
            <ul className="divide-y rounded-lg border">
              {alerts.filter(a => a.show).map((a) => (
                <li key={a.key}>
                  <Link href={a.href} className="flex items-center justify-between px-4 py-3 hover:bg-muted/70">
                    <div className="flex items-center gap-2">
                      {a.icon}
                      <span>{a.label}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </AdminSection>
        )}

        {/* Accès rapides déplacés dans la sidebar (section Administration) */}
      </AdminContent>
    </AdminPage>
  )
}
