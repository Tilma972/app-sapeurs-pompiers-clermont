import { MissionSection } from "@/components/landing/mission-section";
import { TeamSection } from "@/components/landing/team-section";

export default function ActionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <main className="relative py-12">
        <MissionSection />
        <TeamSection />
      </main>
    </div>
  );
}
