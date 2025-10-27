"use client";

import { useEffect } from "react";

export function OverflowDebugger() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const vw = document.documentElement.clientWidth;
    const offenders: Element[] = [];
    document.querySelectorAll("body *").forEach((el) => {
      const r = (el as HTMLElement).getBoundingClientRect();
      if (r.width > vw + 1) offenders.push(el);
    });
    offenders.forEach((el) => {
      (el as HTMLElement).style.outline = "2px solid #ef4444";
      console.warn("Overflow:", el, (el as HTMLElement).className, (el as HTMLElement).style.width);
    });
  }, []);
  return null;
}
