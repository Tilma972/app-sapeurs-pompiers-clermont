# Connexion Boutique Landing Page → Base de Données

## ✅ Problème résolu

La page boutique (`/boutique`) utilisait des **données statiques** (`SHOP_PRODUCTS` dans `data/shop-products.ts`) au lieu de charger les produits depuis la **table `products`** de Supabase.

## 🔧 Modifications apportées

### 1. **Page boutique refactorisée** (`app/(landing)/boutique/page.tsx`)
- ✅ Transformée en **Server Component** (async)
- ✅ Charge les produits depuis la table `products` avec `createClient()`
- ✅ **revalidate = 0** pour désactiver le cache et toujours afficher les derniers produits
- ✅ Query SQL : `SELECT * FROM products ORDER BY created_at DESC`

### 2. **Nouveau composant client** (`app/(landing)/boutique/boutique-client.tsx`)
- ✅ Gère le **panier** (CartProvider)
- ✅ Gère le **modal panier** (state isCartOpen)
- ✅ Transforme les produits DB en format `ShopProduct` compatible avec `ProductCard`
- ✅ Affiche un message si aucun produit disponible

### 3. **Type `ShopProduct` étendu** (`data/shop-products.ts`)
- ✅ Ajout de champs optionnels : `stock?: number` et `status?: string`
- ✅ Compatible avec les produits de la base de données

### 4. **Validation des revalidations** (`app/actions/products/manage-product.ts`)
- ✅ `createProduct()` : revalidatePath("/boutique") ✅
- ✅ `updateProduct()` : revalidatePath("/boutique") ✅
- ✅ `deleteProduct()` : revalidatePath("/boutique") ✅

## 🎯 Résultat

| Avant | Après |
|-------|-------|
| Données statiques en dur | Chargées depuis `products` table |
| Modifications admin invisibles | Affichées immédiatement après revalidation |
| Pas de synchronisation | Synchronisation automatique via Supabase |

## 🧪 Test

1. **Créer un produit** dans `/dashboard/admin/boutique`
2. **Vérifier qu'il apparaît** sur `/boutique` (landing page)
3. **Modifier le produit** (nom, prix, image)
4. **Vérifier la mise à jour** sur `/boutique`
5. **Supprimer le produit** et vérifier sa disparition

## ⚠️ Points d'attention

- **Cache Next.js** : `revalidate = 0` désactive le cache, mais en production tu peux mettre `revalidate = 60` (60 secondes) pour optimiser les performances
- **Images** : Le bucket `landing_page` doit être PUBLIC pour que les images s'affichent
- **Stock** : Si stock = 0, le produit aura status = "out_of_stock" (gestion future)

## 📊 Architecture

```
/boutique (Landing Page)
  ↓
Server Component (page.tsx)
  ↓ fetch products from DB
Supabase.products table
  ↓ pass to
Client Component (boutique-client.tsx)
  ↓ render
ProductCard components
```

## 🔄 Workflow

1. Admin crée/modifie produit → `manage-product.ts` (Server Action)
2. Server Action → INSERT/UPDATE dans `products` table
3. Server Action → `revalidatePath("/boutique")`
4. Next.js → Recharge la page `/boutique` avec nouvelles données
5. Utilisateur → Voit immédiatement le changement
