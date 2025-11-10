import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const addSchema = z.object({
  first_name: z.string().min(2).max(50),
  last_name: z.string().min(2).max(50),
  email: z.string().email().optional().or(z.literal('')),
  notes: z.string().max(255).optional()
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  // Validation Zod
  let validated
  try {
    validated = addSchema.parse(body)
  } catch (err) {
    return NextResponse.json({ error: 'Champs invalides', details: err }, { status: 400 })
  }

  // Vérifier admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  // Insertion
  const { error, data } = await supabase
    .from('whitelist')
    .insert({
      first_name: validated.first_name.trim(),
      last_name: validated.last_name.trim(),
      email: validated.email ? validated.email.trim().toLowerCase() : null,
      notes: validated.notes || null,
      added_by: user.id
    })
    .select()
    .single()

  // Log audit
  if (!error && data) {
    await supabase.from('whitelist_audit').insert({
      action: 'add',
      whitelist_id: data.id,
      performed_by: user.id,
      details: { ...validated }
    })
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, entry: data })
}
