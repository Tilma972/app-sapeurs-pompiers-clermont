# 🔐 Guide Configuration Variables d'Environnement

## Variables requises pour la Boîte à Idées

### 📝 Fichier `.env.local`

Créer un fichier `.env.local` à la racine du projet avec :

```env
# ================================
# SUPABASE (déjà configuré)
# ================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ================================
# OPENAI (pour Whisper - Transcription audio)
# ================================
OPENAI_API_KEY=sk-proj-...

# ================================
# ANTHROPIC (pour Claude - Analyse IA)
# ================================
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 🔑 Obtenir les clés API

### 1. OpenAI API Key (Whisper)

**Étapes :**
1. Aller sur [platform.openai.com](https://platform.openai.com)
2. Se connecter ou créer un compte
3. Aller dans **API Keys** (menu gauche)
4. Cliquer **"Create new secret key"**
5. Nommer la clé (ex: "Amicale SP - Whisper")
6. Copier la clé `sk-proj-...`
7. ⚠️ **IMPORTANT :** Sauvegarder immédiatement, elle ne sera plus visible

**Coûts :**
- **Whisper :** $0.006 / minute
- **Estimation :** ~$1.20/mois pour 100 idées vocales (2 min moyenne)

**Configuration compte :**
- Ajouter un moyen de paiement
- Définir un usage limit (ex: $10/mois) pour éviter surprises

---

### 2. Anthropic API Key (Claude)

**Étapes :**
1. Aller sur [console.anthropic.com](https://console.anthropic.com)
2. Se connecter ou créer un compte
3. Aller dans **API Keys**
4. Cliquer **"Create Key"**
5. Nommer la clé (ex: "Amicale SP - Claude")
6. Copier la clé `sk-ant-...`
7. ⚠️ **IMPORTANT :** Sauvegarder immédiatement

**Coûts :**
- **Claude Sonnet 4 :** $3 / 1M tokens input, $15 / 1M tokens output
- **Estimation :** ~$0.60/mois pour 100 idées vocales
- **Total estimé :** ~$1.80/mois pour 100 idées (Whisper + Claude)

**Configuration compte :**
- Ajouter un moyen de paiement
- Définir un budget mensuel

---

## 🚀 Déploiement Production (Vercel)

### Méthode 1 : Via Dashboard Vercel

1. Aller sur [vercel.com](https://vercel.com)
2. Sélectionner votre projet
3. **Settings** → **Environment Variables**
4. Ajouter chaque variable :
   - `OPENAI_API_KEY` → Valeur → Production
   - `ANTHROPIC_API_KEY` → Valeur → Production
5. **Redéployer** le projet

### Méthode 2 : Via CLI Vercel

```bash
# Installer Vercel CLI si pas déjà fait
npm i -g vercel

# Se connecter
vercel login

# Ajouter les variables
vercel env add OPENAI_API_KEY
# → Coller la valeur
# → Sélectionner "Production"

vercel env add ANTHROPIC_API_KEY
# → Coller la valeur
# → Sélectionner "Production"

# Redéployer
vercel --prod
```

---

## ⚠️ Sécurité

### ✅ Bonnes pratiques :

1. **Ne JAMAIS commit `.env.local`**
   - Vérifier `.gitignore` contient `.env.local`
   
2. **Rotate les clés régulièrement**
   - OpenAI : tous les 6 mois
   - Anthropic : tous les 6 mois

3. **Limiter les permissions**
   - OpenAI : Activer seulement Whisper API
   - Anthropic : Activer seulement Messages API

4. **Monitoring usage**
   - OpenAI : Dashboard → Usage
   - Anthropic : Console → Usage
   - Définir alertes si dépasse budget

5. **Ne pas partager les clés**
   - Chaque membre équipe → sa propre clé
   - Pas de clés dans Slack/Discord/etc.

### ❌ À éviter :

- ❌ Commit les clés dans Git
- ❌ Hardcoder les clés dans le code
- ❌ Partager les clés par email/chat
- ❌ Utiliser les mêmes clés dev/prod
- ❌ Laisser des clés actives après tests

---

## 🧪 Tester les clés

### Test OpenAI :

```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
```

Réponse attendue : Liste des modèles disponibles (dont `whisper-1`)

### Test Anthropic :

```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 10,
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

Réponse attendue : JSON avec `content` contenant une réponse

---

## 🐛 Troubleshooting

### Erreur : "Invalid API Key"

**Cause :** Clé incorrecte ou expirée

**Solution :**
1. Vérifier la clé dans `.env.local`
2. Vérifier pas d'espaces avant/après
3. Régénérer la clé si nécessaire

---

### Erreur : "Insufficient quota"

**Cause :** Crédit épuisé sur le compte

**Solution :**
1. OpenAI : Ajouter crédit dans **Billing**
2. Anthropic : Ajouter moyen de paiement

---

### Erreur : "Rate limit exceeded"

**Cause :** Trop de requêtes en peu de temps

**Solution :**
1. Attendre quelques minutes
2. Implémenter retry logic côté code
3. Upgrader le tier (plus de requests/min)

---

### Variables env non chargées en dev

**Cause :** Next.js ne détecte pas `.env.local`

**Solution :**
```bash
# Redémarrer le serveur dev
npm run dev
```

---

### Variables env non disponibles en prod

**Cause :** Variables non ajoutées dans Vercel

**Solution :**
1. Dashboard Vercel → Settings → Environment Variables
2. Ajouter toutes les variables
3. Redéployer

---

## 📊 Monitoring des coûts

### Dashboard OpenAI

URL : [platform.openai.com/usage](https://platform.openai.com/usage)

**À surveiller :**
- Usage par jour/mois
- Modèles utilisés (Whisper)
- Coût total
- Définir limite mensuelle

### Dashboard Anthropic

URL : [console.anthropic.com/settings/usage](https://console.anthropic.com/settings/usage)

**À surveiller :**
- Tokens consommés (input/output)
- Modèles utilisés (Claude Sonnet 4)
- Coût total
- Définir budget mensuel

---

## 🎯 Checklist finale

Avant de lancer en production :

- [ ] ✅ Clés API OpenAI générée
- [ ] ✅ Clés API Anthropic générée
- [ ] ✅ Variables ajoutées dans Vercel
- [ ] ✅ Tests API effectués (curl)
- [ ] ✅ Budgets définis (OpenAI + Anthropic)
- [ ] ✅ `.env.local` dans `.gitignore`
- [ ] ✅ Alerts configurées (usage > 80%)
- [ ] ✅ Documentation partagée équipe
- [ ] ✅ Plan de rotation clés défini

---

## 📞 Support

### OpenAI
- **Docs :** [platform.openai.com/docs](https://platform.openai.com/docs)
- **Support :** [help.openai.com](https://help.openai.com)
- **Status :** [status.openai.com](https://status.openai.com)

### Anthropic
- **Docs :** [docs.anthropic.com](https://docs.anthropic.com)
- **Support :** [support.anthropic.com](https://support.anthropic.com)
- **Status :** [status.anthropic.com](https://status.anthropic.com)

---

## 🔄 Mise à jour des clés

### Procédure de rotation :

1. **Générer nouvelle clé** sur le dashboard
2. **Tester la nouvelle clé** en local
3. **Ajouter la nouvelle clé** dans Vercel
4. **Redéployer** l'application
5. **Vérifier fonctionnement** en prod
6. **Supprimer l'ancienne clé** sur le dashboard

**Fréquence recommandée :** Tous les 6 mois

---

## 💡 Conseils optimisation coûts

1. **Cache les résultats :** Sauvegarder transcriptions en DB
2. **Rate limiting :** Limiter nb idées vocales/user/jour
3. **Compression audio :** Réduire taille fichiers avant upload
4. **Monitoring strict :** Alertes si usage anormal
5. **Fallback :** Si quota dépassé, proposer création texte

---

**Date de création :** 7 novembre 2025  
**Dernière mise à jour :** 7 novembre 2025

