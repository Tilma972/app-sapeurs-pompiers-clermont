import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PwaContainer } from "@/components/layouts/pwa/pwa-container"

export default async function MonComptePage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/sign-in")
  }

  return (
    <PwaContainer>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Mon Compte</h1>
        <p className="text-muted-foreground">
          Page en construction...
        </p>
      </div>
    </PwaContainer>
  )
}
