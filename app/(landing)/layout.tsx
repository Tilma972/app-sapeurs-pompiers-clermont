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
      <main className="pt-20 md:pt-24">
        {children}
      </main>
      <LandingFooter />
    </>
  );
}