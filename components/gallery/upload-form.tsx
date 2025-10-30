"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import toast from "react-hot-toast";

type Category = "intervention" | "formation" | "detente" | "evenement" | "vie_caserne";

function slugifyFilename(name: string) {
  const dot = name.lastIndexOf(".");
  const base = (dot >= 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  const ext = dot >= 0 ? name.slice(dot).toLowerCase() : "";
  return `${base}${ext}`;
}

export default function GalleryUploadForm() {
  const supabase = createBrowserSupabase();
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("detente");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0); // overall progress 0..100
  const [fileStates, setFileStates] = useState<Record<number, "pending"|"uploading"|"done"|"error">>({});
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onSelectFiles = useCallback((list: FileList | null) => {
    if (!list) return;
    const max = 10 * 1024 * 1024;
    const accepted = Array.from(list).filter((f) => f.size <= max && /^image\/(jpeg|png|webp)$/i.test(f.type));
    setFiles((prev) => [...prev, ...accepted].slice(0, 12));
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    onSelectFiles(e.dataTransfer.files);
  }, [onSelectFiles]);

  const removeAt = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);

  const canPublish = files.length > 0 && !!title && !busy;

  const generateThumbnail = async (file: File): Promise<Blob> => {
    const img = document.createElement("img");
    const url = URL.createObjectURL(file);
    try {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = (e) => reject(e);
        img.src = url;
      });
      const maxW = 640;
      const scale = Math.min(1, maxW / img.naturalWidth);
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas_context");
      ctx.drawImage(img, 0, 0, w, h);
      const blob: Blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b as Blob), "image/webp", 0.85));
      return blob;
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const handlePublish = async () => {
    setBusy(true);
    setProgress(0);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) throw new Error("not_authenticated");

      const total = files.length;
      const createdIds: string[] = [];
      for (let i = 0; i < total; i++) {
        const file = files[i];
        setFileStates((s) => ({ ...s, [i]: "uploading" }));
        const key = `${user.id}/${Date.now()}-${i}-${slugifyFilename(file.name)}`;

        const { error: upErr } = await supabase.storage
          .from("gallery")
          .upload(key, file, { cacheControl: "3600", upsert: false, contentType: file.type });
        if (upErr) { setFileStates((s) => ({ ...s, [i]: "error" })); throw upErr; }

        const { data: pub } = supabase.storage.from("gallery").getPublicUrl(key);
        const imageUrl = pub.publicUrl;

        // Thumbnail
        let thumbUrl: string | null = null;
        try {
          const thumbBlob = await generateThumbnail(file);
          const thumbKey = `${user.id}/thumbs/${Date.now()}-${i}-${slugifyFilename(file.name).replace(/\.[^.]+$/, "")}.webp`;
          const { error: thErr } = await supabase.storage.from("gallery").upload(thumbKey, thumbBlob, {
            cacheControl: "604800",
            upsert: false,
            contentType: "image/webp",
          });
          if (!thErr) {
            const { data: pubT } = supabase.storage.from("gallery").getPublicUrl(thumbKey);
            thumbUrl = pubT.publicUrl;
          }
        } catch (e) {
          // Ignore thumbnail failure, continue with full image only
          console.warn("thumbnail_failed", e);
        }

        const { data: inserted, error: insErr } = await supabase
          .from("gallery_photos")
          .insert({
            user_id: user.id,
            title,
            description: description || null,
            image_url: imageUrl,
            thumbnail_url: thumbUrl || imageUrl,
            category,
            status: "approved",
          })
          .select("id")
          .single();
        if (insErr) { setFileStates((s) => ({ ...s, [i]: "error" })); throw insErr; }
        createdIds.push(inserted.id);
        setFileStates((s) => ({ ...s, [i]: "done" }));
        setProgress(Math.round(((i + 1) / total) * 100));
      }
      toast.success(`${createdIds.length} photo${createdIds.length > 1 ? 's' : ''} publiée${createdIds.length > 1 ? 's' : ''}`);
      router.replace("/galerie");
    } catch (e) {
      console.error(e);
      toast.error("Échec de l'upload. Vérifiez la taille/format et réessayez.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        className={`rounded-lg border-2 border-dashed p-6 text-center ${isDragging ? "border-primary bg-primary/5" : "border-muted"}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDrop={onDrop}
      >
        <div className="mb-2 text-sm">Glissez-déposez vos images ici</div>
        <div className="text-xs text-muted-foreground">Formats: JPG, PNG, WEBP · 10 Mo max / image</div>
        <div className="mt-3">
          <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>Parcourir</Button>
          <input ref={inputRef} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => onSelectFiles(e.target.files)} />
        </div>
      </div>

      {/* Previews */}
      {files.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {previews.map((src, i) => (
            <div key={i} className="relative w-20 h-20 rounded-md overflow-hidden border flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="preview" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeAt(i)} className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded px-1 text-[10px]">×</button>
              {fileStates[i] && (
                <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[10px] text-center py-0.5">
                  {fileStates[i] === 'uploading' ? 'Téléversement…' : fileStates[i] === 'done' ? 'OK' : fileStates[i] === 'error' ? 'Erreur' : ''}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Overall progress bar */}
      {busy && (
        <div className="w-full h-2 bg-muted rounded">
          <div className="h-2 bg-primary rounded" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Metadata */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm mb-1">Titre</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full h-10 border rounded px-3 bg-background" placeholder="Titre de l'image" />
        </div>
        <div>
          <label className="block text-sm mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full border rounded px-3 py-2 bg-background" placeholder="Ajoutez une description..." />
        </div>
        <div>
          <label className="block text-sm mb-1">Catégorie</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as Category)} className="w-full h-10 border rounded px-3 bg-background">
            <option value="detente">Détente</option>
            <option value="formation">Formation</option>
            <option value="intervention">Intervention</option>
            <option value="evenement">Événement</option>
            <option value="vie_caserne">Vie de caserne</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Badge variant="secondary">{files.length} fichier{files.length > 1 ? "s" : ""} sélectionné{files.length > 1 ? "s" : ""}</Badge>
        <Button type="button" onClick={handlePublish} disabled={!canPublish} className="min-w-28">
          {busy ? `Publication ${progress}%` : "Publier"}
        </Button>
      </div>
    </div>
  );
}
