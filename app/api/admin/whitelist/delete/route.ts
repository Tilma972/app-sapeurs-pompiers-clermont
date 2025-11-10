import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const deleteSchema = z.object({
  id: z.string().uuid()
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  // Validation Zod
  let validated
  try {
    validated = deleteSchema.parse(body)
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

  // Récupérer l'entrée complète
  const { data: entry } = await supabase
    .from('whitelist')
    .select('*')
    .eq('id', validated.id)
    .single()

  if (!entry) {
    return NextResponse.json(
      { error: 'Entrée introuvable' },
      { status: 404 }
    )
  }

  if (entry.used) {
    return NextResponse.json({
      error: 'Impossible de supprimer une entrée déjà utilisée',
      entry: {
        name: `${entry.first_name} ${entry.last_name}`,
        used_at: entry.used_at
      }
    }, { status: 400 })
  }

  // Supprimer
  const { error } = await supabase
    .from('whitelist')
    .delete()
    .eq('id', validated.id)

  // Log audit enrichi
  if (!error) {
    await supabase.from('whitelist_audit').insert({
      action: 'delete',
      whitelist_id: validated.id,
      performed_by: user.id,
      details: {
        name: `${entry.first_name} ${entry.last_name}`,
        email: entry.email,
        timestamp: new Date().toISOString(),
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    deleted: {
      name: `${entry.first_name} ${entry.last_name}`,
      email: entry.email
    }
  })
}
