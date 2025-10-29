import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
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

  // Use view that already joins equipe data
  const { data, error } = await supabase
    .from('profiles_with_equipe_view')
    .select('id, full_name, role, equipe_id, equipe_nom, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ users: (data || []).map(u => ({
    id: u.id,
    full_name: u.full_name,
    role: u.role,
    team_id: u.equipe_id,
    team_name: u.equipe_nom,
    created_at: u.created_at,
  })) })
}
