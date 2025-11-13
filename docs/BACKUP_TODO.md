# 🔄 Backup Automatique - À FINALISER

## ✅ Ce qui fonctionne déjà

- ✅ Scripts backup créés et testés **localement avec succès** :
  - `backup-database.js` : Dump PostgreSQL → Compression → Minio ✅
  - `backup-storage.js` : Sync Storage → Minio ✅
  - `restore-database.js` : Restauration d'urgence ✅
  
- ✅ Tests locaux Windows réussis :
  - Backup BDD : 0.76 MB → 0.12 MB (83% compression) en 21s
  - Backup Storage : 13 fichiers uploadés en 14s
  - Destination Minio : `supabase-backups/` ✅

- ✅ GitHub Action workflow créé (`.github/workflows/backup-daily.yml`)
- ✅ Fichiers commités sur GitHub
- ✅ Minio configuré et fonctionnel

## ❌ Problème bloquant

**GitHub Actions ne peut pas se connecter à Supabase PostgreSQL**

### Erreur actuelle
```
FATAL: Tenant or user not found
```

**Cause probable :** Format de connexion incorrect pour le pooler Supabase depuis GitHub Actions.

### Tentatives effectuées
1. ❌ Connexion directe port 5432 → "Network unreachable" (IPv6)
2. ❌ Résolution DNS IPv4 → Pas d'enregistrement A
3. ❌ Pooler port 6543 → "Tenant or user not found"

## 🔧 Solutions à tester (après mise en production)

### Solution 1 : Vérifier le format de connexion pooler (PRIORITÉ)

Le pooler Supabase nécessite un format spécifique. Vérifie dans Supabase Dashboard :

1. Va sur https://supabase.com/dashboard
2. Project Settings → Database → Connection string
3. Sélectionne **"Connection pooling"** (mode Transaction)
4. Copie l'URI exacte

Format attendu :
```
postgresql://postgres.PROJECT_REF:[PASSWORD]@aws-0-eu-west-3.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Action :** Mettre à jour le secret GitHub `SUPABASE_DB_URL` avec la vraie connexion string du pooler.

### Solution 2 : Utiliser l'API Supabase Management (ALTERNATIVE)

Si le pooler ne fonctionne pas, utiliser l'API officielle Supabase pour les backups :

```bash
curl -X POST "https://api.supabase.com/v1/projects/${PROJECT_REF}/database/backups" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}"
```

**Avantage :** Pas de problème de connexion réseau, backup géré par Supabase.
**Inconvénient :** Nécessite un Personal Access Token Supabase.

### Solution 3 : Self-hosted runner avec IP fixe

Si GitHub Actions IP change constamment, utiliser un runner auto-hébergé :

- Installer un runner GitHub sur ton VPS Hetzner (même que Minio)
- IP fixe, whitelist possible dans Supabase
- Backup local → Upload Minio (réseau interne)

**Coût :** 0€ (déjà sur ton VPS)

### Solution 4 : Backup via script cron sur VPS (SIMPLE)

Au lieu de GitHub Actions, exécuter le backup directement sur ton VPS Hetzner :

```bash
# Sur VPS Hetzner
0 3 * * * cd /path/to/scripts && node backup-database.js && node backup-storage.js
```

**Avantages :**
- Pas de problème réseau (VPS → Supabase direct)
- Pas de limite GitHub Actions
- Upload Minio en réseau local (rapide)

**Inconvénient :** Nécessite Node.js + PostgreSQL client sur le VPS.

## 📋 Checklist avant reprise

- [ ] Application en production ✅
- [ ] Tester connexion pooler depuis VPS Hetzner (`psql` avec la connexion string)
- [ ] Vérifier si Supabase bloque les connexions externes (firewall/whitelist)
- [ ] Décider entre GitHub Actions vs Cron VPS
- [ ] Si GitHub Actions : vérifier format exact pooler connection string
- [ ] Si Cron VPS : installer Node.js + pg_dump sur VPS

## 🔗 Ressources

- **Supabase Connection Pooling docs :** https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler
- **GitHub Actions IP ranges :** https://api.github.com/meta (section "actions")
- **Scripts backup locaux :** `scripts/backup/` (fonctionnels ✅)
- **Minio console :** https://console.s3.dsolution-ia.fr

## 💡 Recommandation finale

**Pour gagner du temps : utiliser un cron sur ton VPS Hetzner.**

C'est la solution la plus simple et fiable :
1. Ton VPS peut se connecter à Supabase sans problème réseau
2. Upload Minio en local (même serveur)
3. Pas de limites GitHub Actions
4. Configuration en 10 minutes

**Commande pour installer sur VPS :**
```bash
# 1. Copier les scripts sur VPS
scp -r scripts/backup/ user@vps:/opt/backup/

# 2. Installer dépendances
cd /opt/backup && npm install

# 3. Ajouter au crontab
crontab -e
0 3 * * * cd /opt/backup && node backup-database.js && node backup-storage.js >> /var/log/backup.log 2>&1
```

---

**Document créé le :** 13 novembre 2025  
**Statut :** En pause - À reprendre après mise en production  
**Contact GitHub Actions logs :** https://github.com/Tilma972/app-sapeurs-pompiers-clermont/actions
