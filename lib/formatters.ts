/**
 * Formatters centralisés pour l'affichage de données
 * Utilise l'API Intl pour la localisation française
 */

// ============================
// FORMATAGE DES NOMBRES
// ============================

/**
 * Formatte un nombre entier au format français
 * @example formatNumber(1234) → "1 234"
 */
export function formatNumber(value: number | null | undefined): string {
  if (value == null) return "0";
  return new Intl.NumberFormat("fr-FR").format(value);
}

/**
 * Formatte un montant en euros avec centimes
 * @example formatCurrency(1234.56) → "1 234,56 €"
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "0,00 €";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

/**
 * Formatte un montant en euros sans centimes (arrondi)
 * @example formatCurrencyRounded(1234.56) → "1 235 €"
 */
export function formatCurrencyRounded(value: number | null | undefined): string {
  if (value == null) return "0 €";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formatte un pourcentage
 * @example formatPercent(0.75) → "75 %"
 * @example formatPercent(75, true) → "75 %"
 */
export function formatPercent(
  value: number | null | undefined,
  isAlreadyPercentage = false
): string {
  if (value == null) return "0 %";
  const percentage = isAlreadyPercentage ? value : value * 100;
  return new Intl.NumberFormat("fr-FR", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(isAlreadyPercentage ? percentage / 100 : value);
}

// ============================
// FORMATAGE DES DATES
// ============================

/**
 * Formatte une date au format court français
 * @example formatDate("2024-01-15") → "15/01/2024"
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR").format(d);
}

/**
 * Formatte une date au format long français
 * @example formatDateLong("2024-01-15") → "15 janvier 2024"
 */
export function formatDateLong(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(d);
}

/**
 * Formatte une date au format moyen français
 * @example formatDateMedium("2024-01-15") → "15 janv. 2024"
 */
export function formatDateMedium(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * Formatte une date et heure
 * @example formatDateTime("2024-01-15T14:30:00") → "15/01/2024 à 14:30"
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Formatte une date relative (il y a X jours)
 * @example formatRelativeDate("2024-01-01") → "Il y a 3 jours"
 */
export function formatRelativeDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine${Math.floor(diffDays / 7) > 1 ? "s" : ""}`;
  if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
  return `Il y a ${Math.floor(diffDays / 365)} an${Math.floor(diffDays / 365) > 1 ? "s" : ""}`;
}

// ============================
// FORMATAGE DE TEXTE
// ============================

/**
 * Tronque un texte avec ellipse
 * @example truncate("Texte très long", 10) → "Texte très..."
 */
export function truncate(text: string | null | undefined, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/**
 * Capitalise la première lettre
 * @example capitalize("bonjour") → "Bonjour"
 */
export function capitalize(text: string | null | undefined): string {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Pluralise un mot selon le nombre
 * @example pluralize(1, "calendrier") → "1 calendrier"
 * @example pluralize(5, "calendrier") → "5 calendriers"
 */
export function pluralize(
  count: number,
  singular: string,
  plural?: string
): string {
  const word = count > 1 ? (plural || singular + "s") : singular;
  return `${count} ${word}`;
}
