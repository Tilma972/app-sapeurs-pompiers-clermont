# Audit Complet — Workflow Boutique E-commerce
**Date :** 2026-02-19
**Périmètre :** Page boutique, fiches produits, panier, session Stripe Checkout, webhook Stripe, insertion `order_items`, interface admin produits + upload photo
**Auditeur :** Claude Code

---

## Résumé Exécutif

L'architecture générale du workflow boutique est solide (idempotence Stripe, logs webhook, séparation des couches). Cependant, **4 problèmes critiques** peuvent causer des ruptures de données immédiates en production : survente de stock, troncature silencieuse des metadata Stripe, chaîne webhook non-atomique, et détection de source défaillante. Des problèmes de moindre criticité concernent la cohérence du cache, l'isolation du panier entre pages, et la sécurité de l'upload.

---

## Problèmes Classés par Criticité

---

### 🔴 CRITIQUE — Ruptures de données immédiates

---

#### [C-1] Aucune décrémentation du stock après achat

**Fichiers :** `lib/webhooks/stripe/handlers/checkout-session.ts`, `lib/webhooks/stripe/services/transaction.ts`

**Problème :** Après un achat validé par le webhook `checkout.session.completed`, le stock de la table `products` n'est **jamais mis à jour**. `insertOrderItems()` enregistre les articles mais ne décrémente aucun champ `stock`.

**Conséquence :** 100 unités vendues resteront affichées à 100 en stock. La page produit continuera d'autoriser des ajouts au panier sur des articles épuisés. La survente est illimitée.

**Preuve :**
```typescript
// transaction.ts:101-163 — aucun UPDATE sur products.stock
export async function insertOrderItems(...) {
  // ...
  const { error: itemsError } = await admin.from('order_items').insert(orderItemsToInsert)
  // ← jamais de : admin.from('products').update({ stock: stock - qty }).eq('id', productId)
}
```

**Correction attendue :** Après insertion des `order_items`, exécuter une mise à jour atomique du stock par produit, de préférence via une transaction PostgreSQL ou une fonction RPC pour éviter les race conditions.

---

#### [C-2] Limite 500 caractères Stripe sur `metadata.items` — rupture silencieuse

**Fichier :** `app/actions/shop/create-payment.ts:59`

**Problème :** Stripe impose une limite stricte de **500 caractères par valeur de métadonnée**. Le champ `items` sérialise un tableau JSON de tous les articles du panier :

```typescript
items: JSON.stringify(data.items.map(i => ({ id: i.id, name: i.name, qty: i.quantity })))
```

Un panier de 3-4 produits avec des UUIDs (36 chars chacun) dépasse aisément 500 caractères. **Stripe rejette la création de session** avec une erreur 400, capturée comme erreur générique côté client.

**Exemple de dépassement :** 3 produits × ~70 chars = ~210 chars de données + overhead JSON ≈ souvent > 500 chars.

**Impact secondaire :** Si le JSON est tronqué ou absent dans le webhook, `parseBoutiqueItems()` retourne `[]`, les `order_items` ne sont pas insérés, et l'email/facture sont vides — sans aucune alerte admin.

**Correction attendue :** Stocker les articles en dehors des metadata Stripe (en base avant la session, avec le `session_id` comme clé), ou utiliser le champ `line_items` de Stripe pour la récupération post-paiement via l'API `stripe.checkout.sessions.listLineItems()`.

---

#### [C-3] Chaîne webhook non-atomique — facture émise même si `order_items` échoue

**Fichier :** `lib/webhooks/stripe/handlers/checkout-session.ts:107-141`

**Problème :** `insertOrderItems()` retourne `false` en cas d'échec mais le flux **continue** inconditionnellement vers l'envoi d'email et le déclenchement N8N :

```typescript
// checkout-session.ts:107-141
if (isBoutique && boutiqueItems.length > 0) {
  await insertOrderItems(tx.id, boutiqueItems)  // ← retour non vérifié
}

// Execution continue TOUJOURS :
if (donorEmail) {
  await sendBoutiqueConfirmationEmail(tx, boutiqueItems, amount)
}
if (isBoutique) {
  await triggerInvoice({ transaction: tx, boutiqueItems, shippingAddress })
}
```

**Conséquences :**
- Le client reçoit un email de confirmation de commande
- Une facture PDF est générée via N8N
- Mais la commande n'existe pas en base (`order_items` vide)
- L'admin ne voit aucun article dans l'interface commandes

**Correction attendue :** Conditionner l'envoi email et le déclenchement N8N au succès de `insertOrderItems()`. Implémenter un mécanisme de retry ou d'alerte admin en cas d'échec.

---

#### [C-4] `normalizeSource` retourne `'boutique'` par défaut — faux positifs

**Fichier :** `lib/webhooks/stripe/validators.ts:83-90`

**Problème :**
```typescript
export function normalizeSource(source: string | undefined): string {
  const validSources = ['boutique', 'landing_page_donation', 'terrain']
  if (source && validSources.includes(source)) {
    return source
  }
  return source || 'boutique'  // ← retourne 'boutique' si source absente ou inconnue
}
```

Tout paiement Stripe sans metadata `source` (terrain hors-app, don direct, test, etc.) sera traité comme une commande boutique. Cela déclenche l'insertion d'`order_items` vides, la génération d'une facture boutique, et fausse les statistiques.

**Incohérence supplémentaire :** La migration `20251201_boutique_order_system.sql` utilise `source = 'landing_page'` pour le backfill, alors que le code utilise `'landing_page_donation'`. Ces deux valeurs sont incompatibles — les transactions backfillées avec `'landing_page'` ne seront jamais reconnues comme dons landing page.

**Correction attendue :** Retourner `'terrain'` par défaut (ou `'unknown'`), et aligner les valeurs entre migration et code.

---

### 🟠 ÉLEVÉ — Incohérences fonctionnelles significatives

---

#### [H-1] Panier non partagé entre liste boutique et fiche produit

**Fichiers :** `app/(landing)/boutique/boutique-client.tsx:82`, `app/(landing)/boutique/[productId]/page.tsx:27`

**Problème :** Deux instances distinctes de `CartProvider` sont créées :
- `BoutiqueClient` crée son propre `CartProvider` (pour la liste des produits)
- `boutique/[productId]/page.tsx` crée un second `CartProvider` (pour la fiche produit)

Ces providers sont complètement **isolés** — ils ne partagent aucun état. Un utilisateur qui ajoute un produit depuis la fiche produit puis navigue vers la boutique perd son panier (et vice versa).

**Correction attendue :** Remonter le `CartProvider` au niveau du layout partagé `(landing)/layout.tsx`, ou utiliser `localStorage`/`sessionStorage` pour persister le panier entre navigations.

---

#### [H-2] Revalidation des chemins incorrecte — cache admin jamais invalidé

**Fichier :** `app/actions/products/manage-product.ts:66-68, 124-126, 157-159`

**Problème :**
```typescript
revalidatePath("/dashboard/produits")  // ← cette route n'existe pas
revalidatePath("/boutique")            // ← correct
```

La route admin réelle est `/admin/produits` (groupe de routes `(pwa)`). Le chemin `/dashboard/produits` n'existe pas dans le projet. Après création/modification/suppression d'un produit, **la page admin `produits` n'est jamais revalidée** — les admins voient les anciennes données jusqu'à un rechargement forcé.

**Correction attendue :** Remplacer `revalidatePath("/dashboard/produits")` par `revalidatePath("/admin/produits")`.

---

#### [H-3] Prix des articles non inclus dans les metadata Stripe

**Fichiers :** `app/actions/shop/create-payment.ts:59`, `lib/webhooks/stripe/services/transaction.ts:120-131`

**Problème :** Les metadata stockent `{ id, name, qty }` mais **pas le prix** :
```typescript
items: JSON.stringify(data.items.map(i => ({ id: i.id, name: i.name, qty: i.quantity })))
// ← item.price n'est pas inclus
```

Dans le webhook, le prix est re-fetché depuis la DB :
```typescript
unit_price: item.price || product?.price || 0
// item.price est undefined car absent des metadata
// → utilise le prix DB courant, pas le prix au moment de l'achat
```

**Conséquence :** Si un admin modifie le prix d'un produit entre le moment où le client lance le paiement et le moment où le webhook est traité (généralement quelques secondes, mais théoriquement plus), les `order_items` enregistreront le **nouveau prix**, pas celui facturé à Stripe. Divergence comptable potentielle.

---

#### [H-4] `insertOrderItems` ne gère pas les produits inconnus

**Fichier :** `lib/webhooks/stripe/services/transaction.ts:117`

**Problème :**
```typescript
const { data: products } = await admin.from('products').select(...).in('id', productIds)
const productsMap = new Map(products?.map((p) => [p.id, p]) || [])
```

Si un `productId` dans les metadata ne correspond à aucun produit en base (produit supprimé entre le paiement et le webhook), `productsMap.get(item.id)` retourne `undefined`. Le fallback `product?.name || 'Produit inconnu'` masque l'erreur sans alerte. La commande est enregistrée avec un article `'Produit inconnu'` à prix 0 si `item.price` est aussi absent des metadata.

---

#### [H-5] Mise à jour du log webhook — requête UPDATE invalide

**Fichier :** `lib/webhooks/stripe/index.ts:103-113`

**Problème :**
```typescript
await admin
  .from('webhook_logs')
  .update({ status: result.success ? 'processed' : 'error', ... })
  .eq('event_type', event.type)
  .order('created_at', { ascending: false })  // ← invalide sur UPDATE
  .limit(1)                                    // ← invalide sur UPDATE
```

PostgREST/Supabase ne supporte pas `.order()` et `.limit()` dans une requête UPDATE. Cette requête échoue silencieusement (l'erreur n'est pas capturée) ou met à jour tous les logs du même `event_type`. Le statut des webhook logs n'est donc **jamais correctement mis à jour**.

---

### 🟡 MOYEN — Problèmes de robustesse et sécurité

---

#### [M-1] Aucune validation côté serveur du stock avant paiement

**Fichier :** `app/actions/shop/create-payment.ts`

**Problème :** `createShopPayment` ne vérifie pas si les produits commandés sont en stock avant de créer la session Stripe. La vérification UI-side dans `product-detail.tsx` (`quantity >= product.stock`) est contournable côté client.

**Risque :** Commande acceptée et facturée pour un produit `out_of_stock`.

---

#### [M-2] Upload image sans validation MIME côté serveur

**Fichier :** `app/actions/products/manage-product.ts:182-210`

**Problème :**
```typescript
const file = formData.get("file") as File
// ← aucune vérification du type MIME ni de la taille
const fileExt = file.name.split(".").pop()  // ← extension non validée
```

La restriction `accept="image/*"` est client-side uniquement. Un attaquant authentifié admin pourrait uploader :
- Un fichier SVG contenant du JavaScript (XSS si rendu inline)
- Un fichier très volumineux (pas de limite de taille)
- Un fichier avec extension trompeuse

**Correction attendue :** Vérifier `file.type` côté serveur, limiter la taille (ex: 5MB), valider l'extension.

---

#### [M-3] Page `/boutique/merci` ne vérifie pas le paiement côté serveur

**Fichier :** `app/(landing)/boutique/merci/page.tsx`

**Problème :** La page success simule une vérification avec un simple `setTimeout` :
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    if (sessionId) {
      setLoading(false)  // ← pas de vérification réelle du paiement
    }
  }, 1500)
}, [sessionId])
```

N'importe qui peut accéder à `/boutique/merci?session_id=fake123` et voir la page de confirmation. La vraie validation est dans le webhook — l'UX peut induire en erreur mais pas créer de commande fictive.

---

#### [M-4] Session ID Stripe exposé publiquement dans le DOM

**Fichier :** `app/(landing)/boutique/merci/page.tsx:139-145`

**Problème :**
```tsx
<code className="bg-muted px-2 py-1 rounded">{sessionId}</code>
```

Le `session_id` Stripe est affiché dans la page de confirmation. Ce n'est pas un secret critique mais révèle des identifiants internes à des tiers (analytics, captures d'écran partagées).

---

#### [M-5] Double requête DB redondante pour les mêmes produits

**Fichiers :** `lib/webhooks/stripe/services/transaction.ts:112-115`, `lib/webhooks/stripe/services/email.ts:57-60`

**Problème :** Pour chaque commande boutique, deux requêtes identiques sont exécutées sur `products` :
1. Dans `insertOrderItems()` : `select('id, name, price, image_url, description')`
2. Dans `sendBoutiqueConfirmationEmail()` : `select('id, price, image_url')`

Ces données pourraient être passées en paramètre depuis `checkout-session.ts` après un seul fetch.

---

#### [M-6] Facture générée sans `invoice_url` enregistré en base

**Fichiers :** `lib/webhooks/stripe/services/n8n.ts`, `lib/webhooks/stripe/services/transaction.ts:173-205`

**Problème :** `triggerInvoice()` génère un numéro de facture et l'envoie à N8N, mais **n'appelle pas `updateInvoiceFields()`** pour enregistrer `invoice_number` et `invoice_url` en base. La fonction `updateInvoiceFields()` existe dans `transaction.ts` mais n'est jamais appelée depuis le webhook.

**Conséquence :** `support_transactions.invoice_number` reste `NULL` après une commande boutique. L'admin ne peut pas retrouver la facture depuis l'interface.

---

#### [M-7] `order_status_history` insertée en dehors de toute transaction SQL

**Fichier :** `lib/webhooks/stripe/services/transaction.ts:149-154`

**Problème :** L'insertion dans `order_status_history` est séparée de l'insertion dans `order_items`. Si l'une réussit et l'autre échoue, l'état est incohérent (historique de statut sans articles, ou articles sans historique initial).

**Correction attendue :** Regrouper dans une transaction PostgreSQL via une fonction RPC.

---

### 🔵 FAIBLE — Qualité de code et UX

---

#### [L-1] Type assertion inutile dans `isBoutique`

**Fichier :** `lib/webhooks/stripe/handlers/checkout-session.ts:69`

```typescript
const isBoutique = source === ('boutique' as typeof SOURCES.BOUTIQUE)
```

Cette assertion de type est sans effet — `SOURCES.BOUTIQUE` est déjà `'boutique'` (string littéral). La comparaison est équivalente à `source === 'boutique'`. Lisibilité réduite sans bénéfice.

---

#### [L-2] `TransactionInsertData.order_status` non typé sur l'enum

**Fichier :** `lib/webhooks/stripe/types.ts:86`

```typescript
order_status?: string  // ← devrait être : typeof ORDER_STATUS[keyof typeof ORDER_STATUS]
```

Le type `string` permet d'insérer n'importe quelle valeur alors que la DB accepte uniquement les valeurs de `order_status_enum`. Aucune protection compile-time.

---

#### [L-3] Numéro de commande dans l'email = UUID non lisible

**Fichier :** `lib/webhooks/stripe/services/email.ts:79`

```typescript
orderNumber: transaction.id  // UUID type "a1b2c3d4-..."
```

L'email de confirmation affiche un UUID comme numéro de commande. Utiliser `invoice_number` (format `FAC-2025-00001`) serait plus professionnel et exploitable par le client pour un suivi.

---

#### [L-4] Page `/boutique/merci` — `"use client"` inutile pour un contenu statique

**Fichier :** `app/(landing)/boutique/merci/page.tsx`

La page utilise `"use client"` uniquement pour lire `searchParams` avec `useSearchParams()`. Ce comportement peut être reproduit en Server Component avec `searchParams` prop, évitant le bundle client pour cette page.

---

#### [L-5] `product-card.tsx` importe le type `ShopProduct` de `data/shop-products.ts`

**Fichier :** `components/shop/product-card.tsx:11`

```typescript
import { ShopProduct } from "@/data/shop-products"
```

`ShopProduct` est un type issu des données statiques, alors que les produits viennent maintenant de Supabase. Le composant est adapté via une transformation dans `boutique-client.tsx`, mais la dépendance sur ce type legacy devrait être remplacée par le type généré `Database["public"]["Tables"]["products"]["Row"]`.

---

#### [L-6] Fallback `FAC-${Date.now()}` pour numéro de facture non-séquentiel

**Fichier :** `lib/webhooks/stripe/services/n8n.ts:154-155`

```typescript
} catch {
  invoiceNumber = `FAC-${Date.now()}`
}
```

En cas d'échec de la fonction PostgreSQL `generate_invoice_number()`, le fallback est un timestamp Unix. Ce format casse la numérotation séquentielle et peut créer des doublons si deux commandes arrivent dans la même milliseconde.

---

## Tableau Récapitulatif

| ID | Criticité | Titre | Fichier principal |
|----|-----------|-------|-------------------|
| C-1 | 🔴 Critique | Stock jamais décrémenté | `transaction.ts` |
| C-2 | 🔴 Critique | Limite 500 chars metadata Stripe | `create-payment.ts` |
| C-3 | 🔴 Critique | Chaîne webhook non-atomique | `checkout-session.ts` |
| C-4 | 🔴 Critique | `normalizeSource` retourne `boutique` par défaut | `validators.ts` |
| H-1 | 🟠 Élevé | Panier isolé entre liste et fiche produit | `boutique-client.tsx`, `[productId]/page.tsx` |
| H-2 | 🟠 Élevé | `revalidatePath("/dashboard/produits")` inexistant | `manage-product.ts` |
| H-3 | 🟠 Élevé | Prix absent des metadata → divergence comptable | `create-payment.ts`, `transaction.ts` |
| H-4 | 🟠 Élevé | Produit supprimé → article "inconnu" silencieux | `transaction.ts` |
| H-5 | 🟠 Élevé | UPDATE webhook_log avec ORDER/LIMIT invalide | `index.ts` |
| M-1 | 🟡 Moyen | Pas de vérification stock côté serveur | `create-payment.ts` |
| M-2 | 🟡 Moyen | Upload sans validation MIME/taille côté serveur | `manage-product.ts` |
| M-3 | 🟡 Moyen | Page `/merci` sans vérification paiement réelle | `merci/page.tsx` |
| M-4 | 🟡 Moyen | Session ID Stripe exposé dans le DOM | `merci/page.tsx` |
| M-5 | 🟡 Moyen | Double requête DB redondante par commande | `transaction.ts`, `email.ts` |
| M-6 | 🟡 Moyen | `invoice_number`/`invoice_url` jamais enregistrés | `n8n.ts`, `transaction.ts` |
| M-7 | 🟡 Moyen | Insertions non-atomiques order_items + status | `transaction.ts` |
| L-1 | 🔵 Faible | Type assertion inutile `isBoutique` | `checkout-session.ts` |
| L-2 | 🔵 Faible | `order_status` typé `string` au lieu de l'enum | `types.ts` |
| L-3 | 🔵 Faible | UUID comme numéro de commande dans email | `email.ts` |
| L-4 | 🔵 Faible | `merci/page.tsx` en `"use client"` inutilement | `merci/page.tsx` |
| L-5 | 🔵 Faible | Import type `ShopProduct` legacy | `product-card.tsx` |
| L-6 | 🔵 Faible | Fallback facture `FAC-${Date.now()}` non-séquentiel | `n8n.ts` |

---

## Recommandations Prioritaires

### Immédiat (avant prochain achat en production)

1. **[C-1]** Ajouter la décrémentation du stock dans `insertOrderItems()` via `UPDATE products SET stock = stock - quantity WHERE id = product_id` — idéalement dans une transaction RPC PostgreSQL pour atomicité.

2. **[C-2]** Remplacer le stockage des articles dans les metadata Stripe par une table intermédiaire `pending_orders` (avec TTL) indexée sur le `session_id`, récupérée dans le webhook. Alternative : appeler `stripe.checkout.sessions.listLineItems(session.id)` dans le webhook pour récupérer les articles directement depuis Stripe sans dépendance aux metadata.

3. **[C-3]** Conditionner email et N8N au succès de `insertOrderItems()`. Retourner une erreur 500 si l'insertion échoue — Stripe retransmettra le webhook (avec idempotence garantie par `transactionExists()`).

4. **[C-4]** Changer le fallback de `normalizeSource` à `'terrain'` et aligner la valeur `'landing_page'` → `'landing_page_donation'` dans la migration de backfill.

### Court terme

5. **[H-2]** Corriger `revalidatePath("/dashboard/produits")` → `revalidatePath("/admin/produits")`.

6. **[H-1]** Remonter `CartProvider` au niveau du layout `(landing)` ou implémenter la persistance panier via `localStorage`.

7. **[M-6]** Appeler `updateInvoiceFields()` après `triggerInvoice()` pour enregistrer le numéro et l'URL de facture en base.

8. **[H-5]** Réécrire la mise à jour du webhook log sans `.order()/.limit()` — récupérer d'abord l'ID du log inséré, puis l'updater.

9. **[M-2]** Ajouter dans `uploadProductImage` : vérification `file.type.startsWith('image/')`, limite de taille (5MB), et validation de l'extension whitelist.
