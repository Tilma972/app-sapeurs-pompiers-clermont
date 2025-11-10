import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const bulkSchema = z.object({
  entries: z.array(z.object({
    first_name: z.string().min(2).max(50),
    last_name: z.string().min(2).max(50),
    email: z.string().email().optional().or(z.literal('')),
    notes: z.string().max(255).optional()
  }))
})

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  // Validation Zod
  let validated
  try {
    validated = bulkSchema.parse(body)
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

  // Préparer les entrées
  const enrichedEntries = validated.entries.map(entry => ({
    first_name: entry.first_name.trim(),
    last_name: entry.last_name.trim(),
    email: entry.email ? entry.email.trim().toLowerCase() : null,
    notes: entry.notes || null,
    added_by: user.id
  }))

  // Insertion bulk
  const { error, data } = await supabase
    .from('whitelist')
    .insert(enrichedEntries)
    .select()

  // Log audit
  if (!error && data) {
    for (const entry of data) {
      await supabase.from('whitelist_audit').insert({
        action: 'import',
        whitelist_id: entry.id,
        performed_by: user.id,
        details: entry
      })
    }
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, count: data.length })
}
