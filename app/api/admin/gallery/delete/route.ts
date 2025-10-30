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

  // Fetch URLs to cleanup storage objects
  const { data: photo, error: fetchErr } = await supabase
    .from('gallery_photos')
    .select('image_url, thumbnail_url')
    .eq('id', photo_id)
    .maybeSingle();
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 400 });

  // Best-effort storage cleanup
  const keys: string[] = [];
  const toKey = (url?: string | null) => {
    if (!url) return null;
    try {
      // Accept either full public URL or already-relative key
      const marker = '/storage/v1/object/public/gallery/';
      const idx = url.indexOf(marker);
      if (idx >= 0) return url.substring(idx + marker.length);
      // If not a public URL, assume it's already a bucket-relative key
      return url.replace(/^\/+/, '');
    } catch {
      return null;
    }
  };

  const k1 = toKey((photo as { image_url?: string | null } | null)?.image_url ?? null);
  const k2 = toKey((photo as { thumbnail_url?: string | null } | null)?.thumbnail_url ?? null);
  if (k1) keys.push(k1);
  if (k2 && k2 !== k1) keys.push(k2);

  if (keys.length > 0) {
    // Allow moderators to delete any file via storage policy
    const { error: delErr } = await supabase.storage.from('gallery').remove(keys);
    // Do not fail the whole request on storage cleanup errors
    if (delErr) {
      // no-op: optionally could log delErr.message
    }
  }

  const { error } = await supabase
    .from('gallery_photos')
    .delete()
    .eq('id', photo_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, removed: keys });
}
