-- migration: add performance indexes for frequent queries
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_user_status ON scheduled_calls(user_id, status);
