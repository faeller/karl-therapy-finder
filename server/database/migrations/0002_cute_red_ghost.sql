ALTER TABLE `karl_waitlist` ADD `email` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `karl_waitlist_email_unique` ON `karl_waitlist` (`email`);