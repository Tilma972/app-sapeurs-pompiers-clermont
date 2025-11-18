import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PwaContainer } from "@/components/layouts/pwa/pwa-container";
import { BadgeShowcase } from "@/components/gamification/badge-showcase";
import { getBadgesWithProgress } from "@/lib/supabase/gamification";
import { Award } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default async function BadgesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const badges = await getBadgesWithProgress(user.id);

  const unlockedCount = badges.filter(b => b.unlocked).length;
  const totalCount = badges.length;
  const progressPercentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
    <PwaContainer>
      <div className="space-y-6 py-6">
        {/* Header avec bouton retour */}
        <div className="flex items-center gap-4">
          <Link href="/gamification">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Award className="h-7 w-7 text-primary" />
              Mes Badges
            </h1>
            <p className="text-muted-foreground mt-1">
              {unlockedCount} / {totalCount} badges débloqués ({progressPercentage}%)
            </p>
          </div>
        </div>

        {/* Showcase des badges */}
        <BadgeShowcase badges={badges} />
      </div>
    </PwaContainer>
  );
}
