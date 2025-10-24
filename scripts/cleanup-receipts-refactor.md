# Cleanup guide: receipts refactor cutover

Run this after switching the UI to the new flows and webhooks.

## Files/routes to remove

- components/finalization-options-modal.tsx
- components/donor-completion-form.tsx
- components/donation-modal.tsx
- app/finaliser-don/[token]/page.tsx
- app/don-finalise/page.tsx
- app/actions/finalization-token.ts
- app/actions/complete-donation.ts
- app/actions/donation-actions.ts

Search to confirm no lingering references:

```
rg "pending_donor_info|calendar_accepted|finaliser-don|donor-completion|donation-modal"
rg "finaliser-don|don-finalise" app/
```

## SQL changes (apply during maintenance window)

- Rename/drops:

```sql
-- Rename, drops (only if legacy code is fully removed)
ALTER TABLE public.support_transactions RENAME COLUMN calendar_accepted TO calendar_given;
ALTER TABLE public.support_transactions DROP COLUMN IF EXISTS payment_status;
DROP TABLE IF EXISTS public.donor_completion_tokens;
```

- Optional: simplify legacy generated columns if no longer used:

```sql
-- Example: drop legacy computed columns referencing calendar_accepted
ALTER TABLE public.support_transactions DROP COLUMN IF EXISTS transaction_type;
ALTER TABLE public.support_transactions DROP COLUMN IF EXISTS tax_deductible;
ALTER TABLE public.support_transactions DROP COLUMN IF EXISTS tax_reduction;
ALTER TABLE public.support_transactions DROP COLUMN IF EXISTS receipt_type;
```

## Verification

- npm run build (should pass)
- Hit /dashboard/ma-tournee and test both modals
- Webhook Stripe path /api/webhooks/stripe receives and logs events

## Rollback

- Keep the migration scripts versioned. To rollback, revert the deployment commit and redeploy.
