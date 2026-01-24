-- add attempt_history to track previous call attempts before retry

ALTER TABLE scheduled_calls ADD COLUMN attempt_history TEXT;
