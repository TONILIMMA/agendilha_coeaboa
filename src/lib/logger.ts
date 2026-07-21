/**
 * Lightweight logger. In production, only warnings and errors reach the console.
 * Use this instead of raw `console.*` so we can later plug in Sentry-lite
 * or a remote log sink without touching call sites.
 */
const isDev = import.meta.env.DEV;

type LogArgs = unknown[];

export const logger = {
  debug: (...args: LogArgs) => {
    if (isDev) console.debug(...args);
  },
  info: (...args: LogArgs) => {
    if (isDev) console.info(...args);
  },
  warn: (...args: LogArgs) => {
    console.warn(...args);
  },
  error: (...args: LogArgs) => {
    console.error(...args);
  },
};

export type Logger = typeof logger;