# Système de Commandes Boutique - Documentation

> **Date de mise en place** : 2 décembre 2025  
> **Version** : 1.0.0  
> **Statut** : ✅ Production Ready

## 📋 Résumé

Implémentation d'un système e-commerce complet inspiré de Shopify pour la boutique de l'Amicale des Sapeurs-Pompiers de Clermont l'Hérault. Ce système permet de :

- Enregistrer les articles commandés (pas seulement le montant total)
- Envoyer des emails de confirmation détaillés style Shopify
- Gérer les commandes via une interface admin dédiée
- Suivre l'historique des statuts de commande
- **Isoler la boutique des flux de dons** (pas de reçus fiscaux pour les achats)

---

## 🏗️ Architecture

### Flux de commande

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Client    │────▶│    Stripe    │────▶│  Webhook POST   │
│  (Panier)   │     │   Checkout   │     │ /api/webhooks/  │
└─────────────┘     └──────────────┘     │    stripe       │
                                         └────────┬────────┘
                                                  │
                    ┌─────────────────────────────┼─────────────────────────────┐
                    │                             │                             │
                    ▼                             ▼                             ▼
          ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
          │ support_        │          │   order_items   │          │ order_status_   │
          │ transactions    │          │   (articles)    │          │    history      │
          │ source=boutique │          └─────────────────┘          └─────────────────┘
          └─────────────────┘
                    │
                    ▼
          ┌─────────────────┐
          │  Email Resend   │
          │ (style Shopify) │
          └─────────────────┘
```

### Isolation Boutique vs Dons

| Aspect | Boutique | Dons (terrain/landing) |
|--------|----------|------------------------|
| `source` | `'boutique'` | `'terrain'` / `'landing_page'` |
| Reçu fiscal | ❌ Non | ✅ Oui (via N8N + Gotenberg) |
| `order_status` | ✅ Oui | ❌ Non |
| `order_items` | ✅ Oui | ❌ Non |
| Template email | Shopify (articles) | Confirmation don |

---

## 📁 Fichiers créés/modifiés

### Nouveaux fichiers

| Fichier | Description |
|---------|-------------|
| `supabase/migrations/20251201_boutique_order_system.sql` | Migration complète (tables, RLS, fonctions) |
| `lib/email/boutique-templates.ts` | Templates email style Shopify |
| `components/admin/orders-management.tsx` | Interface admin gestion commandes |
| `app/(pwa)/admin/commandes/page.tsx` | Page admin `/admin/commandes` |

### Fichiers modifiés

| Fichier | Modifications |
|---------|---------------|
| `app/api/webhooks/stripe/route.ts` | Parsing items, insertion order_items, exclusion N8N pour boutique |
| `components/sidebar.tsx` | Ajout lien "Commandes" dans menu admin |
| `components/app-sidebar.tsx` | Ajout lien "Commandes" dans menu admin |

---

## 🗄️ Schéma Base de Données

### Table `order_items`

Stocke le détail des articles commandés (snapshot pour historique).

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES support_transactions(id),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,              -- Snapshot du nom produit
  description TEXT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  image_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Table `order_status_history`

Historique des changements de statut pour traçabilité.

```sql
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES support_transactions(id),
  status order_status_enum NOT NULL,
  notes TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Enum `order_status_enum`

```sql
CREATE TYPE order_status_enum AS ENUM (
  'pending',      -- En attente
  'confirmed',    -- Confirmée
  'preparing',    -- En préparation
  'ready',        -- Prête
  'shipped',      -- Expédiée
  'delivered',    -- Livrée
  'cancelled',    -- Annulée
  'refunded'      -- Remboursée
);
```

### Colonnes ajoutées à `support_transactions`

```sql
ALTER TABLE support_transactions 
ADD COLUMN source TEXT DEFAULT 'terrain';
-- Valeurs: 'terrain', 'landing_page', 'boutique'

ALTER TABLE support_transactions 
ADD COLUMN order_status TEXT DEFAULT 'pending';
-- Pour les commandes boutique uniquement
```

### Vue `boutique_orders`

Vue agrégée pour faciliter les requêtes admin.

```sql
CREATE VIEW boutique_orders AS
SELECT 
  st.*,
  COUNT(oi.*) as items_count,
  jsonb_agg(oi.*) as items
FROM support_transactions st
LEFT JOIN order_items oi ON oi.transaction_id = st.id
WHERE st.source = 'boutique'
GROUP BY st.id;
```

---

## 📧 Templates Email

### Structure email boutique

```
┌──────────────────────────────────────────┐
│  🎉 Merci pour votre commande !          │
│  Commande #ABC12345                      │
├──────────────────────────────────────────┤
│                                          │
│  ┌────┐  Calendrier 2025        x2       │
│  │ 📷 │  10,00 € × 2 = 20,00 €          │
│  └────┘                                  │
│                                          │
│  ┌────┐  Porte-clés SP          x1       │
│  │ 📷 │  5,00 € × 1 = 5,00 €            │
│  └────┘                                  │
│                                          │
├──────────────────────────────────────────┤
│  Sous-total:              25,00 €        │
│  Total:                   25,00 €        │
├──────────────────────────────────────────┤
│  📍 Retrait à la caserne                 │
│  Nous vous contacterons quand votre      │
│  commande sera prête.                    │
└──────────────────────────────────────────┘
```

### Fonctions disponibles

```typescript
import { 
  buildBoutiqueSubject, 
  buildBoutiqueHtml, 
  buildBoutiqueText 
} from '@/lib/email/boutique-templates'

const params = {
  customerName: 'Jean Dupont',
  customerEmail: 'jean@example.com',
  orderNumber: 'abc-123-def',
  items: [
    { name: 'Calendrier 2025', quantity: 2, unitPrice: 10, totalPrice: 20 },
    { name: 'Porte-clés', quantity: 1, unitPrice: 5, totalPrice: 5 }
  ],
  subtotal: 25,
  total: 25,
  orderDate: new Date()
}

const subject = buildBoutiqueSubject(params) // "Confirmation de votre commande #ABC12345..."
const html = buildBoutiqueHtml(params)       // HTML responsive
const text = buildBoutiqueText(params)       // Version texte
```

---

## 🖥️ Interface Admin

### Accès

- **URL** : `/admin/commandes`
- **Rôles autorisés** : `admin`, `tresorier`

### Fonctionnalités

1. **Statistiques en temps réel**
   - Commandes en attente
   - Commandes en préparation
   - Commandes du jour

2. **Filtres**
   - Par statut (tous, pending, preparing, ready, etc.)
   - Recherche par nom/email

3. **Actions**
   - Voir le détail d'une commande
   - Changer le statut (workflow)
   - Historique des changements

### Workflow de statut

```
pending ──▶ confirmed ──▶ preparing ──▶ ready ──▶ shipped ──▶ delivered
    │                                      │
    └──────────────▶ cancelled ◀───────────┘
                         │
                         ▼
                     refunded
```

---

## 🔒 Sécurité (RLS)

### Policies `order_items`

```sql
-- Admins peuvent tout voir
CREATE POLICY "Admins can view all order items" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'tresorier'))
  );

-- Service role (webhook) peut tout faire
CREATE POLICY "Service role full access" ON order_items
  FOR ALL USING (auth.role() = 'service_role');
```

### Policies `order_status_history`

Mêmes règles que `order_items`.

---

## 🧪 Test du flux complet

### 1. Faire un achat test

1. Aller sur `/boutique`
2. Ajouter des produits au panier
3. Renseigner nom et email
4. Payer via Stripe (mode test : `4242 4242 4242 4242`)

### 2. Vérifier l'email

- Sujet : "Confirmation de votre commande #XXXXXXXX - Amicale SP Clermont"
- Contenu : Liste des articles avec prix

### 3. Vérifier l'admin

1. Aller sur `/admin/commandes`
2. La nouvelle commande apparaît avec statut "En attente"
3. Cliquer pour voir le détail des articles
4. Tester le changement de statut

### 4. Vérifier la base de données

```sql
-- Vérifier la transaction
SELECT * FROM support_transactions 
WHERE source = 'boutique' 
ORDER BY created_at DESC LIMIT 1;

-- Vérifier les articles
SELECT * FROM order_items 
WHERE transaction_id = '<id_transaction>';

-- Vérifier l'historique des statuts
SELECT * FROM order_status_history 
WHERE transaction_id = '<id_transaction>';
```

---

## 📊 Fonctions utilitaires

### `update_order_status`

Met à jour le statut et enregistre l'historique.

```sql
SELECT update_order_status(
  p_transaction_id := 'uuid-de-la-commande',
  p_new_status := 'preparing',
  p_notes := 'Commande en cours de préparation',
  p_updated_by := 'uuid-admin'
);
```

### `get_boutique_stats`

Retourne les statistiques globales de la boutique.

```sql
SELECT get_boutique_stats();
-- Retourne JSON:
-- {
--   "total_orders": 150,
--   "pending_orders": 5,
--   "preparing_orders": 3,
--   "completed_orders": 140,
--   "cancelled_orders": 2,
--   "total_revenue": 2500.00,
--   "today_orders": 2,
--   "today_revenue": 35.00
-- }
```

---

## ⚠️ Points d'attention

### 1. Reçus fiscaux

La boutique est explicitement exclue de la génération de reçus fiscaux :

```typescript
// Dans le webhook Stripe
if (tx && amount >= 6 && donorEmail && source !== 'boutique') {
  // Appel N8N pour reçu fiscal
  await sendToN8n(...)
}
```

**Raison** : Un achat en boutique est une vente commerciale, pas un don. Il ne donne pas droit à déduction fiscale.

### 2. Metadata Stripe

Les articles sont passés en `metadata.items` au format JSON :

```typescript
metadata: {
  source: 'boutique',
  items: '[{"id":"xxx","name":"Calendrier","qty":2}]',
  customer_name: 'Jean Dupont'
}
```

**Limite Stripe** : 500 caractères max par valeur de metadata. Pour les grosses commandes, seuls id/name/qty sont stockés.

### 3. Prix snapshot

Le prix est récupéré depuis la table `products` au moment du webhook. Si le prix change entre le checkout et le webhook (très rare), il pourrait y avoir une différence.

**Amélioration future** : Inclure le prix dans `metadata.items`.

---

## 🚀 Déploiement

### Prérequis

1. ✅ Migration SQL exécutée
2. ✅ Types Supabase régénérés (`npx supabase gen types typescript`)
3. ✅ Build Next.js réussi
4. ✅ Variables d'environnement configurées (Stripe, Resend)

### Commandes

```bash
# Régénérer les types après migration
npx supabase gen types typescript --project-id npyfregghvnmqxwgkfea > lib/database.types.ts

# Vérifier le build
npm run build

# Déployer
git add .
git commit -m "feat(boutique): système de commandes complet style Shopify"
git push
```

---

## 📝 Changelog

### v1.0.0 (2025-12-02)

- ✨ Table `order_items` pour stocker les articles
- ✨ Table `order_status_history` pour l'historique
- ✨ Colonne `source` sur `support_transactions`
- ✨ Colonne `order_status` sur `support_transactions`
- ✨ Templates email style Shopify
- ✨ Interface admin `/admin/commandes`
- ✨ Exclusion boutique des reçus fiscaux
- 🔒 Policies RLS pour sécuriser les données

---

## 👥 Contacts

- **Développeur** : GitHub Copilot
- **Repository** : `Tilma972/app-sapeurs-pompiers-clermont`
- **Branche** : `main`
