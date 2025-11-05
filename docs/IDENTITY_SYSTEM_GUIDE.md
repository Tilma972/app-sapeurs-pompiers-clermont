# Guide d'implémentation - Système d'identité progressive

## 📋 Vue d'ensemble

Ce système permet de gérer deux types d'informations :
- **Nom d'affichage** (pseudo) : `display_name` / `full_name` (legacy)
- **Identité réelle** : `first_name` + `last_name` (vérifiée par admin)

## ✅ Fichiers créés

### 1. Migration SQL
📁 `supabase/migrations/20250105_add_identity_fields.sql`
- Ajoute les colonnes `first_name`, `last_name`, `display_name`
- Ajoute `identity_verified`, `verification_date`, `verification_method`
- Migre les données existantes (`full_name` → `display_name`)
- Crée une vue `profiles_with_identity`
- Crée une fonction `get_display_name()`

### 2. Helpers TypeScript
📁 `lib/utils/profile-helpers.ts`
- `getDisplayName()` - Obtient le nom à afficher avec fallbacks
- `getLegalName()` - Obtient l'identité légale (first_name + last_name)
- `getInitials()` - Obtient les initiales
- `hasCompleteIdentity()` - Vérifie si first_name + last_name fournis
- `hasVerifiedIdentity()` - Vérifie si identité vérifiée par admin
- `canAccessPartnerOffers()` - Vérifie accès offres partenaires
- `canReceiveOfficialDocuments()` - Vérifie réception documents
- `getVerificationStatus()` - Statut formaté (none/pending/verified)
- `needsIdentityCompletion()` - Vérifie si complétion requise

### 3. Composant de complétion
📁 `components/profile/complete-identity-form.tsx`
- Formulaire pour `first_name`, `last_name`, `display_name`
- 3 états : Non fourni / En attente / Vérifié
- Messages contextuels selon le statut
- Validation et soumission

### 4. Composant d'alerte
📁 `components/profile/identity-required-alert.tsx`
- Alerte contextuelle pour fonctionnalités nécessitant identité
- Bouton vers formulaire de complétion
- Adapté selon le statut (manquant / en attente)

### 5. Server Actions
📁 `app/actions/profile/complete-identity.ts`
- `completeIdentity()` - Enregistre first_name + last_name
- `verifyUserIdentity()` - Admin vérifie une identité
- `revokeIdentityVerification()` - Admin révoque une vérification

## 🚀 Étapes d'installation

### Étape 1 : Exécuter la migration SQL
```sql
-- Dans Supabase SQL Editor, exécuter:
-- supabase/migrations/20250105_add_identity_fields.sql
```

### Étape 2 : Mettre à jour les requêtes profiles
Partout où vous récupérez un profil, ajouter les nouveaux champs :

```typescript
// AVANT
const { data: profile } = await supabase
  .from("profiles")
  .select("id, email, full_name, role")
  .eq("id", user.id)
  .single()

// APRÈS (ajouter les nouveaux champs)
const { data: profile } = await supabase
  .from("profiles")
  .select(`
    id, email, role,
    full_name,
    display_name, first_name, last_name,
    identity_verified, verification_date, verification_method
  `)
  .eq("id", user.id)
  .single()
```

### Étape 3 : Adapter l'affichage des noms
Remplacer progressivement les références à `full_name` :

```typescript
// AVANT
<span>{profile.full_name}</span>

// APRÈS
import { getDisplayName } from "@/lib/utils/profile-helpers"
<span>{getDisplayName(profile)}</span>
```

### Étape 4 : Ajouter le formulaire au profil utilisateur

Exemple dans `app/(pwa)/profil/page.tsx` :

```typescript
import { CompleteIdentityForm } from "@/components/profile/complete-identity-form"

export default async function ProfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, display_name, first_name, last_name, identity_verified")
    .eq("id", user.id)
    .single()

  return (
    <div>
      <h1>Mon Profil</h1>
      
      {/* Formulaire d'identité */}
      <CompleteIdentityForm 
        profile={profile} 
        onSuccess={() => window.location.reload()} 
      />
      
      {/* Autres sections du profil */}
    </div>
  )
}
```

### Étape 5 : Protéger les offres partenaires

Exemple dans `app/(pwa)/avantages/page.tsx` :

```typescript
import { canAccessPartnerOffers } from "@/lib/utils/profile-helpers"
import { IdentityRequiredAlert } from "@/components/profile/identity-required-alert"

export default async function AvantagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, first_name, last_name, identity_verified")
    .eq("id", user.id)
    .single()

  // Vérifier l'accès
  if (!canAccessPartnerOffers(profile)) {
    return (
      <div>
        <h1>Avantages Partenaires</h1>
        <IdentityRequiredAlert profile={profile} feature="partner_offers" />
      </div>
    )
  }

  // Afficher les offres
  return (
    <div>
      <h1>Avantages Partenaires</h1>
      {/* Liste des offres */}
    </div>
  )
}
```

### Étape 6 : Améliorer le dashboard admin

Exemple dans `app/dashboard/admin/pending/page.tsx` :

```typescript
import { getDisplayName, getLegalName, getVerificationStatus } from "@/lib/utils/profile-helpers"
import { verifyUserIdentity } from "@/app/actions/profile/complete-identity"

export default async function PendingApprovalsPage() {
  const supabase = await createClient()
  
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*, display_name, first_name, last_name, identity_verified")
    .eq("is_active", false)
    .order("created_at", { ascending: false })

  return (
    <div>
      <h1>Inscriptions en attente</h1>
      
      {profiles?.map(profile => {
        const status = getVerificationStatus(profile)
        const legalName = getLegalName(profile)
        
        return (
          <Card key={profile.id}>
            <CardHeader>
              <CardTitle>{getDisplayName(profile)}</CardTitle>
              <Badge className={status.color}>
                {status.icon} {status.label}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>Email:</strong> {profile.email}</p>
                
                {legalName ? (
                  <p><strong>Identité:</strong> {legalName}</p>
                ) : (
                  <Badge variant="warning">Identité non fournie</Badge>
                )}
                
                <div className="flex gap-2">
                  <Button onClick={async () => {
                    await verifyUserIdentity(profile.id)
                  }}>
                    Vérifier l'identité
                  </Button>
                  
                  <Button onClick={async () => {
                    // Approuver le compte
                  }}>
                    Approuver
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
```

## 📊 Exemples d'utilisation

### Afficher le nom selon le contexte

```typescript
// Affichage public (utilise le pseudo si défini)
<span>{getDisplayName(profile)}</span>
// → "JeanD" ou "Jean Dupont"

// Document officiel (identité réelle)
const legalName = getLegalName(profile)
if (legalName) {
  <span>M./Mme {legalName}</span>
  // → "M./Mme Jean Dupont"
}
```

### Vérifier les permissions

```typescript
// Vérifier accès offres
if (canAccessPartnerOffers(profile)) {
  // Afficher les offres
} else {
  <IdentityRequiredAlert profile={profile} feature="partner_offers" />
}

// Vérifier documents officiels
if (canReceiveOfficialDocuments(profile)) {
  // Générer le reçu fiscal
} else {
  <Alert>Identité vérifiée requise pour recevoir des reçus</Alert>
}
```

### Afficher le statut

```typescript
const status = getVerificationStatus(profile)

<Badge className={status.color}>
  {status.icon} {status.label}
</Badge>

// Résultat selon le cas:
// ❌ Non renseigné (gray)
// ⚠️ Identité non fournie (orange)
// ⏳ En attente de vérification (yellow)
// ✓ Identité vérifiée (green)
```

## 🔒 Sécurité

### RLS Policies recommandées

```sql
-- Les utilisateurs peuvent voir leur propre identité
CREATE POLICY "Users can view own identity"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Les utilisateurs peuvent mettre à jour leur identité (mais pas verification)
CREATE POLICY "Users can update own identity"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND old.identity_verified = new.identity_verified  -- Empêche auto-vérification
    AND old.verification_date = new.verification_date
    AND old.verification_method = new.verification_method
  );

-- Seuls les admins peuvent vérifier les identités
-- (déjà géré dans les server actions avec vérification du role)
```

## 📝 Checklist de déploiement

- [ ] Exécuter la migration SQL dans Supabase
- [ ] Vérifier que les colonnes sont créées
- [ ] Tester le formulaire de complétion d'identité
- [ ] Adapter le dashboard admin pour afficher les identités
- [ ] Protéger les offres partenaires avec `canAccessPartnerOffers()`
- [ ] Adapter progressivement les affichages avec `getDisplayName()`
- [ ] Tester le workflow complet : inscription → complétion → vérification admin
- [ ] Documenter le processus pour les admins

## 🎯 Migration progressive

### Phase 1 : Préparation (Immédiat)
- ✅ Exécuter la migration SQL
- ✅ Les helpers sont prêts
- ✅ Les composants sont disponibles

### Phase 2 : Nouvelles inscriptions (1 semaine)
- Ajouter le formulaire au profil utilisateur
- Les nouveaux utilisateurs peuvent compléter leur identité
- Les admins peuvent vérifier les identités

### Phase 3 : Utilisateurs existants (1 mois)
- Bannière invitant à compléter l'identité
- Email de notification
- Incitation avec accès aux offres partenaires

### Phase 4 : Fonctionnalités protégées (2 mois)
- Offres partenaires réservées aux identités vérifiées
- Documents officiels nécessitent identité
- Full_name devient display_name partout

## 🆘 Support

### Questions fréquentes

**Q: Que deviennent les `full_name` existants ?**
R: Ils sont copiés dans `display_name` automatiquement et continuent de fonctionner.

**Q: Comment forcer les utilisateurs à compléter leur identité ?**
R: Bloquer l'accès à certaines fonctionnalités avec `IdentityRequiredAlert`.

**Q: Peut-on migrer automatiquement les identités ?**
R: Oui si `full_name` = "Prénom Nom", utiliser un script de parsing. Sinon demander confirmation manuelle.

**Q: Les admins doivent-ils vérifier toutes les identités ?**
R: Oui, pour garantir l'authenticité. Mais vous pouvez marquer les membres existants comme "legacy verified".
