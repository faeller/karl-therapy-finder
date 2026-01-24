-- validation overrides for whitelisted users
CREATE TABLE IF NOT EXISTS validation_overrides (
  user_id TEXT PRIMARY KEY REFERENCES user(id),
  reason TEXT,
  approved_by TEXT,
  created_at INTEGER NOT NULL
);
