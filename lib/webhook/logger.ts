type Context = Record<string, unknown>;

function write(level: "debug" | "info" | "warn" | "error", message: string, context: Context = {}) {
  if (level === "debug" && process.env.NODE_ENV === "production") return;
  const record = { timestamp: new Date().toISOString(), level, message, ...context };
  console[level](JSON.stringify(record));
}

export const logger = {
  debug: (message: string, context?: Context) => write("debug", message, context),
  info: (message: string, context?: Context) => write("info", message, context),
  warn: (message: string, context?: Context) => write("warn", message, context),
  error: (message: string, error?: unknown, context?: Context) => write("error", message, { ...context, error: error instanceof Error ? error.message : String(error) }),
};
