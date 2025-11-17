import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ModerationList from "@/components/admin/gallery-moderation-list";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminCard } from "@/components/admin/admin-card";
import { Image as ImageIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GalleryModerationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileErr || !profile || !['admin', 'moderateur'].includes((profile as { role?: string } | null)?.role || '')) {
    redirect('/dashboard');
  }

  const { data: flaggedPhotos, error: photosErr } = await supabase
    .from('gallery_photos')
    .select(`*, profiles:user_id (full_name, email)`)
    .eq('status', 'flagged')
    .order('reports_count', { ascending: false });

  if (photosErr) {
    return (
      <div className="space-y-6">
        <AdminPageHeader
          title="Modération Galerie"
          description="Erreur de chargement des photos signalées"
          icon={<ImageIcon className="h-6 w-6" />}
        />
      </div>
    );
  }

  // Fetch bans for the authors of these photos to enable Unban action
  const userIds = Array.from(new Set((flaggedPhotos || []).map(p => p.user_id))).filter(Boolean) as string[];
  let bannedUserIds: string[] = [];
  if (userIds.length > 0) {
    const { data: bans } = await supabase
      .from('gallery_bans')
      .select('user_id')
      .in('user_id', userIds);
    bannedUserIds = (bans || []).map(b => b.user_id as string);
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Modération Galerie"
        description={`${flaggedPhotos?.length || 0} photo(s) signalée(s)`}
        icon={<ImageIcon className="h-6 w-6" />}
      />

      <AdminCard>
        <ModerationList photos={flaggedPhotos || []} bannedUserIds={bannedUserIds} />
      </AdminCard>
    </div>
  );
}
