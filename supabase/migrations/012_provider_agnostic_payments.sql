-- 012_provider_agnostic_payments.sql
-- Extend card_payments for provider-agnostic flows (Stripe, HelloAsso)

do $$ begin
  create type payment_provider as enum ('stripe', 'helloasso');
exception when duplicate_object then null; end $$;

alter table if exists public.card_payments
  add column if not exists provider payment_provider not null default 'stripe',
  add column if not exists external_payment_id text,
  add column if not exists external_checkout_url text;

-- Optional helpful index if matching by external ids in webhooks
create index if not exists idx_card_payments_external_payment_id on public.card_payments(external_payment_id);

-- Ensure realtime publication still includes the table (noop if already added)
alter publication supabase_realtime add table public.card_payments;
