import { PwaAppBar } from "@/components/layouts/pwa/pwa-app-bar"
import { PwaBottomNav } from "@/components/layouts/pwa/pwa-bottom-nav"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { getAvatarUrl } from "@/lib/utils/avatar"

export default async function PwaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_active, first_name, last_name, avatar_url, full_name')
      .eq('id', user.id)
      .single()
    
    if (profile && profile.is_active === false) {
      // Utilisateur non approuvé: renvoyer vers la landing avec un flag
      redirect('/?pending=1')
    }

    // Générer les initiales depuis first_name + last_name (ou fallback sur full_name)
    const initials = profile?.first_name && profile?.last_name
      ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
      : profile?.full_name
        ?.split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase() || 'SP'

    // Construire l'URL complète de l'avatar avec helper
    const avatarUrl = getAvatarUrl(profile?.avatar_url)

    return (
      <div className="min-h-screen flex flex-col">
        <PwaAppBar
          user={{
            avatar_url: avatarUrl || undefined,
            initials,
            full_name: profile?.first_name && profile?.last_name 
              ? `${profile.first_name} ${profile.last_name}` 
              : profile?.full_name || user?.email || undefined,
            email: user?.email ?? undefined,
          }}
        />
        <main className="flex-1 pb-20 sm:pb-6 overflow-x-hidden">
          {children}
        </main>
        <PwaBottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PwaAppBar
        user={{
          avatar_url: undefined,
          initials: 'SP',
          full_name: undefined,
          email: undefined,
        }}
      />
      <main className="flex-1 pb-20 sm:pb-6 overflow-x-hidden">
        {children}
      </main>
      <PwaBottomNav />
    </div>
  )
}
