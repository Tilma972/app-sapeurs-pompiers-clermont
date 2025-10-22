"use client";

import dynamic from "next/dynamic";

export const SectorMap = dynamic(() => import("./sector-map-inner"), {
  ssr: false,
});

export default SectorMap;
