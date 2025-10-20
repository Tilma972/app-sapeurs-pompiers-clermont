"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PrimaryCtaProps {
  href: string;
  children: React.ReactNode;
  variant?: "default" | "outline" | "secondary";
}

export function PrimaryCta({ href, children, variant = "default" }: PrimaryCtaProps) {
  return (
    <Button asChild variant={variant} size="lg" className="text-base px-6 py-5">
      <Link href={href}>{children}</Link>
    </Button>
  );
}


