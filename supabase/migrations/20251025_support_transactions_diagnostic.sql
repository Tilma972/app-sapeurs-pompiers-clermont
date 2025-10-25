-- Diagnostic: support_transactions schema, indexes, constraints, RLS, Realtime
-- Safe to run multiple times. This migration does not mutate data; it only prints RAISE NOTICE diagnostics.

DO $$
DECLARE
  v_exists BOOLEAN;
  r RECORD;
BEGIN
  -- Check table existence
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'support_transactions'
  ) INTO v_exists;

  IF NOT v_exists THEN
    RAISE NOTICE '[diag] Table public.support_transactions: ABSENTE';
    RETURN;
  END IF;

  RAISE NOTICE '[diag] Table public.support_transactions: PRESENTE';

  -- Columns
  RAISE NOTICE '[diag] Colonnes:';
  FOR r IN (
    SELECT ordinal_position, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema='public' AND table_name='support_transactions'
    ORDER BY ordinal_position
  ) LOOP
    RAISE NOTICE '  #%: % % (nullable=%)', r.ordinal_position, r.column_name, r.data_type, r.is_nullable;
  END LOOP;

  -- Indexes
  RAISE NOTICE '[diag] Indexes:';
  FOR r IN (
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE schemaname='public' AND tablename='support_transactions'
    ORDER BY indexname
  ) LOOP
    RAISE NOTICE '  % => %', r.indexname, r.indexdef;
  END LOOP;

  -- Constraints
  RAISE NOTICE '[diag] Contraintes:';
  FOR r IN (
    SELECT conname, contype
    FROM pg_constraint
    WHERE conrelid = 'public.support_transactions'::regclass
    ORDER BY conname
  ) LOOP
    RAISE NOTICE '  % (type=%)', r.conname, r.contype;
  END LOOP;

  -- RLS enabled?
  RAISE NOTICE '[diag] RLS:';
  SELECT relrowsecurity FROM pg_class WHERE oid='public.support_transactions'::regclass INTO v_exists;
  RAISE NOTICE '  Row Level Security active: %', v_exists;

  -- Policies
  RAISE NOTICE '[diag] Policies RLS:';
  FOR r IN (
    SELECT policyname, cmd, roles, permissive, qual, with_check
    FROM pg_policies
    WHERE schemaname='public' AND tablename='support_transactions'
    ORDER BY policyname
  ) LOOP
    RAISE NOTICE '  % | cmd=% | roles=% | permissive=%', r.policyname, r.cmd, r.roles, r.permissive;
  END LOOP;

  -- Realtime publication membership
  RAISE NOTICE '[diag] Realtime (publication supabase_realtime):';
  SELECT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='support_transactions'
  ) INTO v_exists;
  RAISE NOTICE '  Inclus dans supabase_realtime: %', v_exists;

  -- Hints utiles
  RAISE NOTICE '[hint] Index attendu pour idempotence/filtre: (stripe_session_id)';
  RAISE NOTICE '[hint] Colonnes suivi email (si utilisées): receipt_sent, receipt_url, receipt_generated';
  RAISE NOTICE '[hint] Pour forcer Realtime: ALTER PUBLICATION supabase_realtime ADD TABLE public.support_transactions;';
END $$;
