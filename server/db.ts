import { eq, and, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, assets, liabilities, goals, transactions, netWorthSnapshots, Asset, InsertAsset, Liability, InsertLiability, Goal, InsertGoal, Transaction, InsertTransaction, NetWorthSnapshot, InsertNetWorthSnapshot } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============= ASSET QUERIES =============

export async function createAsset(userId: number, asset: Omit<InsertAsset, 'userId'>): Promise<Asset | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(assets).values({
    ...asset,
    userId,
  });
  
  return getAssetById(userId, result[0].insertId);
}

export async function getAssetById(userId: number, assetId: number): Promise<Asset | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(assets).where(and(eq(assets.id, assetId), eq(assets.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getUserAssets(userId: number): Promise<Asset[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(assets).where(eq(assets.userId, userId)).orderBy(desc(assets.createdAt));
}

export async function updateAsset(userId: number, assetId: number, updates: Partial<Omit<Asset, 'id' | 'userId' | 'createdAt'>>): Promise<Asset | null> {
  const db = await getDb();
  if (!db) return null;
  
  await db.update(assets).set(updates).where(and(eq(assets.id, assetId), eq(assets.userId, userId)));
  return getAssetById(userId, assetId);
}

export async function deleteAsset(userId: number, assetId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  await db.delete(assets).where(and(eq(assets.id, assetId), eq(assets.userId, userId)));
  return true;
}

// ============= LIABILITY QUERIES =============

export async function createLiability(userId: number, liability: Omit<InsertLiability, 'userId'>): Promise<Liability | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(liabilities).values({
    ...liability,
    userId,
  });
  
  return getLiabilityById(userId, result[0].insertId);
}

export async function getLiabilityById(userId: number, liabilityId: number): Promise<Liability | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(liabilities).where(and(eq(liabilities.id, liabilityId), eq(liabilities.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getUserLiabilities(userId: number): Promise<Liability[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(liabilities).where(eq(liabilities.userId, userId)).orderBy(desc(liabilities.createdAt));
}

export async function updateLiability(userId: number, liabilityId: number, updates: Partial<Omit<Liability, 'id' | 'userId' | 'createdAt'>>): Promise<Liability | null> {
  const db = await getDb();
  if (!db) return null;
  
  await db.update(liabilities).set(updates).where(and(eq(liabilities.id, liabilityId), eq(liabilities.userId, userId)));
  return getLiabilityById(userId, liabilityId);
}

export async function deleteLiability(userId: number, liabilityId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  await db.delete(liabilities).where(and(eq(liabilities.id, liabilityId), eq(liabilities.userId, userId)));
  return true;
}

// ============= GOAL QUERIES =============

export async function createGoal(userId: number, goal: Omit<InsertGoal, 'userId'>): Promise<Goal | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(goals).values({
    ...goal,
    userId,
  });
  
  return getGoalById(userId, result[0].insertId);
}

export async function getGoalById(userId: number, goalId: number): Promise<Goal | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(goals).where(and(eq(goals.id, goalId), eq(goals.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getUserGoals(userId: number): Promise<Goal[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(goals).where(eq(goals.userId, userId)).orderBy(asc(goals.targetDate));
}

export async function updateGoal(userId: number, goalId: number, updates: Partial<Omit<Goal, 'id' | 'userId' | 'createdAt'>>): Promise<Goal | null> {
  const db = await getDb();
  if (!db) return null;
  
  await db.update(goals).set(updates).where(and(eq(goals.id, goalId), eq(goals.userId, userId)));
  return getGoalById(userId, goalId);
}

export async function deleteGoal(userId: number, goalId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  await db.delete(goals).where(and(eq(goals.id, goalId), eq(goals.userId, userId)));
  return true;
}

// ============= TRANSACTION QUERIES =============

export async function createTransaction(userId: number, transaction: Omit<InsertTransaction, 'userId'>): Promise<Transaction | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(transactions).values({
    ...transaction,
    userId,
  });
  
  return getTransactionById(userId, result[0].insertId);
}

export async function getTransactionById(userId: number, transactionId: number): Promise<Transaction | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(transactions).where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getUserTransactions(userId: number, limit: number = 100, offset: number = 0): Promise<Transaction[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(transactions).where(eq(transactions.userId, userId)).orderBy(desc(transactions.createdAt)).limit(limit).offset(offset);
}

// ============= NET WORTH SNAPSHOT QUERIES =============

export async function createNetWorthSnapshot(userId: number, snapshot: Omit<InsertNetWorthSnapshot, 'userId'>): Promise<NetWorthSnapshot | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.insert(netWorthSnapshots).values({
    ...snapshot,
    userId,
  });
  
  return getNetWorthSnapshotById(userId, result[0].insertId);
}

export async function getNetWorthSnapshotById(userId: number, snapshotId: number): Promise<NetWorthSnapshot | null> {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(netWorthSnapshots).where(and(eq(netWorthSnapshots.id, snapshotId), eq(netWorthSnapshots.userId, userId))).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getUserNetWorthSnapshots(userId: number, limit: number = 365): Promise<NetWorthSnapshot[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(netWorthSnapshots).where(eq(netWorthSnapshots.userId, userId)).orderBy(asc(netWorthSnapshots.snapshotDate)).limit(limit);
}

// ============= AGGREGATION QUERIES =============

export async function calculateUserNetWorth(userId: number): Promise<{ totalAssets: number; totalLiabilities: number; netWorth: number }> {
  const db = await getDb();
  if (!db) return { totalAssets: 0, totalLiabilities: 0, netWorth: 0 };
  
  const userAssets = await getUserAssets(userId);
  const userLiabilities = await getUserLiabilities(userId);
  
  const totalAssets = userAssets.reduce((sum, asset) => sum + parseFloat(asset.amount.toString()), 0);
  const totalLiabilities = userLiabilities.reduce((sum, liability) => sum + parseFloat(liability.amount.toString()), 0);
  const netWorth = totalAssets - totalLiabilities;
  
  return { totalAssets, totalLiabilities, netWorth };
}
