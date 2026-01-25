-- migration: add processed webhooks table for replay protection
CREATE TABLE IF NOT EXISTS processed_webhooks (
    id TEXT PRIMARY KEY,
    conversation_id TEXT,
    processed_at INTEGER NOT NULL
);

CREATE INDEX idx_processed_webhooks_processed_at ON processed_webhooks(processed_at);
