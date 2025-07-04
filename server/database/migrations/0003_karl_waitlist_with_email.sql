-- Recreate karl_waitlist table with email field
DROP TABLE IF EXISTS `karl_waitlist`;

CREATE TABLE `karl_waitlist` (
	`id` integer PRIMARY KEY NOT NULL,
	`email` text,
	`encrypted_profile` text NOT NULL,
	`plz` text NOT NULL,
	`created_at` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`notes` text
);