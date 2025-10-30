import { getPhotoById } from "@/lib/supabase/gallery";
import { FocusedContainer } from "@/components/layouts/focused/focused-container";
import Link from "next/link";
import Image from "next/image";
import ReportButton from "@/components/gallery/report-button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function FocusedPhotoDetail({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { id } = await params;
  const photo = await getPhotoById(id);
  return (
    <FocusedContainer>
      {!photo ? (
        <div className="p-4 text-sm text-muted-foreground">Photo introuvable.</div>
      ) : (
        <div className="space-y-4">
          <section className="mt-1 sm:mt-2">
            <Link href="/galerie" className="text-xs text-muted-foreground hover:text-foreground">← Retour à la galerie</Link>
          </section>
          <div className="rounded-lg overflow-hidden border relative w-full aspect-[4/3]">
            <Image src={photo.image_url} alt={photo.title} fill sizes="100vw" style={{ objectFit: "cover" }} />
          </div>
          <div>
            <h1 className="text-lg font-semibold">{photo.title}</h1>
            {photo.description && (
              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{photo.description}</p>
            )}
            <div className="text-xs text-muted-foreground mt-2">
              <span>Catégorie: {photo.category}</span>
              {photo.taken_at && <span className="ml-2">• Prise le {new Date(photo.taken_at).toLocaleDateString("fr-FR")}</span>}
              <span className="ml-2">• Publiée le {new Date(photo.created_at).toLocaleDateString("fr-FR")}</span>
            </div>
            <div className="mt-3">
              <ReportButton photoId={photo.id} />
            </div>
          </div>
        </div>
      )}
    </FocusedContainer>
  );
}
