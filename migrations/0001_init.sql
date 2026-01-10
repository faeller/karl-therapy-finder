-- users table
CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY,
  patreon_id TEXT UNIQUE,
  email TEXT,
  username TEXT NOT NULL,
  avatar_url TEXT,
  pledge_tier TEXT,
  pledge_amount_cents INTEGER,
  sync_enabled INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- sessions table
CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id),
  expires_at INTEGER NOT NULL
);

-- user campaign data (opt-in sync)
CREATE TABLE IF NOT EXISTS user_campaign (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id),
  campaign_data TEXT,
  updated_at INTEGER NOT NULL
);

-- user contacts data (opt-in sync)
CREATE TABLE IF NOT EXISTS user_contacts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id),
  contacts_data TEXT,
  updated_at INTEGER NOT NULL
);

-- indexes
CREATE INDEX IF NOT EXISTS idx_session_user_id ON session(user_id);
CREATE INDEX IF NOT EXISTS idx_user_patreon_id ON user(patreon_id);
CREATE INDEX IF NOT EXISTS idx_user_campaign_user_id ON user_campaign(user_id);
CREATE INDEX IF NOT EXISTS idx_user_contacts_user_id ON user_contacts(user_id);
