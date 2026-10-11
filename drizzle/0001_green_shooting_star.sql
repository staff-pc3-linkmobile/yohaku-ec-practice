CREATE TABLE `practice_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`mode` text DEFAULT 'normal' NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT "valid_practice_mode" CHECK("practice_settings"."mode" IN ('normal', 'shipping-boundary'))
);
