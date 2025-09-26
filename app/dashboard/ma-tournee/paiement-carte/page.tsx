import { getActiveTournee } from '@/lib/supabase/tournee'
import { ClientQR } from './ClientQR'

export default async function PaiementCartePage() {
  const tournee = await getActiveTournee()
  if (!tournee) {
    return (
      <div className="max-w-md mx-auto p-4 text-sm text-muted-foreground">
        Aucune tournée active trouvée.
      </div>
    )
  }
  return <ClientQR tourneeId={tournee.id} />
}
