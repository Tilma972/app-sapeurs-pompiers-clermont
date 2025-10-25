-- Qualify columns in issue_receipt to avoid ambiguous "id"

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
  -- Load transaction basics (email from supporter_email only)
  SELECT amount, supporter_email INTO v_amount, v_email
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
  SELECT r.id, r.receipt_number
  FROM public.receipts AS r
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
    ) RETURNING public.receipts.id, public.receipts.receipt_number INTO id, receipt_number;
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
