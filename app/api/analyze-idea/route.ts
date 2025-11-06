/**
 * API Route - Analyse IA avec Claude Sonnet 4
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

// Fonction pour obtenir le client Anthropic (lazy initialization)
function getAnthropicClient() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
}

const CATEGORIES = [
  "Équipement",
  "Formation",
  "Organisation",
  "Sécurité",
  "Communication",
  "Bien-être",
  "Innovation",
  "Autre",
];

const SYSTEM_PROMPT = `Tu es un assistant IA expert en analyse de contenu pour une boîte à idées de sapeurs-pompiers.

Ta mission est d'analyser une transcription d'idée vocale et de générer :
1. Un titre concis et accrocheur (max 200 caractères)
2. Une description COURTE reprenant fidèlement le texte original (max 500 caractères)
3. Les catégories pertinentes parmi : ${CATEGORIES.join(", ")}
4. Des tags pertinents (mots-clés, 5 max)
5. Une vérification de modération (détecter contenu inapproprié)

Réponds UNIQUEMENT avec un JSON valide, sans markdown, dans ce format exact :
{
  "title": "Titre de l'idée",
  "description": "Description courte et fidèle au texte original",
  "categories": ["Catégorie1", "Catégorie2"],
  "tags": ["tag1", "tag2", "tag3"],
  "inapropriate": false,
  "moderationReason": ""
}

Règles importantes :
- Le titre doit être accrocheur et professionnel
- La description doit RESTER PROCHE du texte original, ne pas développer ni paraphraser longuement
- Corrige juste la grammaire et structure en 1-2 phrases courtes maximum
- Choisis 1 à 3 catégories maximum parmi la liste fournie
- Génère 1 à 3 tags pertinents
- Détecte le contenu offensant, illégal, ou hors-sujet (inapropriate = true)
- Si inapproprié, explique la raison dans moderationReason`;

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Texte manquant ou invalide" },
        { status: 400 }
      );
    }

    if (text.length < 10) {
      return NextResponse.json(
        { error: "Texte trop court pour analyse" },
        { status: 400 }
      );
    }

    // Initialiser le client et appeler Claude Sonnet 4
    const anthropic = getAnthropicClient();
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Analyse cette transcription d'idée vocale :\n\n"${text}"\n\nRéponds avec le JSON demandé.`,
        },
      ],
    });

    // Extraire le contenu de la réponse
    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Format de réponse inattendu");
    }

    // Parser le JSON
    let analysis;
    try {
      // Nettoyer le texte au cas où il y aurait des balises markdown
      const cleanText = content.text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      
      analysis = JSON.parse(cleanText);
    } catch {
      console.error("Erreur parsing JSON:", content.text);
      throw new Error("Impossible de parser la réponse IA");
    }

    // Valider la structure
    if (
      !analysis.title ||
      !analysis.description ||
      !Array.isArray(analysis.categories) ||
      !Array.isArray(analysis.tags)
    ) {
      throw new Error("Structure JSON invalide");
    }

    // Valider les catégories (doivent être dans la liste)
    analysis.categories = analysis.categories.filter((cat: string) =>
      CATEGORIES.includes(cat)
    );

    // Si aucune catégorie valide, ajouter "Autre"
    if (analysis.categories.length === 0) {
      analysis.categories = ["Autre"];
    }

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("Erreur analyse Claude:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erreur analyse IA",
      },
      { status: 500 }
    );
  }
}
