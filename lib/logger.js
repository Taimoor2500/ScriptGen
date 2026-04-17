/**
 * Minimal structured logger. Emits single-line JSON to stdout/stderr so it's
 * trivially parseable in Vercel's logs (or anywhere else that aggregates
 * structured output). Child loggers let you pin a request_id to every line
 * in a request's lifetime.
 */

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const activeLevel = LEVELS[process.env.LOG_LEVEL || "info"] ?? LEVELS.info;

function write(level, msg, fields) {
  if (LEVELS[level] < activeLevel) return;
  const entry = {
    level,
    msg,
    ts: new Date().toISOString(),
    ...fields,
  };
  const stream = level === "error" || level === "warn" ? process.stderr : process.stdout;
  stream.write(JSON.stringify(entry) + "\n");
}

function makeLogger(baseFields = {}) {
  return {
    debug: (msg, f) => write("debug", msg, { ...baseFields, ...f }),
    info: (msg, f) => write("info", msg, { ...baseFields, ...f }),
    warn: (msg, f) => write("warn", msg, { ...baseFields, ...f }),
    error: (msg, f) => write("error", msg, { ...baseFields, ...f }),
    child: (extra) => makeLogger({ ...baseFields, ...extra }),
  };
}

export const logger = makeLogger();
