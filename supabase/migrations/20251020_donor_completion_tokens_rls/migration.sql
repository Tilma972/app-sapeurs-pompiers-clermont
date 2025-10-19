-- Enable RLS and restrict access on donor_completion_tokens
ALTER TABLE public.donor_completion_tokens ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (pompiers) to manage tokens tied to their own transactions
DO $$
BEGIN
  CREATE POLICY "Users can select own donor tokens"
  ON public.donor_completion_tokens
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.support_transactions st
      WHERE st.id = donor_completion_tokens.transaction_id
        AND st.user_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Users can insert donor tokens for own transactions"
  ON public.donor_completion_tokens
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_transactions st
      WHERE st.id = donor_completion_tokens.transaction_id
        AND st.user_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Users can update own donor tokens"
  ON public.donor_completion_tokens
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.support_transactions st
      WHERE st.id = donor_completion_tokens.transaction_id
        AND st.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_transactions st
      WHERE st.id = donor_completion_tokens.transaction_id
        AND st.user_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- No broad policy for DELETE to avoid accidental removals; admin/service can bypass RLS.
