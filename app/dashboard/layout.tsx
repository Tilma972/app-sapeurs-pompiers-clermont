import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar - Visible sur grand écran, masquée sur mobile */}
      <div className="hidden lg:block lg:w-64">
        <Sidebar />
      </div>

      {/* Zone principale (Header + Contenu) */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header />

        {/* Contenu de la page */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}






