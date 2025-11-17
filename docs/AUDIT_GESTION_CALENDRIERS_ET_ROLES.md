# 🔍 Audit : Gestion des rôles utilisateurs et attribution de calendriers

**Date :** 17 novembre 2025
**Sujet :** Audit du système actuel et recommandations pour l'amélioration

---

## 📊 État actuel du système

### 1. Gestion des rôles utilisateurs

#### ✅ Situation actuelle
- **Migration `20251115_improve_new_user_trigger.sql`** : Tous les nouveaux utilisateurs sont **automatiquement créés avec le rôle "membre"** (ligne 36)
- Le trigger `on_auth_user_created` applique automatiquement ce rôle lors de l'inscription
- Les utilisateurs doivent passer par la **whitelist** avant de pouvoir s'inscrire (validation préalable)

#### ⚠️ Problème identifié
Le problème de l'utilisateur en "pending" était probablement dû à :
- Un utilisateur créé **avant** la migration du 15/11
- Ou une modification manuelle du rôle

#### 💡 Statut : Déjà résolu
Le système actuel fonctionne correctement : **activation automatique en "membre"** après inscription.

---

### 2. Attribution de calendriers

#### 📦 Architecture actuelle

**Trois niveaux d'allocation :**
1. **Niveau ÉQUIPE** (`equipes.calendriers_alloues`)
   - Exemple : Équipe 1 = 800 calendriers
   - Défini dans la table `equipes`
   - Modifiable par l'admin via l'interface équipes

2. **Niveau TOURNÉE** (`tournees.calendriers_alloues`)
   - **Valeur actuelle : 50 calendriers hardcodés** 📍
   - Défini dans `lib/supabase/tournee.ts:272`
   - Attribué automatiquement à chaque nouvelle tournée

3. **Niveau UTILISATEUR**
   - ❌ **N'existe pas actuellement**
   - Pas de colonne `calendriers_alloues` dans `profiles`

#### 🔧 Code actuel (création de tournée)

```typescript
// lib/supabase/tournee.ts:272
const { data: newTournee, error } = await supabase
  .from('tournees')
  .insert({
    user_id: user.id,
    date_debut: new Date().toISOString(),
    statut: 'active',
    zone: zone,
    equipe_id: profile?.team_id ?? null,
    calendriers_alloues: 50, // ⚠️ HARDCODÉ
    notes: 'Tournée créée automatiquement'
  })
```

---

## 🎯 Recommandations

### Option A : Système simple avec allocation d'équipe (RECOMMANDÉ)

**Principe :** Chaque équipe a un quota, distribué automatiquement à ses membres.

#### ✅ Avantages
- Simple à comprendre et à gérer
- Cohérent avec l'organisation en équipes
- Limite la charge administrative
- Logique métier : l'équipe reçoit X calendriers et les distribue

#### 🔨 Modifications nécessaires
1. **Modifier la création de tournée** pour utiliser une valeur configurable
2. **Ajouter un paramètre global** dans `app_settings` : `calendriers_par_tournee_defaut`
3. **Permettre à l'admin de modifier** cette valeur via l'interface

#### 📝 Exemple d'implémentation

```typescript
// 1. Récupérer le paramètre global
const { data: settings } = await supabase
  .from('app_settings')
  .select('calendriers_par_tournee_defaut')
  .single();

const defaultCalendars = settings?.calendriers_par_tournee_defaut ?? 40;

// 2. Utiliser cette valeur
const { data: newTournee, error } = await supabase
  .from('tournees')
  .insert({
    ...
    calendriers_alloues: defaultCalendars,
    ...
  })
```

#### 🖥️ Interface admin suggérée
**Page : Settings globales**
```
┌─────────────────────────────────────────┐
│ ⚙️  Paramètres de distribution          │
├─────────────────────────────────────────┤
│                                         │
│ Calendriers par tournée (défaut)       │
│ ┌───────┐                               │
│ │  40   │ calendriers                   │
│ └───────┘                               │
│                                         │
│ ℹ️  Nombre de calendriers alloués      │
│    automatiquement à chaque nouvelle   │
│    tournée créée.                      │
│                                         │
│         [Enregistrer]                   │
└─────────────────────────────────────────┘
```

---

### Option B : Allocation individuelle par utilisateur

**Principe :** Chaque utilisateur a son propre quota de calendriers.

#### ✅ Avantages
- Contrôle granulaire par utilisateur
- Permet des allocations différenciées
- Utile si certains membres sont plus actifs

#### ❌ Inconvénients
- Plus complexe à gérer
- Charge administrative importante
- Risque d'oublis et d'erreurs
- Nécessite une interface dédiée

#### 🔨 Modifications nécessaires
1. **Ajouter une colonne** `calendriers_alloues` dans `profiles`
2. **Créer une migration** pour ajouter cette colonne
3. **Modifier la création de tournée** pour utiliser cette valeur
4. **Créer une interface admin** pour gérer les allocations individuelles

#### 📝 Migration SQL
```sql
-- Ajout de la colonne calendriers_alloues dans profiles
ALTER TABLE public.profiles
ADD COLUMN calendriers_alloues INTEGER DEFAULT 40 NOT NULL;

COMMENT ON COLUMN public.profiles.calendriers_alloues IS
  'Nombre de calendriers alloués par défaut à cet utilisateur pour chaque tournée';
```

#### 🖥️ Interface admin suggérée
**Page : Gestion utilisateurs (extension)**
```
┌────────────────────────────────────────────────────┐
│ 👤 Jean Dupont                                     │
│                                                    │
│ Rôle    : [Membre ▼]                              │
│ Équipe  : [Équipe 1 ▼]                            │
│ Calendriers par tournée : ┌────┐                  │
│                           │ 40 │                   │
│                           └────┘                   │
│                                                    │
│                [Enregistrer]                       │
└────────────────────────────────────────────────────┘
```

---

### Option C : Système hybride (allocation par équipe + ajustements individuels)

**Principe :** Valeur par défaut de l'équipe, avec possibilité d'ajuster individuellement.

#### ✅ Avantages
- Meilleur des deux mondes
- Flexibilité maximale
- Gestion simple par défaut, ajustements possibles

#### ❌ Inconvénients
- Plus complexe à implémenter
- Logique métier plus difficile à expliquer
- Risque de confusion

#### 🔨 Modifications nécessaires
1. Ajouter `calendriers_alloues_defaut` dans `equipes`
2. Ajouter `calendriers_alloues_override` (nullable) dans `profiles`
3. Logique : utiliser l'override si défini, sinon la valeur de l'équipe

---

## 🚀 Système de demande de calendriers supplémentaires

### Problématique
Un utilisateur a distribué tous ses calendriers et a besoin d'en demander plus.

### Solution recommandée : Auto-service avec notification

#### 📋 Flux utilisateur proposé

**1. Détection automatique**
```
Lors de la clôture de tournée :
- Si calendriers_distribues >= calendriers_alloues
- Afficher un message : "Besoin de plus de calendriers ?"
```

**2. Interface de demande**
```
┌─────────────────────────────────────────┐
│ ✅ Tournée clôturée avec succès         │
│                                         │
│ 📊 40/40 calendriers distribués         │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 🎯 Besoin de plus de calendriers ?  │ │
│ │                                     │ │
│ │ Nombre souhaité : ┌────┐           │ │
│ │                   │ 40 │           │ │
│ │                   └────┘           │ │
│ │                                     │ │
│ │ Raison (optionnel) :                │ │
│ │ ┌─────────────────────────────────┐ │ │
│ │ │ Zone très dense, besoin de     │ │ │
│ │ │ couvrir plus de maisons        │ │ │
│ │ └─────────────────────────────────┘ │ │
│ │                                     │ │
│ │      [Envoyer la demande]           │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**3. Notification admin**
```
L'admin reçoit :
- Email : "Demande de calendriers - Jean Dupont"
- Notification dans le dashboard admin
- Historique visible dans l'interface
```

**4. Traitement par l'admin**
```
Interface admin :
┌─────────────────────────────────────────┐
│ 📬 Demandes de calendriers en attente   │
├─────────────────────────────────────────┤
│ Jean Dupont (Équipe 1)                  │
│ • Demandé : 40 calendriers              │
│ • Raison : Zone très dense...           │
│ • Date : 17/11/2025 14:30              │
│                                         │
│ [✅ Approuver] [❌ Refuser]             │
└─────────────────────────────────────────┘
```

#### 🔨 Implémentation technique

**1. Nouvelle table : `calendrier_requests`**
```sql
CREATE TABLE public.calendrier_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  quantite_demandee INTEGER NOT NULL,
  raison TEXT,
  statut TEXT DEFAULT 'pending' CHECK (statut IN ('pending', 'approved', 'rejected')),
  traite_par UUID REFERENCES auth.users(id),
  traite_le TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

**2. Composant React pour la demande**
```typescript
// components/request-calendars-modal.tsx
export function RequestCalendarsModal() {
  const [quantity, setQuantity] = useState(40);
  const [reason, setReason] = useState('');

  async function handleSubmit() {
    await fetch('/api/calendars/request', {
      method: 'POST',
      body: JSON.stringify({ quantity, reason })
    });
    toast.success('Demande envoyée à l\'admin');
  }

  return (/* UI */);
}
```

**3. Page admin pour gérer les demandes**
```typescript
// app/dashboard/admin/calendar-requests/page.tsx
// Liste des demandes avec actions approuver/refuser
```

---

## 📌 Résumé des recommandations

### ✅ Action immédiate
**RIEN À FAIRE** pour les rôles : le système fonctionne déjà correctement.

### 🎯 Recommandation prioritaire : Option A (Simple)
1. **Ajouter un paramètre global** `calendriers_par_tournee_defaut = 40`
2. **Modifier la création de tournée** pour utiliser cette valeur
3. **Créer une interface admin** pour modifier ce paramètre
4. **Implémenter le système de demande** de calendriers supplémentaires

**Effort estimé :** 4-6 heures de développement

### 🔄 Évolution future : Option C (Hybride)
Si le besoin de personnalisation individuelle se fait sentir :
- Migrer vers le système hybride
- Ajouter les colonnes nécessaires
- Étendre l'interface admin

**Effort estimé :** 8-12 heures de développement supplémentaires

---

## 🛠️ Plan d'implémentation suggéré

### Phase 1 : Paramétrage global (Immédiat)
1. ✅ Ajouter `calendriers_par_tournee_defaut` dans `app_settings`
2. ✅ Modifier `createNewActiveTournee()` pour utiliser cette valeur
3. ✅ Créer interface admin pour modifier le paramètre
4. ✅ Tester et déployer

### Phase 2 : Système de demande (Court terme)
1. ✅ Créer la table `calendrier_requests`
2. ✅ Créer le composant de demande utilisateur
3. ✅ Créer l'interface admin de gestion
4. ✅ Implémenter les notifications
5. ✅ Tester et déployer

### Phase 3 : Évolution (Moyen terme - si nécessaire)
1. ⏳ Migrer vers allocation individuelle ou hybride
2. ⏳ Étendre l'interface admin
3. ⏳ Former les utilisateurs

---

## ❓ Questions à vous poser

1. **Combien de calendriers avez-vous en stock ?** (pour définir la valeur par défaut)
2. **Tous les membres reçoivent-ils le même nombre ?** (40 pour tous ?)
3. **Y a-t-il des cas particuliers ?** (certains membres plus actifs ?)
4. **Qui gère les demandes de calendriers ?** (chef d'équipe ou admin central ?)
5. **Fréquence des réapprovisionnements ?** (pour dimensionner le système)

---

## 📞 Prochaines étapes

**Option recommandée :**
Je peux implémenter l'**Option A (Simple) + Système de demande** maintenant si vous validez.

**Ou préférez-vous :**
- Discuter des options ?
- Répondre aux questions ci-dessus ?
- Voir une démo/maquette avant ?

**Temps estimé total : 6-8 heures de développement**
