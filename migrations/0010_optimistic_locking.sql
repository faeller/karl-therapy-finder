-- migration: add version column for optimistic locking
ALTER TABLE user_call_credits ADD COLUMN version INTEGER DEFAULT 0;
