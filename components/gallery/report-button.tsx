"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function ReportButton({ photoId }: { photoId: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const reasons = [
    "Contenu inapproprié",
    "Violation de confidentialité",
    "Mauvaise qualité",
    "Spam ou hors-sujet",
    "Autre",
  ];

  const report = async (reason: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/gallery/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo_id: photoId, reason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "report_failed");
      toast.success("Signalement envoyé. Merci pour votre vigilance.");
      setOpen(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {!open ? (
        <button onClick={() => setOpen(true)} className="text-xs px-2 py-1 rounded border hover:bg-muted">Signaler</button>
      ) : (
        <div className="border rounded p-2 space-y-2">
          <div className="text-xs text-muted-foreground">Motif du signalement</div>
          <div className="grid grid-cols-1 gap-2">
            {reasons.map((r) => (
              <button key={r} disabled={busy} onClick={() => report(r)} className="text-left px-2 py-1 rounded border hover:bg-muted text-sm">
                {r}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
