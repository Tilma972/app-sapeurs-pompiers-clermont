# AUDIT COMPLET - Feature "Vie de Caserne / Evenements Associatifs"

**Date d'audit :** 2026-02-09
**Perimetre :** Module `lib/features/associative/` + composants + pages

---

## 1. INVENTAIRE DES FICHIERS

### Server Actions
| Fichier | Lignes | Description |
|---------|--------|-------------|
| `lib/features/associative/actions/events.ts` | 425 | CRUD evenements + participation |
| `lib/features/associative/actions/money-pots.ts` | ~440 | Cagnottes + Stripe |
| `lib/features/associative/actions/polls.ts` | ~430 | Sondages + votes |

### Types
| Fichier | Lignes | Description |
|---------|--------|-------------|
| `lib/features/associative/types.ts` | 265 | Interfaces, enums, labels, DTOs |
| `lib/features/associative/index.ts` | 61 | Barrel exports du module |

### Composants UI
| Fichier | Description |
|---------|-------------|
| `components/associative/index.ts` | Barrel exports composants |
| `components/associative/events-tab.tsx` | Onglet evenements (liste + tabs upcoming/past) |
| `components/associative/event-card.tsx` | Carte evenement standalone |
| `components/associative/create-event-dialog.tsx` | Dialog creation evenement |
| `components/associative/money-pots-tab.tsx` | Onglet cagnottes |
| `components/associative/money-pot-card.tsx` | Carte cagnotte |
| `components/associative/materials-tab.tsx` | Onglet materiel |
| `components/associative/material-card.tsx` | Carte materiel |
| `components/associative/polls-tab.tsx` | Onglet sondages |
| `components/associative/poll-card.tsx` | Carte sondage |
| `components/associative/stats-cards.tsx` | Cartes statistiques (non utilise en page) |
| `components/associative/recent-activities-feed.tsx` | Feed d'activites recentes |

### Pages / Routes
| Fichier | Route | Description |
|---------|-------|-------------|
| `app/(pwa)/associative/page.tsx` | `/associative` | Page principale Vie de Caserne |

### Schema DB / Migrations
| Fichier | Description |
|---------|-------------|
| `prisma/migration_vie_associative.sql` | Schema initial (7 tables + enums + RLS) |
| `supabase/migrations/20251211_fix_associative_user_ids.sql` | Fix TEXT->UUID + FK vers profiles + RLS enrichies |

---

## 2. CARTOGRAPHIE FONCTIONNELLE

### Core (critique)

| Fonctionnalite | Implemente | Localisation | Commentaires |
|----------------|------------|--------------|--------------|
| Creer un evenement (AG ou autre) | :white_check_mark: | `actions/events.ts:70` `createEvent()` | Fonctionne, pas de validation Zod |
| Lister les evenements a venir | :white_check_mark: | `actions/events.ts:133` `getEvents({upcoming: true})` | Pagination OK, filtrage OK |
| Afficher le detail d'un evenement | :white_check_mark: Partiel | `actions/events.ts:205` `getEventById()` | Action existe mais **pas de page detail dediee** (`/associative/[eventId]` n'existe pas) |
| Confirmer sa participation (present/absent/astreinte) | :white_check_mark: | `actions/events.ts:244` `updateParticipation()` | Upsert avec check capacite |
| Modifier sa participation | :white_check_mark: | `actions/events.ts:244` | Meme action, upsert |
| Specifier un nombre d'invites | :white_check_mark: Partiel | `types.ts:194` `guests?: number` | Le champ existe dans le type et la DB mais **n'est pas expose dans l'UI** |
| Laisser un commentaire avec sa participation | :x: | - | Pas de champ `comment` dans `UpdateParticipationInput` ni dans la table |
| Verifier les limites de places | :white_check_mark: | `actions/events.ts:266-287` | Check avant upsert si PRESENT + maxParticipants |
| Annuler un evenement | :white_check_mark: | `actions/events.ts:317` `cancelEvent()` | Organizer only, met status CANCELLED |

### Utilisateur

| Fonctionnalite | Implemente | Localisation | Commentaires |
|----------------|------------|--------------|--------------|
| Voir MA participation actuelle | :white_check_mark: | `events-tab.tsx:56` | `event.participants.find(p => p.userId === userId)` |
| Recevoir une notification pour un nouvel evenement | :x: | - | Pas de systeme de notification push ni email |
| Filtrer les evenements (a venir/passes) | :white_check_mark: | `events-tab.tsx:134-139` | Tabs "A venir" / "Passes" |
| Distinguer visuellement les AG des autres evenements | :white_check_mark: | `event-card.tsx:39-45` | Barre laterale coloree par type (AG=bleu, SAINTE_BARBE=rouge, etc.) |
| Voir mes evenements a venir | :white_check_mark: | `actions/events.ts:357` `getMyUpcomingEvents()` | Action existante mais **non utilisee dans l'UI** |

### Admin / Tresorier

| Fonctionnalite | Implemente | Localisation | Commentaires |
|----------------|------------|--------------|--------------|
| Voir la liste complete des participants | :white_check_mark: Partiel | `event-card.tsx:62-63` | Compte affiche, mais **pas de vue liste detaillee des noms** |
| Exporter la liste des participants (CSV/Excel) | :x: | - | Aucune fonctionnalite d'export |
| Voir les non-repondants | :x: | - | Pas de croisement avec la liste des membres |
| Modifier un evenement | :x: | - | Pas de `updateEvent()` server action |
| Supprimer un evenement | :x: | - | Pas de `deleteEvent()`, uniquement `cancelEvent()` |
| Envoyer un rappel aux non-repondants | :x: | - | Aucun systeme d'envoi de notifications |

### Optionnel

| Fonctionnalite | Implemente | Localisation | Commentaires |
|----------------|------------|--------------|--------------|
| Cagnotte associee a l'evenement | :white_check_mark: | `actions/money-pots.ts` + Stripe | Fonctionnel avec Stripe PaymentIntent |
| Sondages integres dans l'evenement | :white_check_mark: | `actions/polls.ts` | Dont `createDatePoll()` pour choix de dates |
| Historique de participation par pompier | :x: | - | Pas de vue historique utilisateur |
| Statistiques de participation | :white_check_mark: Partiel | `actions/events.ts:399` `getEventsStats()` | Action existe mais `StatsCards` non branche dans la page |

---

## 3. POINTS D'ATTENTION

### 3.1 Securite

| Probleme | Severite | Localisation | Detail |
|----------|----------|--------------|--------|
| **Aucune validation Zod** sur les server actions | :red_circle: Haute | Toutes les actions | Les inputs sont types TypeScript mais pas valides a l'execution. Un appel direct pourrait injecter des donnees malformees |
| **Pas de role-based access control (RBAC)** | :red_circle: Haute | `createEvent()` | N'importe quel utilisateur authentifie peut creer un evenement, pas seulement admin/bureau |
| **`getEvents()` et `getEventById()` sans auth check** | :orange_circle: Moyenne | `actions/events.ts:133,205` | Appellent `createClient()` mais ne verifient pas `getCurrentUser()`. Les RLS protegent en DB mais les erreurs ne sont pas gerees proprement |
| **`cancelEvent()` ownership uniquement** | :orange_circle: Moyenne | `actions/events.ts:332` | Un admin ne peut pas annuler un evenement d'un autre organisateur |
| **RLS: pas de policy DELETE** | :red_circle: Haute | `associative_events`, `associative_event_participants` | Aucune policy DELETE definie = impossible de supprimer via le client Supabase. Seul service_role peut le faire |
| **RLS contradictoire** | :orange_circle: Moyenne | Migration initiale vs fix | 1ere migration: SELECT `auth.role() = 'authenticated'`. 2eme migration: SELECT `true` (public). Conflit potentiel entre les deux policies |
| **`closePoll()` et `deletePoll()` sans auth** | :red_circle: Haute | `actions/polls.ts:365,389` | N'importe qui peut fermer ou supprimer un sondage |

### 3.2 Code Quality

| Probleme | Severite | Localisation | Detail |
|----------|----------|--------------|--------|
| **Helpers `map*Dates` utilisent `any`** | :orange_circle: Moyenne | `actions/events.ts:34-65` | `mapEventDates(event: any)` - perte de type safety |
| **`Poll.options` type `any`** | :orange_circle: Moyenne | `types.ts:89` | `options: any` au lieu de `PollOption[]` |
| **Composant `EventCard` duplique** | :yellow_circle: Basse | `event-card.tsx` + `events-tab.tsx:47-126` | Deux composants EventCard: un standalone dans `event-card.tsx` et un inline dans `events-tab.tsx`. L'inline est celui utilise en production, le standalone est un composant mort |
| **`StatsCards` composant mort** | :yellow_circle: Basse | `components/associative/stats-cards.tsx` | Exporte mais jamais importe dans aucune page |
| **Pas de gestion d'erreur utilisateur** | :orange_circle: Moyenne | `events-tab.tsx:141-146` | `handleParticipate` ne gere pas le resultat d'erreur de `updateParticipation()` |
| **Race condition sur la capacite** | :orange_circle: Moyenne | `actions/events.ts:266-287` | Le check de capacite et l'upsert ne sont pas atomiques. Deux utilisateurs pourraient s'inscrire simultanement au-dela de la limite |
| **`comment` dans `updateParticipation` absent** | :yellow_circle: Basse | `types.ts:192-196` | Le champ n'existe ni dans l'interface ni en DB |

### 3.3 Architecture

| Probleme | Severite | Detail |
|----------|----------|--------|
| **Pas de page detail evenement** | :orange_circle: Moyenne | `getEventById()` existe mais pas de route `/associative/[eventId]` |
| **`onViewDetails` jamais connecte** | :yellow_circle: Basse | `EventCard` (standalone) a un prop `onViewDetails` mais il n'est jamais passe |
| **Pas de `updateEvent()`** | :orange_circle: Moyenne | Impossible de modifier titre, date, lieu, description apres creation |
| **Pas de `deleteEvent()`** | :orange_circle: Moyenne | Seulement cancelEvent existe |
| **Toasts mais pas de feedback sur participation** | :yellow_circle: Basse | `events-tab.tsx` appelle `updateParticipation()` dans `startTransition` mais ne montre ni succes ni erreur |
| **`getMyUpcomingEvents()` non utilisee** | :yellow_circle: Basse | Server action definie mais jamais appelee dans l'UI |
| **`getEventsStats()` non utilisee dans la page** | :yellow_circle: Basse | `StatsCards` non branche |

---

## 4. SCHEMA DE BASE DE DONNEES

### Table `associative_events`

| Colonne | Type | Contrainte | Description |
|---------|------|------------|-------------|
| `id` | UUID | PK, DEFAULT `gen_random_uuid()` | Identifiant unique |
| `title` | TEXT | NOT NULL | Titre de l'evenement |
| `description` | TEXT | NULLABLE | Description longue |
| `date` | TIMESTAMP(3) | NOT NULL | Date et heure |
| `location` | TEXT | NULLABLE | Lieu |
| `type` | EventType ENUM | NOT NULL | AG, SAINTE_BARBE, REPAS_GARDE, SPORT, AUTRE |
| `status` | EventStatus ENUM | NOT NULL, DEFAULT 'PLANNED' | DRAFT, PLANNED, COMPLETED, CANCELLED |
| `maxParticipants` | INTEGER | NULLABLE | Limite de places |
| `organizerId` | UUID | NOT NULL, FK -> profiles(id) | Createur |
| `createdAt` | TIMESTAMP(3) | NOT NULL, DEFAULT NOW | Auto |
| `updatedAt` | TIMESTAMP(3) | NOT NULL, DEFAULT NOW | Auto via trigger |

**Index :** `organizerId`, `date`

### Table `associative_event_participants`

| Colonne | Type | Contrainte | Description |
|---------|------|------------|-------------|
| `id` | UUID | PK | Identifiant unique |
| `eventId` | UUID | NOT NULL, FK -> associative_events(id) CASCADE | Evenement |
| `userId` | UUID | NOT NULL, FK -> profiles(id) CASCADE | Participant |
| `status` | ParticipationStatus ENUM | NOT NULL | PRESENT, ABSENT, ASTREINTE |
| `guests` | INTEGER | NOT NULL, DEFAULT 0 | Nombre d'invites |
| `createdAt` | TIMESTAMP(3) | NOT NULL | Auto |
| `updatedAt` | TIMESTAMP(3) | NOT NULL | Auto via trigger |

**Contrainte unique :** `(eventId, userId)`
**Index :** `userId`

### RLS Policies (etat final apres les 2 migrations)

#### `associative_events`
| Policy | Operation | Condition |
|--------|-----------|-----------|
| Authenticated users can view events | SELECT | `auth.role() = 'authenticated'` |
| Events are viewable by everyone | SELECT | `true` |
| Events are insertable by authenticated | INSERT | `auth.role() = 'authenticated'` |
| Events are updatable by organizer | UPDATE | `auth.uid() = organizerId` |
| *(aucune policy DELETE)* | DELETE | **BLOQUE** |

#### `associative_event_participants`
| Policy | Operation | Condition |
|--------|-----------|-----------|
| Authenticated users can view participants | SELECT | `auth.role() = 'authenticated'` |
| Participants viewable by everyone | SELECT | `true` |
| Participants insertable by self | INSERT | `auth.uid() = userId` |
| Participants updatable by self | UPDATE | `auth.uid() = userId` |
| *(aucune policy DELETE)* | DELETE | **BLOQUE** |

### Relations

```
associative_events (1)
  |-- (1:N) associative_event_participants
  |       |-- userId -> profiles(id) CASCADE
  |-- (1:0..1) associative_money_pots
  |       |-- (1:N) associative_contributions
  |               |-- userId -> profiles(id)
  |               |-- stripePaymentId pour paiement
  |-- (1:N) associative_polls
          |-- (1:N) associative_poll_votes
                  |-- userId -> profiles(id) CASCADE
```

---

## 5. DEPENDANCES EXTERNES

| Package | Version | Usage pour la feature |
|---------|---------|----------------------|
| `date-fns` | ^4.1.0 | Formatage des dates (`format` avec locale `fr`) |
| `react-hook-form` | ^7.66.0 | Formulaire de creation d'evenement |
| `sonner` | ^2.0.7 | Toast notifications (succes/erreur) |
| `stripe` | ^19.1.0 | Paiement pour cagnottes (server-side) |
| `@stripe/react-stripe-js` | ^5.2.0 | Integration Stripe cote client |
| `@stripe/stripe-js` | ^8.1.0 | Stripe.js |
| `lucide-react` | ^0.511.0 | Icones (CalendarDays, MapPin, Users, etc.) |
| `@supabase/supabase-js` | latest | Client DB |
| `@radix-ui/*` | varies | Composants UI (Dialog, Tabs, Select, Switch, Badge) |

**Absences notables :** Pas de librairie d'export CSV/Excel.

---

## 6. SCHEMA DE FLUX UTILISATEUR

### Flux principal

```
1. User se connecte et accede a /associative
   -> AssociativePage (server component)
   -> Promise.all([getEvents(), getActiveMoneyPots(), getAllMaterials(), getActivePolls()])
   -> Rendu avec 4 onglets

2. Onglet "Evenements" (defaut)
   -> EventsTab recoit events[] et userId
   -> Affiche tabs "A venir" / "Passes"
   -> Pour chaque evenement: EventCard (inline) avec boutons participation

3. User clique sur "Present" / "Absent" / "Astreinte"
   -> handleParticipate() dans EventsTab
   -> startTransition -> updateParticipation({ eventId, status })
   -> Server: check auth -> check capacite -> upsert participation
   -> revalidatePath('/associative')
   -> router.refresh()

4. User clique sur "Creer un evenement"
   -> CreateEventDialog s'ouvre (react-hook-form)
   -> User remplit le formulaire + option cagnotte
   -> onSubmit -> createEvent(input)
   -> Server: check auth -> insert event -> insert money_pot si demande
   -> revalidatePath('/associative')
   -> toast.success() + dialog ferme

5. Feed "Activites recentes" (en haut de page)
   -> buildRecentActivities() cote serveur
   -> Montre: evenements < 7 jours, cagnottes > 75% objectif, sondages expirant < 3 jours
   -> Limite a 5 items
```

### Flux manquants

```
- Pas de flux "voir detail evenement" (pas de page [eventId])
- Pas de flux "modifier un evenement"
- Pas de flux "voir liste des participants avec noms"
- Pas de flux "exporter participants"
- Pas de flux "envoyer rappel"
- Pas de flux "specifier nombre d'invites" (champ existe mais pas d'UI)
```

---

## 7. SERVER ACTIONS - DETAIL COMPLET

### `createEvent(input: CreateEventInput)` - `events.ts:70`

```
Params:   { title, description?, date, location?, type, maxParticipants?, createMoneyPot?, moneyPotTitle?, moneyPotTarget? }
Auth:     getCurrentUser() - authentification requise
Validation: Aucune (pas de Zod)
RBAC:     Aucun - tout utilisateur authentifie peut creer
Logique:  1. Insert event -> 2. Insert money_pot si demande
Retour:   ActionResult<EventWithDetails>
Cache:    revalidatePath('/associative')
```

### `getEvents(options?)` - `events.ts:133`

```
Params:   { page?, pageSize?, status?, type?, upcoming? }
Auth:     Aucune verification explicite (RLS en DB)
Validation: Aucune
Logique:  Select avec jointures (participants, moneyPot+contributions, polls+votes)
Retour:   { items: EventWithDetails[], total, page, pageSize, hasMore }
Erreur:   Retourne tableau vide
```

### `getEventById(eventId: string)` - `events.ts:205`

```
Params:   eventId: string
Auth:     Aucune verification explicite
Validation: Aucune
Retour:   EventWithDetails | null
```

### `updateParticipation(input: UpdateParticipationInput)` - `events.ts:244`

```
Params:   { eventId, status: 'PRESENT'|'ABSENT'|'ASTREINTE', guests? }
Auth:     getCurrentUser() - authentification requise
Validation: Aucune (pas de Zod)
Logique:  1. Verifier event existe
           2. Si PRESENT + maxParticipants: check capacite
           3. Upsert sur (eventId, userId)
Retour:   ActionResult
Cache:    revalidatePath('/associative')
Attention: Race condition possible sur le check de capacite
```

### `cancelEvent(eventId: string)` - `events.ts:317`

```
Params:   eventId: string
Auth:     getCurrentUser() + ownership check (organizerId === user.id)
Validation: Aucune
Logique:  Update status -> 'CANCELLED'
Retour:   ActionResult
```

### `getMyUpcomingEvents()` - `events.ts:357`

```
Params:   Aucun
Auth:     getCurrentUser()
Logique:  Jointure inversee participants -> events ou status=PRESENT et date future
Retour:   Array d'evenements avec count participants
Note:     NON UTILISE dans l'UI actuellement
```

### `getEventsStats()` - `events.ts:399`

```
Params:   Aucun
Auth:     Aucune
Logique:  3 count queries en parallele (upcoming, past, totalParticipants)
Retour:   { upcoming, past, totalParticipants }
Note:     NON UTILISE dans la page (StatsCards non branche)
```

---

## 8. COMPOSANTS UI - DETAIL

### `EventsTab` (`events-tab.tsx`)

```
Props:    { events: EventWithDetails[], userId: string }
State:    isDialogOpen (useState), useTransition pour participation
Actions:  updateParticipation() via startTransition + router.refresh()
Contenu:  Tabs "A venir" / "Passes" + bouton "Creer un evenement"
Interne:  EventCard inline (different du standalone event-card.tsx)
```

### `EventCard` standalone (`event-card.tsx`)

```
Props:    { event, currentUserId?, onParticipate?, onViewDetails? }
Features: Barre couleur par type, badges (type/status/complet/passe),
          date formatee, lieu, compteur participants + invites,
          cagnotte si presente, boutons participation
Note:     Ce composant est EXPORTE mais NON UTILISE - c'est le EventCard
          inline de events-tab.tsx qui est utilise en production
```

### `CreateEventDialog` (`create-event-dialog.tsx`)

```
Props:    { open, onOpenChange, onSuccess? }
Form:     react-hook-form avec CreateEventInput
Champs:   title*, type*, date*, location, maxParticipants, description,
          createMoneyPot toggle, moneyPotTitle, moneyPotTarget
Actions:  createEvent() + toast
Note:     Pas de validation Zod, seulement required sur title et date
```

---

## 9. BONNES PRATIQUES IDENTIFIEES

1. **Architecture modulaire** - Feature-based organization dans `lib/features/associative/` avec barrel exports
2. **Chargement parallele** - `Promise.all()` dans la page serveur pour les 4 sources de donnees
3. **Types enrichis** - `EventWithDetails` combine l'event avec ses relations
4. **Upsert intelligent** - Participation utilise `onConflict: 'eventId, userId'` pour eviter les doublons
5. **Labels centralises** - `EventTypeLabels`, `ParticipationStatusLabels` dans les types
6. **Migration incrementale** - TEXT -> UUID fait proprement avec `USING "col"::uuid`
7. **FK avec ON DELETE** - CASCADE sur participants quand event supprime, RESTRICT sur contributions
8. **Trigger `updatedAt`** - Automatique via PostgreSQL trigger
9. **Index pertinents** - `organizerId`, `date`, `userId` indexes pour les requetes frequentes
10. **Composants separes** - Separation claire entre composants de presentation et containers

---

## 10. GAPS PRIORITAIRES - TOP 10

### P0 - Critique (securite)

| # | Gap | Impact | Effort |
|---|-----|--------|--------|
| 1 | **Ajouter validation Zod** sur `createEvent()`, `updateParticipation()`, `cancelEvent()` | Securite: un appel direct peut envoyer n'importe quoi | Faible |
| 2 | **Ajouter RBAC** sur `createEvent()` (restreindre aux roles bureau/admin) | N'importe qui peut creer des evenements | Faible |
| 3 | **Ajouter auth check** sur `closePoll()` et `deletePoll()` | N'importe qui peut supprimer un sondage | Faible |
| 4 | **Ajouter policy RLS DELETE** ou desactiver la suppression | Tables non protegeables sans policy DELETE | Faible |

### P1 - Haute (fonctionnel)

| # | Gap | Impact | Effort |
|---|-----|--------|--------|
| 5 | **Creer `updateEvent()`** server action | Impossible de corriger un evenement apres creation | Moyen |
| 6 | **Creer la page detail** `/associative/[eventId]` avec liste complete des participants | Pas de vue detaillee | Moyen |
| 7 | **Ajouter feedback** toast succes/erreur sur la participation | L'utilisateur ne sait pas si sa participation a ete enregistree | Faible |
| 8 | **Exposer le champ `guests`** dans l'UI de participation | Le champ existe en DB mais n'est pas accessible | Faible |

### P2 - Moyenne (amelioration)

| # | Gap | Impact | Effort |
|---|-----|--------|--------|
| 9 | **Export CSV** de la liste des participants | Besoin tresorier | Moyen |
| 10 | **Supprimer le composant `EventCard` standalone** mort ou le brancher | Code mort inutile | Faible |

---

## 11. QUICK WINS (< 30 min chacun)

1. **Ajouter des schemas Zod** pour `CreateEventInput` et `UpdateParticipationInput`
2. **Ajouter `toast.success/error`** dans `handleParticipate` de `events-tab.tsx`
3. **Supprimer `event-card.tsx`** standalone (ou remplacer l'inline par celui-ci)
4. **Typer `Poll.options`** comme `PollOption[]` au lieu de `any`
5. **Brancher `StatsCards`** dans la page ou le supprimer
6. **Ajouter un champ input `guests`** dans le footer des EventCards
7. **Corriger la double policy SELECT** (choisir entre `authenticated` et `true`)

---

## 12. RESUME EXECUTIF

La feature "Vie de Caserne / Evenements Associatifs" est **fonctionnelle pour un MVP** avec :
- Creation d'evenements avec types (AG, Sainte-Barbe, etc.)
- Gestion de participation (present/absent/astreinte) avec check de capacite
- Cagnottes integrees avec Stripe
- Sondages avec vote et date polls
- Feed d'activites recentes

**Points forts :** Architecture modulaire propre, types TypeScript, chargement parallele, schema DB solide avec RLS.

**Faiblesses principales :**
1. **Aucune validation Zod** sur les server actions (risque securite)
2. **Pas de RBAC** - tout utilisateur authentifie peut tout creer
3. **Pas de page detail** evenement ni de liste de participants nominative
4. **Pas de modification** d'evenement apres creation
5. **Composant EventCard duplique** (standalone mort vs inline utilise)
6. **Champ `guests` non expose** dans l'UI malgre le support DB
7. **Pas de notifications** (push/email) pour les nouveaux evenements

La feature necessite principalement un renforcement de la **securite (Zod + RBAC)** et l'ajout de fonctionnalites **admin/tresorier** (modification, export, rappels) pour etre production-ready.
