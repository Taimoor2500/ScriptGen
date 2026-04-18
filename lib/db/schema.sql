-- ScriptGen persistent state.
-- Applied idempotently on first DB access. Use `CREATE TABLE IF NOT EXISTS`
-- plus explicit index statements; avoid destructive migrations here.

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT    NOT NULL,
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT    PRIMARY KEY,           -- 32-byte random hex
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id    ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS searches (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at     INTEGER NOT NULL,
  prompt         TEXT    NOT NULL,
  tone           TEXT    NOT NULL,
  length_minutes INTEGER NOT NULL,
  model          TEXT    NOT NULL,
  word_count     INTEGER NOT NULL,
  target_words   INTEGER NOT NULL,
  script         TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_searches_user_created
  ON searches(user_id, created_at DESC);
