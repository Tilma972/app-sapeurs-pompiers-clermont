import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminPage, AdminContent, AdminSection } from "@/components/admin/admin-page"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Receipt } from "lucide-react"

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
    <AdminPage>
      <div className="bg-card rounded-lg p-6 border">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Receipt className="h-6 w-6" />
          Reçus fiscaux à envoyer
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Liste approximative basée sur les transactions avec numéro de reçu non envoyé</p>
      </div>

      <AdminContent>
        <AdminSection title={`À envoyer (${pending?.length ?? 0})`} description="Les envois automatiques peuvent être déclenchés depuis les écrans opérateurs. Cette vue admin est informative.">
          {error ? (
            <div className="text-sm text-destructive">Erreur de chargement des reçus</div>
          ) : (pending && pending.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Donateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>N° reçu</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.created_at ? new Date(tx.created_at as unknown as string).toLocaleDateString('fr-FR') : '—'}</TableCell>
                    <TableCell>{(tx.supporter_name as string) || '—'}</TableCell>
                    <TableCell className="truncate max-w-[220px]">{(tx.supporter_email as string) || '—'}</TableCell>
                    <TableCell className="text-right">{numberFr.format((tx.amount as number) || 0)}</TableCell>
                    <TableCell>{(tx.receipt_number as string) || '—'}</TableCell>
                    <TableCell>{(tx.receipt_sent as boolean) ? 'Envoyé' : 'À envoyer'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-sm text-muted-foreground">Aucun reçu en attente</div>
          ))}
        </AdminSection>
      </AdminContent>
    </AdminPage>
  )
}
