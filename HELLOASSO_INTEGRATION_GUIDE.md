# HelloAsso Integration (Pivot)

This project now supports HelloAsso as an alternative to Stripe for QR card payments.

## Overview
- Server action `createHelloAssoCheckout(tourneeId, amount)` creates a pending payment row and requests a HelloAsso checkout intent. It stores the external id and checkout URL.
- Frontend (`/dashboard/ma-tournee/paiement-carte`) uses a feature flag to choose HelloAsso vs Stripe and displays a QR code pointing to the checkout URL.
- A webhook endpoint `/api/helloasso-webhook` validates the signature and marks the payment `succeeded` or `failed` accordingly.
- Realtime updates notify the client when status changes.

## Env variables
Add the following variables. Prefer VS Code "Environment Variables" or your hosting provider secret manager.

- HELLOASSO_CLIENT_ID
- HELLOASSO_CLIENT_SECRET
- HELLOASSO_ORG_SLUG
- HELLOASSO_FORM_SLUG
- HELLOASSO_BASE_URL (optional; defaults to https://api.helloasso.com; use https://api.helloasso-sandbox.com for sandbox)
- HELLOASSO_WEBHOOK_SECRET
- NEXT_PUBLIC_HELLOASSO_ENABLED=1 (to enable the HelloAsso path in the UI)

Keep existing Stripe variables as fallback:
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET

## Webhook setup
Configure HelloAsso to POST events to:

- https://<your-domain>/api/helloasso-webhook

Use the same secret configured in `HELLOASSO_WEBHOOK_SECRET`.

## Notes
- We store `state` as our internal `card_payments.id` when creating the checkout; the webhook uses it to correlate updates. If your HelloAsso event format differs, adjust mapping in `app/api/helloasso-webhook/route.ts`.
- RLS remains enforced; the webhook uses the Supabase service role client to update rows.
- The realtime subscription on `card_payments` is unchanged.
