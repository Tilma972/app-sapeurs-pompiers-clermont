-- Create table: app_settings (singleton)
create table if not exists public.app_settings (
  id uuid primary key,
  calendar_price numeric not null default 8,
  min_retrocession numeric not null default 10,
  recommended_retrocession numeric not null default 30,
  updated_at timestamptz,
  updated_by uuid
);

comment on table public.app_settings is 'Global application settings (singleton row).';
comment on column public.app_settings.calendar_price is 'Prix par calendrier (EUR)';
comment on column public.app_settings.min_retrocession is 'Pourcentage minimum de rétrocession %';
comment on column public.app_settings.recommended_retrocession is 'Pourcentage recommandé de rétrocession %';

-- Optional: ensure a single row can be addressed consistently
-- We will upsert with a fixed UUID from the app code.

-- RLS can be added later if needed for admin-only access.
