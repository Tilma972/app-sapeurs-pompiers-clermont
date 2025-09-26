import React from "react";

interface KpiCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  className?: string;
}

export function KpiCard({ title, value, subtitle, className }: KpiCardProps) {
  return (
    <div
      className={[
        "rounded-lg border border-border bg-muted",
        "px-3 py-3",
        "flex flex-col gap-1",
        className || "",
      ].join(" ")}
    >
      <div className="text-xs text-muted-foreground line-clamp-1">{title}</div>
      <div className="text-2xl font-semibold text-foreground leading-tight">{value}</div>
      {subtitle && (
        <div className="text-xs text-muted-foreground line-clamp-1">{subtitle}</div>
      )}
    </div>
  );
}
