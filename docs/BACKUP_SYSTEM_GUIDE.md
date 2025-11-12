# 🔄 Système de Backup Automatique Supabase → Minio

## 📋 Vue d'ensemble

Ce système permet de sauvegarder automatiquement :
- ✅ **Base de données PostgreSQL** (structure + données)
- ✅ **Storage Buckets** (avatars, landing_page)
- ✅ **Rotation automatique** (30 jours de rétention)
- ✅ **Exécution quotidienne** (3h du matin UTC via GitHub Actions)

**Destination :** Minio sur Hetzner VPS (`https://console.s3.dsolution-ia.fr`)

---

## 🚀 Installation & Configuration

### Étape 1 : Créer le bucket Minio

1. Connecte-toi à ton Minio : https://console.s3.dsolution-ia.fr
2. Crée un bucket nommé `supabase-backups` (ou autre nom)
3. Note les credentials :
   - Access Key
   - Secret Key
   - Endpoint URL

### Étape 2 : Obtenir l'URL de connexion PostgreSQL Supabase

1. Va sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionne ton projet
3. Settings > Database > Connection string > URI
4. Copie l'URL complète (format : `postgresql://postgres:[password]@[host]:[port]/postgres`)

### Étape 3 : Configurer les secrets GitHub

1. Va sur ton repo GitHub : https://github.com/Tilma972/app-sapeurs-pompiers-clermont
2. Settings > Secrets and variables > Actions
3. Clique **New repository secret** et ajoute les secrets suivants :

| Nom du secret | Valeur | Exemple |
|---------------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase publique | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key Supabase | `eyJhbGciOiJIUzI1...` |
| `SUPABASE_DB_URL` | URL connexion PostgreSQL | `postgresql://postgres:xxx@xxx.supabase.co:5432/postgres` |
| `MINIO_ENDPOINT` | Endpoint Minio | `https://console.s3.dsolution-ia.fr` |
| `MINIO_ACCESS_KEY` | Access key Minio | `minioadmin` |
| `MINIO_SECRET_KEY` | Secret key Minio | `minioadmin` |
| `MINIO_BUCKET` | Nom du bucket | `supabase-backups` |

### Étape 4 : Installer les dépendances npm

```bash
cd scripts/backup
npm install @supabase/supabase-js @aws-sdk/client-s3 dotenv
```

### Étape 5 : Tester localement (optionnel)

Crée un fichier `.env` dans `scripts/backup/` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1...
SUPABASE_DB_URL=postgresql://postgres:xxx@xxx.supabase.co:5432/postgres
MINIO_ENDPOINT=https://console.s3.dsolution-ia.fr
MINIO_ACCESS_KEY=ton_access_key
MINIO_SECRET_KEY=ton_secret_key
MINIO_BUCKET=supabase-backups
```

Lance un test :

```bash
node backup-database.js
node backup-storage.js
```

---

## ⚙️ Fonctionnement automatique

### GitHub Action

Le workflow `.github/workflows/backup-daily.yml` s'exécute :
- **Automatiquement** : Tous les jours à 3h du matin (UTC)
- **Manuellement** : Via l'onglet "Actions" sur GitHub

### Ce qui est sauvegardé

#### 1. Base de données (`backup-database.js`)
- Dump complet PostgreSQL (structure + données)
- Compression gzip (réduction ~70%)
- Nommage : `database_backup_2025-11-12T03-00-00-000Z.sql.gz`
- Emplacement Minio : `supabase-backups/database/`

#### 2. Storage Buckets (`backup-storage.js`)
- Tous les fichiers des buckets `avatars` et `landing_page`
- Upload uniquement des nouveaux fichiers (skip si déjà présent)
- Structure préservée : `supabase-backups/storage/avatars/`, `storage/landing_page/`

### Rotation automatique

- **Rétention :** 30 jours
- **Nettoyage :** Automatique lors de chaque backup
- **Calcul :** Backups > 30 jours sont supprimés

---

## 🔄 Restauration (en cas de catastrophe)

### Restauration base de données

**⚠️ ATTENTION : Cela va ÉCRASER toutes les données actuelles !**

#### Option 1 : Restaurer le dernier backup

```bash
cd scripts/backup

# Définir les variables d'environnement
export SUPABASE_DB_URL="postgresql://postgres:xxx@xxx.supabase.co:5432/postgres"
export MINIO_ENDPOINT="https://console.s3.dsolution-ia.fr"
export MINIO_ACCESS_KEY="ton_access_key"
export MINIO_SECRET_KEY="ton_secret_key"
export MINIO_BUCKET="supabase-backups"

# Lancer la restauration (backup le plus récent)
node restore-database.js
```

#### Option 2 : Restaurer un backup spécifique

```bash
# Liste les backups disponibles
node restore-database.js

# Restaure un backup particulier (remplace la date par celle voulue)
node restore-database.js 2025-11-12T03-00
```

Le script :
1. ✅ Liste tous les backups disponibles
2. ✅ Télécharge le backup choisi
3. ✅ Décompresse le fichier
4. ✅ Demande confirmation avant restauration
5. ✅ Restaure la base de données
6. ✅ Nettoie les fichiers temporaires

### Restauration Storage (manuel)

Si tu as besoin de restaurer des fichiers du Storage :

1. Connecte-toi à Minio : https://console.s3.dsolution-ia.fr
2. Va dans le bucket `supabase-backups`
3. Navigue vers `storage/avatars/` ou `storage/landing_page/`
4. Télécharge les fichiers souhaités
5. Upload manuellement dans Supabase Dashboard > Storage

---

## 📊 Monitoring

### Vérifier si les backups fonctionnent

#### Via GitHub Actions

1. Va sur GitHub : https://github.com/Tilma972/app-sapeurs-pompiers-clermont/actions
2. Clique sur le workflow "🔄 Backup Quotidien Supabase → Minio"
3. Vérifie les exécutions récentes (doivent être ✅ vertes)

#### Via Minio

1. Connecte-toi à Minio
2. Va dans le bucket `supabase-backups`
3. Vérifie les dossiers :
   - `database/` : Doit contenir des fichiers `.sql.gz` datés
   - `storage/avatars/` : Doit contenir les avatars
   - `storage/landing_page/` : Doit contenir les images produits/partenaires

### Déclencher un backup manuel

1. Va sur GitHub Actions
2. Clique sur "🔄 Backup Quotidien Supabase → Minio"
3. Clique sur "Run workflow" (bouton à droite)
4. Sélectionne la branche `main`
5. Clique "Run workflow"

---

## 🧪 Tests recommandés

### Test 1 : Backup complet

```bash
# Teste le backup DB
cd scripts/backup
node backup-database.js

# Vérifie dans Minio : bucket/database/ doit contenir un nouveau fichier

# Teste le backup Storage
node backup-storage.js

# Vérifie dans Minio : bucket/storage/ doit contenir tes fichiers
```

### Test 2 : Restauration (CRITIQ UE)

**⚠️ À faire sur une base de données de TEST, jamais en prod sans backup récent !**

```bash
# Crée d'abord un backup manuel récent
node backup-database.js

# Teste la restauration
node restore-database.js

# Vérifie que les données sont intactes
```

### Test 3 : Rotation des anciens backups

```bash
# Attends 31 jours ou modifie RETENTION_DAYS dans backup-database.js
# Relance un backup
node backup-database.js

# Les backups > 30 jours doivent être supprimés automatiquement
```

---

## 📐 Architecture

```
GitHub Actions (cron 3h du matin)
  ↓
backup-database.js
  ↓
pg_dump → PostgreSQL Supabase
  ↓
Compression gzip
  ↓
Upload Minio S3
  ↓
Rotation (suppression > 30j)

backup-storage.js
  ↓
List files → Supabase Storage
  ↓
Download files
  ↓
Upload Minio S3 (skip si existe)
```

---

## 🔒 Sécurité

### Bonnes pratiques

1. ✅ **Secrets GitHub** : Jamais commiter les credentials dans le code
2. ✅ **Service Role Key** : Utilisé uniquement pour backups (permissions admin)
3. ✅ **Minio HTTPS** : Connexion chiffrée
4. ✅ **Compression** : Les backups sont compressés (gzip)
5. ✅ **Accès Minio** : Restreindre l'accès au bucket (IP whitelist si possible)

### Que faire si credentials compromis ?

#### Minio compromis
1. Révoquer l'access key compromis dans Minio
2. Créer une nouvelle access key
3. Mettre à jour le secret `MINIO_ACCESS_KEY` sur GitHub

#### Supabase compromis
1. Révoquer le service role key dans Supabase Dashboard
2. Générer un nouveau service role key
3. Mettre à jour les secrets GitHub :
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_DB_URL` (si mot de passe changé)

---

## 🆘 Troubleshooting

### Erreur : "pg_dump: command not found"

Le runner GitHub n'a pas PostgreSQL client installé.

**Solution :** Le workflow installe automatiquement `postgresql-client`. Si ça persiste, vérifie les logs GitHub Actions.

### Erreur : "SUPABASE_DB_URL non défini"

Les secrets GitHub ne sont pas configurés.

**Solution :**
1. Va sur GitHub > Settings > Secrets
2. Vérifie que `SUPABASE_DB_URL` existe
3. Vérifie qu'il n'y a pas de typo dans le nom du secret

### Erreur : "Failed to upload to Minio: AccessDenied"

Les credentials Minio sont incorrects ou le bucket n'existe pas.

**Solution :**
1. Vérifie que le bucket `supabase-backups` existe dans Minio
2. Vérifie `MINIO_ACCESS_KEY` et `MINIO_SECRET_KEY`
3. Vérifie les permissions du bucket (doit autoriser write)

### Erreur : "Connection timeout" (Minio)

GitHub Actions ne peut pas accéder à ton Minio.

**Solution :**
1. Vérifie que `MINIO_ENDPOINT` est accessible publiquement (pas localhost)
2. Vérifie le firewall Hetzner (autoriser IP GitHub Actions : difficile, ils utilisent des ranges dynamiques)
3. Alternative : Utiliser un VPN ou un jump server

### Backup trop lent

Le backup prend > 10 minutes (timeout GitHub Actions).

**Solution :**
1. Augmenter le timeout dans `.github/workflows/backup-daily.yml` :
   ```yaml
   jobs:
     backup-database:
       timeout-minutes: 30  # Au lieu de 10 par défaut
   ```
2. Optimiser le backup (exclure tables temporaires si besoin)

### Backup échoue chaque nuit mais fonctionne manuellement

Les secrets GitHub ne sont peut-être pas accessibles au cron.

**Solution :**
1. Vérifie que les secrets sont bien au niveau **Repository** (pas Environment)
2. Vérifie les permissions du workflow dans Settings > Actions > General

---

## 💰 Coûts

### Stockage Minio (Hetzner)

- **Ton VPS** : Déjà payé, 0€ additionnel
- **Stockage estimé** :
  - Base de données : ~50 MB compressé/jour × 30 jours = 1.5 GB
  - Storage : ~500 MB (images) × 1 = 500 MB
  - **Total : ~2 GB** (largement dans ton espace VPS)

### GitHub Actions

- **Free tier** : 2000 minutes/mois (repos publics illimité)
- **Backup quotidien** : ~5 min/jour × 30 jours = 150 min/mois
- **Coût** : **0€** (largement dans le free tier)

### Bande passante

- **Upload quotidien** : ~50 MB/jour
- **Mois** : ~1.5 GB/mois
- **Coût Hetzner** : Inclus dans ton VPS (20 TB gratuits généralement)

**TOTAL : 0€/mois** 🎉

---

## 📚 Ressources

### Documentation officielle

- [Supabase Database Backups](https://supabase.com/docs/guides/platform/backups)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Minio AWS SDK Compatibility](https://min.io/docs/minio/linux/developers/javascript/minio-javascript.html)
- [pg_dump Documentation](https://www.postgresql.org/docs/current/app-pgdump.html)

### Scripts

- `backup-database.js` : Backup PostgreSQL → Minio
- `backup-storage.js` : Backup Storage Buckets → Minio
- `restore-database.js` : Restauration PostgreSQL depuis Minio
- `.github/workflows/backup-daily.yml` : GitHub Action automatique

---

## ✅ Checklist post-installation

- [ ] Secrets GitHub configurés (7 secrets)
- [ ] Bucket Minio `supabase-backups` créé
- [ ] Test backup database manuel réussi
- [ ] Test backup storage manuel réussi
- [ ] Test restauration database réussi (sur base test)
- [ ] GitHub Action s'exécute automatiquement (vérifier après 24h)
- [ ] Vérification Minio : fichiers présents dans `database/` et `storage/`
- [ ] Documentation lue et comprise
- [ ] Procédure de restauration d'urgence testée

---

## 🚨 Procédure d'urgence (Disaster Recovery)

### Scénario : Perte totale base de données

**Temps de restauration estimé : 15 minutes**

1. **Garder son calme** 🧘
2. **Identifier le problème** : Vérifier que c'est bien une perte de données et pas une erreur de connexion
3. **Aller sur Minio** : https://console.s3.dsolution-ia.fr
4. **Vérifier les backups** : S'assurer qu'un backup récent existe (`database/database_backup_XXX.sql.gz`)
5. **Cloner le repo** (si pas déjà fait) :
   ```bash
   git clone https://github.com/Tilma972/app-sapeurs-pompiers-clermont.git
   cd app-sapeurs-pompiers-clermont
   ```
6. **Configurer les variables d'environnement** (créer `.env` dans `scripts/backup/`)
7. **Lancer la restauration** :
   ```bash
   cd scripts/backup
   node restore-database.js
   ```
8. **Confirmer la restauration** quand demandé
9. **Vérifier l'intégrité** : Se connecter à l'app et vérifier que les données sont OK
10. **Documenter l'incident** : Noter ce qui s'est passé pour éviter que ça se reproduise

### Contacts d'urgence

- **Supabase Support** : https://supabase.com/dashboard/support
- **Hetzner Support** : https://www.hetzner.com/support

---

**Document créé le : 12 novembre 2025**
**Dernière mise à jour : 12 novembre 2025**
**Version : 1.0**

Pour toute question ou amélioration de ce système, ouvre une issue sur GitHub ou contacte le mainteneur.
