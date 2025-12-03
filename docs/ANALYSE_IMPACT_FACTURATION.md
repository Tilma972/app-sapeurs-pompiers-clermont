# Analyse d'Impact : Système de Facturation Boutique

> **Date** : 3 décembre 2025  
> **Objectif** : Évaluer les risques d'impact sur le flux QR Code avant d'implémenter la facturation boutique

---

## 🔍 Compréhension du flux critique : Paiement QR Code

### Schéma du flux actuel

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Pompier       │     │   Donateur       │     │   Stripe        │
│   (tournée)     │     │   (scan QR)      │     │   Webhook       │
└────────┬────────┘     └────────┬─────────┘     └────────┬────────┘
         │                       │                        │
    1. Génère QR                 │                        │
    (createPaymentIntent)        │                        │
         │                       │                        │
         ├──────────────────────▶│                        │
         │    metadata:          │                        │
         │    - tournee_id ✓     │                        │
         │    - user_id ✓        │                        │
         │    - calendar_given   │                        │
         │                       │                        │
         │                       │ 2. Paye sur /pay/...  │
         │                       ├───────────────────────▶│
         │                       │                        │
         │                       │   3. payment_intent   │
         │                       │      .succeeded       │
         │                       │                        │
         │◀──────────────────────┼────────────────────────┤
         │   4. Realtime INSERT  │                        │
         │   support_transactions│                        │
         │   (toast + close)     │                        │
         │                       │                        │
         │   5. N8N génère       │                        │
         │   reçu fiscal (async) │                        │
         │                       │                        │
```

### Colonnes critiques utilisées (QR Code)

| Colonne | Usage | Critique ? |
|---------|-------|------------|
| `user_id` | ID du pompier qui a généré le QR | ✅ OUI |
| `tournee_id` | Lien avec la tournée active | ✅ OUI |
| `stripe_session_id` | Stocke le PaymentIntent ID pour Realtime | ✅ OUI |
| `amount` | Montant du don | ✅ OUI |
| `calendar_accepted` | Calendrier remis ou non | ✅ OUI |
| `payment_status` | Statut du paiement | ✅ OUI |
| `supporter_name` | Nom du donateur (affiché dans toast) | ⚠️ Moyen |
| `supporter_email` | Email pour reçu fiscal | ⚠️ Moyen |

---

## 🛡️ Stratégie de protection

### Principe : Isolation totale par `source`

```sql
-- Flux QR Code (terrain)
source = 'terrain' OR source IS NULL
user_id IS NOT NULL
tournee_id IS NOT NULL

-- Flux Boutique
source = 'boutique'
user_id IS NULL
tournee_id IS NULL
```

### Colonnes à ajouter (BOUTIQUE ONLY)

| Nouvelle colonne | Usage | Impact QR Code |
|------------------|-------|----------------|
| `invoice_number` | N° facture séquentiel | ❌ AUCUN (NULL pour terrain) |
| `invoice_url` | URL du PDF facture | ❌ AUCUN (NULL pour terrain) |
| `invoice_sent` | Facture envoyée ? | ❌ AUCUN (NULL pour terrain) |
| `invoice_generated_at` | Date génération | ❌ AUCUN (NULL pour terrain) |
| `shipping_address` | Adresse livraison | ❌ AUCUN (NULL pour terrain) |

### Modification de code : AUCUNE sur le flux QR

Le flux `payment_intent.succeeded` dans le webhook :
- Ne touche PAS aux colonnes boutique
- Continue de fonctionner avec `tournee_id` et `user_id`
- N8N reçoit les mêmes données qu'avant

---

## ✅ Checklist de non-régression

### Avant déploiement

- [ ] Les colonnes ajoutées ont `DEFAULT NULL`
- [ ] Aucune contrainte `NOT NULL` sur les nouvelles colonnes
- [ ] Le code `payment_intent.succeeded` n'est PAS modifié
- [ ] Le code `createPaymentIntent` n'est PAS modifié
- [ ] Les RLS policies existantes ne sont PAS modifiées

### Tests à effectuer

1. **Test QR Code terrain**
   - Créer une tournée
   - Générer un QR de paiement
   - Scanner et payer
   - Vérifier : toast affiché, transaction créée, N8N déclenché

2. **Test Boutique**
   - Ajouter produit au panier
   - Payer via Stripe Checkout
   - Vérifier : email reçu, transaction avec source='boutique'

3. **Test Stats Tournée**
   - Vérifier que les commandes boutique N'apparaissent PAS dans les stats tournée
   - Vérifier les montants collectés par tournée

---

## 📊 Requêtes de vérification

### Vérifier l'isolation terrain/boutique

```sql
-- Transactions terrain (avec tournée)
SELECT COUNT(*), SUM(amount) 
FROM support_transactions 
WHERE tournee_id IS NOT NULL;

-- Transactions boutique
SELECT COUNT(*), SUM(amount) 
FROM support_transactions 
WHERE source = 'boutique';

-- Vérifier qu'aucune boutique n'a de tournee_id
SELECT * FROM support_transactions 
WHERE source = 'boutique' AND tournee_id IS NOT NULL;
-- Doit retourner 0 lignes
```

### Vérifier le flux Realtime

```sql
-- Les transactions récentes avec PI
SELECT id, stripe_session_id, source, tournee_id, created_at
FROM support_transactions
WHERE stripe_session_id LIKE 'pi_%'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🚀 Plan d'implémentation sécurisé

### Phase 1 : Migration DB (sans risque)

```sql
-- Ajout colonnes avec DEFAULT NULL = aucun impact
ALTER TABLE support_transactions ADD COLUMN invoice_number TEXT;
ALTER TABLE support_transactions ADD COLUMN invoice_url TEXT;
ALTER TABLE support_transactions ADD COLUMN invoice_sent BOOLEAN DEFAULT false;
ALTER TABLE support_transactions ADD COLUMN invoice_generated_at TIMESTAMPTZ;
ALTER TABLE support_transactions ADD COLUMN shipping_address TEXT;

-- Fonction pour générer numéro facture
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'FAC-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('invoice_number_seq')::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;
```

### Phase 2 : Code boutique uniquement

```typescript
// SEULEMENT dans le bloc checkout.session.completed
// SEULEMENT si source === 'boutique'
if (source === 'boutique') {
  // Générer facture via N8N
  await sendToN8nInvoice(...)
}
// Le bloc payment_intent.succeeded n'est PAS modifié
```

### Phase 3 : Workflow N8N séparé

Créer un NOUVEAU workflow N8N pour les factures :
- Endpoint différent de celui des reçus fiscaux
- Template PDF différent (facture vs reçu fiscal)
- Numérotation séquentielle

---

## 🔒 Garanties

| Garantie | Comment ? |
|----------|-----------|
| QR Code continue de fonctionner | Aucune modification du code `payment_intent.succeeded` |
| Stats tournée correctes | Filtre `tournee_id IS NOT NULL` déjà en place |
| Realtime fonctionne | Pas de changement sur `stripe_session_id` |
| N8N reçus fiscaux OK | Workflow existant non modifié |

---

## ✅ Conclusion

**RISQUE : FAIBLE** ✅

L'implémentation de la facturation boutique n'impacte PAS le flux QR Code car :

1. **Isolation par `source`** : boutique vs terrain
2. **Colonnes additives** : DEFAULT NULL, pas de contraintes
3. **Code séparé** : uniquement dans le bloc `checkout.session.completed` + condition `source === 'boutique'`
4. **Workflow N8N séparé** : nouveau endpoint pour factures

Le seul point de contact est la table `support_transactions`, mais les transactions sont clairement identifiées et isolées par leur `source` et la présence/absence de `tournee_id`.
