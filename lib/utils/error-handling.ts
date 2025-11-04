/**
 * Utilitaires pour la gestion d'erreur
 * Logging, formatage, et retry logic
 */

/**
 * Types d'erreurs personnalisés
 */
export class DatabaseError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Log une erreur avec contexte
 */
export function logError(
  error: unknown,
  context: {
    component?: string;
    action?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  }
): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error('[Error]', {
    message: errorMessage,
    stack: errorStack,
    timestamp: new Date().toISOString(),
    ...context,
  });

  // TODO: Intégrer un service de monitoring (Sentry, LogRocket, etc.)
  // if (process.env.NODE_ENV === 'production') {
  //   sendToMonitoring({ error, context });
  // }
}

/**
 * Formatte un message d'erreur user-friendly
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof ValidationError) {
    return error.field 
      ? `Erreur de validation pour le champ "${error.field}": ${error.message}`
      : `Erreur de validation: ${error.message}`;
  }

  if (error instanceof AuthError) {
    return "Erreur d'authentification. Veuillez vous reconnecter.";
  }

  if (error instanceof DatabaseError) {
    return "Erreur lors de l'accès aux données. Veuillez réessayer.";
  }

  if (error instanceof Error) {
    // Messages d'erreur Supabase spécifiques
    if (error.message.includes('JWT')) {
      return "Votre session a expiré. Veuillez vous reconnecter.";
    }
    if (error.message.includes('network')) {
      return "Problème de connexion réseau. Vérifiez votre connexion.";
    }
    if (error.message.includes('permission')) {
      return "Vous n'avez pas les permissions nécessaires.";
    }
  }

  return "Une erreur inattendue s'est produite. Veuillez réessayer.";
}

/**
 * Wrapper pour exécuter une fonction avec gestion d'erreur
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  options: {
    context: {
      component: string;
      action: string;
    };
    fallback?: T;
    onError?: (error: unknown) => void;
  }
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    logError(error, options.context);
    
    if (options.onError) {
      options.onError(error);
    }

    return options.fallback ?? null;
  }
}

/**
 * Retry logic avec backoff exponentiel
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
  } = options;

  let lastError: unknown;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        // Attendre avant de réessayer
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffMultiplier, maxDelay);
      }
    }
  }

  throw lastError;
}

/**
 * Vérifie si une erreur est récupérable (worth retrying)
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('fetch failed') ||
      message.includes('econnrefused')
    );
  }
  return false;
}
