"use client";

import { useEffect, useState } from "react";
function WhitelistEntryRow({ 
  entry, 
  onUpdate, 
  onDelete 
}: { 
  entry: WhitelistEntry; 
  onUpdate: () => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    first_name: entry.first_name,
    last_name: entry.last_name,
    email: entry.email || ""
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.error("Nom et prénom requis");
      return;
    }
    setSaving(true);
    const res = await fetch('/api/admin/whitelist/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: entry.id, ...form })
    });
    if (res.ok) {
      toast.success("Modifié avec succès");
      setEditing(false);
      onUpdate();
    } else {
      const err = await res.json();
      toast.error(err.error || "Erreur");
    }
    setSaving(false);
  }

  function handleCancel() {
    setForm({
      first_name: entry.first_name,
      last_name: entry.last_name,
      email: entry.email || ""
    });
    setEditing(false);
  }

  if (editing && !entry.used) {
    return (
      <div className="flex flex-col gap-2 p-3 border rounded bg-muted/30">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Input
            placeholder="Prénom"
            value={form.first_name}
            onChange={e => setForm({ ...form, first_name: e.target.value })}
            disabled={saving}
          />
          <Input
            placeholder="Nom"
            value={form.last_name}
            onChange={e => setForm({ ...form, last_name: e.target.value })}
            disabled={saving}
          />
          <Input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            disabled={saving}
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleCancel}
            disabled={saving}
          >
            Annuler
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "..." : "Sauvegarder"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 border rounded">
      <div>
        <p className="font-medium">{entry.first_name} {entry.last_name}</p>
        <p className="text-sm text-muted-foreground">
          {entry.email || "Pas d'email"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={entry.used ? "secondary" : "default"}>
          {entry.used ? "Inscrit" : "Autorisé"}
        </Badge>
        {!entry.used && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditing(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(entry.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "react-hot-toast";

interface WhitelistEntry {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  used: boolean;
  used_at?: string | null;
}

export default function WhitelistPage() {
  const [entries, setEntries] = useState<WhitelistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: ""
  });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [importing, setImporting] = useState(false);

  // Charger la liste avec pagination et recherche
  async function loadEntries(pageNum = 1, searchTerm = "") {
    setLoading(true);
    const params = new URLSearchParams({
      page: pageNum.toString(),
      limit: "50",
      search: searchTerm
    });
    const res = await fetch(`/api/admin/whitelist/list?${params}`);
    const data = await res.json();
    setEntries(data.entries || []);
    setTotalPages(data.pagination?.pages || 1);
    setLoading(false);
  }

  // Ajouter manuellement
  async function handleAdd() {
    if (!form.first_name || !form.last_name) {
  toast.error("Nom et prénom requis");
      return;
    }
    const res = await fetch('/api/admin/whitelist/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (res.ok) {
  toast.success("Ajouté à la liste blanche");
      setForm({ first_name: "", last_name: "", email: "" });
      loadEntries(page, search);
    } else {
      const err = await res.json();
  toast.error(err.error || "Erreur");
    }
  }

  // Import CSV
  async function handleCSVUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const text = await file.text();
    const lines = text.split('\n').filter(Boolean);
    const entries = lines.slice(1).map(line => {
      const [firstName, lastName, email] = line.split(',').map(s => s.trim());
      return { first_name: firstName, last_name: lastName, email: email || null };
    }).filter(e => e.first_name && e.last_name);
    const res = await fetch('/api/admin/whitelist/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries })
    });
    const data = await res.json();
    if (res.ok) {
  toast.success(`${data.imported} importés, ${data.errors.length} erreurs`);
      if (data.errors.length) {
    data.errors.forEach((err: { entry: string; reason: string }) => toast.error(`${err.entry}: ${err.reason}`));
      }
      loadEntries(page, search);
    } else {
  toast.error(data.error || "Erreur import");
    }
    setImporting(false);
  }

  // Supprimer
  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette entrée ?")) return;
    const res = await fetch(`/api/admin/whitelist/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const data = await res.json();
    if (res.ok) {
  toast.success(`Supprimé : ${data.deleted?.name || ''}`);
      loadEntries(page, search);
    } else {
  toast.error(data.error || "Erreur suppression");
    }
  }

  useEffect(() => { loadEntries(page, search); }, [page, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Liste Blanche</h1>
        <p className="text-muted-foreground">
          Gérez les pompiers autorisés à s&apos;inscrire
        </p>
      </div>

      {/* Recherche */}
      <div className="flex gap-2 mb-2">
        <Input
          placeholder="Recherche nom, prénom, email..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
        <Button onClick={() => loadEntries(1, search)}>Rechercher</Button>
      </div>

      {/* Ajouter manuellement */}
      <Card className="p-4">
        <h2 className="font-semibold mb-4">Ajouter un pompier</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input
            placeholder="Prénom"
            value={form.first_name}
            onChange={e => setForm({ ...form, first_name: e.target.value })}
          />
          <Input
            placeholder="Nom"
            value={form.last_name}
            onChange={e => setForm({ ...form, last_name: e.target.value })}
          />
          <Input
            placeholder="Email (optionnel)"
            type="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
          <Button onClick={handleAdd} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </Card>

      {/* Import CSV */}
      <Card className="p-4">
        <h2 className="font-semibold mb-2">Import CSV</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Format : prenom,nom,email (l&apos;email est optionnel)
        </p>
        <Input
          type="file"
          accept=".csv"
          onChange={handleCSVUpload}
          disabled={importing}
        />
      </Card>

      {/* Liste */}
      <Card className="p-4">
        <h2 className="font-semibold mb-4">Pompiers autorisés ({entries.length})</h2>
        <div className="space-y-2">
          {entries.map((entry) => (
            <WhitelistEntryRow 
              key={entry.id} 
              entry={entry} 
              onUpdate={() => loadEntries(page, search)}
              onDelete={handleDelete}
            />
          ))}
        </div>
        {/* Pagination */}
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Précédent
          </Button>
          <span className="px-2 py-1 text-sm">Page {page} / {totalPages}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Suivant
          </Button>
        </div>
      </Card>
    </div>
  );
}
