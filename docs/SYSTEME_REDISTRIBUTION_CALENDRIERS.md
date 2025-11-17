# 🔄 Système de redistribution de calendriers - Spécifications

**Date :** 17 novembre 2025
**Contexte :** Optimiser l'utilisation des calendriers entre équipes et membres

---

## 🎯 Objectif métier

**Problème :** Stock limité de calendriers, mais distribution inégale entre les membres.
**Solution :** Système de redistribution intelligent pour éviter le gaspillage.

### Scénario cible

```
Fin de période approche :
├─ Utilisateur A (Équipe 1) : A distribué 40/40 calendriers, zone dense, en veut 20 de plus
├─ Utilisateur B (Équipe 1) : A distribué 15/40 calendriers, zone moins dense
├─ Utilisateur C (Équipe 2) : A distribué 8/40 calendriers, peu disponible
└─ Admin : Veut redistribuer les 25 calendriers inutilisés de B vers A
```

---

## 📋 Fonctionnalités requises

### 1. Vue d'ensemble admin : Qui a quoi ?

**Dashboard admin :**
```
┌────────────────────────────────────────────────────────┐
│ 📊 État des calendriers - Vue globale                  │
├────────────────────────────────────────────────────────┤
│                                                        │
│ Stock total : 200 calendriers                          │
│ • Distribués : 142 (71%)                               │
│ • En possession : 58 (29%)                             │
│ • Demandes en attente : 3                              │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 🔍 Membres avec calendriers inutilisés (>15)      │ │
│ ├────────────────────────────────────────────────────┤ │
│ │ Jean Dupont (Équipe 1)    15/40 (25 restants)     │ │
│ │ Marie Martin (Équipe 2)    8/40 (32 restants) ⚠️  │ │
│ │ Pierre Durand (Équipe 1)  12/40 (28 restants)     │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 📬 Demandes de calendriers                         │ │
│ ├────────────────────────────────────────────────────┤ │
│ │ Paul Petit (Équipe 1)                              │ │
│ │ • Demande : 20 calendriers                         │ │
│ │ • A distribué : 40/40 (100%)                       │ │
│ │ • Raison : "Zone très dense, beaucoup de demandes" │ │
│ │ • Propositions de l'équipe : 2 propositions        │ │
│ │                                                    │ │
│ │ [Voir les propositions] [Redistribuer manuellement]│ │
│ └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

### 2. Demande de calendriers (Utilisateur)

**Déclenchement :** Après clôture d'une tournée OU depuis un bouton dédié

```
┌─────────────────────────────────────────┐
│ 📦 Demander des calendriers             │
├─────────────────────────────────────────┤
│                                         │
│ Votre situation actuelle :              │
│ • Reçus initialement : 40               │
│ • Distribués : 40                       │
│ • Restants : 0                          │
│                                         │
│ Combien de calendriers souhaitez-vous ? │
│ ┌────┐                                  │
│ │ 20 │ calendriers                      │
│ └────┘                                  │
│                                         │
│ Raison (optionnel) :                    │
│ ┌─────────────────────────────────────┐ │
│ │ Ma zone est très dense, j'ai        │ │
│ │ encore beaucoup de portes à faire   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ℹ️  Votre demande sera visible par :   │
│ • Les membres de votre équipe           │
│ • Votre chef d'équipe                   │
│ • L'administrateur                      │
│                                         │
│           [Envoyer la demande]          │
└─────────────────────────────────────────┘
```

### 3. Proposition de don (Membre d'équipe)

**Notification reçue :**
```
┌─────────────────────────────────────────┐
│ 🔔 Nouvelle demande dans votre équipe   │
├─────────────────────────────────────────┤
│                                         │
│ Paul Petit demande 20 calendriers       │
│ Raison : "Zone très dense..."           │
│                                         │
│ Vos calendriers :                       │
│ • Reçus : 40                            │
│ • Distribués : 15                       │
│ • Disponibles : 25                      │
│                                         │
│ Combien pouvez-vous lui donner ?        │
│ ┌────┐                                  │
│ │ 20 │ calendriers                      │
│ └────┘                                  │
│                                         │
│ Message (optionnel) :                   │
│ ┌─────────────────────────────────────┐ │
│ │ Pas de souci, je te les donne !     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Proposer ce don] [Plus tard]           │
└─────────────────────────────────────────┘
```

### 4. Validation du transfert

**Deux approches possibles :**

#### Option A : Transfert automatique (Simple)
- Le donneur propose → Le receveur accepte automatiquement
- Mise à jour immédiate des compteurs
- Notification des deux parties

#### Option B : Transfert validé (Tracé)
- Le donneur propose → Le receveur accepte → Admin valide
- Meilleure traçabilité
- Plus de contrôle
- Mais plus lourd

**Recommandation : Option A** pour commencer, Option B si besoin de traçabilité stricte.

### 5. Redistribution forcée (Admin)

**Interface admin :**
```
┌─────────────────────────────────────────┐
│ 🔄 Redistribuer manuellement            │
├─────────────────────────────────────────┤
│                                         │
│ De :                                    │
│ [Marie Martin (Équipe 2) ▼]             │
│ Disponibles : 32 calendriers            │
│                                         │
│ Vers :                                  │
│ [Paul Petit (Équipe 1) ▼]               │
│ Demande en attente : 20 calendriers     │
│                                         │
│ Quantité à transférer :                 │
│ ┌────┐                                  │
│ │ 20 │ calendriers                      │
│ └────┘                                  │
│                                         │
│ Note pour les deux parties :            │
│ ┌─────────────────────────────────────┐ │
│ │ Redistribution pour optimiser       │ │
│ │ la couverture des secteurs          │ │
│ └─────────────────────────────────────┘ │
│                                         │
│           [Confirmer le transfert]      │
└─────────────────────────────────────────┘
```

---

## 🗄️ Architecture base de données

### Table : `calendar_requests`
```sql
CREATE TABLE public.calendar_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  demandeur_id UUID REFERENCES auth.users(id) NOT NULL,
  quantite_demandee INTEGER NOT NULL,
  raison TEXT,
  statut TEXT DEFAULT 'open' CHECK (statut IN ('open', 'partially_filled', 'filled', 'cancelled')),
  quantite_recue INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.calendar_requests IS
  'Demandes de calendriers supplémentaires par les utilisateurs';
```

### Table : `calendar_offers`
```sql
CREATE TABLE public.calendar_offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES public.calendar_requests(id) ON DELETE CASCADE NOT NULL,
  donneur_id UUID REFERENCES auth.users(id) NOT NULL,
  quantite_proposee INTEGER NOT NULL,
  message TEXT,
  statut TEXT DEFAULT 'proposed' CHECK (statut IN ('proposed', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.calendar_offers IS
  'Propositions de don de calendriers en réponse à une demande';
```

### Table : `calendar_transfers`
```sql
CREATE TABLE public.calendar_transfers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID REFERENCES public.calendar_offers(id) ON DELETE SET NULL,
  donneur_id UUID REFERENCES auth.users(id) NOT NULL,
  receveur_id UUID REFERENCES auth.users(id) NOT NULL,
  quantite INTEGER NOT NULL,
  type TEXT CHECK (type IN ('offer_accepted', 'admin_redistribution')),
  note TEXT,
  executed_by UUID REFERENCES auth.users(id), -- NULL si auto, sinon admin
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE public.calendar_transfers IS
  'Historique des transferts de calendriers effectués';
```

### Ajout dans `profiles`
```sql
-- Ajouter un compteur de calendriers en possession
ALTER TABLE public.profiles
ADD COLUMN calendriers_initiaux INTEGER DEFAULT 40 NOT NULL,
ADD COLUMN calendriers_disponibles INTEGER DEFAULT 40 NOT NULL;

COMMENT ON COLUMN public.profiles.calendriers_initiaux IS
  'Nombre de calendriers reçus initialement (défini par admin)';

COMMENT ON COLUMN public.profiles.calendriers_disponibles IS
  'Nombre de calendriers actuellement en possession (après transferts)';
```

---

## 🔄 Flux de redistribution

### Scénario 1 : Redistribution intra-équipe

```
1. Paul (Équipe 1) demande 20 calendriers
   └─> Statut demande : 'open'

2. Notification envoyée à tous les membres de l'Équipe 1
   └─> Email + notification in-app

3. Jean (Équipe 1) propose de donner 15 calendriers
   └─> Création d'un calendar_offer (statut: 'proposed')

4. Marie (Équipe 1) propose de donner 10 calendriers
   └─> Création d'un autre calendar_offer

5. Paul accepte les deux offres
   └─> Transfer automatique
   └─> Mise à jour des compteurs :
       - Jean : calendriers_disponibles -= 15
       - Marie : calendriers_disponibles -= 10
       - Paul : calendriers_disponibles += 25
   └─> Statut demande : 'filled' (25 >= 20)
   └─> Offres : statut → 'accepted'
```

### Scénario 2 : Redistribution inter-équipes

```
1. Paul (Équipe 1) demande 20 calendriers
   └─> Statut : 'open'

2. Notification Équipe 1 (priorité)
   └─> Aucune proposition après 24h

3. Notification étendue à toutes les équipes
   └─> Ou admin intervient directement

4. Admin utilise "Redistribution forcée"
   └─> Sélectionne Pierre (Équipe 2) qui a 32 calendriers inutilisés
   └─> Transfère 20 calendriers de Pierre vers Paul
   └─> Type : 'admin_redistribution'
   └─> Notification envoyée aux deux parties
```

### Scénario 3 : Annulation

```
1. Paul demande 20 calendriers
2. Finalement, Paul trouve une autre solution
3. Paul annule sa demande
   └─> Statut : 'cancelled'
   └─> Toutes les offres associées : statut → 'cancelled'
```

---

## 📊 Vues SQL utiles

### Vue : Disponibilité des calendriers par utilisateur

```sql
CREATE OR REPLACE VIEW public.calendars_availability_view AS
SELECT
  p.id as user_id,
  p.full_name,
  p.team_id,
  e.nom as equipe_nom,

  -- Calendriers
  p.calendriers_initiaux,
  COALESCE(SUM(t.calendriers_distribues), 0) as calendriers_distribues,
  p.calendriers_disponibles,

  -- Statut
  CASE
    WHEN p.calendriers_disponibles > 20 THEN 'surplus'
    WHEN p.calendriers_disponibles > 0 THEN 'ok'
    ELSE 'epuise'
  END as statut,

  -- Demandes
  (SELECT COUNT(*) FROM public.calendar_requests
   WHERE demandeur_id = p.id AND statut = 'open') as demandes_actives

FROM public.profiles p
LEFT JOIN public.equipes e ON e.id = p.team_id
LEFT JOIN public.tournees t ON t.user_id = p.id AND t.statut = 'completed'
WHERE p.role IN ('membre', 'chef_equipe')
GROUP BY p.id, p.full_name, p.team_id, e.nom,
         p.calendriers_initiaux, p.calendriers_disponibles;
```

### Vue : Demandes avec propositions

```sql
CREATE OR REPLACE VIEW public.requests_with_offers_view AS
SELECT
  r.id as request_id,
  r.demandeur_id,
  pd.full_name as demandeur_nom,
  pd.team_id as demandeur_equipe_id,
  ed.nom as demandeur_equipe_nom,
  r.quantite_demandee,
  r.quantite_recue,
  r.raison,
  r.statut,
  r.created_at,

  -- Offres
  COALESCE(COUNT(o.id), 0) as nb_offres,
  COALESCE(SUM(CASE WHEN o.statut = 'proposed' THEN o.quantite_proposee ELSE 0 END), 0) as quantite_proposee_total

FROM public.calendar_requests r
LEFT JOIN public.profiles pd ON pd.id = r.demandeur_id
LEFT JOIN public.equipes ed ON ed.id = pd.team_id
LEFT JOIN public.calendar_offers o ON o.request_id = r.id
GROUP BY r.id, r.demandeur_id, pd.full_name, pd.team_id, ed.nom,
         r.quantite_demandee, r.quantite_recue, r.raison, r.statut, r.created_at;
```

---

## 🚀 Plan d'implémentation

### Phase 1 : Fondations (2-3h)
- ✅ Migration : Ajouter `calendriers_initiaux` et `calendriers_disponibles` dans profiles
- ✅ Créer tables `calendar_requests`, `calendar_offers`, `calendar_transfers`
- ✅ Créer les vues SQL
- ✅ Ajouter RLS policies

### Phase 2 : Demande de calendriers (2-3h)
- ✅ Composant React : Formulaire de demande
- ✅ API route : POST /api/calendars/request
- ✅ Affichage des demandes actives dans le profil utilisateur

### Phase 3 : Proposition de don (3-4h)
- ✅ Système de notifications (email + in-app)
- ✅ Page : Liste des demandes visibles pour l'équipe
- ✅ Composant : Formulaire de proposition
- ✅ API route : POST /api/calendars/offer
- ✅ API route : POST /api/calendars/offer/accept

### Phase 4 : Dashboard admin (3-4h)
- ✅ Vue d'ensemble : Disponibilité des calendriers
- ✅ Liste des demandes en attente
- ✅ Membres avec surplus de calendriers
- ✅ Interface de redistribution forcée
- ✅ Historique des transferts

### Phase 5 : Notifications et UX (2-3h)
- ✅ Emails transactionnels (Resend)
- ✅ Notifications in-app temps réel
- ✅ Badges de notification
- ✅ Amélioration de l'UX générale

**Total estimé : 12-17 heures de développement**

---

## 🎯 Version MVP (Minimum Viable Product)

Si vous voulez commencer rapidement, voici une version simplifiée :

### MVP : Redistribution admin uniquement (4-6h)

1. ✅ Ajouter compteurs dans profiles
2. ✅ Dashboard admin : Vue disponibilité
3. ✅ Interface admin : Redistribution manuelle
4. ✅ Historique des transferts

**Ensuite, ajouter progressivement :**
- Demandes utilisateur
- Propositions d'équipe
- Notifications automatiques

---

## ❓ Questions pour vous

1. **Voulez-vous commencer par le MVP ou la version complète ?**
2. **Les transferts doivent-ils être validés par l'admin ou automatiques ?**
3. **Notification par email indispensable ou juste in-app suffit ?**
4. **Voulez-vous un système de "réservation" des calendriers non utilisés ?**
5. **Faut-il limiter les demandes (ex: max 1 demande active par personne) ?**

---

## 🚀 Prochaines étapes

Dites-moi :
- Quelle version vous préférez (MVP ou complète) ?
- Quelles fonctionnalités sont prioritaires ?
- Si des ajustements sont nécessaires ?

Et je commence l'implémentation ! 💪
