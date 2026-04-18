-- ScriptGen — PostgreSQL (Neon). Apply with `npm run db:migrate` or Neon SQL editor.

CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  email           TEXT NOT NULL,
  password_hash   TEXT NOT NULL,
  created_at      BIGINT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower ON users (lower(email));

CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at  BIGINT NOT NULL,
  expires_at  BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS searches (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at      BIGINT NOT NULL,
  prompt          TEXT NOT NULL,
  tone            TEXT NOT NULL,
  length_minutes  INTEGER NOT NULL,
  model           TEXT NOT NULL,
  word_count      INTEGER NOT NULL,
  target_words    INTEGER NOT NULL,
  script          TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_searches_user_created ON searches (user_id, created_at DESC);
