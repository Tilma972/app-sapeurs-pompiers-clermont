-- Make expected_amount nullable to support open donation intents
alter table donation_intents
  alter column expected_amount drop not null;
