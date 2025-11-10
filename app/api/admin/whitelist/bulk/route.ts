import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type { Database } from '@/lib/database.types'

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

  // Insertion ligne par ligne avec feedback détaillé
  const results: {
    success: Database["public"]["Tables"]["whitelist"]["Row"][],
    errors: { entry: string; reason: string }[]
  } = {
    success: [],
    errors: []
  }

  for (const entry of validated.entries) {
    const prepared = {
      first_name: entry.first_name.trim(),
      last_name: entry.last_name.trim(),
      email: entry.email ? entry.email.trim().toLowerCase() : null,
      notes: entry.notes || null,
      added_by: user.id
    }
    const { data, error } = await supabase
      .from('whitelist')
      .insert(prepared)
      .select()
      .single()
    if (error) {
      const pgCode = (error as { code?: string }).code
      results.errors.push({
        entry: `${prepared.first_name} ${prepared.last_name}`,
        reason: pgCode === '23505' ? 'Doublon' : (error.message || 'Erreur inconnue')
      })
    } else {
      results.success.push(data)
      // Log audit enrichi
      await supabase.from('whitelist_audit').insert({
        action: 'import',
        whitelist_id: data.id,
        performed_by: user.id,
        details: {
          ...prepared,
          timestamp: new Date().toISOString(),
          ip: request.headers.get('x-forwarded-for') || 'unknown'
        }
      })
    }
  }

  return NextResponse.json({
    success: true,
    imported: results.success.length,
    errors: results.errors
  })
}
