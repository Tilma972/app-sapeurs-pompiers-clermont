"use client";

import { BentoGrid } from "@/components/dashboard/bento-grid";
import { BentoCard } from "@/components/dashboard/bento-card";
import {
    Calendar,
    ShoppingBag,
    Lightbulb,
    Camera,
    Wallet,
    Gift,
    Map as MapIcon,
} from "lucide-react";

export function DashboardBentoGrid(props: {
    annoncesCount?: number;
    photosCount?: number;
    eventsCount?: number;
    offersCount?: number;
    profileComplete?: boolean;
    globalCalendarsDistributed?: number;
    ideasCount?: number;
    userName?: string;
}) {
    return (
        <BentoGrid className="auto-rows-[minmax(160px,auto)]">
            {/* Hero / Main Action - Tournées */}
            <BentoCard
                title="Tournées & Calendriers"
                description="Gérez votre distribution et suivez votre avancement en temps réel."
                icon={MapIcon}
                href="/calendriers"
                cta="Accéder à ma tournée"
                className="md:col-span-2 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20"
                gradient="from-blue-500 to-cyan-500"
                badges={[
                    typeof props.globalCalendarsDistributed === "number"
                        ? `${props.globalCalendarsDistributed.toLocaleString("fr-FR")} distribués`
                        : "Saison 2025",
                ]}
            />

            {/* Mon Compte / Wallet */}
            <BentoCard
                title="Mon Compte"
                description="Solde et demandes de paiement."
                icon={Wallet}
                href="/mon-compte"
                cta="Gérer"
                className="md:col-span-1 bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20"
                gradient="from-emerald-500 to-green-500"
                badges={[props.profileComplete ? "Actif" : "Profil incomplet"]}
            />

            {/* Petites Annonces */}
            <BentoCard
                title="Petites Annonces"
                description="Vendez, achetez, échangez entre collègues."
                icon={ShoppingBag}
                href="/annonces"
                cta="Voir les annonces"
                className="md:col-span-1"
                gradient="from-orange-500 to-amber-500"
                badges={[
                    typeof props.annoncesCount === "number"
                        ? `${props.annoncesCount} en ligne`
                        : "Nouveau",
                ]}
            />

            {/* Boîte à Idées */}
            <BentoCard
                title="Boîte à Idées"
                description="Une suggestion pour l'amicale ?"
                icon={Lightbulb}
                href="/idees"
                cta="Proposer"
                className="md:col-span-1"
                gradient="from-yellow-500 to-amber-500"
                badges={[
                    typeof props.ideasCount === "number"
                        ? `${props.ideasCount} idées`
                        : "Participatif",
                ]}
            />

            {/* Galerie Photos */}
            <BentoCard
                title="Galerie Photos"
                description="Les meilleurs moments de la caserne."
                icon={Camera}
                href="/galerie"
                cta="Explorer"
                className="md:col-span-1"
                gradient="from-purple-500 to-pink-500"
                badges={[
                    typeof props.photosCount === "number"
                        ? `${props.photosCount} photos`
                        : "Souvenirs",
                ]}
            />

            {/* Événements */}
            <BentoCard
                title="Événements"
                description="Ne manquez rien de la vie associative."
                icon={Calendar}
                href="/associative"
                cta="Calendrier"
                className="md:col-span-2"
                gradient="from-red-500 to-rose-500"
                badges={[
                    typeof props.eventsCount === "number"
                        ? `${props.eventsCount} à venir`
                        : "Agenda",
                ]}
            />

            {/* Partenaires */}
            <BentoCard
                title="Partenaires"
                description="Avantages exclusifs pour les pompiers."
                icon={Gift}
                href="/partenaires"
                cta="Profiter"
                className="md:col-span-1"
                gradient="from-indigo-500 to-violet-500"
                badges={["Offres locales"]}
            />
        </BentoGrid>
    );
}
