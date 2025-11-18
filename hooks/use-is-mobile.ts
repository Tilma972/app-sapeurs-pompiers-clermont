"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect if the user is on a mobile device
 * Uses window.innerWidth with 768px breakpoint (Tailwind's md)
 * Returns true for mobile, false for desktop
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

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

  return isMobile;
}
