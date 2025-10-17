-- 017_add_stripe_to_donation_intents.sql
alter table if exists public.donation_intents
  add column if not exists stripe_payment_intent_id text unique;

create index if not exists idx_donation_intents_stripe
  on public.donation_intents(stripe_payment_intent_id);
