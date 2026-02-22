# CLAUDE.md — Amicale des Sapeurs-Pompiers de Clermont-l'Hérault

## Project Overview

Internal PWA for the **Amicale des Sapeurs-Pompiers de Clermont-l'Hérault** (firefighters' association in southern France). The app manages calendar sales rounds ("tournées"), donations, fiscal receipts, team management, gamification, a photo gallery, an ideas box, a shop, and member accounts. It also serves a public landing page for donations and partner visibility.

**Language**: The application UI, comments, and business logic are primarily in **French**. Code identifiers (variables, functions) mix French domain terms with English programming conventions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | **Next.js 16** (App Router, Turbopack dev) |
| Language | **TypeScript 5.9** (strict mode) |
| React | **React 19** |
| Database | **Supabase** (PostgreSQL + Auth + Storage + Realtime) |
| Styling | **Tailwind CSS 3.4** + CSS variables (HSL) |
| UI Components | **shadcn/ui** (New York style, Radix primitives) |
| Icons | **Lucide React** |
| Forms | **React Hook Form** + Zod (via `@hookform/resolvers`) |
| Animations | **Framer Motion** |
| Maps | **Leaflet** + **React Leaflet** |
| Payments | **Stripe** (card payments) + **HelloAsso** (French donation platform) |
| Email | **Resend** |
| AI | **Anthropic Claude** (idea analysis) + **OpenAI Whisper** (audio transcription) |
| Charts | **react-countup**, custom chart components |
| Toasts | **Sonner** (via `@/components/ui/sonner`) |
| Theme | **next-themes** (light/dark, class-based) |
| PWA | Web App Manifest (`public/manifest.json`) |
| Backup | GitHub Actions daily backup to Minio |
| Deployment | **Vercel** |

---

## Quick Commands

```bash
# Development (uses Turbopack)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint

# Type checking
npm run typecheck

# Generate Supabase types from database
npm run db:types

# Push database migrations
npm run db:push

# Clean .next cache
npm run clean
```

---

## Project Structure

```
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (Geist font, ThemeProvider, Toaster)
│   ├── globals.css             # Tailwind + CSS variables (brand colors)
│   ├── middleware.ts           # Auth redirect + route protection
│   ├── (landing)/              # Public landing page route group
│   │   ├── layout.tsx          # Header + Footer + CookieConsent
│   │   ├── page.tsx            # Homepage
│   │   ├── boutique/           # Public shop
│   │   ├── devenir-partenaire/ # Partner signup
│   │   └── mentions-legales/   # Legal notices
│   ├── (pwa)/                  # Authenticated PWA route group
│   │   ├── layout.tsx          # Sidebar + AppBar + BottomNav
│   │   ├── dashboard/          # Main dashboard
│   │   ├── admin/              # Admin panel (15+ sub-sections)
│   │   ├── ma-tournee/         # Active rounds management
│   │   ├── calendriers/        # Calendar sales tracking
│   │   ├── mon-compte/         # Personal account + retributions
│   │   ├── galerie/            # Photo gallery with likes
│   │   ├── idees/              # Ideas box (text + voice)
│   │   ├── annonces/           # Classifieds / announcements
│   │   ├── avantages/          # Member benefits
│   │   ├── tresorerie/         # Treasury management
│   │   ├── partenaires/        # Partners directory
│   │   ├── boite-a-idees/      # Ideas box alternate entry
│   │   ├── pot-equipe/         # Team pot management
│   │   ├── parametres/         # Settings
│   │   └── associative/        # Association life
│   ├── actions/                # Server Actions (Next.js)
│   │   ├── donation-actions.ts # Donation CRUD
│   │   ├── ideas.ts            # Ideas CRUD + AI analysis
│   │   ├── versement.ts        # Payout requests
│   │   ├── depot-fonds.ts      # Fund deposits
│   │   ├── generate-receipt.ts # Fiscal receipt generation
│   │   └── ...                 # Other domain actions
│   ├── api/                    # API Route Handlers
│   │   ├── admin/              # Admin-only endpoints
│   │   ├── webhooks/           # Stripe + HelloAsso webhooks
│   │   ├── gallery/            # Gallery upload/management
│   │   ├── analyze-idea/       # AI idea analysis endpoint
│   │   ├── transcribe/         # Audio transcription (Whisper)
│   │   ├── contact/            # Contact form
│   │   └── calendars/          # Calendar data endpoints
│   ├── auth/                   # Auth pages (login, sign-up, forgot-password, etc.)
│   ├── don/                    # Public donation flow
│   ├── pay/                    # Payment pages
│   └── recu/                   # Receipt download pages
│
├── components/                 # React components
│   ├── ui/                     # shadcn/ui primitives (button, dialog, card, etc.)
│   ├── layouts/pwa/            # PWA shell (app-bar, bottom-nav, container)
│   ├── landing/                # Landing page sections
│   ├── admin/                  # Admin-specific components
│   ├── tournee/                # Round management components
│   ├── idees/                  # Ideas box components
│   ├── gallery/                # Photo gallery components
│   ├── gamification/           # Gamification widgets
│   ├── charts/                 # Data visualization
│   ├── shop/                   # Shop components
│   ├── profile/                # Profile components
│   ├── tresorerie/             # Treasury components
│   ├── avantages/              # Benefits components
│   ├── seo/                    # SEO components
│   ├── icons/                  # Custom icon components
│   ├── app-sidebar.tsx         # Main sidebar navigation
│   ├── sidebar.tsx             # Sidebar variant
│   └── ...                     # Standalone components
│
├── lib/                        # Shared libraries and utilities
│   ├── supabase/               # Supabase clients and data access
│   │   ├── server.ts           # Server-side client (cookies-based)
│   │   ├── client.ts           # Browser client
│   │   ├── middleware.ts       # Auth middleware logic
│   │   ├── database.types.ts   # Auto-generated DB types
│   │   ├── tournee.ts          # Tournee data queries
│   │   ├── gamification.ts     # Gamification queries
│   │   ├── ideas.ts            # Ideas queries
│   │   ├── gallery.ts          # Gallery queries
│   │   ├── leaderboards.ts     # Leaderboard queries
│   │   └── ...                 # Other domain queries
│   ├── types/                  # TypeScript type definitions
│   │   ├── index.ts            # Central re-export
│   │   ├── supabase.ts         # Supabase-derived types
│   │   └── ...                 # Domain type files
│   ├── config.ts               # Centralized business constants
│   ├── config/fiscal.ts        # Fiscal receipt configuration
│   ├── stripe/                 # Stripe client setup
│   ├── helloasso/              # HelloAsso API client
│   ├── email/                  # Resend email templates
│   ├── pdf/                    # PDF receipt template
│   ├── webhooks/               # Webhook handling (Stripe)
│   ├── utils/                  # Utility helpers
│   ├── utils.ts                # cn() helper (clsx + tailwind-merge)
│   ├── animations.ts           # Framer Motion animation variants
│   ├── formatters.ts           # Date/currency formatting
│   ├── cart-context.tsx        # Shop cart React context
│   └── ...
│
├── hooks/                      # Custom React hooks
│   ├── use-is-mobile.ts        # Mobile detection
│   ├── use-media-query.ts      # Media query hook
│   ├── use-realtime-likes.ts   # Supabase realtime likes
│   └── use-realtime-votes.ts   # Supabase realtime votes
│
├── supabase/                   # Supabase configuration
│   └── migrations/             # 115 SQL migration files
│
├── data/                       # Static data files
│   ├── communes-21.json        # Commune data for landing page
│   ├── insee-communes.json     # INSEE population data
│   ├── partners.ts             # Partners seed data
│   └── shop-products.ts        # Shop products seed data
│
├── public/                     # Static assets
│   ├── manifest.json           # PWA manifest
│   ├── icons/                  # PWA icons (72px-512px)
│   └── sectors/                # Sector GeoJSON files
│
├── scripts/                    # Utility scripts
│   ├── backup/                 # Database backup scripts
│   └── fill-insee-populations.js
│
├── tools/                      # GeoJSON processing tools
│   └── communes-from-csv.mjs   # CSV → JSON commune converter
│
├── n8n/                        # n8n workflow automation configs
│
├── prisma/                     # Prisma schema (migration reference)
│   └── schema.prisma
│
└── docs/                       # Extensive project documentation (90+ files)
```

---

## Architecture & Patterns

### Route Groups
- **`(landing)`**: Public-facing pages. No authentication required. Has its own layout with header/footer.
- **`(pwa)`**: Authenticated app shell. Requires login. Uses sidebar + bottom navigation. Protected by middleware.

### Authentication
- **Supabase Auth** with cookie-based sessions (`@supabase/ssr`).
- Middleware (`middleware.ts` + `lib/supabase/middleware.ts`) handles session refresh and route protection.
- Private routes: `/dashboard/*`, `/admin/*`, `/(pwa)/*`, `/ma-tournee/*`, `/avantages/*`.
- Public routes: `/`, `/don/*`, `/api/*`, auth pages.
- Logged-in users hitting `/` are redirected to `/dashboard` (unless `?view=landing`).
- Inactive users (`is_active === false`) are redirected to `/?pending=1`.

### Supabase Client Usage
- **Server Components / Server Actions**: Use `createClient()` from `lib/supabase/server.ts` (always create a new instance per request).
- **Client Components**: Use `createClient()` from `lib/supabase/client.ts` (browser client).
- **Never** store the Supabase client in a global variable.
- Database types are auto-generated in `lib/supabase/database.types.ts` via `npm run db:types`.

### Server Actions
Located in `app/actions/`. These are `"use server"` functions used for mutations:
- Donations, receipts, ideas, payouts, fund deposits, retributions, partners, products, etc.
- Pattern: validate input → create Supabase client → perform DB operation → revalidate path → return result.

### API Routes
Located in `app/api/`. Used for:
- Webhook handlers (Stripe, HelloAsso)
- File uploads (gallery)
- AI endpoints (idea analysis, audio transcription)
- Admin operations

### Data Access Layer
- Query functions live in `lib/supabase/*.ts` (e.g., `tournee.ts`, `gamification.ts`, `ideas.ts`).
- Each file exports typed async functions that create a Supabase client and query the database.
- Types are defined in `lib/types/` and re-exported from `lib/types/index.ts`.

### Business Configuration
All business constants are centralized in `lib/config.ts`:
- Calendar prices, team allocations, retribution percentages
- Pagination limits, gallery settings, payout thresholds
- Role definitions and permission checks (`isAdminRole()`, `isTreasurerRole()`, `canManageTeam()`)

### Roles
- `membre` (default), `chef` (team leader), `admin`, `tresorier` (treasurer)
- Admin access: `admin`, `chef`
- Treasury access: `tresorier`, `admin`

---

## Styling Conventions

### CSS Variables & Brand Colors
Defined in `app/globals.css` using HSL format:
- **Primary**: Red firefighter (`#C63320` / HSL 8 70% 45%)
- **Accent**: Teal (`#33988A` / HSL 170 50% 40%)
- **Background**: Warm beige cream
- Supports light and dark themes via `.dark` class

### Tailwind Aliases
Defined in `tailwind.config.ts`:
- `brandBrown`, `brandCream`, `brandRed`, `brandOrange`, `brandTurquoise`
- `darkBg`, `darkSurface`, `darkText`, `darkBorder`

### Custom CSS Classes
- `.glass-card`, `.glass-header`, `.glass-button` — Glassmorphism effects
- `.animate-float`, `.animate-glow` — Custom animations

### Component Styling
- Use `cn()` from `lib/utils.ts` (combines `clsx` + `tailwind-merge`) for conditional classes.
- shadcn/ui components use `class-variance-authority` for variants.

---

## Path Aliases

Configured in `tsconfig.json`:
```
@/* → ./*
```
Examples:
- `@/components/ui/button`
- `@/lib/supabase/server`
- `@/lib/config`
- `@/hooks/use-is-mobile`

---

## Environment Variables

See `.env.example` for the full list. Key variables:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key (server-only) |
| `NEXT_PUBLIC_SITE_URL` | Public site URL for link generation |
| `HELLOASSO_CLIENT_ID` / `HELLOASSO_CLIENT_SECRET` | HelloAsso OAuth |
| `HELLOASSO_ORGANIZATION_SLUG` | HelloAsso org identifier |
| `HELLOASSO_WEBHOOK_SECRET` | HelloAsso webhook verification |
| `RESEND_API_KEY` / `RESEND_FROM` | Email sending |
| `OPENAI_API_KEY` | Whisper audio transcription |
| `ANTHROPIC_API_KEY` | Claude AI idea analysis |

---

## Database

### Supabase / PostgreSQL
- **115 migration files** in `supabase/migrations/`
- Types auto-generated: `lib/supabase/database.types.ts` (do not edit manually)
- Regenerate types: `npm run db:types`
- Push migrations: `npm run db:push`

### Key Tables (inferred from types and queries)
- `profiles` — User profiles with roles, teams, identity verification
- `tournees` — Calendar sales rounds
- `transactions` / `support_transactions` — Financial transactions
- `donation_intents` — Donation tracking (Stripe + HelloAsso)
- `equipes` — Teams
- `ideas` — Ideas box entries (with AI analysis)
- `idea_votes`, `idea_comments`, `idea_reports` — Ideas engagement
- `gallery_photos`, `gallery_likes`, `gallery_comments` — Photo gallery
- `annonces` — Classifieds
- `products`, `orders` — Shop
- `partners`, `offers` — Partner benefits
- `fiscal_receipts` — Tax receipts
- `versements` — Payout requests
- `depot_fonds` — Fund deposits
- `webhook_logs` — Webhook audit trail
- `challenges`, `leaderboards` — Gamification

### Storage Buckets (Supabase Storage)
- Avatars, gallery photos, product images
- Accessed via `npyfregghvnmqxwgkfea.supabase.co/storage/v1/object/public/**`

---

## Key Domain Concepts (French)

| Term | Translation | Description |
|---|---|---|
| Tournée | Round/Tour | Calendar-selling rounds in assigned zones |
| Calendrier | Calendar | Firefighter calendars sold door-to-door |
| Rétribution | Retribution | Member earnings from calendar sales |
| Pot d'équipe | Team pot | Shared team fund from retributions |
| Versement | Payout | Cash withdrawal from earned retributions |
| Dépôt de fonds | Fund deposit | Cash deposit to treasury |
| Reçu fiscal | Fiscal receipt | Tax-deductible donation receipt |
| Trésorerie | Treasury | Financial management |
| Amicale | Association | The firefighters' association itself |
| Boîte à idées | Ideas box | Member suggestion system |
| Avantages | Benefits | Partner discounts for members |
| Annonces | Announcements | Internal classifieds |
| Galerie | Gallery | Photo gallery |
| Partenaires | Partners | Local business partners |
| Équipe | Team | Firefighter team/crew |

---

## Coding Conventions

### General
- **TypeScript strict mode** is enabled.
- Prefer `async/await` over `.then()` chains.
- Server Components are the default; add `"use client"` only when needed.
- Server Actions use `"use server"` directive.
- File naming: kebab-case for files (`tournee-cloture-modal.tsx`), PascalCase for components.

### Component Patterns
- shadcn/ui primitives in `components/ui/` — do not modify directly (managed by `shadcn` CLI).
- Domain components organized by feature folder.
- Layouts use the `(group)` route convention for shared shells.
- Client components receive data as props from Server Components.

### Imports
- Use `@/` path alias for all imports.
- Supabase types from `@/lib/types` or `@/lib/supabase/database.types`.
- UI components from `@/components/ui/*`.
- Business config from `@/lib/config`.

### Error Handling
- Server actions return `{ success: boolean, error?: string }` patterns.
- Toast notifications via Sonner for user feedback.
- Error boundaries in PWA layout (`app/(pwa)/error.tsx`).

### ESLint
- Extends `next/core-web-vitals` and `next/typescript`.
- `@typescript-eslint/no-empty-object-type` is off for UI components.
- `@typescript-eslint/no-explicit-any` is warn for UI components.
- Ignored files: `lib/database.types.ts`, `node_modules`, `.next`.

---

## Third-Party Integrations

### Stripe
- Client: `lib/stripe/client.ts` and `lib/stripe/client-side.ts`
- Webhooks: `app/api/webhooks/stripe/`
- Used for card payments on donations

### HelloAsso
- Client: `lib/helloasso/client.ts`, `lib/helloasso/webhook.ts`
- Webhooks: `app/api/helloasso-webhook/`
- French donation/payment platform integration

### Resend (Email)
- Client: `lib/email/resend-client.ts`
- Templates: `lib/email/receipt-templates.ts`, `lib/email/boutique-templates.ts`
- Used for fiscal receipts and shop order confirmations

### AI (Ideas Box)
- **Claude (Anthropic)**: `app/api/analyze-idea/` — Analyzes user-submitted ideas
- **Whisper (OpenAI)**: `app/api/transcribe/` — Converts voice recordings to text

### Leaflet Maps
- Used in tournee/zone management for sector visualization
- GeoJSON data in `public/sectors/` and root-level `.geojson` files

---

## CI/CD & Automation

### GitHub Actions
- **`backup-daily.yml`**: Daily Supabase backup (database + storage) to Minio at 3 AM UTC.

### Deployment
- Deployed on **Vercel** (auto-deploy from Git).
- `next.config.ts` configures remote image patterns for Supabase Storage and Unsplash.

### n8n
- Workflow automation configs in `n8n/` directory.
- Used for receipt PDF generation and webhook orchestration.

---

## Working with This Codebase

### Adding a New Feature
1. Create page in the appropriate route group (`(pwa)` for authenticated, `(landing)` for public).
2. Add components in `components/<feature>/`.
3. Add data access functions in `lib/supabase/<feature>.ts`.
4. Add types in `lib/types/<feature>.ts` and re-export from `lib/types/index.ts`.
5. Add server actions in `app/actions/<feature>.ts` if mutations are needed.
6. Add API routes in `app/api/<feature>/` if external integrations are needed.
7. Update business constants in `lib/config.ts` if applicable.

### Database Changes
1. Create a new SQL migration file in `supabase/migrations/`.
2. Follow the naming convention: `NNN_description.sql` or `YYYYMMDD_description.sql`.
3. Push with `npm run db:push`.
4. Regenerate types with `npm run db:types`.
5. Update `lib/types/` if custom types are needed beyond auto-generated ones.

### Adding a shadcn/ui Component
```bash
npx shadcn@latest add <component-name>
```
Components are installed to `components/ui/` with the New York style variant.

---

## Documentation

Extensive documentation exists in:
- `docs/` — 90+ guide files covering features, migrations, fixes, and architectural decisions
- Root-level `*.md` files — Audit reports, implementation guides, troubleshooting
- `supabase/README.md` — Database migration guide

Key documentation files:
- `docs/DEPLOYMENT_GUIDE.md` — Deployment instructions
- `docs/ENV_VARIABLES_GUIDE.md` — Environment variable reference
- `docs/DESIGN_SYSTEM_MODERNIZATION_GUIDE.md` — Design system documentation
- `docs/BACKUP_SYSTEM_GUIDE.md` — Backup system documentation
- `TROUBLESHOOTING.md` — Common issues and solutions
- `PWA-SETUP.md` — PWA configuration guide
