# Projet Amicale SP — Roadmap des 6 modules

Objectif: cadrer l'architecture, la sécurité et la livraison incrémentale des 6 rubriques, avec un focus PWA mobile-first et data sécurité (RLS Supabase).

## Modules et MVPs

1) Tournées & Calendriers (/dashboard/calendriers)
- But: Suivi global + démarrer/terminer la tournée, dons, clôture
- MVP:
  - Vue d'ensemble: stats globales (calendriers, montant), progression équipes (agrégat par team)
  - Ma tournée active: création/lecture/fin, dons espèces/chèque/HelloAsso via intents
  - Modales: don compact, clôture simple espèces/chèques (déjà en place)
  - Gains 30%: calcul simple affiché (lecture seule) — logique trésorerie en phase ultérieure
- Entités:
  - tournees, support_transactions, donation_intents, tournee_summary (vue), profiles (team)

2) Petites Annonces (/dashboard/annonces)
- But: Mini-leboncoin interne
- MVP:
  - CRUD annonces (titre, description, prix, catégorie, photos[])
  - Messagerie simple (contact par email ou commentaire interne minimal)
  - Upload photos (via Supabase Storage) + modération basique (signalement)
- Entités:
  - classifieds, classified_images, classified_flags, classified_comments

3) Galerie SP (/dashboard/galerie)
- But: Instagram privé caserne
- MVP:
  - Upload photo + légende, like, signalement
  - Flux par ordre chronologique, profil auteur
  - Modération hybride: file d'attente admin pour items signalés (soft)
- Entités:
  - gallery_posts, gallery_likes, gallery_flags, gallery_comments, storage buckets

4) Annonces & Événements (/dashboard/associative)
- But: Agenda + prêt matériel amicale + actualités
- MVP:
  - Événements: création, RSVP (intéressé/participe)
  - Prêts matériel: inventaire simple, demandes/prêts/retour
  - Annonces associatives: naissances, infos pratiques (post court)
- Entités:
  - events, event_rsvps, assets, asset_loans, assoc_posts

5) Mon Compte SP (/dashboard/compte)
- But: Vue finance interne orientée membre
- MVP:
  - Curseur répartition (visualisation), demandes de paiement avec justificatifs (upload), balance
  - Historique opérations (lecture)
- Entités:
  - member_wallets, wallet_transactions, payout_requests, payout_attachments

6) Partenaires & Avantages (/dashboard/partenaires)
- But: Mini-CE local
- MVP:
  - Catalogue partenaires, offres, codes promo, validité
  - Méca d’accès (visible membres), filtre par catégorie
- Entités:
  - partners, partner_offers, partner_codes

## Schéma SQL — à compléter

Tables à créer (exemples) :
- classifieds(id, user_id, title, description, price, category, status, created_at)
- classified_images(id, classified_id, path, created_at)
- classified_flags(id, classified_id, user_id, reason, created_at)
- gallery_posts(id, user_id, caption, image_path, created_at)
- gallery_likes(id, post_id, user_id, created_at)
- gallery_flags(id, post_id, user_id, reason, created_at)
- events(id, creator_id, title, description, start_at, end_at, location, created_at)
- event_rsvps(id, event_id, user_id, status, created_at)
- assets(id, label, qty_total, qty_available, created_at)
- asset_loans(id, asset_id, user_id, qty, status, start_at, end_at, created_at)
- assoc_posts(id, author_id, type, body, created_at)
- member_wallets(id, user_id, balance_cents, created_at)
- wallet_transactions(id, wallet_id, type, amount_cents, memo, created_at)
- payout_requests(id, user_id, amount_cents, status, created_at)
- payout_attachments(id, request_id, path, created_at)
- partners(id, name, category, logo_path, created_at)
- partner_offers(id, partner_id, title, description, valid_from, valid_to, created_at)
- partner_codes(id, offer_id, code, is_unique, redeemed_by, redeemed_at, created_at)

Indexes & contraintes:
- Index par foreign key + composite utiles (ex: (user_id, created_at))
- Contraintes CHECK (amount >= 0), NOT NULL sur clés

## RLS & Rôles — patterns

Rôles: membre (sapeur), chef_equipe, tresorier, admin
- Par défaut: lecture/écriture restreintes à owner (user_id = auth.uid())
- chef_equipe: lecture agrégée équipe (via profils.team)
- tresorier: accès financier (support_transactions, wallets) lecture/écriture limitée
- admin: modération et gestion

Exemples de politiques:
- classifieds: owner full; autres lecture; flags: owner insert, admin read/write
- gallery_posts: owner full; likes: user insert/delete; flags: user insert, admin read/write
- events: creator full; rsvps: user can upsert own; assets/loans: admin full, user request/return
- wallets: user read own; transactions: user read own, tresorier write settlement; payout_requests: user create/read own, tresorier approve

## Sécurité & conformité
- Uploads: buckets dédiés, validations mimetype/taille, filenames hashés
- Webhooks: secrets, signature, idempotence
- Données sensibles: minimiser, chiffrage si nécessaire

## PWA mobile-first
- Offline: cache routes clés, stale-while-revalidate, file d’attente (uploads/demandes) en option
- UI: actions en 1-2 taps, formulaires compacts, feedback immédiat
- Realtime: updates légères pour counters/états (Supabase Realtime)

## Performances & monitoring
- Indexation SQL, pagination (infinite scroll), agrégations côté DB
- Metrics: latences API, erreurs, taux adoption, usage PWA
- Logs structurés côté serveur (createLogger existant)

## Phases de livraison
- Phase 0 (Fondations: 1-2 semaines)
  - Schéma SQL initial (annonces, galerie, événements), buckets storage, RLS de base
  - Squelettes UI (routes, pages, layouts), composants shadcn partagés
  - Lint/Type/Build CI, secrets env, checklists déploiement

- Phase 1 (Calendriers):
  - Finaliser UX ma tournée (déjà très avancée), QA paiements HelloAsso, reçus email
  - Progression équipes et vue globale propre

- Phase 2 (Annonces):
  - CRUD, upload, flags, listing responsive

- Phase 3 (Galerie):
  - Upload, feed, likes/flags, modération légère

- Phase 4 (Événements & prêts):
  - Événements + RSVP; inventaire + flux prêt/retour

- Phase 5 (Compte SP):
  - Wallet basique lecture + demandes paiement

- Phase 6 (Partenaires):
  - Catalogue + offres/codes

## Risques & atténuations
- Sécurité des fichiers: strict RLS Storage + presigned URLs
- Charge Realtime: filtrage par canal, throttling
- Complexité RLS: patterns testés par rôle, tests SQL de politiques
- Endettement technique: limiter réécritures, shipper MVPs

## Décisions ouvertes
- Modèle finance interne: cents vs décimales; autorisations trésorier
- Modération: seuil auto de masquage vs full manuel
- Offline avancé: file d’attente actions (phase ultérieure)
