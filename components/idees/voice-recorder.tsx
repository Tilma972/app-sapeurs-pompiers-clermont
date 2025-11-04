/**
 * VoiceRecorder - Enregistrement audio avec waveform
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import toast from "react-hot-toast";

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  maxDuration?: number; // en secondes
}

type RecordingState = "idle" | "recording" | "paused" | "completed";

export function VoiceRecorder({
  onRecordingComplete,
  maxDuration = 300, // 5 minutes par défaut
}: VoiceRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [waveformData, setWaveformData] = useState<number[]>(
    Array(40).fill(0)
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Formater la durée en mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Nettoyer les ressources
  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  // Analyser le flux audio pour la waveform
  const analyzeAudio = (stream: MediaStream) => {
    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    source.connect(analyserRef.current);

    analyserRef.current.fftSize = 256;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateWaveform = () => {
      if (analyserRef.current && recordingState === "recording") {
        analyserRef.current.getByteFrequencyData(dataArray);

        // Prendre 40 échantillons
        const samples = 40;
        const step = Math.floor(bufferLength / samples);
        const newWaveform = [];

        for (let i = 0; i < samples; i++) {
          const value = dataArray[i * step] || 0;
          // Normaliser entre 0 et 1
          newWaveform.push(value / 255);
        }

        setWaveformData(newWaveform);
        animationFrameRef.current = requestAnimationFrame(updateWaveform);
      }
    };

    updateWaveform();
  };

  // Démarrer l'enregistrement
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Vérifier le support des formats
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4";

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setRecordingState("completed");
        cleanup();

        // Arrêter tous les tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setRecordingState("recording");
      setDuration(0);

      // Analyser l'audio pour la waveform
      analyzeAudio(stream);

      // Timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const next = prev + 1;
          if (next >= maxDuration) {
            stopRecording();
            toast.error(`Durée maximale atteinte (${maxDuration / 60} min)`);
          }
          return next;
        });
      }, 1000);

      toast.success("Enregistrement démarré");
    } catch (error) {
      console.error("Erreur accès microphone:", error);
      toast.error("Impossible d'accéder au microphone");
    }
  };

  // Mettre en pause
  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === "recording") {
      mediaRecorderRef.current.pause();
      setRecordingState("paused");
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      toast("Enregistrement en pause");
    }
  };

  // Reprendre
  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === "paused") {
      mediaRecorderRef.current.resume();
      setRecordingState("recording");

      // Relancer le timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const next = prev + 1;
          if (next >= maxDuration) {
            stopRecording();
            toast.error(`Durée maximale atteinte (${maxDuration / 60} min)`);
          }
          return next;
        });
      }, 1000);
    }
  };

  // Arrêter l'enregistrement
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
  };

  // Supprimer l'enregistrement
  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingState("idle");
    setDuration(0);
    setWaveformData(Array(40).fill(0));
    cleanup();
  };

  // Valider l'enregistrement
  const confirmRecording = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob, duration);
    }
  };

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      cleanup();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  return (
    <Card className="w-full">
      <CardContent className="p-6 space-y-6">
        {/* Timer */}
        <div className="text-center">
          <div className="text-4xl font-mono font-bold tabular-nums">
            {formatDuration(duration)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Max: {formatDuration(maxDuration)}
          </p>
        </div>

        {/* Waveform */}
        <div className="flex items-center justify-center gap-1 h-32 bg-muted rounded-lg p-4">
          {waveformData.map((value, index) => (
            <div
              key={index}
              className="flex-1 bg-primary rounded-full transition-all duration-100"
              style={{
                height: `${Math.max(
                  4,
                  recordingState === "recording" ? value * 100 : 4
                )}%`,
                opacity: recordingState === "recording" ? 0.8 : 0.3,
              }}
            />
          ))}
        </div>

        {/* Preview audio si terminé */}
        {recordingState === "completed" && audioUrl && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Aperçu :</p>
            <audio controls className="w-full">
              <source src={audioUrl} type="audio/webm" />
              <source src={audioUrl} type="audio/mp4" />
              Votre navigateur ne supporte pas la lecture audio.
            </audio>
          </div>
        )}

        {/* Boutons de contrôle */}
        <div className="flex justify-center gap-3">
          {recordingState === "idle" && (
            <Button onClick={startRecording} size="lg" className="gap-2">
              <Mic className="h-5 w-5" />
              Démarrer l&apos;enregistrement
            </Button>
          )}

          {recordingState === "recording" && (
            <>
              <Button
                onClick={pauseRecording}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <Pause className="h-5 w-5" />
                Pause
              </Button>
              <Button
                onClick={stopRecording}
                variant="destructive"
                size="lg"
                className="gap-2"
              >
                <Square className="h-5 w-5" />
                Arrêter
              </Button>
            </>
          )}

          {recordingState === "paused" && (
            <>
              <Button
                onClick={resumeRecording}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <Play className="h-5 w-5" />
                Reprendre
              </Button>
              <Button
                onClick={stopRecording}
                variant="destructive"
                size="lg"
                className="gap-2"
              >
                <Square className="h-5 w-5" />
                Arrêter
              </Button>
            </>
          )}

          {recordingState === "completed" && (
            <>
              <Button
                onClick={deleteRecording}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <Trash2 className="h-5 w-5" />
                Supprimer
              </Button>
              <Button
                onClick={confirmRecording}
                size="lg"
                className="gap-2"
              >
                <Check className="h-5 w-5" />
                Valider
              </Button>
            </>
          )}
        </div>

        {/* Conseils */}
        {recordingState === "idle" && (
          <div className="text-xs text-muted-foreground text-center space-y-1">
            <p>💡 Parlez clairement dans votre microphone</p>
            <p>⏱️ Durée maximale : {maxDuration / 60} minutes</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
