-- 012_create_donation_intents.sql
create table if not exists public.donation_intents (
  id uuid primary key default gen_random_uuid(),
  tournee_id uuid references public.tournees(id) not null,
  sapeur_pompier_id uuid references auth.users(id) not null,

  -- Données initiales (saisies par le pompier)
  expected_amount numeric(8,2) not null,
  donor_name_hint text,

  -- Données finales (saisies par le donateur)
  final_amount numeric(8,2),
  donor_first_name text,
  donor_last_name text,
  donor_email text,
  fiscal_receipt boolean default false,

  -- Suivi technique
  status text default 'waiting_donor' check (status in ('waiting_donor','completed','expired','cancelled')),
  helloasso_checkout_intent_id text unique,
  support_transaction_id uuid references public.support_transactions(id),

  -- Timestamps
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_donation_intents_status on public.donation_intents(status);
create index if not exists idx_donation_intents_expires on public.donation_intents(expires_at);
create index if not exists idx_donation_intents_tournee on public.donation_intents(tournee_id);

alter table public.donation_intents enable row level security;

create policy "Users can view own donation intents" on public.donation_intents
  for select using (sapeur_pompier_id = auth.uid());

create policy "Users can insert own donation intents" on public.donation_intents
  for insert with check (sapeur_pompier_id = auth.uid());

create policy "Users can update own donation intents" on public.donation_intents
  for update using (sapeur_pompier_id = auth.uid());

-- trigger to maintain updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_donation_intents_updated_at on public.donation_intents;
create trigger update_donation_intents_updated_at
  before update on public.donation_intents
  for each row execute function public.update_updated_at_column();

alter publication supabase_realtime add table public.donation_intents;
