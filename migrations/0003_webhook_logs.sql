-- webhook logs table for debugging

CREATE TABLE IF NOT EXISTS webhook_logs (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  conversation_id TEXT,
  call_id TEXT REFERENCES scheduled_calls(id),
  status TEXT,
  raw_payload TEXT NOT NULL,
  headers TEXT,
  processed_at INTEGER,
  processing_error TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_conversation_id ON webhook_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_call_id ON webhook_logs(call_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);
