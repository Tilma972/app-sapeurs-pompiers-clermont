'use client';

import { X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SectorMap } from './sector-map';

interface SectorMapModalProps {
  secteur: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SECTEUR_LABELS: Record<string, string> = {
  'nord': 'Secteur Nord',
  'sud': 'Secteur Sud',
  'ouest': 'Secteur Ouest',
  'nord-est': 'Secteur Nord-Est',
  'sud-est': 'Secteur Sud-Est',
};

export function SectorMapModal({ secteur, open, onOpenChange }: SectorMapModalProps) {
  const label = SECTEUR_LABELS[secteur] || secteur;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center justify-between">
            <span>📍 {label}</span>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fermer</span>
            </button>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 h-[calc(90vh-4rem)] p-4 pt-0">
          <SectorMap secteur={secteur} className="h-full" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
