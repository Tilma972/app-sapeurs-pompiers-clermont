import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminCard, AdminListCard } from "@/components/admin/admin-card"
import { FileWarning } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export const dynamic = 'force-dynamic'

export default async function AdminChequesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!me || !['admin','tresorier'].includes(me.role)) redirect('/dashboard')

  // Approximation: il n'y a pas encore d'état "déposé". On liste les chèques complétés.
  const { data: cheques, error } = await supabase
    .from('support_transactions')
    .select('id, created_at, amount, supporter_name, supporter_email, payment_status')
    .eq('payment_method', 'cheque')
    .eq('payment_status', 'completed')
    .order('created_at', { ascending: false })
    .limit(200)

  const numberFr = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Chèques à déposer"
        description="Vue informative des transactions par chèque complétées"
        icon={<FileWarning className="h-6 w-6" />}
      />

      <AdminCard
        title={`Chèques (${cheques?.length ?? 0})`}
        description="Suivi détaillé (déposé / non déposé) à venir."
      >
        {error ? (
          <div className="text-sm text-destructive py-4">Erreur de chargement des chèques</div>
        ) : (cheques && cheques.length > 0 ? (
          <div className="space-y-3">
            {cheques.map(tx => (
              <AdminListCard key={tx.id}>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{(tx.supporter_name as string) || '—'}</p>
                  <p className="text-sm text-muted-foreground truncate">{(tx.supporter_email as string) || '—'}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tx.created_at ? new Date(tx.created_at as unknown as string).toLocaleDateString('fr-FR') : '—'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="font-bold text-lg">{numberFr.format((tx.amount as number) || 0)}</p>
                  <Badge variant="secondary">{(tx.payment_status as string) || '—'}</Badge>
                </div>
              </AdminListCard>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground py-8 text-center">Aucun chèque à afficher</div>
        ))}
      </AdminCard>
    </div>
  )
}
