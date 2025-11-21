import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function WebhookLogsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'tresorier'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const { data: logs } = await supabase
    .from('webhook_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  type WebhookLog = {
    id: string
    source: string
    event_type: string | null
    payload: unknown
    headers: unknown
    status: 'received' | 'processed' | 'error'
    error_message: string | null
    processing_duration_ms: number | null
    created_at: string
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Logs Webhooks HelloAsso</h1>
      <div className="space-y-4">
        {logs?.map((log: WebhookLog) => (
          <details key={log.id} className="bg-card text-card-foreground rounded-lg shadow p-4 border border-border">
            <summary className="cursor-pointer font-semibold flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span
                  className={
                    `px-2 py-1 rounded text-xs font-medium ` +
                    (log.status === 'processed'
                      ? 'bg-green-600/15 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      : log.status === 'error'
                        ? 'bg-red-600/15 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                        : 'bg-slate-600/15 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300')
                  }
                >
                  {log.status}
                </span>
                <span className="text-sm text-foreground/80">{log.event_type || 'Unknown'}</span>
                <span className="text-xs text-foreground/60">{new Date(log.created_at).toLocaleString('fr-FR')}</span>
              </div>
              {log.processing_duration_ms && (
                <span className="text-xs text-foreground/70">{log.processing_duration_ms}ms</span>
              )}
            </summary>
            <div className="mt-4 space-y-2">
              {log.error_message && (
                <div className="p-3 rounded bg-red-600/10 text-red-800 dark:bg-red-900/30 dark:text-red-200">
                  <p className="text-sm font-semibold">Erreur :</p>
                  <p className="text-sm">{log.error_message}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold mb-1">Headers :</p>
                <pre className="p-3 rounded text-xs overflow-x-auto bg-muted text-foreground shadow-inner border border-border">{JSON.stringify(log.headers, null, 2)}</pre>
              </div>
              <div>
                <p className="text-sm font-semibold mb-1">Payload :</p>
                <pre className="p-3 rounded text-xs overflow-x-auto max-h-96 bg-muted text-foreground shadow-inner border border-border">{JSON.stringify(log.payload, null, 2)}</pre>
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
