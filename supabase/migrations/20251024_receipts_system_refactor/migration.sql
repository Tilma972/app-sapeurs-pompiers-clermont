-- Receipts system refactor (phase 1 - additive, low-risk)
-- Context: small volume (~100/year), low concurrency. Keep legacy columns; add new RPC and constraints.

-- 1) Ensure additional donor fields exist on support_transactions (non-breaking)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='support_transactions' AND column_name='donor_first_name'
  ) THEN
    ALTER TABLE public.support_transactions ADD COLUMN donor_first_name TEXT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='support_transactions' AND column_name='donor_last_name'
  ) THEN
    ALTER TABLE public.support_transactions ADD COLUMN donor_last_name TEXT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='support_transactions' AND column_name='donor_address'
  ) THEN
    ALTER TABLE public.support_transactions ADD COLUMN donor_address TEXT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='support_transactions' AND column_name='donor_zip'
  ) THEN
    ALTER TABLE public.support_transactions ADD COLUMN donor_zip TEXT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='support_transactions' AND column_name='donor_city'
  ) THEN
    ALTER TABLE public.support_transactions ADD COLUMN donor_city TEXT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='support_transactions' AND column_name='stripe_session_id'
  ) THEN
    ALTER TABLE public.support_transactions ADD COLUMN stripe_session_id TEXT;
  END IF;
END $$;

-- 2) Add idempotency guard on receipts by transaction
DO $$
BEGIN
  ALTER TABLE public.receipts ADD CONSTRAINT receipts_transaction_unique UNIQUE (transaction_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3) Simplified receipt number generator using COUNT per year
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_year INT := EXTRACT(YEAR FROM now());
  v_next INT;
BEGIN
  SELECT COUNT(*) + 1 INTO v_next 
  FROM public.receipts 
  WHERE fiscal_year = v_year;
  RETURN v_year || '-' || LPAD(v_next::TEXT, 4, '0');
END;
$$;

-- 4) RPC to issue a receipt idempotently for a transaction
-- Returns existing receipt if already issued
CREATE OR REPLACE FUNCTION public.issue_receipt(p_transaction_id UUID)
RETURNS TABLE(id UUID, receipt_number TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_amount NUMERIC(8,2);
  v_email TEXT;
  v_year INT := EXTRACT(YEAR FROM now());
  v_next INT;
  v_number TEXT;
BEGIN
  -- Load transaction basics
  SELECT amount, COALESCE(supporter_email, donor_email) INTO v_amount, v_email
  FROM public.support_transactions
  WHERE id = p_transaction_id;

  IF v_amount IS NULL THEN
    RAISE EXCEPTION 'Transaction introuvable';
  END IF;

  IF v_amount < 6 THEN
    RAISE EXCEPTION 'NotEligible: montant < 6€';
  END IF;

  -- If already has a receipt, return it (idempotent)
  RETURN QUERY
  SELECT r.id, r.receipt_number FROM public.receipts r
  WHERE r.transaction_id = p_transaction_id
  LIMIT 1;

  IF FOUND THEN
    RETURN; -- existing returned
  END IF;

  -- Compute next number for the year
  SELECT COUNT(*) + 1 INTO v_next FROM public.receipts WHERE fiscal_year = v_year;
  v_number := v_year || '-' || LPAD(v_next::TEXT, 4, '0');

  -- Try to insert; if conflict on unique, retry once by re-reading
  BEGIN
    INSERT INTO public.receipts (
      transaction_id, receipt_number, fiscal_year, sequence_number, receipt_type, status, generated_at
    ) VALUES (
      p_transaction_id, v_number, v_year, v_next, 'fiscal', 'generated', now()
    ) RETURNING id, receipt_number INTO id, receipt_number;
    RETURN; -- success
  EXCEPTION WHEN unique_violation THEN
    -- Return the existing one for this transaction (idempotency)
    RETURN QUERY
    SELECT r.id, r.receipt_number FROM public.receipts r
    WHERE r.transaction_id = p_transaction_id
    LIMIT 1;
    RETURN;
  END;
END;
$$;

-- 5) RLS: receipts table is already ENABLED in earlier migrations.
-- Ensure no UPDATE policy exists (immutability via lack of policy). Allow SELECT/INSERT for owners.
DO $$
BEGIN
  -- View own receipts (check existence via pg_policies since CREATE POLICY doesn't support IF NOT EXISTS)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'receipts' AND policyname = 'Users can view own receipts (v2)'
  ) THEN
    CREATE POLICY "Users can view own receipts (v2)" ON public.receipts
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.support_transactions st 
        WHERE st.id = receipts.transaction_id AND st.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$
BEGIN
  -- Insert own receipts (check existence via pg_policies)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'receipts' AND policyname = 'Users can insert own receipts (v2)'
  ) THEN
    CREATE POLICY "Users can insert own receipts (v2)" ON public.receipts
    FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.support_transactions st 
        WHERE st.id = receipts.transaction_id AND st.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Destructive changes deferred to cutover window (documented for later):
-- ALTER TABLE public.support_transactions RENAME COLUMN calendar_accepted TO calendar_given;
-- ALTER TABLE public.support_transactions DROP COLUMN IF EXISTS payment_status;
-- DROP TABLE IF EXISTS public.donor_completion_tokens;
