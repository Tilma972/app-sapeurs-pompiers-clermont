-- Migration: Add is_active flag to profiles for admin moderation
-- Description: Adds a boolean column to control account activation/approval

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS profiles_is_active_idx ON public.profiles(is_active);

COMMENT ON COLUMN public.profiles.is_active IS 'Indique si le compte est actif (approuvé par un admin).';
