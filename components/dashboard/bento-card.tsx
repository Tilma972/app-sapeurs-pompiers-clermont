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
                "bg-card border-border/50 border shadow-sm hover:shadow-xl transition-all duration-300",
                "hover:scale-[1.02]",
                className
            )}
        >
            {/* Background Gradient/Image */}
            <div className="absolute inset-0 z-0">
                {background}
                {gradient && (
                    <div className={cn("absolute inset-0 opacity-15 group-hover:opacity-30 transition-opacity bg-gradient-to-br", gradient)} />
                )}
            </div>

            <div className="relative z-10 flex flex-col gap-3 p-6">
                <div className={cn("flex items-center gap-3 mb-2")}>
                    <div className={cn(
                        "p-2.5 rounded-xl bg-background/80 backdrop-blur-sm shadow-sm ring-1 ring-black/5 dark:ring-white/10",
                        "group-hover:bg-background transition-colors"
                    )}>
                        <Icon className="h-6 w-6 text-foreground" />
                    </div>
                    {badges && badges.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap">
                            {badges.map((badge) => (
                                <span key={badge} className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary border border-primary/20 shadow-sm">
                                    {badge}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <h3 className="font-bold text-xl tracking-tight text-foreground group-hover:text-primary transition-colors">
                    {title}
                </h3>
                <p className="text-sm text-muted-foreground/90 leading-relaxed max-w-[95%]">
                    {description}
                </p>
            </div>

            <div
                className={cn(
                    "pointer-events-none absolute bottom-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
                )}
            >
                <div className="flex flex-row items-center gap-2 rounded-full bg-background/95 px-4 py-1.5 text-sm font-semibold shadow-md backdrop-blur-md ring-1 ring-black/5 dark:ring-white/10 text-primary">
                    <span>{cta}</span>
                    <ArrowRight className="h-4 w-4" />
                </div>
            </div>

            {/* Decorative gradient blob */}
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-primary/10 blur-3xl group-hover:bg-primary/20 transition-colors duration-500" />
        </Link>
    );
}
