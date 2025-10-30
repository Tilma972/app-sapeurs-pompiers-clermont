import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

    const body = await request.json();
    const { photo_id, reason } = body as { photo_id?: string; reason?: string };
    if (!photo_id || !reason) return NextResponse.json({ error: "invalid_payload" }, { status: 400 });

    const { error } = await supabase.from("gallery_photo_reports").insert({
      photo_id,
      reporter_id: user.id,
      reason,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
