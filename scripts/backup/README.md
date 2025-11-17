# 📦 Système de Backup Supabase → MinIO

Ce système automatise la sauvegarde quotidienne de vos données Supabase (PostgreSQL + Storage) vers votre instance MinIO S3.

## 📋 Table des matières

- [Vue d'ensemble](#vue-densemble)
- [Configuration](#configuration)
- [Utilisation locale](#utilisation-locale)
- [GitHub Actions](#github-actions)
- [Résolution de problèmes](#résolution-de-problèmes)
- [Scripts disponibles](#scripts-disponibles)

---

## 🎯 Vue d'ensemble

Le système se compose de 3 scripts principaux :

1. **`backup-database.js`** - Sauvegarde la base de données PostgreSQL
2. **`backup-storage.js`** - Sauvegarde les fichiers du Storage (buckets)
3. **`restore-database.js`** - Restaure une sauvegarde de la base de données

### Fonctionnalités

- ✅ Backup automatique quotidien (3h UTC)
- ✅ Compression des backups (.gz)
- ✅ Rotation automatique (30 jours)
- ✅ Upload vers MinIO S3
- ✅ Détection et correction automatique des erreurs de configuration
- ✅ Test de connexion avant backup
- ✅ Logs détaillés

---

## ⚙️ Configuration

### 1. Prérequis

**Dépendances système :**
- Node.js 20+
- PostgreSQL client tools (`pg_dump`, `psql`)
- `gzip` (Linux/Mac)

**Sur Ubuntu/Debian :**
```bash
apt-get install -y postgresql-client
```

**Sur macOS :**
```bash
brew install postgresql
```

**Sur Windows :**
- Télécharger PostgreSQL : https://www.postgresql.org/download/windows/
- Ajouter au PATH : `C:\Program Files\PostgreSQL\16\bin`

### 2. Installation des dépendances Node.js

```bash
cd scripts/backup
npm install
```

### 3. Configuration des variables d'environnement

#### 🔴 IMPORTANT : Configuration Supabase

**Le problème le plus courant est l'utilisation du mauvais type de connexion PostgreSQL.**

Supabase propose 2 types de connexion :
- ❌ **Transaction mode** (port 6543) → **NE FONCTIONNE PAS** avec `pg_dump`
- ✅ **Session mode / Direct connection** (port 5432) → **À UTILISER**

#### Comment obtenir la bonne URL de connexion :

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. **Settings** → **Database**
4. Dans la section **Connection string** :
   - Sélectionnez **"Direct connection"** ou **"Session mode"** (pas "Transaction")
   - Copiez l'URL qui ressemble à :

```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-eu-west-3.pooler.supabase.com:5432/postgres
```

**Points clés :**
- Port **5432** (pas 6543)
- Format : `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[HOST]:5432/postgres`

#### Variables d'environnement requises

Créez un fichier `.env` basé sur `.env.example` :

```bash
cp .env.example .env
```

Puis remplissez les valeurs :

```bash
# SUPABASE
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_DB_URL=postgresql://postgres.xxxxx:[PASSWORD]@aws-0-eu-west-3.pooler.supabase.com:5432/postgres

# MINIO
MINIO_ENDPOINT=https://console.s3.dsolution-ia.fr
MINIO_ACCESS_KEY=votre_access_key
MINIO_SECRET_KEY=votre_secret_key
MINIO_BUCKET=supabase-backups
```

---

## 💻 Utilisation locale

### Backup de la base de données

```bash
npm run backup:database
```

**Ce script va :**
1. ✅ Vérifier et corriger automatiquement l'URL de connexion si nécessaire
2. ✅ Tester la connexion à PostgreSQL
3. ✅ Créer un dump complet de la base
4. ✅ Compresser le dump en .gz
5. ✅ Upload vers MinIO
6. ✅ Nettoyer les backups > 30 jours

### Backup du Storage

```bash
npm run backup:storage
```

**Ce script va :**
1. Lister tous les fichiers des buckets (`avatars`, `landing_page`)
2. Télécharger chaque fichier
3. Upload vers MinIO avec la même structure
4. Ignorer les fichiers déjà présents

### Backup complet (database + storage)

```bash
npm run backup:all
```

### Restauration

```bash
# Restaurer le dernier backup
npm run restore:database

# Restaurer un backup spécifique
node restore-database.js 2025-11-17T03-00
```

⚠️ **Attention :** La restauration écrasera toutes les données actuelles !

---

## 🤖 GitHub Actions

Le workflow `.github/workflows/backup-daily.yml` s'exécute automatiquement tous les jours à **3h UTC**.

### Configuration des secrets

Dans votre repo GitHub : **Settings** → **Secrets and variables** → **Actions**

Créez les secrets suivants :

| Secret | Description | Exemple |
|--------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL publique Supabase | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role | `eyJhbGci...` |
| `SUPABASE_DB_URL` | **URL de connexion directe (port 5432)** | `postgresql://postgres.xxx:pwd@...5432/postgres` |
| `MINIO_ENDPOINT` | URL de votre MinIO | `https://console.s3.dsolution-ia.fr` |
| `MINIO_ACCESS_KEY` | Access key MinIO | `your_access_key` |
| `MINIO_SECRET_KEY` | Secret key MinIO | `your_secret_key` |
| `MINIO_BUCKET` | Nom du bucket | `supabase-backups` |

### Lancement manuel

Vous pouvez lancer le backup manuellement :
1. Allez dans l'onglet **Actions** de votre repo
2. Sélectionnez **"Backup Quotidien Supabase → Minio"**
3. Cliquez sur **"Run workflow"**

---

## 🔧 Résolution de problèmes

### Erreur : "Tenant or user not found"

**Cause :** Vous utilisez l'URL du Transaction pooler (port 6543) au lieu de la connexion directe.

**Solution automatique :** Le script détecte maintenant ce problème et convertit automatiquement le port 6543 en 5432.

**Solution manuelle :**
1. Allez dans Supabase Dashboard → Settings → Database
2. Changez "Transaction mode" vers **"Direct connection"** ou **"Session mode"**
3. Copiez la nouvelle URL (avec port 5432)
4. Mettez à jour votre secret GitHub `SUPABASE_DB_URL`

### Erreur : "pg_dump: command not found"

**Cause :** PostgreSQL client tools non installés.

**Solution :**
```bash
# Ubuntu/Debian
apt-get install -y postgresql-client

# macOS
brew install postgresql

# Windows
choco install postgresql
```

### Erreur : "password authentication failed"

**Cause :** Le mot de passe dans `SUPABASE_DB_URL` est incorrect.

**Solution :**
1. Récupérez le mot de passe dans Supabase Dashboard → Settings → Database
2. Vérifiez que l'URL contient bien `:[PASSWORD]@`

### Le backup ne sauvegarde que 1000 fichiers

**Cause :** Limitation actuelle du script (sera corrigée dans une prochaine version).

**Workaround :** Contactez-moi pour implémenter la pagination.

### Backup échoue avec "ECONNREFUSED"

**Cause :** Impossible de se connecter à MinIO.

**Solution :**
1. Vérifiez que `MINIO_ENDPOINT` est correct (avec `https://`)
2. Testez la connexion : `curl https://console.s3.dsolution-ia.fr`
3. Vérifiez vos credentials MinIO

---

## 📜 Scripts disponibles

### backup-database.js

Sauvegarde complète de PostgreSQL vers MinIO.

**Nouvelles fonctionnalités :**
- ✅ Détection automatique du pooler (port 6543)
- ✅ Conversion automatique vers connexion directe (port 5432)
- ✅ Test de connexion avant backup
- ✅ Messages d'erreur détaillés avec solutions

### backup-storage.js

Synchronisation des fichiers du Storage Supabase vers MinIO.

**Buckets sauvegardés :**
- `avatars`
- `landing_page`

### restore-database.js

Restauration d'un backup PostgreSQL depuis MinIO.

**Usage :**
```bash
# Dernier backup
node restore-database.js

# Backup spécifique
node restore-database.js 2025-11-17T03-00
```

---

## 📊 Structure des backups sur MinIO

```
supabase-backups/
├── database/
│   ├── database_backup_2025-11-17T03-00-00-000Z.sql.gz
│   ├── database_backup_2025-11-16T03-00-00-000Z.sql.gz
│   └── ...
└── storage/
    ├── avatars/
    │   ├── user1.png
    │   └── user2.jpg
    └── landing_page/
        ├── hero.jpg
        └── logo.svg
```

---

## 🔒 Sécurité

- ✅ Utilisation de secrets GitHub Actions
- ✅ Credentials jamais exposés dans les logs
- ⚠️ Backups non chiffrés (à implémenter)
- ⚠️ Pas de checksum d'intégrité (à implémenter)

**Recommandations futures :**
1. Chiffrer les backups avec GPG
2. Calculer des checksums SHA256
3. Implémenter des tests de restauration automatiques

---

## 📞 Support

Pour toute question ou problème :
1. Vérifiez d'abord cette documentation
2. Consultez les logs du workflow GitHub Actions
3. Vérifiez que toutes les variables d'environnement sont correctes

---

## 🗓️ Prochaines améliorations

- [ ] Chiffrement des backups
- [ ] Calcul de checksums
- [ ] Pagination complète (> 1000 fichiers)
- [ ] Tests de restauration automatiques
- [ ] Notifications Slack/Discord
- [ ] Métriques et monitoring
- [ ] Backups incrémentaux
