-- Add HelloAsso checkout tracking columns
alter table donation_intents
  add column if not exists helloasso_checkout_intent_id text,
  add column if not exists helloasso_checkout_url text;

comment on column donation_intents.helloasso_checkout_url is
  'URL du checkout HelloAsso pour éviter de recréer à chaque scan';
