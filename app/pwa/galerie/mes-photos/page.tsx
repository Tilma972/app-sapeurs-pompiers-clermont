import Link from "next/link";
import Image from "next/image";
import { listMyPhotos } from "@/lib/supabase/gallery";
import { FocusedContainer } from "@/components/layouts/focused/focused-container";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MesPhotosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const photos = await listMyPhotos();
  return (
    <FocusedContainer>
      <div className="space-y-4">
        <section className="space-y-1 mt-1 sm:mt-2">
          <p className="text-sm text-muted-foreground">Vos photos publiées.</p>
        </section>
        <div className="columns-2 md:columns-3 gap-3 [column-fill:_balance] pb-4">
          {photos.map((p) => (
            <div key={p.id} className="mb-3 break-inside-avoid rounded-lg overflow-hidden border bg-card" style={{ breakInside: "avoid" }}>
              <div className="relative w-full aspect-[4/3] bg-muted">
                <Image src={p.thumbnail_url || p.image_url} alt={p.title} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" style={{ objectFit: "cover" }} />
              </div>
              <div className="px-2 py-2">
                <div className="text-sm font-medium line-clamp-2">{p.title}</div>
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <Link href={`/galerie/${p.id}`} className="hover:underline">Voir</Link>
                </div>
              </div>
            </div>
          ))}
          {photos.length === 0 && (
            <div className="col-span-2 text-center text-sm text-muted-foreground py-8">Vous n&apos;avez pas encore publié de photo.</div>
          )}
        </div>
      </div>
    </FocusedContainer>
  );
}
