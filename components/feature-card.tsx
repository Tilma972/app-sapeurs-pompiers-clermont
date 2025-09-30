"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, ShoppingBag, Camera, Wallet, Gift } from "lucide-react";
import * as React from "react";

export type Feature = {
  title: string;
  description: string;
  iconKey: "calendar" | "shopping-bag" | "camera" | "wallet" | "gift";
  href: string;
  gradient: string; // e.g. "from-green-500 to-emerald-600"
  stats?: string;
  benefits?: string[];
  badges?: string[]; // up to 2 concise badges
};

const iconMap: Record<Feature["iconKey"], React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  "calendar": Calendar,
  "shopping-bag": ShoppingBag,
  "camera": Camera,
  "wallet": Wallet,
  "gift": Gift,
};

export function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = iconMap[feature.iconKey];
  return (
    <Link href={feature.href} className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-xl">
      <Card
        className={cn(
          "relative overflow-hidden transition-all duration-300 border-border/60",
          "hover:shadow-xl hover:-translate-y-0.5",
          "bg-card"
        )}
      >
        {/* Animated gradient blob */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute -left-10 -top-10 size-40 rounded-full blur-2xl opacity-20",
            "bg-gradient-to-br",
            feature.gradient
          )}
        />

        <CardHeader>
          <div className="flex items-start gap-3">
            <div className={cn(
              "shrink-0 rounded-full p-2 text-white",
              "bg-gradient-to-br",
              feature.gradient,
              "shadow-sm"
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-base">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </div>
            <CardAction>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-300 group-hover:translate-x-0.5" />
            </CardAction>
          </div>
        </CardHeader>

        {(feature.badges && feature.badges.length > 0) && (
          <CardFooter className="flex gap-2 flex-wrap">
            {feature.badges.slice(0, 2).map((b) => (
              <Badge key={b} variant="secondary" className="bg-secondary/80">
                {b}
              </Badge>
            ))}
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}
