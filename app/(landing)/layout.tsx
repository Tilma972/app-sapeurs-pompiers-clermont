import { LandingHeaderWrapper } from "@/components/landing/landing-header-wrapper";
import { LandingFooter } from "@/components/landing/landing-footer";
import { createClient } from "@/lib/supabase/server";

export default async function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <LandingHeaderWrapper user={user} />
      <main className="pt-14 md:pt-16">
        {children}
      </main>
      <LandingFooter />
    </>
  );
}