# Design System - Amicale des Sapeurs-Pompiers

## INSTRUCTIONS CURSOR - MODERNISATION OBLIGATOIRE

**AVANT TOUTE CRÉATION/MODIFICATION** : Consulte TOUJOURS ce fichier. Applique systématiquement ces patterns.

### Règles non-négociables
1. **ABANDONNE** les layouts sidebar/inset traditionnels
2. **UTILISE** exclusivement l'architecture cards-based moderne 
3. **APPLIQUE** les espacements généreux (space-y-8, p-6/p-8)
4. **CRÉE** des composants métier spécialisés (pas de composants génériques)
5. **SUIS** le pattern du dashboard réussi existant

## Vue d'ensemble
Interface moderne cards-based avec respiration maximum. Fini les layouts cramped de 2019. Architecture mobile-first avec navigation contextuelle.

## Palette de couleurs

### Couleurs primaires (cards thématiques)
- **Bleu** : `bg-blue-500` / `text-blue-600` - Tournées & Calendriers
- **Vert** : `bg-green-500` / `text-green-600` - Petites Annonces / Actions positives
- **Violet** : `bg-purple-500` / `text-purple-600` - Galerie / Contenu média
- **Orange** : `bg-orange-500` / `text-orange-600` - Annonces & Communications
- **Teal** : `bg-teal-500` / `text-teal-600` - Profil & Personnel
- **Rouge** : `bg-red-500` / `text-red-600` - Partenaires & Important

### Couleurs neutres
- **Backgrounds** : `bg-gray-50` (principal), `bg-white` (cards)
- **Textes** : `text-gray-900` (titres), `text-gray-600` (contenu), `text-gray-500` (métadonnées)
- **Borders** : `border-gray-200` (subtil), `border-gray-300` (visible)

### États et feedbacks
- **Succès** : `bg-green-50` + `text-green-600`
- **Attention** : `bg-yellow-50` + `text-yellow-600`  
- **Erreur** : `bg-red-50` + `text-red-600`
- **Info** : `bg-blue-50` + `text-blue-600`

## Composants principaux

### Cards (pattern principal)
```tsx
// Card thématique standard
<Card className="bg-blue-50 border-0 shadow-sm">
  <CardContent className="p-6">
    <div className="flex items-center space-x-4 mb-4">
      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>
    </div>
    {/* Métriques */}
    <div className="space-y-3">
      <div>
        <div className="text-2xl font-bold text-blue-600">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  </CardContent>
</Card>
```

### Métriques (pattern dashboard)
```tsx
// Métrique avec évolution
<div className="text-center">
  <div className="text-3xl font-bold text-blue-600 mb-1">
    {value} <span className="text-sm text-green-500 font-normal">+{change}%</span>
  </div>
  <div className="text-sm text-gray-600">{label}</div>
</div>
```

### Boutons (hiérarchie claire)
```tsx
// Bouton principal (actions importantes)
<Button className="w-full h-12 text-base font-semibold bg-green-600 hover:bg-green-700 text-white shadow-sm">

// Bouton secondaire  
<Button variant="outline" className="h-10 text-sm">

// Bouton subtil
<Button variant="ghost" size="sm" className="h-8 text-xs">
```

## Architecture moderne (OBLIGATOIRE)

### NOUVELLE structure de page (remplace sidebar/inset)
```tsx
<div className="min-h-screen bg-gray-50">
  {/* Header moderne avec navigation contextuelle */}
  <header className="bg-white shadow-sm border-b">
    <div className="max-w-7xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{pageTitle}</h1>
            <p className="text-sm text-gray-500">{breadcrumb}</p>
          </div>
        </div>
        {/* Actions contextuelles ici */}
      </div>
    </div>
  </header>

  {/* Main content avec MAXIMUM de respiration */}
  <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
    {/* Cards avec espacement GÉNÉREUX */}
  </main>
</div>
```

### Grilles modernes (espacement généreux)
```tsx
// Grille principale - TOUJOURS gap-8 minimum
<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

// Grille métriques - espacement visible
<div className="grid grid-cols-2 md:grid-cols-3 gap-6">

// Grille détails - dans les cards
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
```

## Règles de composition

### DO ✅
- Utiliser les cards thématiques colorées comme sur le dashboard
- Maintenir la hiérarchie : titre (text-xl font-bold) > sous-titre (text-sm text-gray-600) > contenu
- Espacements réguliers : `space-y-6` entre sections, `space-y-3` dans sections
- Icônes rondes colorées pour identifier les sections
- Métriques importantes en gros (text-2xl ou text-3xl font-bold)
- Évolutions/changements en petites couleurs (text-sm text-green/red-500)

### DON'T ❌ (PATTERNS OBSOLÈTES À ÉVITER)
- **SidebarProvider / SidebarInset** - Architecture 2019, cramped et rigide
- **DataTable génériques** - Utilise des composants métier spécialisés
- **gap-2, gap-4** - Trop serré, utilise gap-6/gap-8 minimum
- **px-4 py-6** - Trop petit, utilise px-4 py-8 ou plus
- **Composants génériques** (`<SectionCards />`, `<ChartAreaInteractive />`)
- **Noir pur** (`bg-black`) - utiliser `bg-gray-900` maximum
- **Boutons disproportionnés** (max h-12 sauf cas exceptionnel)
- **Mélange de styles** - suivre le pattern cards exclusivement
- **@container queries** sans bénéfice visible
- **Layouts empilés sans respiration**

## INSTRUCTIONS CONCRÈTES POUR CURSOR

### 1. Refactoring immédiat des pages existantes
```
PRIORITÉ 1 - Remplacer l'architecture obsolète:
- Supprimer TOUT usage de SidebarProvider/SidebarInset
- Appliquer la nouvelle structure header + main + cards
- Espacements: py-8 space-y-8 gap-8 (MINIMUM)
- Container: max-w-7xl mx-auto px-4

PRIORITÉ 2 - Composants métier spécialisés:
- Remplacer <DataTable> par <TourneesDataView>
- Remplacer <SectionCards> par <MetricsOverview>  
- Remplacer <ChartAreaInteractive> par <TourneesChart>
- Chaque composant doit être contextuel au métier SP
```

### 2. Pattern obligatoire pour TOUTES nouvelles pages
```tsx
// Template OBLIGATOIRE - copie exacte
export default function PageName() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="p-2">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Titre Page</h1>
                <p className="text-sm text-gray-500">Contexte/breadcrumb</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Cards avec thématiques colorées */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="bg-blue-50 border-0 shadow-sm">
            <CardContent className="p-8">
              {/* Contenu avec icône thématique */}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
```

### 3. Directive de recherche moderne
```
Quand tu crées un nouveau composant ou layout:
1. Recherche "modern dashboard design 2024" via web_search
2. Analyse les patterns contemporains (cards, spacing, colors)
3. Applique ces insights au contexte Sapeurs-Pompiers
4. Privilégie TOUJOURS l'espace et la respiration
5. Utilise les couleurs thématiques définies dans ce design system
```

### 4. Checklist validation (OBLIGATOIRE avant commit)
```
✅ Aucun SidebarProvider/SidebarInset dans le code
✅ max-w-7xl mx-auto pour le container principal  
✅ py-8 space-y-8 pour les espacements principaux
✅ gap-8 minimum dans les grilles
✅ Cards thématiques colorées (bg-blue-50, bg-green-50, etc.)
✅ Composants nommés selon le métier (Tournees*, Sapeurs*, etc.)
✅ Mobile-first responsive avec breakpoints intelligents
✅ Header moderne avec navigation contextuelle
✅ Padding généreux dans les cards (p-6 minimum, p-8 idéal)
```