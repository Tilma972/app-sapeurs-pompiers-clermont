-- Migration: Table de stockage temporaire des articles panier Stripe
-- Date: 2026-02-19
-- Problème résolu: La limite Stripe de 500 caractères par valeur de metadata
-- empêchait de stocker les articles directement dans la session Checkout.
-- Solution: Les articles sont stockés dans cette table, indexés par stripe_session_id.

CREATE TABLE IF NOT EXISTS public.pending_cart_sessions (
  -- La session Stripe est la clé primaire (créée dans create-payment.ts)
  stripe_session_id TEXT PRIMARY KEY,

  -- Snapshot complet des articles au moment de l'initiation du paiement
  -- Format JSON : [{ id, name, qty, price }]
  items JSONB NOT NULL,

  -- Nettoyage automatique possible après 24h (pg_cron ou trigger externe)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pas d'index supplémentaire : PK sur stripe_session_id suffit

-- RLS : uniquement le service_role peut accéder (appels server-side uniquement)
ALTER TABLE pending_cart_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access pending_cart_sessions"
  ON pending_cart_sessions
  FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE pending_cart_sessions IS
  'Stockage temporaire des articles panier associés à une session Stripe Checkout. '
  'Contourne la limite 500 chars/champ de Stripe metadata. '
  'Peut être nettoyé après 24h une fois les webhooks traités.';
