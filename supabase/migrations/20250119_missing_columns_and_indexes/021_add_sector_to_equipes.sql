-- ============================================
-- Migration 021 : Ajout des champs de secteur à equipes
-- Date : 2025-01-19
-- Description : Centre du secteur + communes
-- Dépendances : 009_create_equipes_table.sql, 018_fix_missing_columns.sql
-- ============================================

ALTER TABLE equipes
ADD COLUMN IF NOT EXISTS secteur_centre_lat DECIMAL(9, 6),
ADD COLUMN IF NOT EXISTS secteur_centre_lon DECIMAL(9, 6),
ADD COLUMN IF NOT EXISTS communes TEXT[];

COMMENT ON COLUMN equipes.secteur_centre_lat IS 'Latitude du centre du secteur (optionnelle)';
COMMENT ON COLUMN equipes.secteur_centre_lon IS 'Longitude du centre du secteur (optionnelle)';
COMMENT ON COLUMN equipes.communes IS 'Liste des communes du secteur (texte brut)';
