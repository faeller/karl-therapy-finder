-- migration: add credit audit log for reconciliation
CREATE TABLE credit_audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id),
  event_type TEXT NOT NULL,
  seconds INTEGER NOT NULL,
  call_id TEXT REFERENCES scheduled_calls(id),
  metadata TEXT,
  balance_before INTEGER,
  balance_after INTEGER,
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_credit_audit_user_created ON credit_audit_log(user_id, created_at);
