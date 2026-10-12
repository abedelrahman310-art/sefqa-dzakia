CREATE TABLE `operator_profiles` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`wilaya_code` varchar(10) NOT NULL,
	`main_sector` enum('construction_public_works','hydraulics','it_telecom','supplies','services','studies_consulting') NOT NULL,
	`declared_activity_codes` json NOT NULL,
	`declared_qualification_level` varchar(10),
	`declared_qualification_sector` varchar(100),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `operator_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `operator_profiles_user_id_unique` UNIQUE(`user_id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255),
	`action` varchar(100) NOT NULL,
	`entity_type` varchar(50) NOT NULL,
	`entity_id` varchar(255) NOT NULL,
	`metadata` json,
	`ip_address` varchar(50),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `drafts` ADD `sector` enum('construction_public_works','hydraulics','it_telecom','supplies','services','studies_consulting');--> statement-breakpoint
ALTER TABLE `drafts` ADD `execution_scope` enum('wilaya','national') DEFAULT 'wilaya' NOT NULL;--> statement-breakpoint
ALTER TABLE `drafts` ADD `execution_wilaya_code` varchar(10);--> statement-breakpoint
ALTER TABLE `drafts` ADD `min_qualification_level` varchar(10);--> statement-breakpoint
ALTER TABLE `drafts` ADD `activity_codes_required` json;--> statement-breakpoint
ALTER TABLE `operator_profiles` ADD CONSTRAINT `operator_profiles_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
