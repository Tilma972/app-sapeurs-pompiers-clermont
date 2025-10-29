import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: me } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!me || !['admin', 'tresorier'].includes(me.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const admin = createAdminClient()

  // Delete profile first (cascades are on auth.users, so keep order)
  const { error: profileErr } = await admin.from('profiles').delete().eq('id', id)
  if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 })

  // Try to delete auth user (requires service role)
  const { error: authErr } = await admin.auth.admin.deleteUser(id)
  if (authErr) {
    // Non-fatal: profile already removed
    console.warn('Failed to delete auth user:', authErr.message)
  }

  return NextResponse.json({ ok: true })
}
