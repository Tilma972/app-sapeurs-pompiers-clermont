'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import { AdminCard } from '@/components/admin/admin-card';

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001';

type AppSettings = {
  calendar_price: number;
  min_retrocession: number;
  recommended_retrocession: number;
};

export default function AdminSettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    calendar_price: 8,
    min_retrocession: 10,
    recommended_retrocession: 30,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('calendar_price, min_retrocession, recommended_retrocession')
          .eq('id', SETTINGS_ID)
          .maybeSingle();
        if (mounted && data) {
          setSettings({
            calendar_price: Number(data.calendar_price ?? 8),
            min_retrocession: Number(data.min_retrocession ?? 10),
            recommended_retrocession: Number(data.recommended_retrocession ?? 30),
          });
        }
      } catch (e) {
        console.error(e);
        toast.error("Impossible de charger les paramètres");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [supabase]);

  const onSave = async () => {
    if (settings.recommended_retrocession < settings.min_retrocession) {
      toast.error('La recommandation doit être ≥ au minimum');
      return;
    }
    if (settings.min_retrocession < 0 || settings.recommended_retrocession > 100) {
      toast.error('Valeurs de rétrocession invalides (0-100)');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          id: SETTINGS_ID,
          calendar_price: settings.calendar_price,
          min_retrocession: settings.min_retrocession,
          recommended_retrocession: settings.recommended_retrocession,
          updated_at: new Date().toISOString(),
          updated_by: user?.id ?? null,
        }, { onConflict: 'id' });
      if (error) throw error;
      toast.success('Paramètres enregistrés');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement';
      console.error(e);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Paramètres globaux"
        description="Définissez les paramètres de base de la campagne calendriers"
        icon={<Settings className="h-6 w-6" />}
      />

      <AdminCard
        title="Campagne calendriers"
        description="Prix et répartition recommandée"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="calendar_price">Prix du calendrier (€)</Label>
              <Input
                id="calendar_price"
                type="number"
                min={0}
                step={1}
                value={settings.calendar_price}
                onChange={(e) => setSettings(s => ({ ...s, calendar_price: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_retrocession">Rétrocession minimale (%)</Label>
              <Input
                id="min_retrocession"
                type="number"
                min={0}
                max={100}
                step={1}
                value={settings.min_retrocession}
                onChange={(e) => setSettings(s => ({ ...s, min_retrocession: Number(e.target.value) }))}
              />
              <p className="text-xs text-muted-foreground">
                Pourcentage minimum que les pompiers doivent reverser au pot d&apos;équipe
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recommended_retrocession">Rétrocession recommandée (%)</Label>
              <Input
                id="recommended_retrocession"
                type="number"
                min={settings.min_retrocession}
                max={100}
                step={1}
                value={settings.recommended_retrocession}
                onChange={(e) => setSettings(s => ({ ...s, recommended_retrocession: Number(e.target.value) }))}
              />
              <p className="text-xs text-muted-foreground">
                Pourcentage suggéré aux pompiers pour leurs contributions
              </p>
            </div>
          </div>
          <Button onClick={onSave} disabled={saving || loading} className="w-full">
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </AdminCard>
    </div>
  );
}
