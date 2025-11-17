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

Supabase propose 3 types de connexion :

| Type | Port | Format | Compatible `pg_dump` | Réseau |
|------|------|--------|---------------------|--------|
| **Direct connection** | 5432 | `db.xxx.supabase.co:5432` | ✅ OUI | IPv6 |
| **Session pooler** | 5432 | `aws-x-region.pooler.supabase.com:5432` | ✅ OUI | IPv4 |
| **Transaction pooler** | 6543 | `aws-x-region.pooler.supabase.com:6543` | ❌ NON | IPv4 |

**Pour GitHub Actions, utilisez le Session pooler** (IPv4 compatible, port 5432)

#### Comment obtenir la bonne URL de connexion :

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Cliquez sur **Connect**
4. Dans la section **Connection string** :
   - **Type** : URI
   - **Source** : Primary database
   - **Method** : **Session pooler** (recommandé pour GitHub Actions - IPv4)
   - OU **Direct connection** (si votre environnement supporte IPv6)
   - ❌ **PAS Transaction pooler**

5. Copiez l'URL qui ressemble à :

**Session pooler (recommandé pour GitHub Actions) :**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-eu-west-3.pooler.supabase.com:5432/postgres
```

**Direct connection (si IPv6 disponible) :**
```
postgresql://postgres:[PASSWORD]@db.abcdefghijklmnopqrst.supabase.co:5432/postgres
```

**Points clés :**
- Port **5432** (pas 6543)
- Le script convertit automatiquement 6543 → 5432 si vous vous trompez
- GitHub Actions utilise IPv4, donc **Session pooler** est préférable

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
| `SUPABASE_DB_URL` | **Session pooler (port 5432) - IPv4 compatible** | `postgresql://postgres.xxx:pwd@aws-0-eu-west-3.pooler.supabase.com:5432/postgres` |
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

**Cause :** Vous utilisez l'URL du **Transaction pooler** (port 6543) au lieu du **Session pooler** ou **Direct connection**.

**Solution automatique :** Le script détecte maintenant ce problème et convertit automatiquement le port 6543 en 5432.

**Solution manuelle (recommandée) :**
1. Allez dans Supabase Dashboard → Cliquez **"Connect"**
2. Configurez :
   - **Type** : URI
   - **Source** : Primary database
   - **Method** : **"Session pooler"** (recommandé pour GitHub Actions - IPv4)
3. Copiez l'URL (format : `postgresql://postgres.xxx:pwd@aws-x-region.pooler.supabase.com:5432/postgres`)
4. Mettez à jour votre secret GitHub `SUPABASE_DB_URL`

**Important :** Le Session pooler est préférable pour GitHub Actions car il est IPv4 compatible.

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

**Cause :** Le mot de passe dans `SUPABASE_DB_URL` est incorrect ou mal encodé.

**Problème fréquent :** Les mots de passe Supabase contiennent souvent des caractères spéciaux (`#`, `@`, `$`, `%`, etc.) qui doivent être **encodés en URL**.

**Solution 1 - Utiliser l'URL pré-encodée (RECOMMANDÉ) :**

1. Dashboard Supabase → Cliquez **"Connect"**
2. **Type** : URI, **Source** : Primary database, **Method** : Session pooler
3. **Copiez l'URL COMPLÈTE** affichée (le mot de passe est déjà encodé)
4. Mettez à jour le secret GitHub `SUPABASE_DB_URL` avec cette URL

**Solution 2 - Utiliser l'outil d'encodage :**

```bash
cd scripts/backup
npm run encode-password
```

Cet outil vous guidera pour générer l'URL correcte avec le mot de passe encodé.

**Exemples d'encodage :**
- `MyP@ssw#rd$` → `MyP%40ssw%23rd%24`
- `Pass!word&123` → `Pass%21word%26123`
- `Secret#Key@2024` → `Secret%23Key%402024`

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

### encode-password.js

**Outil interactif pour générer l'URL de connexion PostgreSQL avec le mot de passe correctement encodé.**

**Pourquoi cet outil ?**
Les mots de passe Supabase contiennent souvent des caractères spéciaux qui doivent être encodés en URL. Cet outil simplifie ce processus.

**Usage :**
```bash
npm run encode-password
```

**L'outil vous demandera :**
1. Votre PROJECT-REF (ex: `npyfregghvnmqxwgkfea`)
2. Votre région (ex: `eu-west-3`)
3. Votre mot de passe de base de données

**Il générera :**
- L'URL Session pooler (recommandée pour GitHub Actions)
- L'URL Direct connection (si IPv6 disponible)
- La liste des caractères encodés

**Exemple de sortie :**
```
✅ URLs générées:

📍 SESSION POOLER (recommandé pour GitHub Actions - IPv4):
postgresql://postgres.abc123:MyP%40ss%23word@aws-0-eu-west-3.pooler.supabase.com:5432/postgres

💡 Informations:
   Mot de passe original: MyP@ss#word
   Mot de passe encodé: MyP%40ss%23word

   Caractères encodés:
   "@" → "%40"
   "#" → "%23"
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
