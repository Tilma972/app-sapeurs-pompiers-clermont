import { PwaAppBar } from "@/components/layouts/pwa/pwa-app-bar"
import { PwaBottomNav } from "@/components/layouts/pwa/pwa-bottom-nav"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { redirect } from "next/navigation"
import { getAvatarUrl } from "@/lib/utils/avatar"
import { getUserWithProfile } from "@/lib/supabase/auth-cache"

export default async function PwaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile } = await getUserWithProfile()

  if (user && profile) {

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
      <SidebarProvider>
        <AppSidebar user={{
          avatar_url: avatarUrl || undefined,
          initials,
          full_name: profile?.first_name && profile?.last_name
            ? `${profile.first_name} ${profile.last_name}`
            : profile?.full_name || user?.email || undefined,
          email: user?.email ?? undefined,
        }} />
        <div className="min-h-screen flex flex-col w-full">
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
          <main className="flex-1 pb-20 sm:pb-6 overflow-x-hidden p-4">
            {children}
          </main>
          <PwaBottomNav />
        </div>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar user={{
        avatar_url: undefined,
        initials: 'SP',
        full_name: undefined,
        email: undefined,
      }} />
      <div className="min-h-screen flex flex-col w-full">
        <PwaAppBar
          user={{
            avatar_url: undefined,
            initials: 'SP',
            full_name: undefined,
            email: undefined,
          }}
        />
        <main className="flex-1 pb-20 sm:pb-6 overflow-x-hidden p-4">
          {children}
        </main>
        <PwaBottomNav />
      </div>
    </SidebarProvider>
  )
}
