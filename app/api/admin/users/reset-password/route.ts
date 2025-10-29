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

  const body = await request.json().catch(() => null)
  const { id } = body || {}
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const admin = createAdminClient()
  const { data: authUser, error: getErr } = await admin.auth.admin.getUserById(id)
  if (getErr || !authUser.user?.email) {
    return NextResponse.json({ error: getErr?.message || 'User not found' }, { status: 404 })
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || ''
  const redirectTo = origin ? `${origin}/auth/update-password` : undefined

  // Generate a password recovery link (admin flow)
  const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: authUser.user.email,
    options: redirectTo ? { redirectTo } : undefined,
  })
  const actionLink = (link as { properties?: { action_link?: string } })?.properties?.action_link as string | undefined
  if (linkErr || !actionLink) {
    return NextResponse.json({ error: linkErr?.message || 'Failed to generate link' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, action_link: actionLink })
}
