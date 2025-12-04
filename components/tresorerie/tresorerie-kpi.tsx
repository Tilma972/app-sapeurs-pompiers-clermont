import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Euro, Users, FileText, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import type { TresorerieKPIs } from "@/lib/supabase/tresorerie";

interface TresorerieKPIProps {
    kpis: TresorerieKPIs;
}

export function TresorerieKPI({ kpis }: TresorerieKPIProps) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Total collecté
                    </CardTitle>
                    <Euro className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(kpis.montantCollecteTotal)}</div>
                    <p className="text-xs text-muted-foreground">
                        Campagne calendriers
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Tournées actives
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{kpis.tourneesActives}</div>
                    <p className="text-xs text-muted-foreground">
                        En cours de distribution
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Demandes en attente
                    </CardTitle>
                    <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{kpis.demandesEnAttente}</div>
                    <p className="text-xs text-muted-foreground">
                        À valider ou rejeter
                    </p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Solde total pompiers
                    </CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(kpis.soldeTotalPompiers)}</div>
                    <p className="text-xs text-muted-foreground">
                        Disponible sur les comptes
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
