#!/usr/bin/env pwsh
# ============================================================
# new-migration.ps1 — Crée une migration Supabase avec le bon format
#
# Usage :
#   .\scripts\new-migration.ps1 add_column_to_profiles
#   .\scripts\new-migration.ps1 "fix RLS on support_transactions"
#
# Génère : supabase/migrations/20260304153042_add_column_to_profiles.sql
# Format : YYYYMMDDHHmmss_slug.sql  (14 chiffres → unicité garantie)
# ============================================================

param (
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Name
)

# 1. Normaliser le nom : minuscules, espaces/tirets → underscores, caractères invalides supprimés
$slug = $Name.ToLower() `
    -replace '\s+', '_' `
    -replace '-', '_' `
    -replace '[^a-z0-9_]', '' `
    -replace '__+', '_' `
    -replace '^_|_$', ''

if (-not $slug) {
    Write-Error "Nom invalide apres normalisation : '$Name'"
    exit 1
}

# 2. Timestamp au format YYYYMMDDHHmmss (heure locale)
$ts = Get-Date -Format "yyyyMMddHHmmss"

# 3. Vérifier qu'aucune migration n'a déjà ce prefix exact
$migrationsDir = Join-Path $PSScriptRoot ".." "supabase" "migrations"
$migrationsDir = Resolve-Path $migrationsDir

$existing = Get-ChildItem $migrationsDir -Filter "${ts}_*.sql" -ErrorAction SilentlyContinue
if ($existing) {
    # Attendre 1 seconde pour avoir un timestamp différent
    Write-Warning "Timestamp $ts déjà utilisé — attente 1s..."
    Start-Sleep -Seconds 1
    $ts = Get-Date -Format "yyyyMMddHHmmss"
}

# 4. Créer le fichier
$filename = "${ts}_${slug}.sql"
$filepath = Join-Path $migrationsDir $filename

$header = @"
-- ============================================================
-- Migration : $slug
-- Date      : $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
-- ============================================================


"@

Set-Content -Path $filepath -Value $header -Encoding UTF8

Write-Host ""
Write-Host "Migration créée :" -ForegroundColor Green
Write-Host "  $filepath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ouvrir dans VS Code :"
Write-Host "  code `"$filepath`"" -ForegroundColor DarkGray
