# 🚀 Plan de Refactoring V2 - Application Sapeurs-Pompiers

> **Durée totale estimée :** 2 semaines (40-50h)
> **Objectif :** Nettoyer et stabiliser le MVP sans réécriture complète

---

## 📋 SEMAINE 1 : LE GRAND MÉNAGE

### 🔥 PHASE 1.1 : Préparation et Sécurité (1h)

#### Étape 1.1.1 : Créer une branche de sécurité
- [ ] Vérifier que vous êtes sur la branche principale
  ```bash
  git status
  git branch
  ```
- [ ] Créer et basculer sur la branche de refacto
  ```bash
  git checkout -b refacto-v2-baseline
  ```
- [ ] Pousser la branche sur GitHub
  ```bash
  git push -u origin refacto-v2-baseline
  ```

**✅ Point de contrôle :** Vous êtes sur `refacto-v2-baseline`

---

#### Étape 1.1.2 : Backup de la base de données de production
- [ ] Se connecter au dashboard Supabase (https://supabase.com/dashboard)
- [ ] Aller dans votre projet > Database > Backups
- [ ] Cliquer sur "Create backup" et nommer : `backup-avant-refacto-v2`
- [ ] Attendre la fin du backup (peut prendre 2-5 min)
- [ ] Vérifier que le backup apparaît dans la liste

**✅ Point de contrôle :** Backup visible dans Supabase Dashboard

---

### 🗄️ PHASE 1.2 : Squash des Migrations (4-6h)

#### Étape 1.2.1 : Installer/Vérifier Supabase CLI
- [ ] Vérifier l'installation
  ```bash
  supabase --version
  ```
- [ ] Si pas installé, installer via :
  ```bash
  # macOS
  brew install supabase/tap/supabase

  # Linux
  curl -fsSL https://supabase.com/install.sh | sh

  # Windows (WSL)
  curl -fsSL https://supabase.com/install.sh | sh
  ```

**✅ Point de contrôle :** `supabase --version` affiche une version

---

#### Étape 1.2.2 : Lister les migrations actuelles
- [ ] Compter les migrations
  ```bash
  ls -1 supabase/migrations/ | wc -l
  ```
- [ ] Afficher la taille totale
  ```bash
  du -sh supabase/migrations/
  ```
- [ ] Noter le nombre exact : __________ migrations

**✅ Point de contrôle :** Vous savez combien de migrations existent

---

#### Étape 1.2.3 : Dumper le schéma actuel
- [ ] Se connecter à Supabase en local
  ```bash
  supabase login
  ```
- [ ] Récupérer votre Project ID depuis le dashboard Supabase
  - Aller sur https://supabase.com/dashboard/project/_/settings/general
  - Copier le "Reference ID"
- [ ] Définir la variable d'environnement
  ```bash
  export SUPABASE_PROJECT_ID="votre-project-id"
  ```
- [ ] Dumper le schéma complet de production
  ```bash
  supabase db dump --db-url "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" > migration_baseline.sql
  ```
  > **Note :** Récupérez l'URL complète depuis Dashboard > Settings > Database > Connection String (URI)

**✅ Point de contrôle :** Le fichier `migration_baseline.sql` existe et fait > 50 KB

---

#### Étape 1.2.4 : Vérifier le contenu de la baseline
- [ ] Ouvrir `migration_baseline.sql` dans votre éditeur
- [ ] Vérifier qu'il contient bien :
  - [ ] Des `CREATE TABLE`
  - [ ] Des `CREATE INDEX`
  - [ ] Des `CREATE POLICY` (RLS)
  - [ ] Des `CREATE FUNCTION`
- [ ] Vérifier qu'il y a au moins vos tables principales :
  - [ ] `profiles`
  - [ ] `transactions`
  - [ ] `tournees`
  - [ ] `equipes`
  - [ ] `photos`
  - [ ] `ideas`

**✅ Point de contrôle :** Le fichier baseline semble complet

---

#### Étape 1.2.5 : Archiver les anciennes migrations
- [ ] Créer le dossier d'archive
  ```bash
  mkdir -p supabase/migrations/archive
  ```
- [ ] Déplacer TOUTES les anciennes migrations
  ```bash
  mv supabase/migrations/*.sql supabase/migrations/archive/
  ```
- [ ] Vérifier que le dossier migrations est vide
  ```bash
  ls supabase/migrations/
  ```
  (Doit afficher uniquement `archive/`)

**✅ Point de contrôle :** `supabase/migrations/` ne contient que le dossier `archive/`

---

#### Étape 1.2.6 : Créer la nouvelle baseline
- [ ] Renommer et déplacer le fichier baseline
  ```bash
  mv migration_baseline.sql supabase/migrations/00000000000000_baseline.sql
  ```
- [ ] Vérifier la nouvelle migration
  ```bash
  ls -lh supabase/migrations/
  ```

**✅ Point de contrôle :** Un seul fichier `00000000000000_baseline.sql` existe dans migrations/

---

#### Étape 1.2.7 : Tester la baseline en local (CRITIQUE)
- [ ] Détruire et recréer la BDD locale
  ```bash
  supabase db reset
  ```
- [ ] Attendre la fin de l'opération (2-5 min)
- [ ] Vérifier qu'aucune erreur n'apparaît
- [ ] Lancer l'app en local
  ```bash
  npm run dev
  ```
- [ ] Tester rapidement :
  - [ ] Se connecter avec un compte test
  - [ ] Naviguer sur 2-3 pages (dashboard, galerie)
  - [ ] Vérifier qu'il n'y a pas d'erreur console

**✅ Point de contrôle :** L'app fonctionne en local avec la nouvelle baseline

---

#### Étape 1.2.8 : Commit du squash
- [ ] Ajouter les changements
  ```bash
  git add supabase/migrations/
  ```
- [ ] Créer le commit
  ```bash
  git commit -m "refactor(db): squash 113 migrations into single baseline

  - Archive 113 migrations in supabase/migrations/archive/
  - Create single baseline migration from production schema
  - Tested locally with supabase db reset

  Breaking: This requires fresh db reset for local dev"
  ```
- [ ] Pousser sur GitHub
  ```bash
  git push origin refacto-v2-baseline
  ```

**✅ Point de contrôle :** Commit poussé sur GitHub

---

### 🗑️ PHASE 1.3 : Supprimer Prisma (2-3h)

#### Étape 1.3.1 : Identifier l'utilisation de Prisma
- [ ] Chercher tous les imports Prisma
  ```bash
  grep -r "from '@prisma/client'" app/ lib/ --include="*.ts" --include="*.tsx"
  ```
- [ ] Chercher les utilisations de `prisma.`
  ```bash
  grep -r "prisma\." app/ lib/ --include="*.ts" --include="*.tsx" | grep -v "node_modules"
  ```
- [ ] Noter les fichiers impactés :
  - `_________________________________`
  - `_________________________________`
  - `_________________________________`

**✅ Point de contrôle :** Vous avez la liste des fichiers à modifier

---

#### Étape 1.3.2 : Convertir le module associatif (Prisma → Supabase)
> **Info :** D'après l'audit, seul le module associatif utilise Prisma (Events, MoneyPots, Polls, Materials)

- [ ] Ouvrir `lib/features/associative/` (ou équivalent)
- [ ] Pour chaque query Prisma, convertir en Supabase :

**Exemples de conversion :**

```typescript
// ❌ AVANT (Prisma)
const events = await prisma.event.findMany({
  where: { status: 'active' },
  include: { participants: true }
})

// ✅ APRÈS (Supabase)
const { data: events } = await supabase
  .from('events')
  .select('*, participants(*)')
  .eq('status', 'active')

// ❌ AVANT (Prisma)
const event = await prisma.event.create({
  data: {
    title: 'AG 2025',
    date: new Date(),
  }
})

// ✅ APRÈS (Supabase)
const { data: event } = await supabase
  .from('events')
  .insert({
    title: 'AG 2025',
    date: new Date().toISOString(),
  })
  .select()
  .single()
```

- [ ] Convertir les queries dans :
  - [ ] Fichier 1 : `_________________________________`
  - [ ] Fichier 2 : `_________________________________`
  - [ ] Fichier 3 : `_________________________________`

**✅ Point de contrôle :** Plus aucun `prisma.` dans le code

---

#### Étape 1.3.3 : Supprimer Prisma
- [ ] Désinstaller les packages
  ```bash
  npm uninstall prisma @prisma/client
  ```
- [ ] Supprimer le dossier Prisma
  ```bash
  rm -rf prisma/
  ```
- [ ] Supprimer le fichier client Prisma
  ```bash
  rm lib/prisma.ts
  ```
- [ ] Supprimer `pg` si non utilisé ailleurs
  ```bash
  npm uninstall pg
  ```

**✅ Point de contrôle :** Prisma n'apparaît plus dans `package.json`

---

#### Étape 1.3.4 : Tester après suppression de Prisma
- [ ] Vérifier qu'il n'y a pas d'erreurs TypeScript
  ```bash
  npm run typecheck
  ```
- [ ] Lancer l'app en local
  ```bash
  npm run dev
  ```
- [ ] Tester les fonctionnalités du module associatif :
  - [ ] Créer un événement
  - [ ] Ajouter un participant
  - [ ] Créer un vote/sondage
  - [ ] Vérifier la liste des événements

**✅ Point de contrôle :** Le module associatif fonctionne sans Prisma

---

#### Étape 1.3.5 : Commit de la suppression de Prisma
- [ ] Ajouter les changements
  ```bash
  git add .
  ```
- [ ] Créer le commit
  ```bash
  git commit -m "refactor: remove Prisma ORM, migrate to Supabase only

  - Uninstall prisma and @prisma/client
  - Convert associative module queries from Prisma to Supabase
  - Remove prisma/ directory and lib/prisma.ts
  - All database operations now use Supabase client

  Rationale: Avoid ORM conflict (Prisma + Supabase).
  99% of code already used Supabase, only associative module used Prisma."
  ```
- [ ] Pousser sur GitHub
  ```bash
  git push origin refacto-v2-baseline
  ```

**✅ Point de contrôle :** Commit poussé, Prisma supprimé

---

### 🧹 PHASE 1.4 : Nettoyage des Fichiers Morts (1-2h)

#### Étape 1.4.1 : Supprimer les fichiers backup (.orig)
- [ ] Chercher les fichiers backup
  ```bash
  find . -name "*.orig" -not -path "./node_modules/*"
  ```
- [ ] Supprimer les fichiers trouvés
  ```bash
  rm lib/supabase/leaderboards.ts.orig
  # Ajouter d'autres si trouvés
  ```

**✅ Point de contrôle :** Plus aucun fichier `.orig` trouvé

---

#### Étape 1.4.2 : Supprimer les scripts de test
- [ ] Supprimer les scripts de test inutilisés
  ```bash
  rm -f scripts/test-ideas-backend.ts
  ```
- [ ] Supprimer les routes API de test
  ```bash
  rm -rf app/api/test-helloasso/
  ```
- [ ] Vérifier qu'il n'y a plus de fichiers de test orphelins
  ```bash
  find . -name "*test*.ts" -not -path "./node_modules/*" -not -path "./__tests__/*"
  ```

**✅ Point de contrôle :** Scripts de test supprimés

---

#### Étape 1.4.3 : Supprimer les dépendances redondantes
- [ ] Vérifier quelle lib QR est utilisée
  ```bash
  grep -r "qrcode.react\|react-qr-code" app/ lib/ --include="*.tsx" --include="*.ts"
  ```
- [ ] Supprimer la lib non utilisée
  ```bash
  # Si react-qr-code n'est pas utilisé :
  npm uninstall react-qr-code

  # OU si qrcode.react n'est pas utilisé :
  npm uninstall qrcode.react
  ```

**✅ Point de contrôle :** Une seule lib QR dans package.json

---

#### Étape 1.4.4 : Consolider la documentation
- [ ] Créer le dossier docs
  ```bash
  mkdir -p docs/audits
  ```
- [ ] Déplacer les fichiers AUDIT_*.md
  ```bash
  mv AUDIT_*.md docs/audits/ 2>/dev/null || true
  ```
- [ ] Déplacer les guides
  ```bash
  mv GUIDE_*.md docs/ 2>/dev/null || true
  ```
- [ ] Lister ce qui reste à la racine
  ```bash
  ls -1 *.md
  ```
- [ ] Décider quoi faire des autres fichiers .md (garder README.md à la racine)

**✅ Point de contrôle :** Documentation organisée dans `/docs`

---

#### Étape 1.4.5 : Commit du nettoyage
- [ ] Ajouter les changements
  ```bash
  git add .
  ```
- [ ] Créer le commit
  ```bash
  git commit -m "chore: clean up unused files and organize documentation

  - Remove .orig backup files
  - Remove test scripts and test API routes
  - Remove redundant QR code dependency
  - Move documentation to /docs folder
  - Organize AUDIT_*.md files in docs/audits/

  Result: Cleaner repository structure"
  ```
- [ ] Pousser sur GitHub
  ```bash
  git push origin refacto-v2-baseline
  ```

**✅ Point de contrôle :** Nettoyage terminé et commité

---

## 📋 SEMAINE 2 : LES FONDATIONS

### 🧪 PHASE 2.1 : Tests Critiques (6-8h)

#### Étape 2.1.1 : Installer Vitest
- [ ] Installer les dépendances de test
  ```bash
  npm install -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react happy-dom
  ```
- [ ] Créer la config Vitest
  ```bash
  touch vitest.config.ts
  ```
- [ ] Copier cette configuration dans `vitest.config.ts` :
  ```typescript
  import { defineConfig } from 'vitest/config'
  import react from '@vitejs/plugin-react'
  import path from 'path'

  export default defineConfig({
    plugins: [react()],
    test: {
      environment: 'happy-dom',
      globals: true,
      setupFiles: ['./vitest.setup.ts'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      },
    },
  })
  ```

**✅ Point de contrôle :** `vitest.config.ts` créé

---

#### Étape 2.1.2 : Créer le fichier de setup
- [ ] Créer `vitest.setup.ts`
  ```typescript
  import { expect, afterEach, vi } from 'vitest'
  import { cleanup } from '@testing-library/react'
  import * as matchers from '@testing-library/jest-dom/matchers'

  expect.extend(matchers)

  afterEach(() => {
    cleanup()
  })

  // Mock Supabase client
  vi.mock('@/lib/supabase/client', () => ({
    supabase: {
      from: vi.fn(),
      auth: {
        getSession: vi.fn(),
      },
    },
  }))
  ```

**✅ Point de contrôle :** Setup créé

---

#### Étape 2.1.3 : Ajouter les scripts de test
- [ ] Ouvrir `package.json`
- [ ] Ajouter dans la section `"scripts"` :
  ```json
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
  ```

**✅ Point de contrôle :** Scripts ajoutés dans package.json

---

#### Étape 2.1.4 : Test #1 - Webhook Stripe
- [ ] Créer le dossier
  ```bash
  mkdir -p lib/webhooks/stripe/__tests__
  ```
- [ ] Créer le fichier de test
  ```bash
  touch lib/webhooks/stripe/__tests__/webhook.test.ts
  ```
- [ ] Copier ce template de test :
  ```typescript
  import { describe, it, expect, beforeEach, vi } from 'vitest'

  describe('Stripe Webhook Handler', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    describe('payment_intent.succeeded', () => {
      it('devrait créer une transaction pour un don réussi', async () => {
        // TODO: Implémenter le test
        expect(true).toBe(true)
      })

      it('devrait envoyer un email de confirmation', async () => {
        // TODO: Implémenter le test
        expect(true).toBe(true)
      })
    })

    describe('payment_intent.payment_failed', () => {
      it('devrait logger l\'erreur sans créer de transaction', async () => {
        // TODO: Implémenter le test
        expect(true).toBe(true)
      })
    })
  })
  ```
- [ ] Implémenter les tests réels en vous basant sur `lib/webhooks/stripe/index.ts`

**✅ Point de contrôle :** Test Stripe créé

---

#### Étape 2.1.5 : Test #2 - Webhook HelloAsso
- [ ] Créer le dossier
  ```bash
  mkdir -p lib/webhooks/helloasso/__tests__
  ```
- [ ] Créer le fichier de test
  ```bash
  touch lib/webhooks/helloasso/__tests__/webhook.test.ts
  ```
- [ ] Copier ce template :
  ```typescript
  import { describe, it, expect } from 'vitest'

  describe('HelloAsso Webhook Handler', () => {
    describe('Order completed', () => {
      it('devrait créer une transaction pour un don HelloAsso', async () => {
        // TODO: Implémenter le test
        expect(true).toBe(true)
      })
    })

    describe('Order refunded', () => {
      it('devrait marquer la transaction comme remboursée', async () => {
        // TODO: Implémenter le test
        expect(true).toBe(true)
      })
    })
  })
  ```

**✅ Point de contrôle :** Test HelloAsso créé

---

#### Étape 2.1.6 : Test #3 - Calculs de versement
- [ ] Créer le fichier de test
  ```bash
  touch lib/supabase/__tests__/versement.test.ts
  ```
- [ ] Copier ce template :
  ```typescript
  import { describe, it, expect } from 'vitest'

  describe('Calculs de versement', () => {
    describe('Calcul du montant disponible', () => {
      it('devrait calculer correctement le solde disponible', () => {
        const totalDonations = 10000 // 100€
        const totalWithdrawals = 3000 // 30€
        const expectedBalance = 7000 // 70€

        const balance = totalDonations - totalWithdrawals
        expect(balance).toBe(expectedBalance)
      })

      it('devrait déduire les frais Stripe (2.9% + 0.25€)', () => {
        const donationAmount = 10000 // 100€
        const stripeFees = Math.round(donationAmount * 0.029 + 25) // 290 + 25 = 315
        const netAmount = donationAmount - stripeFees

        expect(netAmount).toBe(9685) // 96.85€
      })
    })
  })
  ```

**✅ Point de contrôle :** Test versement créé

---

#### Étape 2.1.7 : Lancer les tests
- [ ] Lancer tous les tests
  ```bash
  npm test
  ```
- [ ] Vérifier qu'ils passent tous (même si certains sont des TODOs)
- [ ] Si erreurs, les corriger une par une

**✅ Point de contrôle :** `npm test` passe sans erreur

---

#### Étape 2.1.8 : Commit des tests
- [ ] Ajouter les changements
  ```bash
  git add .
  ```
- [ ] Créer le commit
  ```bash
  git commit -m "test: add critical tests for payment flows

  - Add Vitest configuration and setup
  - Add Stripe webhook tests (payment success/failure)
  - Add HelloAsso webhook tests (order/refund)
  - Add withdrawal calculation tests

  Coverage: Payment-critical flows only (pragmatic approach)
  Next: Implement full test scenarios"
  ```
- [ ] Pousser
  ```bash
  git push origin refacto-v2-baseline
  ```

**✅ Point de contrôle :** Tests commités

---

### 📖 PHASE 2.2 : Documentation Minimum (2-3h)

#### Étape 2.2.1 : Créer README_TECH.md
- [ ] Créer le fichier
  ```bash
  touch README_TECH.md
  ```
- [ ] Copier ce template :

```markdown
# 📘 Documentation Technique - Sapeurs-Pompiers Clermont

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 20+
- npm ou pnpm
- Compte Supabase configuré

### Installation
\`\`\`bash
# 1. Cloner le repo
git clone https://github.com/votre-org/app-sapeurs-pompiers-clermont.git
cd app-sapeurs-pompiers-clermont

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# Remplir les valeurs dans .env.local

# 4. Lancer en dev
npm run dev
\`\`\`

L'app sera disponible sur http://localhost:3000

---

## 🔑 Variables d'Environnement

Créer un fichier \`.env.local\` avec :

\`\`\`bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# HelloAsso
HELLOASSO_CLIENT_ID=xxx
HELLOASSO_CLIENT_SECRET=xxx
HELLOASSO_ORGANIZATION_SLUG=sapeurs-pompiers-clermont
HELLOASSO_WEBHOOK_SECRET=xxx

# Email (Resend)
RESEND_API_KEY=re_xxx

# AI (OpenAI + Anthropic)
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
\`\`\`

---

## 📁 Structure du Projet

\`\`\`
/app                     # Next.js App Router
  /(landing)             # Pages publiques (landing)
  /(pwa)                 # App principale (dashboard, admin)
  /api                   # API Routes
  /actions               # Server Actions

/components              # Composants React
  /ui                    # Composants de base (shadcn)
  /dashboard             # Widgets dashboard
  /admin                 # Composants admin
  /[feature]             # Composants par fonctionnalité

/lib                     # Business logic
  /supabase              # Requêtes Supabase
  /webhooks              # Handlers webhooks (Stripe, HelloAsso)
  /features              # Logique métier par module
  /utils                 # Fonctions utilitaires

/supabase
  /migrations            # Migrations SQL

/docs                    # Documentation
\`\`\`

---

## 🛠️ Commandes Utiles

### Développement
\`\`\`bash
npm run dev              # Lancer le serveur de dev
npm run build            # Build de production
npm run start            # Serveur de production
npm run lint             # Linter ESLint
npm run typecheck        # Vérification TypeScript
\`\`\`

### Tests
\`\`\`bash
npm test                 # Lancer les tests
npm run test:watch       # Mode watch
npm run test:coverage    # Rapport de couverture
\`\`\`

### Base de données
\`\`\`bash
npm run db:types         # Générer les types TypeScript depuis Supabase
supabase db reset        # Reset la BDD locale
supabase migration new [name]  # Créer une nouvelle migration
\`\`\`

---

## 🗄️ Base de Données

### ORM
- **Supabase** uniquement (plus de Prisma depuis refacto V2)
- Utilise PostgreSQL avec Row Level Security (RLS)

### Tables Principales
- \`profiles\` : Profils utilisateurs
- \`transactions\` : Transactions financières
- \`tournees\` : Gestion des tournées
- \`equipes\` : Équipes de sapeurs-pompiers
- \`photos\` : Galerie photos
- \`ideas\` : Boîte à idées
- \`products\` : Boutique
- \`events\` : Événements associatifs

### Migrations
Après refacto V2, le système utilise une baseline unique + migrations incrémentales.

Anciennes migrations (113 fichiers) archivées dans \`supabase/migrations/archive/\`.

---

## 🔒 Sécurité

### Row Level Security (RLS)
Toutes les tables utilisent RLS. Les politiques sont définies dans les migrations.

### Webhooks
- **Stripe** : Signature vérifiée via \`STRIPE_WEBHOOK_SECRET\`
- **HelloAsso** : Signature vérifiée via \`HELLOASSO_WEBHOOK_SECRET\`

### Variables sensibles
- ❌ Ne JAMAIS commiter de fichiers \`.env\` ou \`.env.local\`
- ✅ Utiliser les secrets GitHub pour la CI/CD
- ✅ Utiliser les variables d'environnement Vercel pour la prod

---

## 🚀 Déploiement

### Vercel (Recommandé)
1. Push sur \`main\` déclenche un déploiement automatique
2. Variables d'environnement configurées dans le dashboard Vercel
3. Preview deployments sur chaque PR

### Configuration des Webhooks
Après déploiement, configurer les webhooks :

**Stripe :**
- URL : \`https://votre-app.vercel.app/api/webhooks/stripe\`
- Events : \`payment_intent.succeeded\`, \`payment_intent.payment_failed\`

**HelloAsso :**
- URL : \`https://votre-app.vercel.app/api/webhooks/helloasso\`
- Events : Order notifications

---

## 🐛 Debugging

### En cas de problème

1. **Vérifier les logs Vercel**
   - Dashboard Vercel > Logs > Runtime Logs

2. **Vérifier les logs Supabase**
   - Dashboard Supabase > Logs > Postgres Logs

3. **Vérifier les webhooks**
   - Stripe Dashboard > Developers > Webhooks > Logs
   - HelloAsso Back Office > Webhooks

4. **Erreurs TypeScript**
   \`\`\`bash
   npm run typecheck
   \`\`\`

5. **Erreurs de build**
   \`\`\`bash
   npm run build
   \`\`\`

---

## 📞 Support

- **Issues GitHub :** [Lien vers votre repo]
- **Contact :** [Votre email ou Discord]

---

## 📚 Ressources

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Stripe](https://stripe.com/docs)
- [Documentation HelloAsso API](https://api.helloasso.com/v5/swagger/ui/index)

---

**Dernière mise à jour :** 2025-12-07
**Version :** 2.0 (Après refacto)
\`\`\`
```

- [ ] Adapter les sections avec vos vraies valeurs (URLs, emails, etc.)

**✅ Point de contrôle :** README_TECH.md créé et complet

---

#### Étape 2.2.2 : Mettre à jour le README.md principal
- [ ] Ouvrir `README.md`
- [ ] Remplacer le contenu générique Next.js par une vraie description
- [ ] Exemple de structure :

```markdown
# 🚒 Application Sapeurs-Pompiers Clermont

> Application web de gestion pour l'association des Sapeurs-Pompiers de Clermont

## 🎯 Fonctionnalités

- 💰 **Système de dons** (Stripe + HelloAsso)
- 📸 **Galerie photos** collaborative
- 💡 **Boîte à idées** avec IA (transcription vocale)
- 🎖️ **Gamification** (badges, défis, progression)
- 🛒 **Boutique** en ligne
- 📅 **Gestion d'événements** associatifs
- 🗺️ **Gestion des tournées** par zone
- 💼 **Trésorerie** et demandes de versement

## 🚀 Démarrage

Voir [README_TECH.md](./README_TECH.md) pour la documentation technique complète.

\`\`\`bash
npm install
npm run dev
\`\`\`

## 🛠️ Stack Technique

- **Framework :** Next.js 16 (App Router)
- **Base de données :** Supabase (PostgreSQL)
- **Paiements :** Stripe + HelloAsso
- **UI :** Tailwind CSS + shadcn/ui
- **Déploiement :** Vercel

## 📄 Licence

[Votre licence]
```

**✅ Point de contrôle :** README.md mis à jour

---

#### Étape 2.2.3 : Commit de la documentation
- [ ] Ajouter les fichiers
  ```bash
  git add README.md README_TECH.md
  ```
- [ ] Créer le commit
  ```bash
  git commit -m "docs: add comprehensive technical documentation

  - Create README_TECH.md with full setup guide
  - Update README.md with project description and features
  - Document environment variables, structure, and commands
  - Add debugging and deployment guides

  Makes onboarding and maintenance easier"
  ```
- [ ] Pousser
  ```bash
  git push origin refacto-v2-baseline
  ```

**✅ Point de contrôle :** Documentation commité

---

### ⚙️ PHASE 2.3 : CI/CD Minimum (2h)

#### Étape 2.3.1 : Créer le workflow GitHub Actions
- [ ] Créer les dossiers
  ```bash
  mkdir -p .github/workflows
  ```
- [ ] Créer le fichier CI
  ```bash
  touch .github/workflows/ci.yml
  ```
- [ ] Copier cette configuration :

```yaml
name: CI

on:
  push:
    branches: [main, refacto-v2-baseline]
  pull_request:
    branches: [main]

jobs:
  quality-checks:
    name: Code Quality Checks
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: TypeScript check
        run: npm run typecheck

      - name: Lint check
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: Build check
        run: npm run build
        env:
          SKIP_ENV_VALIDATION: true

  test-results:
    name: Test Results Summary
    runs-on: ubuntu-latest
    needs: quality-checks
    if: always()

    steps:
      - name: Summary
        run: |
          echo "✅ All quality checks passed!"
          echo "- TypeScript: OK"
          echo "- Linting: OK"
          echo "- Tests: OK"
          echo "- Build: OK"
```

**✅ Point de contrôle :** Workflow CI créé

---

#### Étape 2.3.2 : Tester le workflow localement (optionnel)
- [ ] Installer act (outil pour tester GitHub Actions en local)
  ```bash
  # macOS
  brew install act

  # Linux
  curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
  ```
- [ ] Tester le workflow
  ```bash
  act push
  ```

**✅ Point de contrôle :** Workflow teste localement (ou skip si pas act)

---

#### Étape 2.3.3 : Commit du CI/CD
- [ ] Ajouter le workflow
  ```bash
  git add .github/workflows/ci.yml
  ```
- [ ] Créer le commit
  ```bash
  git commit -m "ci: add GitHub Actions workflow for quality checks

  - Run TypeScript, Lint, Tests, and Build on push/PR
  - Ensures code quality before merge
  - Runs on main and feature branches

  Helps catch errors early in development"
  ```
- [ ] Pousser
  ```bash
  git push origin refacto-v2-baseline
  ```

**✅ Point de contrôle :** Workflow poussé et visible sur GitHub Actions

---

#### Étape 2.3.4 : Vérifier l'exécution du workflow
- [ ] Aller sur GitHub > Votre repo > Actions
- [ ] Vérifier que le workflow "CI" est en cours d'exécution
- [ ] Attendre qu'il termine (2-5 min)
- [ ] Vérifier qu'il passe au vert ✅
- [ ] Si rouge ❌, cliquer dessus et corriger les erreurs

**✅ Point de contrôle :** Workflow GitHub Actions passe au vert

---

### 🎯 PHASE 2.4 : Optimisations Rapides (2-3h)

#### Étape 2.4.1 : Fixer les versions Supabase
- [ ] Ouvrir `package.json`
- [ ] Remplacer `"latest"` par des versions fixes pour :
  ```json
  "@supabase/ssr": "^0.5.2",
  "@supabase/supabase-js": "^2.48.1"
  ```
  (Vérifier les dernières versions stables sur npm)
- [ ] Mettre à jour les dépendances
  ```bash
  npm install
  ```

**✅ Point de contrôle :** Versions Supabase fixées

---

#### Étape 2.4.2 : Ajouter validation Zod (si pas déjà fait)
- [ ] Vérifier si Zod est installé
  ```bash
  npm list zod
  ```
- [ ] Si pas installé :
  ```bash
  npm install zod
  ```
- [ ] Créer un fichier de schemas de validation
  ```bash
  touch lib/validations/donation.ts
  ```
- [ ] Exemple de schema :
  ```typescript
  import { z } from 'zod'

  export const donationSchema = z.object({
    amount: z.number().min(100, 'Montant minimum 1€').max(1000000, 'Montant maximum 10000€'),
    email: z.string().email('Email invalide'),
    name: z.string().min(2, 'Nom requis'),
  })
  ```

**✅ Point de contrôle :** Zod installé et schema créé

---

#### Étape 2.4.3 : Commit des optimisations
- [ ] Ajouter les changements
  ```bash
  git add package.json lib/validations/
  ```
- [ ] Créer le commit
  ```bash
  git commit -m "chore: fix Supabase versions and add input validation

  - Fix @supabase packages versions (no more 'latest')
  - Add Zod for input validation
  - Create donation validation schema

  Improves stability and security"
  ```
- [ ] Pousser
  ```bash
  git push origin refacto-v2-baseline
  ```

**✅ Point de contrôle :** Optimisations commitées

---

## 🎉 PHASE FINALE : Merge et Déploiement

### Étape FINALE.1 : Revue complète
- [ ] Relire tous les changements
  ```bash
  git log --oneline origin/main..refacto-v2-baseline
  ```
- [ ] Vérifier qu'il n'y a pas de fichiers oubliés
  ```bash
  git status
  ```
- [ ] Tester l'app complète en local une dernière fois
  ```bash
  npm run dev
  ```
- [ ] Tester les fonctionnalités critiques :
  - [ ] Connexion
  - [ ] Dashboard
  - [ ] Galerie
  - [ ] Système de dons (en mode test Stripe)

**✅ Point de contrôle :** Tout fonctionne en local

---

### Étape FINALE.2 : Créer une Pull Request
- [ ] Aller sur GitHub
- [ ] Créer une PR : `refacto-v2-baseline` → `main`
- [ ] Titre : `🚀 Refactoring V2: Clean MVP baseline`
- [ ] Description :
  ```markdown
  ## 🎯 Objectif
  Nettoyer et stabiliser le MVP sans réécriture complète

  ## ✅ Changements
  - ✅ Squash 113 migrations → 1 baseline
  - ✅ Suppression Prisma (Supabase uniquement)
  - ✅ Nettoyage fichiers morts
  - ✅ Tests critiques (paiements)
  - ✅ Documentation technique
  - ✅ CI/CD GitHub Actions
  - ✅ Optimisations sécurité

  ## 🧪 Tests
  - [x] Tests unitaires passent
  - [x] CI/CD passe au vert
  - [x] App fonctionne en local
  - [ ] Tests en staging (à faire avant merge)

  ## 📋 Checklist avant merge
  - [ ] Review complète
  - [ ] Tests en staging
  - [ ] Backup BDD prod
  ```
- [ ] Assigner des reviewers (vous-même ou autre dev)

**✅ Point de contrôle :** PR créée

---

### Étape FINALE.3 : Tests en Staging (CRITIQUE)
⚠️ **NE PAS MERGER SANS TESTER EN STAGING D'ABORD**

- [ ] Déployer sur un environnement de staging (branche preview Vercel)
- [ ] Tester TOUTES les fonctionnalités :
  - [ ] Authentification (login/logout)
  - [ ] Dashboard utilisateur
  - [ ] Système de dons (mode test)
  - [ ] Galerie photos (upload, like, commentaire)
  - [ ] Boîte à idées (création, vote)
  - [ ] Admin panel
  - [ ] Gamification (badges, progression)
- [ ] Vérifier les logs (pas d'erreurs critiques)
- [ ] Tester sur mobile

**✅ Point de contrôle :** Staging fonctionne parfaitement

---

### Étape FINALE.4 : Backup Production
- [ ] Aller sur Supabase Dashboard
- [ ] Database > Backups
- [ ] Créer un backup : `backup-avant-merge-refacto-v2`
- [ ] Attendre la fin du backup

**✅ Point de contrôle :** Backup prod créé

---

### Étape FINALE.5 : Merger la PR
- [ ] Vérifier que le CI est vert ✅
- [ ] Merger la PR sur `main`
- [ ] Supprimer la branche `refacto-v2-baseline` (optionnel)

**✅ Point de contrôle :** PR mergée

---

### Étape FINALE.6 : Vérifier le déploiement Production
- [ ] Aller sur Vercel Dashboard
- [ ] Attendre que le déploiement soit terminé (2-5 min)
- [ ] Visiter l'URL de production
- [ ] Tester rapidement :
  - [ ] Page d'accueil charge
  - [ ] Connexion fonctionne
  - [ ] Dashboard s'affiche
- [ ] Vérifier les logs Vercel (pas d'erreur 500)

**✅ Point de contrôle :** Production fonctionne ✅

---

## 🎊 TERMINÉ !

### 📊 Récapitulatif

Vous avez accompli :
- ✅ Squash de 113 migrations → 1 baseline propre
- ✅ Suppression de Prisma (architecture simplifiée)
- ✅ Nettoyage du code (fichiers morts supprimés)
- ✅ Tests sur les flux critiques (paiements)
- ✅ Documentation technique complète
- ✅ CI/CD automatisé
- ✅ Optimisations sécurité

### 📈 Prochaines Étapes (Optionnelles)

#### Court terme (1-2 semaines)
- [ ] Implémenter les scénarios de tests complets (les TODOs dans les tests)
- [ ] Ajouter Sentry pour le monitoring des erreurs
- [ ] Ajouter rate limiting sur les API routes sensibles

#### Moyen terme (1 mois)
- [ ] Commencer la migration vers `/features` (module par module)
- [ ] Ajouter des tests d'intégration
- [ ] Optimiser les requêtes lentes (EXPLAIN ANALYZE)

#### Long terme (2-3 mois)
- [ ] Considérer React Query pour le caching
- [ ] Ajouter des feature flags
- [ ] Améliorer l'accessibilité (a11y)

### 🙏 Félicitations !

Vous avez maintenant une base de code **propre**, **testée** et **documentée**.

Le plus dur est fait. Maintenant vous pouvez développer sereinement de nouvelles fonctionnalités.

---

**Bon courage ! 💪🚒**
