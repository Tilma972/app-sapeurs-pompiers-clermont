'use client';

import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SectorBadgeProps {
  secteur: string;
  onClick?: () => void;
  className?: string;
}

const SECTEUR_LABELS: Record<string, string> = {
  'nord': 'Secteur Nord',
  'sud': 'Secteur Sud',
  'ouest': 'Secteur Ouest',
  'nord-est': 'Secteur Nord-Est',
  'sud-est': 'Secteur Sud-Est',
};

export function SectorBadge({ secteur, onClick, className = '' }: SectorBadgeProps) {
  const label = SECTEUR_LABELS[secteur] || secteur;

  return (
    <Badge
      variant="outline"
      className={`cursor-pointer hover:bg-accent transition-colors inline-flex items-center ${className}`}
      onClick={onClick}
    >
      <MapPin className="w-3 h-3 mr-1" />
      {label}
    </Badge>
  );
}
