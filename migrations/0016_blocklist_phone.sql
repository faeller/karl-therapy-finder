-- add phone column to blocklist for blocking numbers not tied to eId
ALTER TABLE therapist_blocklist ADD COLUMN phone TEXT;

-- make eId optional (can block by phone only)
-- sqlite doesn't support ALTER COLUMN, but eId was already nullable in practice
