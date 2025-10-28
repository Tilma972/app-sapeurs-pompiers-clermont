import { FocusedHeader } from "@/components/layouts/focused/focused-header"
import { createClient } from "@/lib/supabase/server"

export default async function FocusedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const initials = user?.user_metadata?.full_name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || 'SP'

  return (
    <div className="min-h-screen">
      <FocusedHeader 
        user={{
          avatar_url: (user?.user_metadata as { avatar_url?: string } | undefined)?.avatar_url,
          initials
        }}
      />
      {children}
    </div>
  )
}
