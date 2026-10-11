CREATE TABLE `practice_inventory` (
	`user_id` text NOT NULL,
	`product_id` text NOT NULL,
	`stock` integer NOT NULL,
	PRIMARY KEY(`user_id`, `product_id`),
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "nonnegative_practice_stock" CHECK("practice_inventory"."stock" >= 0)
);
