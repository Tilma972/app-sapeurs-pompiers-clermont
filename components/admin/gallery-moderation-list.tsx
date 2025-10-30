"use client";

import Image from "next/image";
import toast from "react-hot-toast";

interface Photo {
  id: string;
  user_id: string;
  image_url: string;
  thumbnail_url: string | null;
  title: string;
  description: string | null;
  reports_count: number;
  profiles?: { full_name?: string | null; email?: string | null } | null;
}

export default function ModerationList({ photos }: { photos: Photo[] }) {
  const act = async (endpoint: string, payload: Record<string, unknown>, success: string) => {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "action_failed");
    toast.success(success);
    // Soft refresh
    window.location.reload();
  };

  const approve = (id: string) => act("/api/admin/gallery/approve", { photo_id: id }, "Photo validée");
  const reject = (id: string) => act("/api/admin/gallery/reject", { photo_id: id }, "Signalement confirmé");
  const remove = (id: string) => act("/api/admin/gallery/delete", { photo_id: id }, "Photo supprimée");
  const ban = (user_id: string) => {
    const reason = window.prompt("Motif du bannissement ?");
    if (!reason) return;
    return act("/api/admin/gallery/ban", { user_id, reason }, "Utilisateur banni");
  };

  if (photos.length === 0) return <div className="text-sm text-muted-foreground">Aucune photo en modération.</div>;

  return (
    <div className="grid grid-cols-1 gap-4">
      {photos.map((p) => (
        <div key={p.id} className="border rounded-lg overflow-hidden">
          <div className="flex">
            <div className="relative w-40 h-28 bg-muted flex-shrink-0">
              <Image src={p.thumbnail_url || p.image_url} alt={p.title} fill sizes="160px" style={{ objectFit: "cover" }} />
            </div>
            <div className="flex-1 p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="font-medium line-clamp-1">{p.title}</div>
                <div className="text-xs text-orange-600">{p.reports_count} signalement(s)</div>
              </div>
              {p.description && <div className="text-sm text-muted-foreground line-clamp-2">{p.description}</div>}
              <div className="text-xs text-muted-foreground mt-1">
                Auteur: {p.profiles?.full_name || p.profiles?.email || p.user_id}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => approve(p.id)} className="px-3 py-1 rounded bg-green-600 text-white text-sm">Valider</button>
                <button onClick={() => reject(p.id)} className="px-3 py-1 rounded bg-yellow-600 text-white text-sm">Confirmer</button>
                <button onClick={() => remove(p.id)} className="px-3 py-1 rounded bg-red-600 text-white text-sm">Supprimer</button>
                <button onClick={() => ban(p.user_id)} className="px-3 py-1 rounded border text-sm">Bannir</button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
