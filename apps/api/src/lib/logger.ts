// Tiny structured-ish logger. Swap for pino/winston later.
type Level = 'info' | 'warn' | 'error' | 'debug';

function log(level: Level, msg: string, meta?: Record<string, unknown>) {
  const ts = new Date().toISOString();
  const base = `${ts} ${level.toUpperCase()} ${msg}`;
  if (meta && Object.keys(meta).length) console[level === 'debug' ? 'log' : level](base, meta);
  else console[level === 'debug' ? 'log' : level](base);
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => log('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log('error', msg, meta),
  debug: (msg: string, meta?: Record<string, unknown>) => log('debug', msg, meta),
};
