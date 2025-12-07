# ✅ TODO - Refactoring V2

> **Checklist rapide** - Voir [REFACTO_V2_PLAN.md](./REFACTO_V2_PLAN.md) pour les détails

---

## 🔥 SEMAINE 1 : LE GRAND MÉNAGE

### Phase 1.1 : Préparation (1h)
- [ ] Créer branche `refacto-v2-baseline`
- [ ] Backup Supabase Dashboard
- [ ] Installer Supabase CLI

### Phase 1.2 : Squash Migrations (4-6h)
- [ ] Dumper le schéma actuel
- [ ] Vérifier le fichier baseline
- [ ] Archiver les 113 migrations
- [ ] Créer baseline unique
- [ ] Tester en local (`supabase db reset`)
- [ ] Commit

### Phase 1.3 : Supprimer Prisma (2-3h)
- [ ] Identifier utilisation Prisma
- [ ] Convertir queries → Supabase
- [ ] Désinstaller Prisma
- [ ] Tester module associatif
- [ ] Commit

### Phase 1.4 : Nettoyage (1-2h)
- [ ] Supprimer fichiers .orig
- [ ] Supprimer scripts de test
- [ ] Supprimer dépendance QR redondante
- [ ] Organiser docs dans /docs
- [ ] Commit

---

## 📋 SEMAINE 2 : LES FONDATIONS

### Phase 2.1 : Tests Critiques (6-8h)
- [ ] Installer Vitest
- [ ] Configurer Vitest
- [ ] Test Stripe webhook
- [ ] Test HelloAsso webhook
- [ ] Test calculs versement
- [ ] Lancer `npm test`
- [ ] Commit

### Phase 2.2 : Documentation (2-3h)
- [ ] Créer README_TECH.md
- [ ] Mettre à jour README.md
- [ ] Commit

### Phase 2.3 : CI/CD (2h)
- [ ] Créer workflow GitHub Actions
- [ ] Vérifier workflow passe au vert
- [ ] Commit

### Phase 2.4 : Optimisations (2-3h)
- [ ] Fixer versions Supabase
- [ ] Ajouter Zod validation
- [ ] Commit

---

## 🎉 PHASE FINALE : Merge

- [ ] Revue complète
- [ ] Créer Pull Request
- [ ] Tester en staging
- [ ] Backup production
- [ ] Merger PR
- [ ] Vérifier déploiement prod

---

## 📊 Progression

**Semaine 1 :** ⬜⬜⬜⬜ 0/4 phases
**Semaine 2 :** ⬜⬜⬜⬜ 0/4 phases
**Finale :** ⬜ 0/1 phase

**Total :** 0% complété

---

**Dernière mise à jour :** 2025-12-07
