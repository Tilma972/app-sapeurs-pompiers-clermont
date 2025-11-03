import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FocusedContainer } from "@/components/layouts/focused/focused-container";
import GalleryUploadForm from "@/components/gallery/upload-form";

export default async function NouveauFocusedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <FocusedContainer>
      <div className="max-w-md mx-auto p-2 sm:p-4 space-y-4">
        <h1 className="text-xl font-semibold">Ajouter des photos</h1>
        <GalleryUploadForm />
      </div>
    </FocusedContainer>
  );
}
