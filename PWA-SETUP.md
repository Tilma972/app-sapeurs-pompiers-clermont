# 📱 Guide Installation PWA - Amicale SP

## ✅ Configuration effectuée

### 1. Fichiers créés
- ✅ `/public/manifest.json` - Configuration PWA
- ✅ `/public/icons/` - Dossier pour les icônes
- ✅ `/app/layout.tsx` - Meta tags PWA + Apple + Microsoft

### 2. Metadata configurée
- ✅ Theme color: `#c41e3a` (rouge pompiers)
- ✅ Mode standalone (sans barre de navigation)
- ✅ Support iOS (Apple Touch Icons)
- ✅ Support Android (Maskable icons)
- ✅ Support Windows (Tiles)

---

## 🎨 Génération des icônes à partir de votre logo

Votre logo pompiers (blason rouge/beige avec avion Canadair) doit être converti en icônes PWA.

### Option 1 : Service en ligne (Recommandé) 🌐

1. **PWA Asset Generator** : https://www.pwabuilder.com/imageGenerator
   - Upload votre logo `logo-pompiers.png` (idéalement 512x512 ou +)
   - Padding: 10% (pour laisser de l'espace)
   - Télécharger le ZIP
   - Extraire dans `/public/icons/`

2. **RealFaviconGenerator** : https://realfavicongenerator.net/
   - Upload votre logo
   - Configure iOS, Android, Windows
   - Télécharger le package
   - Copier les fichiers dans `/public/icons/`

### Option 2 : Avec ImageMagick (CLI) 💻

```bash
# Installer ImageMagick
# Windows: https://imagemagick.org/script/download.php#windows
# Mac: brew install imagemagick
# Linux: sudo apt install imagemagick

cd public/icons

# Depuis votre logo source (par ex. logo-512.png)
convert logo-512.png -resize 72x72 icon-72x72.png
convert logo-512.png -resize 96x96 icon-96x96.png
convert logo-512.png -resize 128x128 icon-128x128.png
convert logo-512.png -resize 144x144 icon-144x144.png
convert logo-512.png -resize 152x152 icon-152x152.png
convert logo-512.png -resize 180x180 icon-180x180.png
convert logo-512.png -resize 192x192 icon-192x192.png
convert logo-512.png -resize 384x384 icon-384x384.png
convert logo-512.png -resize 512x512 icon-512x512.png

# Maskable icon (Android adaptive - avec padding)
convert logo-512.png -background transparent -gravity center -extent 640x640 -resize 512x512 maskable-icon-512x512.png

# Favicon
convert logo-512.png -resize 32x32 ../favicon.ico
```

### Option 3 : Avec Photoshop/GIMP/Figma 🎨

1. Ouvrir votre logo source
2. Exporter chaque taille :
   - 72x72, 96x96, 128x128, 144x144, 152x152, 180x180, 192x192, 384x384, 512x512
3. Format : PNG, fond transparent (ou blanc si logo opaque)
4. Sauvegarder dans `/public/icons/` avec le nom exact : `icon-XXxXX.png`

---

## 📋 Checklist icônes requises

Créer ces fichiers dans `/public/icons/` :

- [ ] `icon-72x72.png`
- [ ] `icon-96x96.png`
- [ ] `icon-128x128.png`
- [ ] `icon-144x144.png`
- [ ] `icon-152x152.png`
- [ ] `icon-180x180.png` (important pour iOS)
- [ ] `icon-192x192.png`
- [ ] `icon-384x384.png`
- [ ] `icon-512x512.png`
- [ ] `maskable-icon-512x512.png` (avec padding pour Android)

Dans `/public/` :
- [ ] `favicon.ico` (32x32)

---

## 🧪 Tester l'installation PWA

### 1. Build local
```bash
npm run build
npm run start
```

### 2. Tester sur Android (Chrome)
1. Ouvrir l'app sur mobile : `https://votre-domaine.com`
2. Chrome affiche "Installer l'application"
3. Ou Menu ⋮ → "Installer l'application"
4. ✅ Icône apparaît sur écran d'accueil

### 3. Tester sur iOS (Safari)
1. Ouvrir l'app sur iPhone
2. Touche bouton Partage 
3. "Sur l'écran d'accueil"
4. ✅ Icône apparaît sur écran d'accueil

### 4. Vérifier avec DevTools
```
F12 → Application → Manifest
```
Toutes les icônes doivent être en vert ✅

### 5. Lighthouse Audit
```
F12 → Lighthouse → Progressive Web App
```
Score attendu : **90+/100**

---

## 🚀 Déploiement

Une fois les icônes générées :

```bash
git add public/icons/* public/manifest.json public/favicon.ico app/layout.tsx
git commit -m "feat: add PWA support with custom pompiers icons"
git push origin main
```

Vercel redéploiera automatiquement.

---

## 🎯 Raccourcis rapides configurés

Dans le menu contextuel de l'icône PWA, 3 raccourcis apparaîtront :
1. **Ma Tournée** → `/dashboard/calendriers`
2. **Calendriers** → `/dashboard/calendriers`
3. **Mon Compte** → `/dashboard/mon-compte`

---

## ✅ Vérifications finales

Avant mise en prod :
- [ ] Toutes les icônes chargent (pas de 404)
- [ ] Le site est en HTTPS (obligatoire PWA)
- [ ] Test installation Android OK
- [ ] Test installation iOS OK
- [ ] Lighthouse PWA score > 90
- [ ] Logo visible et centré sur toutes les tailles

---

## 🆘 Besoin d'aide ?

Si vous avez besoin que je génère les icônes pour vous :
1. Envoyez-moi votre logo en haute résolution (PNG, 512x512 minimum)
2. Je génère toutes les tailles nécessaires
3. Je les optimise pour PWA (compression, padding, etc.)

---

## 📊 Statistiques PWA (Optionnel)

Pour tracker les installations, ajoutez dans un composant client :

\`\`\`typescript
useEffect(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Track prompt shown
      console.log('PWA install prompt displayed')
    })
    
    window.addEventListener('appinstalled', () => {
      // Track successful install
      console.log('PWA installed!')
    })
  }
}, [])
\`\`\`

Bon déploiement ! 🚒🔥
