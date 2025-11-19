# Système de Demandes de Versement - Documentation

## 📋 Vue d'ensemble

Ce document décrit l'implémentation complète du système de demandes de versement permettant aux utilisateurs de demander le versement de leurs rétributions et aux trésoriers de gérer ces demandes.

## ✅ Fonctionnalités implémentées

### Pour les utilisateurs
- ✅ Voir leur solde disponible sur la page "Mon Compte"
- ✅ Créer une demande de versement par virement bancaire ou carte cadeau
- ✅ Voir l'historique de leurs demandes avec les statuts
- ✅ Le montant demandé est immédiatement bloqué
- ✅ Validation côté client et serveur des montants (min/max)
- ✅ Affichage des frais pour les cartes cadeaux (5%)

### Pour les trésoriers
- ✅ Dashboard avec statistiques des demandes
- ✅ Visualisation par onglets (En attente / En cours / Historique)
- ✅ Valider une demande (passe en statut "en_cours")
- ✅ Marquer comme payée (débite définitivement le compte)
- ✅ Rejeter une demande avec raison (débloque les fonds)
- ✅ Voir les détails complets d'une demande (IBAN, notes, etc.)

## 📁 Fichiers créés

### Base de données
- `supabase/migrations/20251119_demandes_versement_system.sql`
  - Table `demandes_versement`
  - Policies RLS
  - Fonctions PostgreSQL (créer, valider, marquer payée, rejeter)

### Types TypeScript
- `lib/types/versement.ts` - Types, enums, helpers
- `lib/types/index.ts` - Export centralisé (mis à jour)

### Helpers Supabase
- `lib/supabase/versement.ts` - Requêtes et actions

### Configuration
- `lib/config.ts` - Configuration ajoutée:
  - `VERSEMENT_CONFIG` (montants min/max, délais, frais)
  - `ROLES_CONFIG.TREASURER_ROLES`
  - Helper `isTreasurerRole()`
  - Helper `calculateNetAmountAfterFees()`

### Server Actions
- `app/actions/versement.ts` - Actions serveur:
  - `creerDemandeVersementAction()`
  - `validerDemandeAction()`
  - `marquerPayeeAction()`
  - `rejeterDemandeAction()`
  - `annulerDemandeAction()`

### Pages
- `app/(pwa)/mon-compte/page.tsx` - Améliorée avec demandes
- `app/(pwa)/mon-compte/demander-versement/page.tsx` - Nouvelle demande
- `app/(pwa)/tresorerie/page.tsx` - Dashboard trésorier

### Composants
- `components/compte/demande-versement-form.tsx` - Formulaire de demande
- `components/compte/demandes-liste.tsx` - Liste des demandes utilisateur
- `components/tresorerie/demandes-table.tsx` - Tableau de gestion trésorier
- `components/ui/radio-group.tsx` - Composant UI (créé)

## 🚀 Instructions d'installation

### 1. Appliquer la migration

```bash
# Depuis le répertoire du projet
supabase migration up

# Ou via le dashboard Supabase
# Copier le contenu de supabase/migrations/20251119_demandes_versement_system.sql
# et l'exécuter dans l'éditeur SQL
```

### 2. Régénérer les types TypeScript

```bash
# Générer les types depuis le schéma Supabase
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/database.types.ts

# Ou si vous utilisez un projet local
npx supabase gen types typescript --local > lib/database.types.ts
```

### 3. Installer les dépendances manquantes (si nécessaire)

```bash
npm install @radix-ui/react-radio-group
npm install sonner  # Pour les notifications toast
```

### 4. Assigner le rôle trésorier

Via l'interface admin `/admin/users`, assignez le rôle `tresorier` à un ou plusieurs utilisateurs.

## 🔐 Permissions et sécurité

### Row Level Security (RLS)

Les politiques RLS garantissent que:
- Les utilisateurs ne voient que leurs propres demandes
- Les utilisateurs ne peuvent créer que leurs propres demandes
- Les utilisateurs ne peuvent modifier que leurs demandes "en_attente"
- Les trésoriers et admins voient toutes les demandes
- Les trésoriers et admins peuvent modifier toutes les demandes
- Les chefs d'équipe voient les demandes de leur équipe

### Sécurité bancaire

⚠️ **IMPORTANT**: L'IBAN est actuellement stocké en clair dans la base de données.

**Pour la production**, il est recommandé de:
1. Utiliser **Supabase Vault** pour chiffrer les IBANs
2. Ou implémenter un chiffrement côté application
3. Limiter l'affichage de l'IBAN complet (utiliser `masquerIBAN()`)

### Validation

Toutes les actions sont validées:
- Côté client (React Hook Form + Zod)
- Côté serveur (Server Actions)
- Côté base de données (Contraintes PostgreSQL + Fonctions)

## 📊 Workflow des demandes

```
1. Utilisateur crée une demande
   ↓
   - Montant bloqué immédiatement (solde_disponible → solde_bloque)
   - Statut: "en_attente"

2. Trésorier valide la demande
   ↓
   - Statut: "en_cours"
   - Montant reste bloqué

3a. Trésorier marque comme payée
    ↓
    - Statut: "payee"
    - Débit définitif (solde_bloque → solde_utilise)

3b. Trésorier rejette la demande
    ↓
    - Statut: "rejetee"
    - Fonds débloqués (solde_bloque → solde_disponible)
```

## 🎨 Configuration personnalisable

Dans `lib/config.ts`, vous pouvez ajuster:

```typescript
export const VERSEMENT_CONFIG = {
  MONTANT_MINIMUM_VERSEMENT: 10,        // Minimum 10€
  MONTANT_MAXIMUM_VERSEMENT: 500,       // Maximum 500€
  DELAI_TRAITEMENT_JOURS: 7,            // 7 jours estimés
  FRAIS_CARTE_CADEAU: 5,                // 5% de frais
  MONTANT_MINIMUM_VIREMENT: 20,         // Minimum 20€ pour virement
}
```

## 📱 URLs importantes

- **Utilisateurs**:
  - `/mon-compte` - Voir solde et demandes
  - `/mon-compte/demander-versement` - Créer une demande

- **Trésoriers**:
  - `/tresorerie` - Dashboard de gestion

## 🧪 Tests recommandés

1. **Test utilisateur**:
   - Créer un compte avec un solde > 10€
   - Créer une demande de virement (montant ≥ 20€)
   - Vérifier que le solde est bloqué
   - Créer une demande carte cadeau
   - Vérifier le calcul des frais

2. **Test trésorier**:
   - Se connecter avec un compte trésorier
   - Valider une demande
   - Marquer comme payée
   - Rejeter une demande
   - Vérifier les statistiques

3. **Test sécurité**:
   - Essayer de créer une demande > solde disponible
   - Essayer de créer une demande < montant minimum
   - Essayer d'accéder à `/tresorerie` sans rôle trésorier

## 🐛 Dépannage

### Erreur "Function not found"
- Vérifiez que la migration a bien été appliquée
- Vérifiez les noms des fonctions RPC dans `versement.ts`

### Types TypeScript manquants
```bash
# Régénérer les types
npx supabase gen types typescript --local > lib/database.types.ts
```

### Permissions refusées
- Vérifiez les policies RLS
- Vérifiez le rôle de l'utilisateur dans la table `profiles`

## 📈 Prochaines étapes recommandées

### Phase 2 - Pot d'équipe (À implémenter)

1. Table `demandes_pot_equipe`
2. Interface chef d'équipe pour demander des fonds
3. Validation par trésorier
4. Historique détaillé du pot d'équipe

### Améliorations suggérées

- [ ] Notifications email (validation, rejet, paiement)
- [ ] Export comptable (CSV/PDF) pour le trésorier
- [ ] Upload de preuves de paiement
- [ ] Chiffrement des IBANs avec Supabase Vault
- [ ] Statistiques avancées (par équipe, par période)
- [ ] Limite de demandes par mois/trimestre
- [ ] Intégration avec un système de paiement automatique

## 📞 Support

Pour toute question sur l'implémentation, consultez:
- `lib/supabase/versement.ts` - Documentation des fonctions
- `app/actions/versement.ts` - Logique métier
- Migration SQL - Schéma et contraintes

---

**Implémenté le**: 19 novembre 2025
**Version**: 1.0.0
**Auteur**: Claude (Assistant IA)
