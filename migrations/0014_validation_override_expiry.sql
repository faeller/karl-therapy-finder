-- migration: add expiration to validation overrides
ALTER TABLE validation_overrides ADD COLUMN expires_at INTEGER;
