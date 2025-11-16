import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateSchema = z.object({
  id: z.string().uuid(),
  first_name: z.string().min(2).max(50),
  last_name: z.string().min(2).max(50),
  email: z.string().email().optional().or(z.literal('')),
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  // Validation
  let validated
  try {
    validated = updateSchema.parse(body)
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

  // Vérifier que l'entrée existe et n'est pas utilisée
  const { data: existing } = await supabase
    .from('whitelist')
    .select('used')
    .eq('id', validated.id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: 'Entrée introuvable' }, { status: 404 })
  }

  if (existing.used) {
    return NextResponse.json({ 
      error: 'Impossible de modifier une entrée déjà utilisée' 
    }, { status: 400 })
  }

  // Mise à jour
  const { data, error } = await supabase
    .from('whitelist')
    .update({
      first_name: validated.first_name.trim(),
      last_name: validated.last_name.trim(),
      email: validated.email ? validated.email.trim().toLowerCase() : null,
    })
    .eq('id', validated.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log audit
  await supabase.from('whitelist_audit').insert({
    action: 'update',
    whitelist_id: validated.id,
    performed_by: user.id,
    details: {
      first_name: validated.first_name,
      last_name: validated.last_name,
      email: validated.email || null,
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || 'unknown'
    }
  })

  return NextResponse.json({ success: true, entry: data })
}
