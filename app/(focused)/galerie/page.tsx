import Link from "next/link";
import Image from "next/image";
import { listPhotos, type GalleryCategory } from "@/lib/supabase/gallery";
import { FocusedContainer } from "@/components/layouts/focused/focused-container";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const categories: { value: "all" | GalleryCategory; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "intervention", label: "Intervention" },
  { value: "formation", label: "Formation" },
  { value: "detente", label: "Détente" },
  { value: "evenement", label: "Événement" },
  { value: "vie_caserne", label: "Vie de caserne" },
];

export const dynamic = "force-dynamic";

export default async function GalerieFocusedPage({
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

  return (
    <FocusedContainer>
      <div className="space-y-4">
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
            <Link
              key={p.id}
              href={`/galerie/${p.id}`}
              className="mb-3 block break-inside-avoid rounded-lg overflow-hidden border bg-card"
              style={{ breakInside: "avoid" }}
            >
              <div className="relative w-full aspect-[4/3] bg-muted">
                <Image src={p.thumbnail_url || p.image_url} alt={p.title} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" style={{ objectFit: "cover" }} />
                <div className="absolute top-2 left-2">
                  <Badge variant="outline" className="bg-background/80 backdrop-blur text-foreground">
                    {p.category}
                  </Badge>
                </div>
              </div>
              <div className="px-2 py-2">
                <div className="text-sm font-medium line-clamp-2">{p.title}</div>
                {p.description && (
                  <div className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{p.description}</div>
                )}
              </div>
            </Link>
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
    </FocusedContainer>
  );
}
