import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function PATCH(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!me || me.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await _request.json().catch(() => ({})) as Record<string, unknown>

  // Whitelist fields
  const allowed = new Set([
    'nom','numero','type','description','secteur','communes','secteur_centre_lat','secteur_centre_lon',
    'calendriers_alloues','couleur','ordre_affichage','chef_equipe_id',
    'enable_retribution','pourcentage_minimum_pot','pourcentage_recommande_pot','mode_transparence',
    'status','actif'
  ])
  const updates: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(body)) {
    if (allowed.has(k)) updates[k] = v
  }
  updates['updated_at'] = new Date().toISOString()
  // Keep status/actif in sync when explicitly provided
  if ('status' in updates) {
    updates['actif'] = (updates['status'] === 'active')
  }
  if ('actif' in updates && !('status' in updates)) {
    updates['status'] = (updates['actif'] ? 'active' : 'archived')
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('equipes')
    .update(updates)
    .eq('id', id)

  if (error) {
    const pgCode = (error as { code?: string }).code
    if (pgCode === '23505') {
      return NextResponse.json({ error: 'Nom d\'équipe déjà pris' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
