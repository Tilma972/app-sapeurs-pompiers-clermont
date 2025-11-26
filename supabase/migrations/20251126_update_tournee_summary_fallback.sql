-- Migration: Update Tournee Summary Fallback
-- Description: Update tournee_summary view to use tournees table columns when no transactions exist

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
    
    -- Calendriers distribués (HYBRIDE : Transactions OU Manuel)
    CASE 
        WHEN COUNT(st.id) > 0 THEN COUNT(st.id) FILTER (WHERE st.calendar_accepted = true)
        ELSE COALESCE(t.calendriers_distribues, 0)
    END as calendars_distributed,
    
    -- Montant total (HYBRIDE : Transactions OU Manuel)
    CASE 
        WHEN COUNT(st.id) > 0 THEN COALESCE(SUM(st.amount), 0)
        ELSE COALESCE(t.montant_collecte, 0)
    END as montant_total,
    
    -- Répartition paiements (Uniquement dispo si transactions, sinon 0)
    COALESCE(SUM(st.amount) FILTER (WHERE st.payment_method = 'especes'), 0) as especes_total,
    COALESCE(SUM(st.amount) FILTER (WHERE st.payment_method = 'cheque'), 0) as cheques_total,
    COALESCE(SUM(st.amount) FILTER (WHERE st.payment_method = 'carte'), 0) as cartes_total

FROM tournees t
LEFT JOIN support_transactions st ON st.tournee_id = t.id
GROUP BY t.id, t.user_id, t.calendriers_distribues, t.montant_collecte;

COMMENT ON VIEW tournee_summary IS 'Vue agrégée des statistiques de tournée avec fallback sur les données manuelles si aucune transaction n''existe';
