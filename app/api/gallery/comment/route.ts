/**
 * API Route - Gallery Comments
 * POST /api/gallery/comment - Créer un commentaire
 */

import { NextResponse } from "next/server";
import { createPhotoComment } from "@/lib/supabase/gallery-comments";

export async function POST(req: Request) {
  try {
    const { photo_id, content } = await req.json();

    // Validation
    if (!photo_id || typeof photo_id !== "string") {
      return NextResponse.json(
        { error: "photo_id requis" },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Le commentaire ne peut pas être vide" },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: "Le commentaire ne peut pas dépasser 2000 caractères" },
        { status: 400 }
      );
    }

    // Créer le commentaire
    const comment = await createPhotoComment(photo_id, content);

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Error creating comment:", error);

    if (error instanceof Error && error.message === "User not authenticated") {
      return NextResponse.json(
        { error: "Vous devez être connecté" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la création du commentaire" },
      { status: 500 }
    );
  }
}
