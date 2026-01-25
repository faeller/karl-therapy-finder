-- add projected_seconds column for credit tracking
-- status can now also be 'frozen' for calls waiting on credits
ALTER TABLE scheduled_calls ADD COLUMN projected_seconds INTEGER DEFAULT 180;
