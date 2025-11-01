export const logger = {
  debug: (...args: any[]) => {
    if (import.meta.env.DEV) console.debug(...args);
  },
  info: (...args: any[]) => {
    if (import.meta.env.DEV) console.info(...args);
  },
  warn: (...args: any[]) => {
    if (import.meta.env.DEV) console.warn(...args);
  },
  error: (...args: any[]) => {
    // Keep minimal production surface - send to external logger here if configured
    if (import.meta.env.DEV) console.error(...args);
  },
};
