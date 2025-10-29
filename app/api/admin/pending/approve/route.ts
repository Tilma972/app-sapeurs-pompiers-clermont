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

  const body = (await request.json().catch(() => ({}))) as { id?: string; userId?: string; team_id?: string | null; role?: string }
  const id = body.id || body.userId
  const team_id: string | null | undefined = body.team_id === '' ? null : body.team_id
  const role: string | undefined = body.role
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Validate role
  const allowedRoles = ['membre', 'chef_equipe', 'tresorier', 'admin']
  if (role !== undefined && !allowedRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  // Validate team existence if provided
  if (team_id) {
    const { data: teamExists } = await supabase
      .from('equipes')
      .select('id')
      .eq('id', team_id)
      .single()
    if (!teamExists) {
      return NextResponse.json({ error: 'Equipe introuvable' }, { status: 400 })
    }
  }

  const admin = createAdminClient()
  const updates: Record<string, unknown> = { is_active: true }
  if (team_id !== undefined) updates.team_id = team_id
  if (role !== undefined) updates.role = role

  const { error } = await admin
    .from('profiles')
    .update(updates)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
