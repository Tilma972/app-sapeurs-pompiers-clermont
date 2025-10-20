-- Migration: Feature Fiscal Support
-- Description: Évolution du système de transactions pour distinguer dons fiscaux et soutiens

-- ENUMS NÉCESSAIRES
DO $$
BEGIN
    CREATE TYPE payment_method_enum AS ENUM ('especes', 'cheque', 'carte', 'virement');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ÉVOLUTION/CRÉATION DE LA TABLE support_transactions
CREATE TABLE IF NOT EXISTS support_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournee_id UUID REFERENCES tournees(id) NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    
    -- Données transaction
    amount DECIMAL(8, 2) NOT NULL CHECK (amount > 0),
    
    -- CHAMP CLÉ : pilote toute la logique métier
    calendar_accepted BOOLEAN NOT NULL DEFAULT true,
    
    -- Champs calculés automatiquement (cohérence garantie)
    transaction_type VARCHAR(30) GENERATED ALWAYS AS (
        CASE WHEN calendar_accepted = false THEN 'don_fiscal' ELSE 'soutien' END
    ) STORED,
    
    tax_deductible BOOLEAN GENERATED ALWAYS AS (calendar_accepted = false) STORED,
    
    tax_reduction DECIMAL(6, 2) GENERATED ALWAYS AS (
        CASE WHEN calendar_accepted = false THEN ROUND(amount * 0.66, 2) ELSE 0 END
    ) STORED,
    
    -- Informations personnelles (RGPD compliant)
    supporter_name TEXT,
    supporter_email TEXT,
    supporter_phone TEXT,
    consent_email BOOLEAN DEFAULT false,
    
    -- Paiement
    payment_method payment_method_enum NOT NULL DEFAULT 'especes',
    stripe_session_id TEXT,
    stripe_payment_intent TEXT,
    payment_status VARCHAR(20) DEFAULT 'completed',
    
    -- Reçu
    receipt_number TEXT UNIQUE,
    receipt_type VARCHAR(20) GENERATED ALWAYS AS (
        CASE WHEN calendar_accepted = false THEN 'fiscal' ELSE 'soutien' END
    ) STORED,
    receipt_generated BOOLEAN DEFAULT false,
    receipt_sent BOOLEAN DEFAULT false,
    receipt_url TEXT,
    
    -- Offline & audit
    created_offline BOOLEAN DEFAULT false,
    synced_at TIMESTAMPTZ,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- CONTRAINTE MÉTIER CRITIQUE : Email obligatoire pour don fiscal
    CONSTRAINT email_required_for_fiscal_donation CHECK (
        (calendar_accepted = true) OR 
        (calendar_accepted = false AND supporter_email IS NOT NULL AND supporter_email <> '')
    )
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_support_transactions_tournee ON support_transactions(tournee_id);
CREATE INDEX IF NOT EXISTS idx_support_transactions_type ON support_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_support_transactions_created ON support_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_support_transactions_user ON support_transactions(user_id);

-- Table séparée pour le suivi des reçus (séparation des responsabilités)
CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES support_transactions(id) NOT NULL,
    
    -- Numérotation légale séquentielle
    receipt_number TEXT UNIQUE NOT NULL,
    fiscal_year INTEGER NOT NULL,
    sequence_number INTEGER NOT NULL,
    
    -- Type et statut
    receipt_type VARCHAR(20) NOT NULL, -- 'fiscal' | 'soutien'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'generated' | 'sent' | 'failed'
    
    -- PDF
    pdf_generated BOOLEAN DEFAULT false,
    pdf_url TEXT,
    pdf_storage_path TEXT,
    pdf_checksum TEXT, -- Intégrité du fichier
    
    -- Email via Resend
    email_sent BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMPTZ,
    email_delivery_status TEXT, -- 'delivered' | 'bounced' | 'failed'
    resend_message_id TEXT,
    
    -- Audit
    generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(fiscal_year, sequence_number)
);

-- Index pour receipts
CREATE INDEX IF NOT EXISTS idx_receipts_transaction ON receipts(transaction_id);
CREATE INDEX IF NOT EXISTS idx_receipts_fiscal_year ON receipts(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);

-- Fonction pour générer automatiquement les numéros de reçus
CREATE OR REPLACE FUNCTION generate_receipt_number() 
RETURNS TEXT AS $$
DECLARE
    current_year INTEGER := EXTRACT(YEAR FROM NOW());
    sequence_num INTEGER;
BEGIN
    -- Récupère le prochain numéro pour l'année courante
    SELECT COALESCE(MAX(sequence_number), 0) + 1 
    INTO sequence_num
    FROM receipts 
    WHERE fiscal_year = current_year;
    
    RETURN current_year || '-SP-' || LPAD(sequence_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour update automatique du updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_support_transactions_updated_at 
    BEFORE UPDATE ON support_transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receipts_updated_at 
    BEFORE UPDATE ON receipts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Activation RLS
ALTER TABLE support_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Policies pour support_transactions
CREATE POLICY "Users can view own transactions" ON support_transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON support_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON support_transactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON support_transactions
    FOR DELETE USING (auth.uid() = user_id);

-- Policies pour receipts
CREATE POLICY "Users can view own receipts" ON receipts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM support_transactions st 
            WHERE st.id = receipts.transaction_id 
            AND st.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own receipts" ON receipts
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM support_transactions st 
            WHERE st.id = receipts.transaction_id 
            AND st.user_id = auth.uid()
        )
    );

-- Vue métier pour dashboard
CREATE OR REPLACE VIEW tournee_summary AS
SELECT 
    t.id as tournee_id,
    t.user_id,
    COUNT(st.id) as total_transactions,
    
    -- Dons fiscaux
    COUNT(st.id) FILTER (WHERE st.transaction_type = 'don_fiscal') as dons_count,
    COALESCE(SUM(st.amount) FILTER (WHERE st.transaction_type = 'don_fiscal'), 0) as dons_amount,
    COALESCE(SUM(st.tax_reduction) FILTER (WHERE st.transaction_type = 'don_fiscal'), 0) as total_deductions,
    
    -- Soutiens
    COUNT(st.id) FILTER (WHERE st.transaction_type = 'soutien') as soutiens_count,
    COALESCE(SUM(st.amount) FILTER (WHERE st.transaction_type = 'soutien'), 0) as soutiens_amount,
    COUNT(st.id) FILTER (WHERE st.calendar_accepted = true) as calendars_distributed,
    
    -- Totaux
    COALESCE(SUM(st.amount), 0) as montant_total,
    
    -- Répartition paiements
    COALESCE(SUM(st.amount) FILTER (WHERE st.payment_method = 'especes'), 0) as especes_total,
    COALESCE(SUM(st.amount) FILTER (WHERE st.payment_method = 'cheque'), 0) as cheques_total,
    COALESCE(SUM(st.amount) FILTER (WHERE st.payment_method = 'carte'), 0) as cartes_total

FROM tournees t
LEFT JOIN support_transactions st ON st.tournee_id = t.id
GROUP BY t.id, t.user_id;

-- Commentaires pour la documentation
COMMENT ON TABLE support_transactions IS 'Transactions de soutien et dons fiscaux des sapeurs-pompiers';
COMMENT ON COLUMN support_transactions.calendar_accepted IS 'CHAMP CLÉ: true=soutien avec calendrier, false=don fiscal sans contrepartie';
COMMENT ON COLUMN support_transactions.transaction_type IS 'Type calculé automatiquement: soutien ou don_fiscal';
COMMENT ON COLUMN support_transactions.tax_deductible IS 'Calculé automatiquement: true si don fiscal';
COMMENT ON COLUMN support_transactions.tax_reduction IS 'Calculé automatiquement: 66% du montant si don fiscal';

COMMENT ON TABLE receipts IS 'Suivi des reçus fiscaux et de soutien';
COMMENT ON VIEW tournee_summary IS 'Vue agrégée des statistiques de tournée avec distinction fiscal/soutien';






