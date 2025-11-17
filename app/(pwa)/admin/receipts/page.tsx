import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AdminCard, AdminListCard } from "@/components/admin/admin-card"
import { Receipt } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export const dynamic = 'force-dynamic'

export default async function AdminReceiptsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!me || !['admin','tresorier'].includes(me.role)) redirect('/dashboard')

  const { data: pending, error } = await supabase
    .from('support_transactions')
    .select('id, created_at, amount, supporter_name, supporter_email, receipt_number, receipt_sent')
    .not('receipt_number','is', null)
    .eq('receipt_sent', false)
    .order('created_at', { ascending: false })
    .limit(200)

  const numberFr = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Reçus fiscaux à envoyer"
        description="Liste approximative basée sur les transactions avec numéro de reçu non envoyé"
        icon={<Receipt className="h-6 w-6" />}
      />

      <AdminCard
        title={`À envoyer (${pending?.length ?? 0})`}
        description="Les envois automatiques peuvent être déclenchés depuis les écrans opérateurs. Cette vue admin est informative."
      >
        {error ? (
          <div className="text-sm text-destructive py-4">Erreur de chargement des reçus</div>
        ) : (pending && pending.length > 0 ? (
          <div className="space-y-3">
            {pending.map(tx => (
              <AdminListCard key={tx.id}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">{(tx.supporter_name as string) || '—'}</p>
                    <Badge variant="outline" className="text-xs">
                      {(tx.receipt_number as string) || '—'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{(tx.supporter_email as string) || '—'}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tx.created_at ? new Date(tx.created_at as unknown as string).toLocaleDateString('fr-FR') : '—'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="font-bold text-lg">{numberFr.format((tx.amount as number) || 0)}</p>
                  <Badge variant="secondary">
                    {(tx.receipt_sent as boolean) ? 'Envoyé' : 'À envoyer'}
                  </Badge>
                </div>
              </AdminListCard>
            ))}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground py-8 text-center">Aucun reçu en attente</div>
        ))}
      </AdminCard>
    </div>
  )
}
