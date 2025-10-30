import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ModerationList from "@/components/admin/gallery-moderation-list";

export const dynamic = "force-dynamic";

export default async function GalleryModerationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'moderateur'].includes(profile.role as string)) {
    redirect('/dashboard');
  }

  const { data: flaggedPhotos } = await supabase
    .from('gallery_photos')
    .select(`*, profiles:user_id (full_name, email)`)
    .eq('status', 'flagged')
    .order('reports_count', { ascending: false });

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Modération Galerie</h1>
        <p className="text-muted-foreground">
          {flaggedPhotos?.length || 0} photo(s) signalée(s)
        </p>
      </div>

      <ModerationList photos={flaggedPhotos || []} />
    </div>
  );
}
