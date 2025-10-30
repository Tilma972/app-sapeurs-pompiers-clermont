import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function assertModerator() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "not_authenticated" }, { status: 401 }) };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const role = (profile as { role?: string } | null)?.role;
  if (!role || !['admin','moderateur'].includes(role)) {
    return { error: NextResponse.json({ error: "forbidden" }, { status: 403 }) };
  }
  return { supabase } as const;
}

export async function POST(req: Request) {
  const guard = await assertModerator();
  if ('error' in guard) return guard.error;
  const { supabase } = guard;
  const { photo_id } = await req.json();
  if (!photo_id) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });

  const { error } = await supabase
    .from('gallery_photos')
    .update({ status: 'approved', reports_count: 0 })
    .eq('id', photo_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
