"use client"

import * as React from "react"
import {
    Calendar,
    Camera,
    Gift,
    Home,
    ShoppingBag,
    Sliders,
    User,
    Users,
    Wallet,
    Lightbulb,
    Shield,
    UserCheck,
    Building2,
    Settings,
    Image,
    Trophy,
    ChevronRight,
    LogOut,
} from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

// Menu items.
const data = {
    user: {
        name: "shadcn",
        email: "m@example.com",
        avatar: "/avatars/shadcn.jpg",
    },
    navMain: [
        {
            title: "Général",
            url: "#",
            items: [
                { title: "Tableau de bord", url: "/dashboard", icon: Home },
                { title: "Tournées & Calendriers", url: "/calendriers", icon: Calendar },
                { title: "Petites Annonces", url: "/annonces", icon: ShoppingBag },
                { title: "Boîte à Idées", url: "/idees", icon: Lightbulb },
                { title: "Ma Progression", url: "/gamification", icon: Trophy },
                { title: "Galerie Photos", url: "/galerie", icon: Camera },
                { title: "Événements", url: "/associative", icon: Calendar },
            ],
        },
        {
            title: "Mon Compte",
            url: "#",
            items: [
                { title: "Mon Compte", url: "/mon-compte", icon: Wallet },
                { title: "Paramètres", url: "/parametres", icon: Sliders },
                { title: "Partenaires & Avantages", url: "/partenaires", icon: Gift },
                { title: "Mon Profil", url: "/dashboard/profil", icon: User },
            ],
        },
    ],
    admin: [
        {
            title: "Administration",
            url: "#",
            icon: Shield,
            items: [
                { title: "Vue d'ensemble", url: "/admin", icon: Home },
                { title: "Liste blanche", url: "/admin/whitelist", icon: Shield },
                { title: "Utilisateurs", url: "/admin/users", icon: Users },
                { title: "Équipes", url: "/admin/equipes", icon: UserCheck },
                { title: "Partenaires", url: "/admin/partenaires", icon: Building2 },
                { title: "Avantages", url: "/admin/avantages", icon: Gift },
                { title: "Produits", url: "/admin/produits", icon: ShoppingBag },
                { title: "Chèques", url: "/admin/cheques", icon: Wallet },
                { title: "Reçus fiscaux", url: "/admin/receipts", icon: Gift },
                { title: "Modération galerie", url: "/admin/gallery-moderation", icon: Image },
                { title: "Paramètres", url: "/admin/settings", icon: Settings },
            ],
        },
    ],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    user: {
        avatar_url?: string
        initials: string
        full_name?: string
        email?: string
    }
}

import { useSidebar } from "@/components/ui/sidebar"

export function AppSidebar({ user, ...props }: AppSidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [role, setRole] = React.useState<string | null>(null)
    const { setOpenMobile, isMobile } = useSidebar()

    React.useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const supabase = createClient();
                const {
                    data: { user },
                } = await supabase.auth.getUser();
                if (!user) return;
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("id", user.id)
                    .single();
                if (mounted) setRole(profile?.role ?? null);
            } catch {
                // ignore
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);

    const onLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push("/auth/login")
    }

    const handleLinkClick = () => {
        if (isMobile) {
            setOpenMobile(false)
        }
    }

    return (
        <Sidebar collapsible="icon" className="bg-background border-r [&>div]:bg-background" {...props}>
            <SidebarHeader className="bg-background">
                <div className="flex items-center gap-2 px-2 py-1">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                        <Shield className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">Amicale SP</span>
                        <span className="truncate text-xs">Tableau de bord</span>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent className="bg-background">
                {/* General Navigation */}
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {data.navMain[0].items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={pathname === item.url || pathname.startsWith(item.url + "/")}>
                                        <Link href={item.url} onClick={handleLinkClick}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Account Navigation */}
                <Collapsible defaultOpen className="group/collapsible">
                    <SidebarGroup>
                        <SidebarGroupLabel asChild>
                            <CollapsibleTrigger>
                                Mon Compte
                                <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                            </CollapsibleTrigger>
                        </SidebarGroupLabel>
                        <CollapsibleContent>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {data.navMain[1].items.map((item) => (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton asChild isActive={pathname === item.url || pathname.startsWith(item.url + "/")}>
                                                <Link href={item.url} onClick={handleLinkClick}>
                                                    <item.icon />
                                                    <span>{item.title}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </CollapsibleContent>
                    </SidebarGroup>
                </Collapsible>

                {/* Admin Navigation */}
                {role && ["admin", "tresorier"].includes(role) && (
                    <Collapsible defaultOpen className="group/collapsible">
                        <SidebarGroup>
                            <SidebarGroupLabel asChild>
                                <CollapsibleTrigger>
                                    Administration
                                    <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                                </CollapsibleTrigger>
                            </SidebarGroupLabel>
                            <CollapsibleContent>
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        {data.admin[0].items.map((item) => (
                                            <SidebarMenuItem key={item.title}>
                                                <SidebarMenuButton asChild isActive={pathname === item.url || pathname.startsWith(item.url + "/")}>
                                                    <Link href={item.url} onClick={handleLinkClick}>
                                                        <item.icon />
                                                        <span>{item.title}</span>
                                                    </Link>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        ))}
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </CollapsibleContent>
                        </SidebarGroup>
                    </Collapsible>
                )}
            </SidebarContent>
            <SidebarFooter className="bg-background">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage src={user.avatar_url} alt={user.full_name} />
                                    <AvatarFallback className="rounded-lg">{user.initials}</AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">{user.full_name}</span>
                                    <span className="truncate text-xs">{user.email}</span>
                                </div>
                                <LogOut className="ml-auto size-4" onClick={onLogout} />
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
