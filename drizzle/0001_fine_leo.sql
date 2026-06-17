CREATE TABLE `assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`assetCategory` enum('cash','savings_account','stocks','mutual_funds','bonds','fixed_deposits','real_estate','crypto','gold','vehicles','other') NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'INR',
	`dateAdded` datetime NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`targetAmount` decimal(15,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'INR',
	`targetDate` datetime NOT NULL,
	`currentAmount` decimal(15,2) NOT NULL DEFAULT '0',
	`isCompleted` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `liabilities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`liabilityCategory` enum('personal_loan','home_loan','car_loan','credit_card','education_loan','other') NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'INR',
	`interestRate` decimal(5,2) DEFAULT '0',
	`dueDate` datetime,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `liabilities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `netWorthSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalAssets` decimal(15,2) NOT NULL,
	`totalLiabilities` decimal(15,2) NOT NULL,
	`netWorth` decimal(15,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'INR',
	`snapshotDate` datetime NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `netWorthSnapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('asset_add','asset_update','asset_delete','liability_add','liability_update','liability_delete','goal_add','goal_update','goal_delete') NOT NULL,
	`entityType` enum('asset','liability','goal') NOT NULL,
	`entityId` int NOT NULL,
	`description` text,
	`amount` decimal(15,2),
	`category` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`)
);
