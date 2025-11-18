import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminPage } from "@/components/admin/admin-page"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminStatCard } from "@/components/admin/admin-stat-card"
import { AdminCard } from "@/components/admin/admin-card"
import { getGlobalStats } from "@/lib/supabase/tournee"
import Link from "next/link"
import { UsersRound, Layers3, Calendar, Euro, Receipt, FileWarning, ChevronRight, LayoutDashboard, AlertCircle } from "lucide-react"
import { formatNumber, formatCurrency } from "@/lib/formatters"

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
  const [activeProfiles, activeTeams, global, chequesPending, receiptsToSend, calendriersNonConfirmes] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('equipes').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    getGlobalStats(),
    // Approximation: cheques encaissés à déposer non suivi explicitement -> on compte les chèques complétés
    supabase.from('support_transactions').select('*', { count: 'exact', head: true })
      .eq('payment_method', 'cheque').eq('payment_status', 'completed'),
    // Reçus à envoyer: on compte les transactions avec un numéro de reçu mais non envoyées
    supabase.from('support_transactions').select('*', { count: 'exact', head: true })
      .not('receipt_number','is', null).eq('receipt_sent', false),
    // Calendriers non confirmés: membres actifs qui n'ont pas confirmé
    supabase.from('profiles').select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .in('role', ['membre', 'chef_equipe'])
      .eq('calendriers_reception_confirmee', false),
  ])

  const stats = [
    { title: 'Utilisateurs actifs', value: activeProfiles.count || 0, icon: <UsersRound className="h-4 w-4" /> },
    { title: 'Équipes actives', value: activeTeams.count || 0, icon: <Layers3 className="h-4 w-4" /> },
    { title: 'Calendriers vendus', value: formatNumber(global.total_calendriers_distribues), icon: <Calendar className="h-4 w-4" /> },
    { title: 'Montant collecté', value: formatCurrency(global.total_montant_collecte), icon: <Euro className="h-4 w-4" /> },
    { title: 'Calendriers à confirmer', value: calendriersNonConfirmes.count || 0, icon: <AlertCircle className="h-4 w-4" /> },
    { title: 'Tournées actives', value: global.total_tournees_actives, icon: <Layers3 className="h-4 w-4" /> },
    { title: 'Chèques à déposer', value: chequesPending.count || 0, icon: <FileWarning className="h-4 w-4" /> },
    { title: 'Reçus à envoyer', value: receiptsToSend.count || 0, icon: <Receipt className="h-4 w-4" /> },
  ]

  const alerts: Array<{ key: string; label: string; href: string; show: boolean; icon: React.ReactNode }> = [
    { key: 'calendars', label: `${calendriersNonConfirmes.count || 0} membre(s) n'ont pas confirmé leurs calendriers`, href: '/admin/calendriers-suivi', show: (calendriersNonConfirmes.count || 0) > 0, icon: <AlertCircle className="h-4 w-4 text-amber-500" /> },
    { key: 'cheques', label: `${chequesPending.count || 0} chèque(s) à traiter`, href: '/admin/cheques', show: (chequesPending.count || 0) > 0, icon: <FileWarning className="h-4 w-4 text-amber-500" /> },
    { key: 'receipts', label: `${receiptsToSend.count || 0} reçu(s) à envoyer`, href: '/admin/receipts', show: (receiptsToSend.count || 0) > 0, icon: <Receipt className="h-4 w-4 text-amber-500" /> },
  ]

  return (
    <AdminPage>
      <AdminPageHeader
        title="Vue d'ensemble"
        description="Pilotage admin en un coup d'œil"
        icon={<LayoutDashboard className="h-6 w-6" />}
      />

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => (
          <div key={idx} className="relative">
            <div className="absolute right-2 top-2 opacity-60 z-10">{s.icon}</div>
            <AdminStatCard title={s.title} value={s.value} />
          </div>
        ))}
      </div>

      {/* Alertes (only shown when there is at least one) */}
      {alerts.some(a => a.show) && (
        <AdminCard
          title="Alertes"
          description="Actions urgentes"
        >
          <ul className="divide-y rounded-lg border">
            {alerts.filter(a => a.show).map((a) => (
              <li key={a.key}>
                <Link href={a.href} className="flex items-center justify-between px-4 py-3 hover:bg-muted/70 transition-colors">
                  <div className="flex items-center gap-2">
                    {a.icon}
                    <span>{a.label}</span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </AdminCard>
      )}

      {/* Liens rapides */}
      <AdminCard
        title="Accès rapides"
        description="Gestion des ressources principales"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { name: "Liste blanche", href: "/admin/whitelist", description: "Gérer les inscriptions autorisées" },
            { name: "Utilisateurs", href: "/admin/users", description: "Gérer les comptes utilisateurs" },
            { name: "Équipes", href: "/admin/equipes", description: "Configuration des équipes" },
            { name: "Suivi calendriers", href: "/admin/calendriers-suivi", description: "Rapprochement admin/membres" },
            { name: "Partenaires", href: "/admin/partenaires", description: "Gérer les partenariats" },
            { name: "Avantages", href: "/admin/avantages", description: "Offres et réductions" },
            { name: "Produits", href: "/admin/produits", description: "Boutique et articles" },
            { name: "Modération", href: "/admin/gallery-moderation", description: "Photos en attente" },
            { name: "Webhooks", href: "/admin/webhooks", description: "Logs HelloAsso" },
            { name: "Paramètres", href: "/admin/settings", description: "Configuration générale" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-medium group-hover:text-primary transition-colors">{item.name}</h3>
                <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-0.5" />
            </Link>
          ))}
        </div>
      </AdminCard>
    </AdminPage>
  )
}
