import Link from "next/link";
import { listPhotos, getUserLikedPhotos, type GalleryCategory } from "@/lib/supabase/gallery";
import { PwaContainer } from "@/components/layouts/pwa/pwa-container";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PhotoCardWithLike } from "@/components/gallery/photo-card-with-like";

const categories: { value: "all" | GalleryCategory; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "intervention", label: "Intervention" },
  { value: "formation", label: "Formation" },
  { value: "detente", label: "Détente" },
  { value: "evenement", label: "Événement" },
  { value: "vie_caserne", label: "Vie de caserne" },
];

export const dynamic = "force-dynamic";

export default async function GaleriePwaPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: GalleryCategory | "all" }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { category } = await searchParams;
  const catParam = (category || "all") as "all" | GalleryCategory;
  const photos = await listPhotos({ category: catParam === "all" ? undefined : catParam, limit: 48 });
  
  // Récupérer les likes de l'utilisateur
  const photoIds = photos.map((p) => p.id);
  const likedPhotoIds = await getUserLikedPhotos(photoIds);

  return (
  <PwaContainer>
      <div className="space-y-6 pb-20">
        {/* Intro */}
        <section className="space-y-1 mt-1 sm:mt-2">
          <p className="text-sm text-muted-foreground">Partage et souvenirs de la caserne.</p>
        </section>

        {/* Filtres */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((c) => {
            const isActive = c.value === catParam;
            const href = c.value === "all" ? "/galerie" : `/galerie?category=${c.value}`;
            return (
              <Link key={c.value} href={href} className={`px-3 py-1 rounded-full text-sm whitespace-nowrap border ${isActive ? "bg-primary text-primary-foreground border-transparent" : "bg-muted hover:bg-muted/80"}`}>
                {c.label}
              </Link>
            );
          })}
        </div>

        {/* Stats + action */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{photos.length} photo{photos.length > 1 ? "s" : ""}</span>
          <Link href="/galerie/nouveau" className="text-primary hover:underline">+ Ajouter</Link>
        </div>

        {/* Masonry grid */}
        <div className="columns-2 md:columns-3 gap-3 [column-fill:_balance] pb-4">
          {photos.map((p) => (
            <PhotoCardWithLike
              key={p.id}
              photo={p}
              initialLiked={likedPhotoIds.includes(p.id)}
            />
          ))}

          {photos.length === 0 && (
            <div className="col-span-2 text-center text-sm text-muted-foreground py-8">
              Aucune photo dans cette catégorie pour le moment.
            </div>
          )}
        </div>
        {/* Floating action button */}
        <Link href="/galerie/nouveau" className="fixed bottom-20 right-4 sm:right-6 h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
          +
        </Link>
      </div>
  </PwaContainer>
  );
}
