import { FocusedAppBar } from "@/components/layouts/focused/focused-app-bar"
import { FocusedBottomNav } from "@/components/layouts/focused/focused-bottom-nav"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function FocusedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_active')
      .eq('id', user.id)
      .single()
    if (profile && profile.is_active === false) {
      // Utilisateur non approuvé: renvoyer vers la landing avec un flag
      redirect('/?pending=1')
    }
  }

  const initials = user?.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || 'SP'

  return (
    <div className="min-h-screen flex flex-col">
      <FocusedAppBar
        user={{
          avatar_url: (user?.user_metadata as { avatar_url?: string } | undefined)?.avatar_url,
          initials,
          full_name: (user?.user_metadata as { full_name?: string } | undefined)?.full_name,
          email: user?.email ?? undefined,
        }}
      />
      <main className="flex-1 pb-20 sm:pb-6 overflow-x-hidden">
        {children}
      </main>
      <FocusedBottomNav />
    </div>
  )
}
