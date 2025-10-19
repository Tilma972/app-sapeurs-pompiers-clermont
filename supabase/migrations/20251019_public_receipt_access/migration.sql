-- Public receipt access via unguessable token
-- 1) Add a public access token to receipts and make it unique
ALTER TABLE public.receipts
ADD COLUMN IF NOT EXISTS public_access_token uuid UNIQUE;

-- Ensure receipts has an updated_at column for existing BEFORE UPDATE trigger
ALTER TABLE public.receipts
ADD COLUMN IF NOT EXISTS updated_at timestamptz;
ALTER TABLE public.receipts
ALTER COLUMN updated_at SET DEFAULT now();
UPDATE public.receipts SET updated_at = now() WHERE updated_at IS NULL;

-- Backfill existing rows with a token if null
UPDATE public.receipts
SET public_access_token = gen_random_uuid()
WHERE public_access_token IS NULL;

-- Ensure future rows default to a generated token
ALTER TABLE public.receipts
ALTER COLUMN public_access_token SET DEFAULT gen_random_uuid();

-- Helpful index for lookups by receipt number
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_number ON public.receipts(receipt_number);
