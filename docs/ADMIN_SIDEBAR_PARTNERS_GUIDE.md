# Guide d'Administration - Sidebar Collapsible et Gestion des Partenaires

## Vue d'ensemble

Ce guide explique les nouvelles fonctionnalités d'administration ajoutées à l'application, notamment la sidebar avec menus collapsibles et la gestion complète des partenaires.

## 1. Sidebar avec Menus Collapsibles

### Structure

La sidebar admin est maintenant organisée en **4 sections collapsibles** :

#### 📊 **Général**
- Vue d'ensemble
- Inscriptions en attente  
- Utilisateurs

#### 🛒 **Boutique**
- Produits (CRUD complet)
- Commandes (à implémenter)

#### 🏠 **Page d'accueil**
- **Partenaires** (✅ Implémenté)
- Galerie Photos (à implémenter)
- Annonces (à implémenter)

#### 👥 **Organisation**
- Équipes
- Avantages
- Chèques
- Reçus fiscaux

### Utilisation

Les menus collapsibles permettent de :
- Garder la sidebar organisée
- Accéder rapidement aux sous-sections
- Voir d'un coup d'œil toutes les fonctionnalités admin

Le menu "Général" est ouvert par défaut (`defaultOpen`).

## 2. Gestion des Partenaires

### Base de données

**Table créée** : `partners`

```sql
- id (SERIAL PRIMARY KEY)
- name (TEXT NOT NULL)
- logo (TEXT NOT NULL) 
- website (TEXT)
- tier (platinum|gold|bronze)
- sector (TEXT NOT NULL)
- since (INTEGER NOT NULL)
- created_at, updated_at
```

### RLS Policies

- ✅ SELECT : Public (tout le monde peut voir)
- ✅ INSERT/UPDATE/DELETE : Admin uniquement

### Fonctionnalités

#### Page d'administration
`/dashboard/admin/partenaires`

- **Recherche** : Par nom ou secteur
- **Tableau** : Affiche tous les partenaires avec logo, infos, actions
- **Actions** :
  - ➕ Ajouter un partenaire
  - ✏️ Modifier un partenaire
  - 🗑️ Supprimer un partenaire (avec confirmation)

#### Modal d'édition

Champs disponibles :
- Nom du partenaire *
- Secteur d'activité *
- Catégorie (Platine 💎 / Or 🥇 / Bronze 🥉)
- Partenaire depuis (année)
- Site web
- Logo * (upload vers Supabase Storage)

### Upload d'images

- **Bucket** : `landing_page`
- **Dossier** : `partners/`
- **Limite** : 5MB
- **Formats** : Tous les formats image
- **Recommandation** : PNG transparent, ratio 2:1

### Server Actions

Fichier : `app/actions/partners/manage-partner.ts`

- `createPartner()` - Créer un nouveau partenaire
- `updatePartner()` - Modifier un partenaire existant
- `deletePartner()` - Supprimer un partenaire
- `uploadPartnerLogo()` - Upload du logo vers Supabase Storage

## 3. Intégration avec la Landing Page

### Composant Partenaires

Le composant `components/landing/Partenaires.tsx` :
- Lit les données depuis la table `partners`
- Affiche les logos dans un carousel infini
- Gère les catégories (Platine/Or/Bronze)
- Affiche les badges et tooltips
- Responsive et accessible

### Synchronisation

- Les modifications dans l'admin sont **immédiatement visibles** sur la landing page
- `revalidatePath()` force le rechargement des données
- Pas de cache à vider manuellement

## 4. Installation

### Étapes

1. **Créer la table partners dans Supabase**
   ```bash
   # Copier le contenu de supabase/CREATE_PARTNERS_TABLE.sql
   # Le coller dans le SQL Editor de Supabase
   # Exécuter le script
   ```

2. **Vérifier les policies RLS**
   - La table doit avoir RLS activé
   - Les 4 policies doivent être créées

3. **Tester l'admin**
   - Se connecter en tant qu'admin
   - Aller dans "Administration > Page d'accueil > Partenaires"
   - Ajouter/Modifier/Supprimer un partenaire

4. **Vérifier la landing page**
   - Aller sur la page d'accueil (/)
   - Scroller jusqu'à la section "Nos Partenaires"
   - Vérifier que les logos s'affichent correctement

## 5. Prochaines Étapes

### À implémenter

- [ ] **Galerie Photos Landing** : Upload et gestion des photos de la galerie homepage
- [ ] **Annonces Landing** : Gestion des annonces affichées sur la landing page
- [ ] **Commandes Boutique** : Historique et gestion des commandes Stripe
- [ ] **Contenu dynamique** : Titres, descriptions, call-to-actions éditables
- [ ] **Analytics** : Statistiques de visites et conversions

### Améliorations futures

- Réorganisation par drag & drop des partenaires
- Prévisualisation de la landing page avant publication
- Historique des modifications
- Validation des images (dimensions, poids optimisés)
- CDN pour les images

## 6. Dépendances

### Packages requis

Tous déjà installés :
- `@radix-ui/react-collapsible` - Menus collapsibles
- `@radix-ui/react-dialog` - Modals
- `@radix-ui/react-alert-dialog` - Dialogues de confirmation
- `react-hot-toast` - Notifications
- `next/image` - Optimisation des images

## 7. Notes importantes

⚠️ **Sécurité**
- Seuls les admins peuvent modifier les partenaires
- Upload limité à 5MB
- RLS policies strictes en place

💡 **Performance**
- Images uploadées dans Supabase Storage (CDN)
- Next.js Image optimization activée
- Lazy loading des images

🎨 **UX**
- Confirmations avant suppression
- Toasts pour les feedbacks
- Preview des logos avant upload
- Responsive sur tous les devices

## Support

Pour toute question ou amélioration, contactez l'équipe de développement.
