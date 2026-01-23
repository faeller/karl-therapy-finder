-- store original call params for retries

ALTER TABLE scheduled_calls ADD COLUMN call_metadata TEXT;
