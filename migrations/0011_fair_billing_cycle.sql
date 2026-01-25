-- migration: add subscription start date for audit trail
ALTER TABLE user_call_credits ADD COLUMN subscription_started_at INTEGER;
