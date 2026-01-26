-- add role column, migrate isAdmin data, drop isAdmin
ALTER TABLE user ADD COLUMN role TEXT DEFAULT 'user';

-- migrate: isAdmin=true -> 'admin', else 'user'
UPDATE user SET role = CASE WHEN is_admin = 1 THEN 'admin' ELSE 'user' END;

-- drop old column
ALTER TABLE user DROP COLUMN is_admin;
