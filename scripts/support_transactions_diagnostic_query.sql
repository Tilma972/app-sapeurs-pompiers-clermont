-- SELECT-based diagnostics for public.support_transactions
-- Run this in Supabase SQL Editor (recommended) or via CLI:
--   supabase db query -f scripts/support_transactions_diagnostic_query.sql
-- Outputs multiple result sets; no DO/RAISE so results are visible in clients that suppress NOTICE.

-- 1) Table presence
SELECT '[diag] Table public.support_transactions: ' ||
       CASE WHEN EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_schema='public' AND table_name='support_transactions'
       ) THEN 'PRESENTE' ELSE 'ABSENTE' END AS info;

-- 2) Columns
SELECT 'columns' AS section,
       c.ordinal_position,
       c.column_name,
       c.data_type,
       c.is_nullable
FROM information_schema.columns c
WHERE c.table_schema='public' AND c.table_name='support_transactions'
ORDER BY c.ordinal_position;

-- 3) Indexes
SELECT 'indexes' AS section,
       i.indexname,
       i.indexdef
FROM pg_indexes i
WHERE i.schemaname='public' AND i.tablename='support_transactions'
ORDER BY i.indexname;

-- 4) Constraints (guarded against missing table)
WITH rel AS (
  SELECT oid
  FROM pg_class
  WHERE relname='support_transactions' AND relnamespace='public'::regnamespace
)
SELECT 'constraints' AS section,
       c.conname,
       c.contype
FROM pg_constraint c
JOIN rel ON c.conrelid = rel.oid
ORDER BY c.conname;

-- 5) RLS flag
WITH rel AS (
  SELECT oid, relrowsecurity
  FROM pg_class
  WHERE relname='support_transactions' AND relnamespace='public'::regnamespace
)
SELECT 'rls' AS section,
       COALESCE(rel.relrowsecurity, FALSE) AS row_level_security_enabled
FROM rel;

-- 6) RLS policies
SELECT 'policies' AS section,
       p.policyname,
       p.cmd,
       p.roles,
       p.permissive,
       p.qual,
       p.with_check
FROM pg_policies p
WHERE p.schemaname='public' AND p.tablename='support_transactions'
ORDER BY p.policyname;

-- 7) Realtime publication membership
SELECT 'realtime' AS section,
       EXISTS (
         SELECT 1 FROM pg_publication_tables
         WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='support_transactions'
       ) AS included_in_supabase_realtime;

-- 8) Helpful hints
SELECT 'hint' AS section, 'Index attendu pour idempotence/filtre: (stripe_session_id)' AS message
UNION ALL
SELECT 'hint', 'Colonnes suivi email (si utilisées): receipt_sent, receipt_url, receipt_generated'
UNION ALL
SELECT 'hint', 'Pour activer Realtime si absent: ALTER PUBLICATION supabase_realtime ADD TABLE public.support_transactions;';