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

  if (!me || me.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({})) as {
    nom?: string;
    numero?: number | null;
    type?: 'standard' | 'spp';
    description?: string | null;
    secteur?: string;
    communes?: string[] | null;
    secteur_centre_lat?: number | null;
    secteur_centre_lon?: number | null;
    calendriers_alloues?: number;
    couleur?: string | null;
    ordre_affichage?: number | null;
    chef_equipe_id?: string | null;
  }

  if (!body.nom || !body.secteur) {
    return NextResponse.json({ error: 'Champs requis: nom, secteur' }, { status: 400 })
  }

  const admin = createAdminClient()
  const payload: Record<string, unknown> = {
    nom: body.nom.trim(),
    numero: body.numero ?? null,
    type: body.type ?? 'standard',
    description: body.description ?? null,
    secteur: body.secteur,
    communes: body.communes ?? null,
    secteur_centre_lat: body.secteur_centre_lat ?? null,
    secteur_centre_lon: body.secteur_centre_lon ?? null,
    calendriers_alloues: body.calendriers_alloues ?? 0,
    couleur: body.couleur ?? '#3b82f6',
    ordre_affichage: body.ordre_affichage ?? 0,
    chef_equipe_id: body.chef_equipe_id ?? null,
    actif: true,
    status: 'active',
  }

  const { error, data } = await admin
    .from('equipes')
    .insert(payload)
    .select('id')
    .single()

  if (error) {
    const pgCode = (error as { code?: string }).code
    if (pgCode === '23505') {
      return NextResponse.json({ error: 'Nom d\'équipe déjà pris' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, id: data?.id })
}
