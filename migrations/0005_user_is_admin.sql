-- add is_admin flag to users

ALTER TABLE user ADD COLUMN is_admin INTEGER DEFAULT 0;

-- make all existing users admin
UPDATE user SET is_admin = 1;
