CREATE TABLE `karl_waitlist` (
	`id` integer PRIMARY KEY NOT NULL,
	`encrypted_profile` text NOT NULL,
	`plz` text NOT NULL,
	`created_at` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`notes` text
);
