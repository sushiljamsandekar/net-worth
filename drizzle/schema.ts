import { decimal, int, mysqlEnum, mysqlTable, text, timestamp, varchar, datetime, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Asset Categories: cash, stocks, real estate, crypto, mutual funds, bonds, fixed deposits, gold, vehicles, other
 */
export const assetCategories = mysqlEnum("assetCategory", [
  "cash",
  "savings_account",
  "stocks",
  "mutual_funds",
  "bonds",
  "fixed_deposits",
  "real_estate",
  "crypto",
  "gold",
  "vehicles",
  "other",
]);

/**
 * Liability Categories: personal loan, home loan, car loan, credit card, education loan, other
 */
export const liabilityCategories = mysqlEnum("liabilityCategory", [
  "personal_loan",
  "home_loan",
  "car_loan",
  "credit_card",
  "education_loan",
  "other",
]);

/**
 * Assets table: stores user's assets across different categories
 */
export const assets = mysqlTable("assets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: assetCategories.notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("INR").notNull(),
  dateAdded: datetime("dateAdded").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = typeof assets.$inferInsert;

/**
 * Liabilities table: stores user's debts and obligations
 */
export const liabilities = mysqlTable("liabilities", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: liabilityCategories.notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("INR").notNull(),
  interestRate: decimal("interestRate", { precision: 5, scale: 2 }).default("0"),
  dueDate: datetime("dueDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Liability = typeof liabilities.$inferSelect;
export type InsertLiability = typeof liabilities.$inferInsert;

/**
 * Goals table: stores user's financial goals
 */
export const goals = mysqlTable("goals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  targetAmount: decimal("targetAmount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("INR").notNull(),
  targetDate: datetime("targetDate").notNull(),
  currentAmount: decimal("currentAmount", { precision: 15, scale: 2 }).default("0").notNull(),
  isCompleted: boolean("isCompleted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Goal = typeof goals.$inferSelect;
export type InsertGoal = typeof goals.$inferInsert;

/**
 * Transactions table: audit log of all asset and liability changes
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["asset_add", "asset_update", "asset_delete", "liability_add", "liability_update", "liability_delete", "goal_add", "goal_update", "goal_delete"]).notNull(),
  entityType: mysqlEnum("entityType", ["asset", "liability", "goal"]).notNull(),
  entityId: int("entityId").notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 15, scale: 2 }),
  category: varchar("category", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Net Worth Snapshots table: stores historical net worth for trend analysis
 */
export const netWorthSnapshots = mysqlTable("netWorthSnapshots", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  totalAssets: decimal("totalAssets", { precision: 15, scale: 2 }).notNull(),
  totalLiabilities: decimal("totalLiabilities", { precision: 15, scale: 2 }).notNull(),
  netWorth: decimal("netWorth", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("INR").notNull(),
  snapshotDate: datetime("snapshotDate").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type NetWorthSnapshot = typeof netWorthSnapshots.$inferSelect;
export type InsertNetWorthSnapshot = typeof netWorthSnapshots.$inferInsert;