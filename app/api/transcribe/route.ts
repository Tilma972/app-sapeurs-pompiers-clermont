/**
 * API Route - Transcription Audio avec OpenAI Whisper
 */

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Fonction pour obtenir le client OpenAI (lazy initialization)
function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { audioUrl } = await request.json();

    if (!audioUrl) {
      return NextResponse.json(
        { error: "URL audio manquante" },
        { status: 400 }
      );
    }

    // Télécharger l'audio depuis l'URL
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      throw new Error("Impossible de télécharger l'audio");
    }

    // Convertir en Blob puis en File (requis par OpenAI API)
    const audioBlob = await audioResponse.blob();
    const audioFile = new File([audioBlob], "audio.webm", {
      type: audioBlob.type,
    });

    // Initialiser le client et appeler Whisper API pour transcription
    const openai = getOpenAIClient();
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "fr", // Forcer le français
      response_format: "text",
    });

    return NextResponse.json({
      success: true,
      transcription,
    });
  } catch (error) {
    console.error("Erreur transcription Whisper:", error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Erreur transcription",
      },
      { status: 500 }
    );
  }
}
