-- Finalization tokens for donor-provided details and minimal address fields

-- 1) Extend support_transactions with minimal address fields (nullable by default)
ALTER TABLE public.support_transactions
ADD COLUMN IF NOT EXISTS supporter_address_line1 text,
ADD COLUMN IF NOT EXISTS supporter_postal_code text,
ADD COLUMN IF NOT EXISTS supporter_city text;

-- 2) Increase payment_status capacity and add new statuses if needed
ALTER TABLE public.support_transactions
ALTER COLUMN payment_status TYPE varchar(30);

-- 3) Donor completion tokens table
CREATE TABLE IF NOT EXISTS public.donor_completion_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid NOT NULL REFERENCES public.support_transactions(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tokens_transaction ON public.donor_completion_tokens(transaction_id);
CREATE INDEX IF NOT EXISTS idx_tokens_token ON public.donor_completion_tokens(token);
