"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect if the user is on a mobile device
 * Uses window.innerWidth with 768px breakpoint (Tailwind's md)
 * Returns true for mobile, false for desktop
 *
 * IMPORTANT: Starts with undefined to avoid SSR/client mismatch,
 * then updates on mount with actual value
 */
export function useIsMobile(): boolean {
  // Start with undefined to detect if we're on first render
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    // Initial check
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();

    // Listen for resize events
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // During SSR and first render, assume desktop for better initial display
  // This prevents layout shift and shows full animations initially
  return isMobile ?? false;
}
