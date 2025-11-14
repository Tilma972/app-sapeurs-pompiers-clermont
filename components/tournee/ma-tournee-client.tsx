'use client';

import { useState } from 'react';
import { SectorBadge } from './sector-badge';
import { SectorMapModal } from './sector-map-modal';

interface MaTourneeClientProps {
  secteur: string;
}

export function MaTourneeClient({ secteur }: MaTourneeClientProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="mt-4">
        <SectorBadge 
          secteur={secteur} 
          onClick={() => setModalOpen(true)}
          className="text-base py-2 px-4"
        />
      </div>
      <SectorMapModal 
        secteur={secteur} 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
      />
    </>
  );
}
