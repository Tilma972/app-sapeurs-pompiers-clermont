-- 011_create_card_payments.sql
-- Create card_payments table for QR/Stripe flows

create type payment_status as enum ('pending', 'succeeded', 'failed');

create table if not exists public.card_payments (
  id uuid primary key default gen_random_uuid(),
  tournee_id uuid not null references public.tournees(id) on delete cascade,
  stripe_payment_intent_id text unique,
  amount numeric(10,2) not null check (amount > 0),
  status payment_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- Basic RLS to scope to owner via tournees.user_id; enable RLS and add policies consistent with existing schema
alter table public.card_payments enable row level security;

-- Allow owner to read their payments via tournees relation
create policy "user_can_read_own_card_payments" on public.card_payments
for select using (
  exists (
    select 1 from public.tournees t
    where t.id = card_payments.tournee_id
      and t.user_id = auth.uid()
  )
);

-- Allow inserts via server actions (service role) or secure RPC; no direct client insert
create policy "service_can_insert_card_payments" on public.card_payments
for insert with check (auth.role() = 'service_role');

-- Allow authenticated users to insert for their own tournee
create policy "user_can_insert_own_card_payment" on public.card_payments
for insert with check (
  exists (
    select 1 from public.tournees t
    where t.id = card_payments.tournee_id
      and t.user_id = auth.uid()
  )
);

-- Allow updates to status via service/webhook
create policy "service_can_update_card_payments" on public.card_payments
for update using (auth.role() = 'service_role');

-- Realtime publication note: enable table in Supabase UI (Database -> Replication -> Realtime)
-- Alternatively, if using SQL:
alter publication supabase_realtime add table public.card_payments;
