import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/resend-client'

export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, is_active')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  if (profile.is_active) return NextResponse.json({ ok: true, skipped: true })

  // Collect admin recipients
  const { data: admins } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('role', ['admin', 'tresorier'])

  const admin = createAdminClient()
  const emails: string[] = []
  for (const a of admins || []) {
    const { data: u } = await admin.auth.admin.getUserById(a.id)
    const email = u.user?.email
    if (email) emails.push(email)
  }

  // Send one email per admin (simpler, avoids BCC complexity)
  const origin = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || ''
  const link = origin ? `${origin}/dashboard/admin/pending` : '/dashboard/admin/pending'
  await Promise.all(
    emails.map(to => sendEmail({
      to,
      subject: 'Nouvelle demande d\'inscription à approuver',
      text: `Un nouveau compte a été créé et attend votre approbation. Nom: ${profile.full_name || user.email || user.id}. Gérer: ${link}`,
      html: `<p>Un nouveau compte a été créé et attend votre approbation.</p><p><strong>Nom:</strong> ${profile.full_name || user.email || user.id}</p><p><a href="${link}">Ouvrir la page d\'approbation</a></p>`
    }))
  )

  return NextResponse.json({ ok: true, notified: emails.length })
}
