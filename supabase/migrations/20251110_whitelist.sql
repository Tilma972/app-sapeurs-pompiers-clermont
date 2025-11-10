-- Table whitelist
create table if not exists whitelist (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  first_name text not null,
  last_name text not null,
  added_by uuid references auth.users(id),
  added_at timestamptz default now(),
  used boolean default false, -- true quand quelqu'un s'inscrit avec cet email/nom
  used_at timestamptz,
  notes text
);

-- Index unique composite pour éviter doublons nom/prénom non utilisés
create unique index if not exists whitelist_name_unused_idx 
  on whitelist (lower(first_name), lower(last_name)) 
  where used = false;

-- RLS
alter table whitelist enable row level security;

-- Policy admin stricte
create policy "Admins can manage whitelist" on whitelist
  for all using (
    exists (
      select 1 from profiles 
      where profiles.id = auth.uid() 
      and profiles.role = 'admin'
    )
  );

-- Table d'audit
create table if not exists whitelist_audit (
  id uuid primary key default gen_random_uuid(),
  action text not null, -- add, delete, import, claim
  whitelist_id uuid references whitelist(id),
  performed_by uuid references auth.users(id),
  performed_at timestamptz default now(),
  details jsonb
);

-- Fonction transactionnelle pour claim atomique
create or replace function claim_whitelist_entry(
  p_first_name text,
  p_last_name text,
  p_email text
) returns table(id uuid, email text, first_name text, last_name text) as $$
declare
  entry record;
begin
  -- Chercher une entrée non utilisée (email prioritaire)
  select * into entry from whitelist
    where (
      (email is not null and lower(email) = lower(p_email))
      or (
        email is null
        and lower(first_name) = lower(p_first_name)
        and lower(last_name) = lower(p_last_name)
        and used = false
      )
    )
    order by (email is not null) desc, added_at asc
    limit 1
    for update;

  if not found then
    return;
  end if;

  -- Marquer comme utilisée et mettre à jour l'email si besoin
  update whitelist
    set used = true, used_at = now(), email = coalesce(email, p_email)
    where id = entry.id;

  -- Log audit
  insert into whitelist_audit(action, whitelist_id, performed_by, details)
    values ('claim', entry.id, auth.uid(), jsonb_build_object('email', p_email));

  return query select entry.id, entry.email, entry.first_name, entry.last_name;
end;
$$ language plpgsql security definer;
