/**
 * Page Enregistrer Idée Vocale
 * Enregistrement audio + Transcription + Analyse IA
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles, FileText, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { PwaContainer } from "@/components/layouts/pwa/pwa-container";
import { VoiceRecorder } from "@/components/idees/voice-recorder";
import { createClient } from "@/lib/supabase/client";
import { createIdeaAction } from "@/app/actions/ideas";
import toast from "react-hot-toast";

type ProcessStep =
  | "recording"
  | "uploading"
  | "transcribing"
  | "analyzing"
  | "preview"
  | "publishing";

interface AIAnalysisResult {
  title: string;
  description: string;
  categories: string[];
  tags: string[];
  inapropriate: boolean;
  moderationReason?: string;
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

export default function EnregistrerIdeePage() {
  const router = useRouter();
  const [step, setStep] = useState<ProcessStep>("recording");
  const [, setAudioBlob] = useState<Blob | null>(null);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [transcription, setTranscription] = useState("");
  const [aiAnalysis, setAIAnalysis] = useState<AIAnalysisResult | null>(null);

  // Formulaire éditable
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Upload audio vers Supabase Storage
  const uploadAudio = async (blob: Blob): Promise<string> => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Non authentifié");

    // Générer un nom unique avec dossier user_id (requis par RLS)
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const filename = `${user.id}/${timestamp}_${randomId}.webm`;

    const { data, error } = await supabase.storage
      .from("idea-audios")
      .upload(filename, blob, {
        contentType: blob.type,
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      throw new Error(`Erreur upload: ${error.message}`);
    }

    // Récupérer l'URL publique
    const {
      data: { publicUrl },
    } = supabase.storage.from("idea-audios").getPublicUrl(data.path);

    return publicUrl;
  };

  // Appeler l'API de transcription
  const transcribeAudio = async (audioPublicUrl: string): Promise<string> => {
    const response = await fetch("/api/transcribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audioUrl: audioPublicUrl }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erreur transcription");
    }

    const data = await response.json();
    return data.transcription;
  };

  // Appeler l'API d'analyse IA
  const analyzeIdea = async (text: string): Promise<AIAnalysisResult> => {
    const response = await fetch("/api/analyze-idea", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erreur analyse IA");
    }

    const data = await response.json();
    return data.analysis;
  };

  // Handler après enregistrement
  const handleRecordingComplete = async (blob: Blob, duration: number) => {
    setAudioBlob(blob);
    setAudioDuration(duration);

    try {
      // Étape 1 : Upload
      setStep("uploading");
      const url = await uploadAudio(blob);
      setAudioUrl(url);
      toast.success("Audio uploadé");

      // Étape 2 : Transcription
      setStep("transcribing");
      let transcriptionText = "";
      const transcriptionStartTime = Date.now();
      try {
        transcriptionText = await transcribeAudio(url);
        setTranscription(transcriptionText);
        
        // Logging succès pour monitoring
        console.info("✅ Transcription succeeded:", {
          duration: `${Date.now() - transcriptionStartTime}ms`,
          audioDuration: duration,
          transcriptionLength: transcriptionText.length,
          timestamp: new Date().toISOString(),
        });
        
        toast.success("Transcription terminée");
      } catch (transcriptionError) {
        // Logging erreur structuré pour monitoring
        console.error("❌ Transcription failed:", {
          audioDuration: duration,
          audioUrl: url,
          duration: `${Date.now() - transcriptionStartTime}ms`,
          error: transcriptionError instanceof Error 
            ? transcriptionError.message 
            : String(transcriptionError),
          timestamp: new Date().toISOString(),
        });
        
        toast.error("Transcription impossible. Vous pouvez saisir manuellement.");
        // Fallback : passer en mode édition manuelle
        setTranscription("[Transcription échouée - Saisie manuelle requise]");
        setStep("preview");
        return;
      }

      // Étape 3 : Analyse IA
      setStep("analyzing");
      let analysis: AIAnalysisResult;
      const analysisStartTime = Date.now();
      try {
        analysis = await analyzeIdea(transcriptionText);
        setAIAnalysis(analysis);
        
        // Logging succès pour monitoring
        console.info("✅ Analysis succeeded:", {
          duration: `${Date.now() - analysisStartTime}ms`,
          transcriptionLength: transcriptionText.length,
          categoriesFound: analysis.categories.length,
          tagsFound: analysis.tags.length,
          inappropriate: analysis.inapropriate,
          timestamp: new Date().toISOString(),
        });
      } catch (analysisError) {
        // Logging erreur structuré pour monitoring
        console.error("❌ Analysis failed:", {
          transcriptionLength: transcriptionText.length,
          duration: `${Date.now() - analysisStartTime}ms`,
          error: analysisError instanceof Error 
            ? analysisError.message 
            : String(analysisError),
          timestamp: new Date().toISOString(),
        });
        
        toast.error("Analyse IA impossible. Remplissez manuellement.");
        // Fallback : valeurs par défaut
        setAIAnalysis({
          title: "",
          description: transcriptionText,
          categories: [],
          tags: [],
          inapropriate: false,
        });
        setDescription(transcriptionText);
        setStep("preview");
        return;
      }

      // Vérifier modération
      if (analysis.inapropriate) {
        toast.error("Contenu inapproprié détecté : " + (analysis.moderationReason || "Non spécifié"));
        setStep("recording");
        return;
      }

      // Pré-remplir le formulaire
      setTitle(analysis.title);
      setDescription(analysis.description);
      setSelectedCategories(analysis.categories);
      setTags(analysis.tags);

      setStep("preview");
      toast.success("Analyse terminée");
    } catch (error) {
      console.error("Erreur traitement audio:", error);
      toast.error(
        error instanceof Error ? error.message : "Erreur traitement"
      );
      setStep("recording");
    }
  };

  // Ajouter un tag
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  // Supprimer un tag
  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // Toggle catégorie
  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  // Publier l'idée
  const publishIdea = async () => {
    if (!title.trim() || !description.trim()) {
      toast.error("Titre et description requis");
      return;
    }

    setStep("publishing");

    try {
      // Utiliser la Server Action avec validation serveur
      await createIdeaAction({
        title: title.trim(),
        description: description.trim(),
        categories: selectedCategories,
        tags,
        anonyme: isAnonymous,
        audio_url: audioUrl,
        audio_duration: audioDuration,
        transcription,
        status: "published",
      });

      toast.success("Idée publiée !");
      router.push("/idees");
    } catch (error) {
      console.error("Erreur publication:", error);
      const errorMessage = error instanceof Error ? error.message : "Impossible de publier l'idée";
      toast.error(errorMessage);
      setStep("preview");
    }
  };

  return (
    <PwaContainer>
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/idees">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Enregistrer une idée vocale</h1>
            <p className="text-sm text-muted-foreground">
              Partagez votre idée à la voix
            </p>
          </div>
        </div>

        {/* Stepper */}
        {step !== "recording" && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm">
                <div
                  className={
                    step === "uploading"
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  }
                >
                  {step === "uploading" && <Loader2 className="h-4 w-4 animate-spin inline mr-2" />}
                  1. Upload
                </div>
                <div
                  className={
                    step === "transcribing"
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  }
                >
                  {step === "transcribing" && <Loader2 className="h-4 w-4 animate-spin inline mr-2" />}
                  2. Transcription
                </div>
                <div
                  className={
                    step === "analyzing"
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  }
                >
                  {step === "analyzing" && <Loader2 className="h-4 w-4 animate-spin inline mr-2" />}
                  3. Analyse IA
                </div>
                <div
                  className={
                    step === "preview" || step === "publishing"
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  }
                >
                  4. Édition
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enregistrement */}
        {step === "recording" && (
          <VoiceRecorder
            onRecordingComplete={handleRecordingComplete}
            maxDuration={300}
          />
        )}

        {/* Preview et édition */}
        {step === "preview" && (
          <div className="space-y-6">
            {/* Transcription */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Transcription
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {transcription}
                </p>
              </CardContent>
            </Card>

            {/* Analyse IA */}
            {aiAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Suggestions IA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    <span className="font-medium">Catégories suggérées :</span>{" "}
                    {aiAnalysis.categories.join(", ")}
                  </p>
                  <p>
                    <span className="font-medium">Tags suggérés :</span>{" "}
                    {aiAnalysis.tags.join(", ")}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Formulaire éditable */}
            <Card>
              <CardHeader>
                <CardTitle>Modifier avant publication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Titre */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Titre</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Titre de l'idée"
                    maxLength={200}
                  />
                  <p className="text-xs text-muted-foreground">
                    {title.length}/200
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Description détaillée"
                    className="min-h-[150px]"
                    maxLength={5000}
                  />
                  <p className="text-xs text-muted-foreground">
                    {description.length}/5000
                  </p>
                </div>

                <Separator />

                {/* Catégories */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Catégories</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <div key={cat} className="flex items-center gap-2">
                        <Checkbox
                          id={cat}
                          checked={selectedCategories.includes(cat)}
                          onCheckedChange={() => toggleCategory(cat)}
                        />
                        <label
                          htmlFor={cat}
                          className="text-sm cursor-pointer"
                        >
                          {cat}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tags
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addTag()}
                      placeholder="Ajouter un tag"
                    />
                    <Button onClick={addTag} variant="outline">
                      Ajouter
                    </Button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removeTag(tag)}
                        >
                          #{tag} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Anonymat */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="anonymous"
                    checked={isAnonymous}
                    onCheckedChange={(checked) =>
                      setIsAnonymous(checked as boolean)
                    }
                  />
                  <label htmlFor="anonymous" className="text-sm cursor-pointer">
                    Publier anonymement
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Boutons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push("/idees")}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button onClick={publishIdea} className="flex-1">
                Publier l&apos;idée
              </Button>
            </div>
          </div>
        )}

        {/* Publishing state */}
        {step === "publishing" && (
          <Card>
            <CardContent className="p-12 text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium">Publication en cours...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PwaContainer>
  );
}
