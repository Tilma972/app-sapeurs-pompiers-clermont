# Amicale des Sapeurs-Pompiers de Clermont-l'Hérault

Application interne (PWA) de gestion pour l'**Amicale des Sapeurs-Pompiers de Clermont-l'Hérault** (Hérault, 34).

Gestion des tournées de calendriers, dons, reçus fiscaux, équipes, gamification, galerie photo, boîte à idées, boutique, comptes membres et page publique vitrine.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | **Next.js 16** (App Router, Turbopack) |
| Langage | **TypeScript 5.9** (strict) |
| React | **React 19** |
| Base de données | **Supabase** (PostgreSQL + Auth + Storage + Realtime) |
| Styles | **Tailwind CSS 3.4** + variables CSS (HSL) |
| Composants UI | **shadcn/ui** (style New York, primitives Radix) |
| Icônes | **Lucide React** |
| Formulaires | **React Hook Form** + **Zod** |
| Animations | **Framer Motion** |
| Cartes | **Leaflet** + **React Leaflet** |
| Paiements | **Stripe** (CB) + **HelloAsso** (dons) |
| Emails | **Resend** |
| IA | **Claude** (analyse d'idées) + **Whisper** (transcription vocale) |
| Thème | **next-themes** (clair / sombre) |
| Déploiement | **Vercel** |

---

## Prérequis

- **Node.js** >= 20
- **npm** >= 10
- Un projet **Supabase** (PostgreSQL + Auth + Storage)
- Comptes **Stripe**, **HelloAsso**, **Resend** pour les intégrations tierces

---

## Installation

### 1. Cloner le dépôt

```bash
git clone <url-du-repo>
cd app-sapeurs-pompiers-clermont
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer les variables d'environnement

Copier le fichier d'exemple et renseigner les valeurs :

```bash
cp .env.example .env.local
```

**Variables requises :**

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` | Clé publique (anon) Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role (serveur uniquement) |
| `NEXT_PUBLIC_SITE_URL` | URL publique du site |
| `HELLOASSO_CLIENT_ID` / `HELLOASSO_CLIENT_SECRET` | OAuth HelloAsso |
| `HELLOASSO_ORGANIZATION_SLUG` | Slug de l'organisation HelloAsso |
| `HELLOASSO_WEBHOOK_SECRET` | Secret de vérification webhook HelloAsso |
| `RESEND_API_KEY` / `RESEND_FROM` | Envoi d'emails (Resend) |
| `OPENAI_API_KEY` | Transcription audio (Whisper) |
| `ANTHROPIC_API_KEY` | Analyse IA des idées (Claude) |

Voir `.env.example` pour la liste complète.

### 4. Appliquer les migrations

```bash
npm run db:push
```

### 5. Générer les types Supabase

```bash
npm run db:types
```

### 6. Lancer le serveur de développement

```bash
npm run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

---

## Commandes

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement (Turbopack) |
| `npm run build` | Build de production |
| `npm start` | Lancer le serveur de production |
| `npm run lint` | Linting ESLint |
| `npm run typecheck` | Vérification des types TypeScript |
| `npm run db:push` | Appliquer les migrations Supabase |
| `npm run db:types` | Générer les types depuis la base de données |
| `npm run clean` | Nettoyer le cache `.next` |

---

## Structure du projet

```
app/
├── (landing)/              # Pages publiques (vitrine, boutique, partenaires)
├── (pwa)/                  # Application authentifiée (dashboard, tournées, admin...)
├── auth/                   # Authentification (login, inscription, mot de passe)
├── don/                    # Parcours de don public
├── pay/                    # Pages de paiement
├── recu/                   # Téléchargement de reçus fiscaux
├── actions/                # Server Actions (mutations)
└── api/                    # Route Handlers (webhooks, uploads, IA)

components/
├── ui/                     # Composants shadcn/ui (ne pas modifier directement)
├── landing/                # Sections page d'accueil
├── admin/                  # Composants admin
├── tournee/                # Gestion des tournées
├── gallery/                # Galerie photo
├── idees/                  # Boîte à idées
├── gamification/           # Widgets de gamification
└── ...                     # Autres modules métier

lib/
├── supabase/               # Clients Supabase + requêtes par domaine
├── types/                  # Définitions TypeScript
├── config.ts               # Constantes métier centralisées
├── stripe/                 # Client Stripe
├── helloasso/              # Client HelloAsso
├── email/                  # Templates email (Resend)
├── pdf/                    # Génération de reçus PDF
└── utils.ts                # Utilitaires (cn, formatters...)

hooks/                      # Hooks React custom
supabase/migrations/        # 115 fichiers de migration SQL
public/                     # Assets statiques, manifest PWA, icônes
docs/                       # Documentation détaillée (90+ fichiers)
```

---

## Fonctionnalités principales

### Page publique (Landing)
- Présentation de l'amicale et de ses actions
- Liste des 20 communes protégées
- Parcours de don en ligne (Stripe + HelloAsso)
- Boutique en ligne
- Inscription partenaire

### Espace membre (PWA)
- **Dashboard** avec KPIs et statistiques en temps réel
- **Tournées** : gestion des rondes de vente de calendriers avec carte interactive
- **Calendriers** : suivi des ventes et objectifs
- **Mon compte** : solde, rétributions, demandes de versement / dépôt
- **Galerie photo** avec likes et commentaires en temps réel
- **Boîte à idées** : soumission texte ou vocale, analyse IA, votes
- **Annonces** : petites annonces internes
- **Avantages** : réductions partenaires pour les membres
- **Vie associative** : événements, pot d'équipe, cagnotte
- **Gamification** : classements, défis, badges

### Administration
- Gestion des utilisateurs, équipes et rôles
- Suivi des tournées et zones (GeoJSON)
- Modération galerie
- Gestion des partenaires et avantages
- Commandes boutique et chèques
- Reçus fiscaux et trésorerie
- Webhooks et liste blanche d'inscription

### Rôles

| Rôle | Accès |
|---|---|
| `membre` | Espace membre standard |
| `chef` | Gestion d'équipe + accès admin |
| `admin` | Administration complète |
| `tresorier` | Trésorerie + administration |

---

## Architecture

### Groupes de routes
- **`(landing)`** : pages publiques, pas d'authentification requise
- **`(pwa)`** : shell applicatif authentifié, protégé par le middleware

### Authentification
- **Supabase Auth** avec sessions basées sur les cookies (`@supabase/ssr`)
- Middleware de protection des routes privées
- Redirection automatique des utilisateurs connectés vers `/dashboard`
- Workflow d'approbation : les nouveaux comptes doivent être activés par un admin

### Accès à la base de données
- **Server Components / Server Actions** : `createClient()` depuis `lib/supabase/server.ts`
- **Client Components** : `createClient()` depuis `lib/supabase/client.ts`
- Ne jamais stocker le client Supabase dans une variable globale

### Server Actions
- Situées dans `app/actions/`
- Pattern : validation → client Supabase → opération DB → revalidation → résultat
- Retournent `{ success: boolean, error?: string }`

### Configuration métier
- Constantes centralisées dans `lib/config.ts` (prix calendriers, pourcentages rétribution, rôles, seuils...)

---

## Intégrations tierces

### Stripe
Paiements par carte bancaire pour les dons en ligne.
- Client : `lib/stripe/`
- Webhooks : `app/api/webhooks/stripe/`

### HelloAsso
Plateforme française de dons et paiements associatifs.
- Client : `lib/helloasso/`
- Webhooks : `app/api/helloasso-webhook/`

### Resend
Envoi d'emails transactionnels (reçus fiscaux, confirmations boutique).
- Client : `lib/email/`

### IA
- **Claude (Anthropic)** : analyse sémantique des idées soumises
- **Whisper (OpenAI)** : transcription audio → texte pour les idées vocales

---

## Base de données

- **115 migrations SQL** dans `supabase/migrations/`
- Types auto-générés : `lib/supabase/database.types.ts` (ne pas modifier à la main)
- Régénérer : `npm run db:types`

### Tables principales
`profiles`, `equipes`, `tournees`, `transactions`, `donation_intents`, `fiscal_receipts`, `ideas`, `idea_votes`, `gallery_photos`, `gallery_likes`, `annonces`, `products`, `orders`, `partners`, `offers`, `versements`, `depot_fonds`, `challenges`, `leaderboards`

---

## Données communes

- Source : `Nomdelacommune-CodeINSEE.csv` (racine)
- Fichier généré : `data/communes-21.json` (consommé par le composant Communes)
- Populations enrichies depuis `data/insee-communes.json`
- Relancer la synchronisation si le CSV change : `npm run sync:communes`

---

## CI/CD

### GitHub Actions
- **`backup-daily.yml`** : sauvegarde quotidienne de la base de données et du storage Supabase vers Minio (3h UTC)

### Déploiement
- Déployé sur **Vercel** avec déploiement automatique depuis Git

---

## Documentation

Une documentation détaillée est disponible dans le dossier `docs/` (90+ fichiers) couvrant :
- Guides de déploiement et variables d'environnement
- Système de design et modernisation UI
- Intégrations (HelloAsso, Stripe, Resend)
- Migrations et troubleshooting
- Système de backup
- Configuration PWA

Fichiers clés à la racine :
- `CLAUDE.md` — Instructions pour le développement assisté par IA
- `TROUBLESHOOTING.md` — Problèmes courants et solutions
- `PWA-SETUP.md` — Configuration PWA

---

## Licence

Projet privé — Usage interne réservé à l'Amicale des Sapeurs-Pompiers de Clermont-l'Hérault.
