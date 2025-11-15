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

/**
 * Toggle like sur une photo (like si pas liké, unlike sinon)
 */
export async function toggleLike(photoId: string): Promise<{ liked: boolean; count: number }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  console.log("🔍 [toggleLike] Auth check:", {
    hasUser: !!user,
    userId: user?.id,
    authError: authError?.message,
  });

  if (!user) {
    console.error("❌ [toggleLike] Not authenticated");
    throw new Error("not_authenticated");
  }

  // Vérifier si like existe déjà
  console.log("🔍 [toggleLike] Checking existing like for photo:", photoId, "user:", user.id);
  const { data: existing, error: checkError } = await supabase
    .from("gallery_likes")
    .select("photo_id")
    .eq("photo_id", photoId)
    .eq("user_id", user.id)
    .maybeSingle();

  console.log("🔍 [toggleLike] Existing like:", existing, "error:", checkError?.message);

  let newLikedState: boolean;

  if (existing) {
    // Supprimer le like (unlike)
    console.log("🗑️ [toggleLike] Deleting like");
    const { error: deleteError } = await supabase
      .from("gallery_likes")
      .delete()
      .eq("photo_id", photoId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("❌ [toggleLike] Delete error:", deleteError);
      throw deleteError;
    }
    console.log("✅ [toggleLike] Like deleted successfully");
    newLikedState = false;
  } else {
    // Ajouter le like
    console.log("➕ [toggleLike] Inserting like");
    const { error: insertError } = await supabase
      .from("gallery_likes")
      .insert({ photo_id: photoId, user_id: user.id });

    if (insertError) {
      console.error("❌ [toggleLike] Insert error:", insertError);
      throw insertError;
    }
    console.log("✅ [toggleLike] Like inserted successfully");
    newLikedState = true;
  }

  // Compter directement les likes au lieu de lire likes_count (évite problème de timing avec trigger)
  console.log("🔢 [toggleLike] Counting likes for photo:", photoId);
  const { count, error: countError } = await supabase
    .from("gallery_likes")
    .select("*", { count: "exact", head: true })
    .eq("photo_id", photoId);

  if (countError) {
    console.error("❌ [toggleLike] Count error:", countError);
  }
  console.log("🔢 [toggleLike] Final count:", count);

  const result = {
    liked: newLikedState,
    count: count || 0,
  };

  console.log("✅ [toggleLike] Returning result:", result);
  return result;
}

/**
 * Récupérer les IDs des photos likées par l'utilisateur connecté
 */
export async function getUserLikedPhotos(photoIds: string[]): Promise<string[]> {
  if (photoIds.length === 0) return [];

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  console.log("🔍 [getUserLikedPhotos] Auth check:", {
    hasUser: !!user,
    userId: user?.id,
    authError: authError?.message,
    photoIds,
  });

  if (!user) {
    console.warn("⚠️ [getUserLikedPhotos] No user, returning empty array");
    return [];
  }

  const { data, error } = await supabase
    .from("gallery_likes")
    .select("photo_id")
    .eq("user_id", user.id)
    .in("photo_id", photoIds);

  console.log("🔍 [getUserLikedPhotos] Query result:", {
    data,
    error: error?.message,
    count: data?.length || 0,
  });

  const likedIds = (data || []).map(like => like.photo_id);
  console.log("✅ [getUserLikedPhotos] Returning liked photo IDs:", likedIds);

  return likedIds;
}
