'use client';

import Link from 'next/link';
import { SectorBadge } from './sector-badge';

interface MaTourneeClientProps {
  secteur: string;
}

export function MaTourneeClient({ secteur }: MaTourneeClientProps) {
  return (
    <div className="mt-4 space-y-1">
      <Link href="/ma-tournee/carte">
        <SectorBadge 
          secteur={secteur} 
          className="text-base py-2 px-4"
        />
      </Link>
      <p className="text-xs text-muted-foreground ml-1">
        👆 Clique pour visualiser ta zone de distribution
      </p>
    </div>
  );
}
