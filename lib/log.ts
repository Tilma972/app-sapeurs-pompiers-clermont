type LogLevel = 'debug' | 'info' | 'warn' | 'error';

function format(scope: string, level: LogLevel, msg: string, meta?: unknown) {
  const base = `[${new Date().toISOString()}] [${level.toUpperCase()}] [${scope}] ${msg}`;
  if (meta === undefined) return base;
  try {
    return `${base} | ${JSON.stringify(meta)}`;
  } catch {
    return base;
  }
}

export function createLogger(scope: string) {
  return {
    debug: (msg: string, meta?: unknown) => console.debug(format(scope, 'debug', msg, meta)),
    info: (msg: string, meta?: unknown) => console.info(format(scope, 'info', msg, meta)),
    warn: (msg: string, meta?: unknown) => console.warn(format(scope, 'warn', msg, meta)),
    error: (msg: string, meta?: unknown) => console.error(format(scope, 'error', msg, meta)),
  };
}
