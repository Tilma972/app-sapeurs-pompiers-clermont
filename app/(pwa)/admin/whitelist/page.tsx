"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, Shield, Upload, Search } from "lucide-react";
import { toast } from "react-hot-toast";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminCard, AdminListCard } from "@/components/admin/admin-card";
import { AdminActionSheet } from "@/components/admin/admin-action-sheet";

interface WhitelistEntry {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  used: boolean;
  used_at?: string | null;
}

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
      <div className="flex flex-col gap-3 p-4 border rounded-lg bg-muted/30">
        <div className="grid grid-cols-1 gap-3">
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
    <AdminListCard>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{entry.first_name} {entry.last_name}</p>
        <p className="text-sm text-muted-foreground truncate">
          {entry.email || "Pas d'email"}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
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
    </AdminListCard>
  );
}

function AddEntryForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: ""
  });
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!form.first_name || !form.last_name) {
      toast.error("Nom et prénom requis");
      return;
    }
    setSaving(true);
    const res = await fetch('/api/admin/whitelist/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (res.ok) {
      toast.success("Ajouté à la liste blanche");
      setForm({ first_name: "", last_name: "", email: "" });
      onSuccess();
    } else {
      const err = await res.json();
      toast.error(err.error || "Erreur");
    }
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Input
          placeholder="Prénom *"
          value={form.first_name}
          onChange={e => setForm({ ...form, first_name: e.target.value })}
          disabled={saving}
        />
        <Input
          placeholder="Nom *"
          value={form.last_name}
          onChange={e => setForm({ ...form, last_name: e.target.value })}
          disabled={saving}
        />
        <Input
          placeholder="Email (optionnel)"
          type="email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          disabled={saving}
        />
      </div>
      <Button
        onClick={handleAdd}
        disabled={saving}
        className="w-full"
      >
        {saving ? "Ajout en cours..." : "Ajouter à la liste blanche"}
      </Button>
    </div>
  );
}

export default function WhitelistPage() {
  const [entries, setEntries] = useState<WhitelistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [importing, setImporting] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);

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
    // Reset file input
    e.target.value = '';
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
      <AdminPageHeader
        title="Liste Blanche"
        description="Gérez les pompiers autorisés à s'inscrire"
        icon={<Shield className="h-6 w-6" />}
        actions={
          <AdminActionSheet
            trigger={
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Ajouter</span>
              </Button>
            }
            title="Ajouter un pompier"
            description="Ajoutez un pompier à la liste blanche pour l'autoriser à s'inscrire"
            open={addSheetOpen}
            onOpenChange={setAddSheetOpen}
          >
            <AddEntryForm onSuccess={() => {
              loadEntries(page, search);
              setAddSheetOpen(false);
            }} />
          </AdminActionSheet>
        }
      />

      {/* Recherche */}
      <AdminCard>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Recherche nom, prénom, email..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="pl-9"
            />
          </div>
          <Button onClick={() => loadEntries(1, search)} variant="secondary">
            Rechercher
          </Button>
        </div>
      </AdminCard>

      {/* Import CSV */}
      <AdminCard
        title="Import CSV"
        description="Format : prenom,nom,email (l'email est optionnel)"
      >
        <div className="relative">
          <Input
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            disabled={importing}
            className="cursor-pointer"
          />
          {importing && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded">
              <p className="text-sm text-muted-foreground">Import en cours...</p>
            </div>
          )}
        </div>
      </AdminCard>

      {/* Liste */}
      <AdminCard
        title={`Pompiers autorisés (${entries.length})`}
      >
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun résultat
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <WhitelistEntryRow
                key={entry.id}
                entry={entry}
                onUpdate={() => loadEntries(page, search)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Précédent
            </Button>
            <span className="px-3 py-2 text-sm text-muted-foreground">
              Page {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Suivant
            </Button>
          </div>
        )}
      </AdminCard>
    </div>
  );
}
