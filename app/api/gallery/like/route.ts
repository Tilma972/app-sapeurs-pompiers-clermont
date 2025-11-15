/**
 * API Route - Toggle Like sur une photo
 */

import { NextResponse } from "next/server";
import { toggleLike } from "@/lib/supabase/gallery";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    // 🔍 DEBUG: Vérifier l'authentification
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    console.log("🔍 [API /like] Auth check:", {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message,
      headers: {
        cookie: req.headers.get('cookie') ? 'present' : 'missing',
        origin: req.headers.get('origin'),
        referer: req.headers.get('referer'),
      }
    });

    const { photo_id } = await req.json();

    if (!photo_id || typeof photo_id !== "string") {
      return NextResponse.json(
        { error: "photo_id requis" },
        { status: 400 }
      );
    }

    console.log("🔍 [API /like] Calling toggleLike for photo:", photo_id);
    const result = await toggleLike(photo_id);
    console.log("✅ [API /like] Success:", result);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error toggling like:", error);

    if (error instanceof Error && error.message === "not_authenticated") {
      return NextResponse.json(
        { error: "Vous devez être connecté" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors du like" },
      { status: 500 }
    );
  }
}
