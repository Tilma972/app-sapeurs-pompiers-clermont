# Plan de Tests - Marketplace Annonces

## 🧪 Tests Fonctionnels

### 1. Création d'annonce

**Scénario nominal:**
```
1. Se connecter en tant qu'utilisateur
2. Aller sur /annonces
3. Cliquer sur "Publier"
4. Remplir tous les champs :
   - Titre : "Test Casque F1" (min 5 caractères)
   - Description : "Description complète de test" (min 20 caractères)
   - Prix : 120
   - Catégorie : "Équipement"
   - Photos : Uploader 2-3 images
5. Soumettre le formulaire
6. Vérifier la redirection vers /annonces/mes-annonces
7. Vérifier que l'annonce apparaît dans la liste
```

**Validations à tester:**
- [ ] Titre < 5 caractères → erreur
- [ ] Description < 20 caractères → erreur
- [ ] Prix <= 0 → erreur
- [ ] Aucune photo → erreur
- [ ] Plus de 5 photos → erreur (limite UI)
- [ ] Image > 10 Mo → erreur
- [ ] Non authentifié → erreur

**Vérifications Storage:**
- [ ] Photo uploadée dans `annonces/{user_id}/...`
- [ ] Photo compressée (< 1 Mo généralement)
- [ ] Format JPEG
- [ ] URL publique accessible

---

### 2. Liste des annonces

**Tests de base:**
- [ ] Voir toutes les annonces actives (sans filtre)
- [ ] Voir 20 annonces max sur première page
- [ ] Cliquer "Charger plus" → 20 annonces supplémentaires
- [ ] Bouton "Charger plus" disparaît quand plus d'annonces

**Tests de filtrage:**
- [ ] Filtrer par catégorie "Équipement"
- [ ] Rechercher "casque" dans la barre
- [ ] Combiner catégorie + recherche
- [ ] Changer de filtre → reset pagination

**Tests favoris:**
- [ ] Cliquer sur ❤️ → ajoute aux favoris
- [ ] Compteur favoris +1
- [ ] Re-cliquer → retire des favoris
- [ ] Compteur favoris -1

**Tests navigation:**
- [ ] Cliquer sur une card → aller sur détail
- [ ] Bouton "Mes annonces" → /annonces/mes-annonces
- [ ] Bouton "Publier" → /annonces/nouvelle

---

### 3. Détail d'une annonce

**Affichage:**
- [ ] Galerie photos fonctionnelle
- [ ] Changer de photo principale
- [ ] Titre, description, prix affichés
- [ ] Infos vendeur affichées
- [ ] Compteur vues incrémenté automatiquement

**Actions:**
- [ ] Bouton "Contacter" → ouvre téléphone/email
- [ ] Bouton ❤️ → ajoute/retire favoris
- [ ] Bouton "Retour" → retour liste

**Sécurité:**
- [ ] Impossible de modifier l'annonce d'un autre user (UI)
- [ ] Bouton "Modifier" visible UNIQUEMENT si propriétaire

---

### 4. Modification d'annonce

**Chargement:**
- [ ] Formulaire pré-rempli avec données existantes
- [ ] Photos existantes affichées
- [ ] Badge "Principal" sur première photo

**Modification photos:**
- [ ] Ajouter nouvelle photo → badge "Nouveau" vert
- [ ] Supprimer photo existante
- [ ] Supprimer nouvelle photo (avant submit)
- [ ] Maximum 5 photos total (existantes + nouvelles)

**Sauvegarde:**
- [ ] Modifier uniquement le titre → succès
- [ ] Modifier uniquement les photos → succès
- [ ] Modifier tous les champs → succès
- [ ] Redirection vers /annonces/mes-annonces

**Sécurité RLS:**
- [ ] Impossible de modifier l'annonce d'un autre via API
- [ ] Erreur 403 si tentative

---

### 5. Gestion "Mes annonces"

**Affichage:**
- [ ] Stats correctes (total, actives, pausées, vendues)
- [ ] Toutes les annonces de l'utilisateur
- [ ] Filtres par onglets fonctionnels

**Actions par annonce:**
- [ ] Modifier → /annonces/[id]/modifier
- [ ] Activer/Désactiver → change statut
- [ ] Marquer vendue → change statut
- [ ] Supprimer → confirmation modal
- [ ] Supprimer confirmé → annonce disparaît

**Vérifications base de données:**
- [ ] Changement de statut enregistré
- [ ] Suppression effective (soft delete si implémenté)
- [ ] Photos supprimées du Storage

---

## 🔒 Tests de Sécurité RLS

### Test 1 : Lecture des annonces

**Utilisateur non connecté:**
```sql
-- Doit voir uniquement annonces actives/réservées
SELECT * FROM annonces WHERE statut IN ('active', 'reservee');
-- ✅ Succès

SELECT * FROM annonces WHERE statut = 'desactivee';
-- ❌ Aucun résultat (RLS bloque)
```

**Utilisateur connecté:**
```sql
-- Doit voir ses annonces (tous statuts)
SELECT * FROM annonces WHERE user_id = auth.uid();
-- ✅ Succès

-- Doit voir annonces actives des autres
SELECT * FROM annonces WHERE user_id != auth.uid() AND statut = 'active';
-- ✅ Succès
```

---

### Test 2 : Création

**Tentative de créer pour un autre user:**
```sql
INSERT INTO annonces (user_id, titre, description, prix, categorie)
VALUES ('autre-user-id', 'Test', 'Description test', 100, 'Équipement');
-- ❌ Erreur RLS (user_id != auth.uid())
```

---

### Test 3 : Modification

**Tentative de modifier l'annonce d'un autre:**
```typescript
// User A essaie de modifier l'annonce de User B
await updateAnnonce('annonce-id-user-b', { titre: 'Hack' })
// ❌ Erreur 403 ou pas de lignes affectées
```

---

### Test 4 : Suppression

**Tentative de supprimer l'annonce d'un autre:**
```typescript
await deleteAnnonce('annonce-id-user-b')
// ❌ Erreur 403 ou pas de lignes affectées
```

---

## 🖼️ Tests Compression Images

### Préparation
1. Trouver une image JPEG 5 Mo (ex: 4000x3000px)
2. Uploader via le formulaire

### Vérifications
- [ ] Upload réussi sans erreur
- [ ] Taille finale < 1 Mo
- [ ] Dimensions max 1200px largeur
- [ ] Format JPEG (même si PNG à l'origine)
- [ ] Qualité visuelle acceptable

### Test avec différentes images
- [ ] Photo portrait (3000x4000) → compressée
- [ ] Photo paysage (4000x3000) → compressée
- [ ] Image carrée (2000x2000) → compressée
- [ ] Petite image (800x600) → non redimensionnée
- [ ] PNG avec transparence → converti JPEG (fond blanc)

---

## ♿ Tests Accessibilité

### Navigation clavier

**Parcours complet au clavier:**
1. Tab sur page liste
2. Atteindre barre de recherche → écrire
3. Tab vers filtres catégories
4. Tab vers cards d'annonces
5. Enter sur une card → ouvre détail
6. Tab dans détail → focus sur boutons
7. Escape → retour (si modal)

**Checklist:**
- [ ] Tous les éléments focusables
- [ ] Focus visible (outline/ring)
- [ ] Ordre logique de tabulation
- [ ] Pas de piège à focus

---

### Lecteur d'écran (NVDA/JAWS)

**Éléments à vérifier:**
- [ ] Barre recherche : "Rechercher une annonce, champ de texte"
- [ ] Bouton publier : "Publier une nouvelle annonce, bouton"
- [ ] Bouton favoris : "Ajouter aux favoris, bouton" ou "Retirer des favoris"
- [ ] Image annonce : "Casque F1 en excellent état, image"
- [ ] Prix : "120 euros"

**Test navigation landmarks:**
- [ ] Navigation principale identifiée
- [ ] Zone contenu principale
- [ ] Formulaires correctement labellisés

---

### Contraste et lisibilité

**Avec outil WAVE ou axe DevTools:**
- [ ] Contraste texte/fond > 4.5:1 (WCAG AA)
- [ ] Boutons avec contraste suffisant
- [ ] Badges lisibles
- [ ] Texte sur images lisible (overlays)

---

## 📱 Tests Mobile

### Responsive

**Breakpoints à tester:**
- [ ] 320px (iPhone SE)
- [ ] 375px (iPhone 12/13)
- [ ] 390px (iPhone 14)
- [ ] 768px (iPad)

**Vérifications:**
- [ ] Grille 2 colonnes sur mobile
- [ ] Barre recherche pleine largeur
- [ ] Boutons accessibles au pouce
- [ ] Images redimensionnées correctement
- [ ] Pas de scroll horizontal

---

### Touch gestures

- [ ] Swipe horizontal sur galerie photos
- [ ] Tap sur card → ouvre détail
- [ ] Tap sur favoris → toggle
- [ ] Pull to refresh (si implémenté)

---

### Performance mobile

**Avec Lighthouse mobile:**
- [ ] Performance > 85
- [ ] First Contentful Paint < 2s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1

---

## ⚡ Tests Performance

### Pagination

**Scénario :**
1. Charger page liste (20 items)
2. Cliquer "Charger plus" 5 fois
3. Vérifier mémoire navigateur

**Checklist:**
- [ ] Temps chargement initial < 1s
- [ ] Temps "Charger plus" < 500ms
- [ ] Pas de memory leak
- [ ] Scroll fluide même avec 100+ items

---

### Cache

**Test cache images:**
1. Charger page liste
2. Aller sur détail
3. Retour liste
4. Vérifier Network tab → images en cache (304)

**Test cache données:**
- [ ] Requêtes Supabase rapides (< 200ms)
- [ ] Pas de refetch inutiles

---

## 🐛 Tests Edge Cases

### Données manquantes
- [ ] Annonce sans photo → placeholder
- [ ] Vendeur sans avatar → initiales
- [ ] Prix à 0 → validation bloque
- [ ] Description vide → validation bloque

### Limits
- [ ] Upload 6 photos → bloqué à 5
- [ ] Titre 200 caractères → accepté
- [ ] Description 10 000 caractères → accepté
- [ ] Prix 999 999 € → accepté

### Erreurs réseau
- [ ] Déconnexion pendant upload → erreur claire
- [ ] Timeout requête → retry ou erreur
- [ ] 500 error Supabase → message utilisateur

---

## 📊 Métriques à Monitorer

### En production
- Nombre d'annonces créées/jour
- Taux de conversion (vues → favoris)
- Temps moyen upload photo
- Taux d'erreur upload
- Pages les plus lentes
- Erreurs JS (Sentry)

---

## ✅ Checklist Finale

### Avant déploiement
- [ ] Tous les tests fonctionnels passés
- [ ] Tests RLS validés en dev
- [ ] Tests accessibilité > 90
- [ ] Lighthouse > 85 sur toutes les pages
- [ ] Tests mobile sur devices réels
- [ ] Pas d'erreurs console
- [ ] Pas de warnings React
- [ ] Documentation à jour

### Post-déploiement
- [ ] Smoke test en production
- [ ] Vérifier analytics configuré
- [ ] Vérifier monitoring erreurs
- [ ] Tester flow complet avec compte test
- [ ] Vérifier RLS en prod (ne pas bypass)

---

**Document créé le:** 4 novembre 2025  
**Version:** 1.0
