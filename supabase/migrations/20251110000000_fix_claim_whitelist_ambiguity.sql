-- Fix: Correction de l'ambiguïté des colonnes dans claim_whitelist_entry
-- Problème: Les références aux colonnes email, first_name, last_name étaient ambiguës
-- Solution: Préfixer toutes les colonnes avec le nom de la table ou l'alias

-- Supprimer l'ancienne fonction
drop function if exists claim_whitelist_entry(text, text, text);

-- Recréer la fonction avec les corrections
create or replace function claim_whitelist_entry(
  p_first_name text,
  p_last_name text,
  p_email text
) returns table(id uuid, email text, first_name text, last_name text) as $$
declare
  entry record;
begin
  -- Chercher une entrée non utilisée (email prioritaire)
  select * into entry from whitelist w
    where (
      (w.email is not null and lower(w.email) = lower(p_email))
      or (
        w.email is null
        and lower(w.first_name) = lower(p_first_name)
        and lower(w.last_name) = lower(p_last_name)
        and w.used = false
      )
    )
    order by (w.email is not null) desc, w.added_at asc
    limit 1
    for update;

  if not found then
    return;
  end if;

  -- Marquer comme utilisée et mettre à jour l'email si besoin
  update whitelist
    set used = true, used_at = now(), email = coalesce(whitelist.email, p_email)
    where whitelist.id = entry.id;

  -- Log audit
  insert into whitelist_audit(action, whitelist_id, performed_by, details)
    values ('claim', entry.id, auth.uid(), jsonb_build_object('email', p_email));

  return query select entry.id, entry.email, entry.first_name, entry.last_name;
end;
$$ language plpgsql security definer;
