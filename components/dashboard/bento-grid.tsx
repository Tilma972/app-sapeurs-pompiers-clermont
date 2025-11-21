import { cn } from "@/lib/utils";

export function BentoGrid({
    className,
    children,
}: {
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <div
            className={cn(
                "grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-[minmax(180px,auto)]",
                className
            )}
        >
            {children}
        </div>
    );
}
