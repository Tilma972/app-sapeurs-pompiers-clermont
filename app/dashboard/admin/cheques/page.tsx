import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminPage, AdminContent, AdminSection } from "@/components/admin/admin-page"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileWarning } from "lucide-react"

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
    <AdminPage>
      <div className="bg-card rounded-lg p-6 border">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileWarning className="h-6 w-6" />
          Chèques à déposer
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Vue informative des transactions par chèque complétées</p>
      </div>

      <AdminContent>
        <AdminSection title={`Chèques (${cheques?.length ?? 0})`} description="Suivi détaillé (déposé / non déposé) à venir.">
          {error ? (
            <div className="text-sm text-destructive">Erreur de chargement des chèques</div>
          ) : (cheques && cheques.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Donateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cheques.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.created_at ? new Date(tx.created_at as unknown as string).toLocaleDateString('fr-FR') : '—'}</TableCell>
                    <TableCell>{(tx.supporter_name as string) || '—'}</TableCell>
                    <TableCell className="truncate max-w-[220px]">{(tx.supporter_email as string) || '—'}</TableCell>
                    <TableCell className="text-right">{numberFr.format((tx.amount as number) || 0)}</TableCell>
                    <TableCell>{(tx.payment_status as string) || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-sm text-muted-foreground">Aucun chèque à afficher</div>
          ))}
        </AdminSection>
      </AdminContent>
    </AdminPage>
  )
}
