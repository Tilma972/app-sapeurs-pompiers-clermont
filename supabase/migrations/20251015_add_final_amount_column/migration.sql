-- Add final_amount column to donation_intents if missing
alter table donation_intents
  add column if not exists final_amount numeric(8,2);
