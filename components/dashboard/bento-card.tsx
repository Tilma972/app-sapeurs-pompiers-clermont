import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface BentoCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    href: string;
    cta?: string;
    className?: string;
    background?: React.ReactNode;
    badges?: string[];
    gradient?: string;
}

export function BentoCard({
    title,
    description,
    icon: Icon,
    href,
    cta = "Ouvrir",
    className,
    background,
    badges,
    gradient,
}: BentoCardProps) {
    return (
        <Link
            href={href}
            className={cn(
                "group relative col-span-1 flex flex-col justify-between overflow-hidden rounded-xl",
                "bg-background/40 backdrop-blur-md border border-white/10 shadow-sm hover:shadow-md transition-all duration-300",
                "hover:bg-background/60",
                className
            )}
        >
            {/* Background Gradient/Image */}
            <div className="absolute inset-0 z-0">
                {background}
                {gradient && (
                    <div className={cn("absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity bg-gradient-to-br", gradient)} />
                )}
            </div>

            <div className="relative z-10 flex flex-col gap-1 p-6">
                <div className={cn("flex items-center gap-2 mb-2")}>
                    <div className={cn("p-2 rounded-lg bg-background/50 backdrop-blur-sm shadow-sm ring-1 ring-black/5 dark:ring-white/10")}>
                        <Icon className="h-5 w-5 text-foreground/80" />
                    </div>
                    {badges && badges.length > 0 && (
                        <div className="flex gap-1">
                            {badges.map((badge) => (
                                <span key={badge} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
                                    {badge}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <h3 className="font-semibold text-lg tracking-tight text-foreground">
                    {title}
                </h3>
                <p className="text-sm text-muted-foreground max-w-[90%]">
                    {description}
                </p>
            </div>

            <div
                className={cn(
                    "pointer-events-none absolute bottom-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
                )}
            >
                <div className="flex flex-row items-center gap-2 rounded-full bg-background/90 px-3 py-1 text-xs font-medium shadow-sm backdrop-blur-sm ring-1 ring-black/5 dark:ring-white/10">
                    <span>{cta}</span>
                    <ArrowRight className="h-3 w-3" />
                </div>
            </div>

            {/* Decorative gradient blob */}
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/5 blur-3xl group-hover:bg-primary/10 transition-colors" />
        </Link>
    );
}
