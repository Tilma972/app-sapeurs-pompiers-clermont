import { createClient } from "@/lib/supabase/server";

export type GalleryCategory = "intervention" | "formation" | "detente" | "evenement" | "vie_caserne";
export type GalleryStatus = "pending" | "approved" | "flagged";

export interface GalleryPhoto {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  image_url: string;
  thumbnail_url: string | null;
  category: GalleryCategory;
  taken_at: string | null; // ISO
  status: GalleryStatus;
  likes_count: number;
  comments_count: number;
  reports_count: number;
  created_at: string; // ISO
}

export async function listPhotos(params?: {
  category?: GalleryCategory;
  authorId?: string;
  limit?: number;
  before?: string; // ISO created_at for pagination
}): Promise<GalleryPhoto[]> {
  const supabase = await createClient();
  let query = supabase.from("gallery_photos").select("*", { count: "exact" }).order("created_at", { ascending: false });

  if (params?.category) query = query.eq("category", params.category);
  if (params?.authorId) query = query.eq("user_id", params.authorId);
  if (params?.before) query = query.lt("created_at", params.before);
  if (params?.limit) query = query.limit(params.limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as GalleryPhoto[];
}

export async function getPhotoById(id: string): Promise<GalleryPhoto | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("gallery_photos").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as GalleryPhoto) ?? null;
}

export async function listMyPhotos(): Promise<GalleryPhoto[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("gallery_photos")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as GalleryPhoto[];
}

export async function createPhoto(input: {
  title: string;
  description?: string;
  image_url: string; // public URL (upload to storage separately)
  thumbnail_url?: string | null;
  category: GalleryCategory;
  taken_at?: string | null; // ISO
}): Promise<{ id: string } | { error: string } > {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "not_authenticated" };

  const { data, error } = await supabase
    .from("gallery_photos")
    .insert({
      user_id: user.id,
      title: input.title,
      description: input.description ?? null,
      image_url: input.image_url,
      thumbnail_url: input.thumbnail_url ?? null,
      category: input.category,
      taken_at: input.taken_at ?? null,
      status: "approved",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}
