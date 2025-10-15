-- Create webhook_logs table for persisting incoming webhooks for observability
create table if not exists public.webhook_logs (
  id uuid primary key default gen_random_uuid(),
  source text not null, -- 'helloasso', 'stripe', etc.
  event_type text,
  payload jsonb not null,
  headers jsonb,
  status text default 'received', -- received, processed, error
  error_message text,
  processing_duration_ms integer,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_webhook_logs_source on public.webhook_logs(source);
create index if not exists idx_webhook_logs_created_at on public.webhook_logs(created_at desc);
create index if not exists idx_webhook_logs_event_type on public.webhook_logs(event_type);

-- RLS
alter table public.webhook_logs enable row level security;

-- Allow admins and treasurers to view logs
create policy if not exists "Admins can view webhook logs" on public.webhook_logs
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('admin', 'tresorier')
    )
  );
