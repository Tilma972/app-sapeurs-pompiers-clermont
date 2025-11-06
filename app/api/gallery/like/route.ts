/**
 * API Route - Toggle Like sur une photo
 */

import { NextResponse } from "next/server";
import { toggleLike } from "@/lib/supabase/gallery";

export async function POST(req: Request) {
  try {
    const { photo_id } = await req.json();

    if (!photo_id || typeof photo_id !== "string") {
      return NextResponse.json(
        { error: "photo_id requis" },
        { status: 400 }
      );
    }

    const result = await toggleLike(photo_id);
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
