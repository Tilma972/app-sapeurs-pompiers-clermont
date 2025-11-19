import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PwaContainer } from "@/components/layouts/pwa/pwa-container";
import { ChallengesList } from "@/components/gamification/challenges-list";
import { getUserChallengesProgress } from "@/lib/supabase/challenges";
import { Target, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DefisPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const challenges = await getUserChallengesProgress(user.id);

  const completedCount = challenges.filter(c => c.completed).length;
  const totalCount = challenges.length;

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
              <Target className="h-7 w-7 text-primary" />
              Mes Défis
            </h1>
            <p className="text-muted-foreground mt-1">
              {completedCount} / {totalCount} défis complétés
            </p>
          </div>
        </div>

        {/* Liste des défis */}
        <ChallengesList challenges={challenges} />
      </div>
    </PwaContainer>
  );
}
