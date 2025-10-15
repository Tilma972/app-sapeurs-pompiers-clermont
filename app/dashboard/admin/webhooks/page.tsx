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
          <details key={log.id} className="bg-white rounded-lg shadow p-4">
            <summary className="cursor-pointer font-semibold flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className={`px-2 py-1 rounded text-xs ${
                  log.status === 'processed' ? 'bg-green-100 text-green-800' :
                  log.status === 'error' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {log.status}
                </span>
                <span className="text-sm text-gray-600">{log.event_type || 'Unknown'}</span>
                <span className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString('fr-FR')}</span>
              </div>
              {log.processing_duration_ms && (
                <span className="text-xs text-gray-500">{log.processing_duration_ms}ms</span>
              )}
            </summary>
            <div className="mt-4 space-y-2">
              {log.error_message && (
                <div className="bg-red-50 p-3 rounded">
                  <p className="text-sm font-semibold text-red-800">Erreur :</p>
                  <p className="text-sm text-red-600">{log.error_message}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-semibold mb-1">Headers :</p>
                <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">{JSON.stringify(log.headers, null, 2)}</pre>
              </div>
              <div>
                <p className="text-sm font-semibold mb-1">Payload :</p>
                <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto max-h-96">{JSON.stringify(log.payload, null, 2)}</pre>
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}
