# 🔗 Liens à compléter

Ce document liste tous les liens qui doivent être complétés avec vos URLs réelles.

---

## 📱 Réseaux sociaux (Footer)

**Fichier:** `components/landing/landing-footer.tsx`

### Facebook
- **Ligne:** 160
- **État actuel:** `href="#facebook"`
- **Action requise:** Remplacer par votre URL Facebook officielle
- **Exemple:** `href="https://www.facebook.com/amicale.sapeurs.pompiers.clermont"`

### Instagram
- **Ligne:** 167
- **État actuel:** `href="#instagram"`
- **Action requise:** Remplacer par votre URL Instagram officielle
- **Exemple:** `href="https://www.instagram.com/amicale_sp_clermont"`

---

## 📄 Pages légales (Footer)

**Fichier:** `components/landing/landing-footer.tsx` (lignes 189-197)

Ces liens pointent actuellement vers des ancres (`#`) et doivent être remplacés par de vraies pages.

### 1. Confidentialité
- **Ligne:** 189
- **État actuel:** `href="#privacy"`
- **Action requise:**
  - Option A: Créer une page `/politique-de-confidentialite`
  - Option B: Utiliser un service comme [Termly](https://termly.io) pour générer automatiquement votre politique

### 2. Conditions d'utilisation
- **Ligne:** 192
- **État actuel:** `href="#terms"`
- **Action requise:**
  - Option A: Créer une page `/conditions-generales`
  - Option B: Adapter un modèle de CGU pour associations

### 3. Politique de cookies
- **Ligne:** 195
- **État actuel:** `href="#cookies"`
- **Action requise:**
  - Option A: Créer une page `/politique-cookies`
  - Option B: Si vous n'utilisez pas de cookies tiers, une simple mention peut suffire

---

## 🗂️ Liens de navigation footer

**Fichier:** `components/landing/landing-footer.tsx` (lignes 11-26)

Plusieurs liens de navigation pointent vers des ancres. Voici ceux à vérifier :

### L'Amicale
- ✅ `#about` → Vérifier si l'ancre existe sur la page
- ✅ `#missions` → OK (section existe)
- ❌ `#teams` → Pas de section équipes actuellement
- ❌ `#news` → Devrait être `#actualites` (section existe avec cet ID)

### Services
- ❌ `#formation` → Section n'existe pas actuellement
- ❌ `#intervention` → Section n'existe pas actuellement
- ❌ `#prevention` → Devrait être OK (section existe)
- ❌ `#support` → Section n'existe pas actuellement

### Ressources
- ✅ Lien externe SDIS (OK)
- ❌ `#faq` → Section n'existe pas actuellement
- ❌ `#legal` → Devrait pointer vers `/mentions-legales`

---

## 🎯 Actions recommandées

### Priorité HAUTE (À faire maintenant)

1. **Réseaux sociaux**
   ```typescript
   // Dans landing-footer.tsx, lignes 159-172
   <Link href="https://www.facebook.com/[VOTRE_PAGE]">
     <Facebook className="h-5 w-5" />
   </Link>
   <Link href="https://www.instagram.com/[VOTRE_PAGE]">
     <Instagram className="h-5 w-5" />
   </Link>
   ```

2. **Corriger les liens de navigation existants**
   - Changer `#news` → `#actualites`
   - Changer `#about` → `#actions` (ou créer une section about)

### Priorité MOYENNE (À planifier)

3. **Créer les pages légales minimales**
   - Mentions légales
   - Politique de confidentialité (RGPD)
   - Cookies (si applicable)

4. **Créer ou supprimer les sections manquantes**
   - Option A: Créer les sections (formation, intervention, etc.)
   - Option B: Supprimer ces liens du footer

---

## 📝 Templates suggérés

### Page "Mentions légales" minimale

```markdown
# Mentions Légales

## Éditeur du site
Amicale des Sapeurs-Pompiers de Clermont-l'Hérault
Adresse: Caserne des Sapeurs-Pompiers, 34800 Clermont-l'Hérault
Email: contact@amicale-sp-clermont.fr
Téléphone: 04 67 44 99 70

## Hébergement
[Nom de votre hébergeur]
[Adresse de l'hébergeur]

## Propriété intellectuelle
[Vos mentions de droits d'auteur]

## Protection des données personnelles
Conformément au RGPD...
```

---

## ✅ Checklist finale

- [ ] Ajouter liens Facebook et Instagram réels
- [ ] Corriger `#news` → `#actualites`
- [ ] Créer page `/mentions-legales`
- [ ] Créer page `/politique-de-confidentialite`
- [ ] Créer page `/politique-cookies` (si cookies tiers utilisés)
- [ ] Décider du sort des sections manquantes (créer ou supprimer liens)
- [ ] Créer section "À propos" ou rediriger `#about` vers `#actions`
- [ ] Optionnel: Créer page FAQ

---

**Note:** Une fois ces liens complétés, votre landing page sera conforme aux bonnes pratiques et aux obligations légales (RGPD).
