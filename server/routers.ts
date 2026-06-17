import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  createAsset,
  getUserAssets,
  updateAsset,
  deleteAsset,
  createLiability,
  getUserLiabilities,
  updateLiability,
  deleteLiability,
  createGoal,
  getUserGoals,
  updateGoal,
  deleteGoal,
  getUserTransactions,
  createTransaction,
  calculateUserNetWorth,
  getUserNetWorthSnapshots,
  createNetWorthSnapshot,
} from "./db";
import { TRPCError } from "@trpc/server";

// ============= VALIDATION SCHEMAS =============

const assetCategoryEnum = z.enum([
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

const liabilityCategoryEnum = z.enum([
  "personal_loan",
  "home_loan",
  "car_loan",
  "credit_card",
  "education_loan",
  "other",
]);

const createAssetSchema = z.object({
  name: z.string().min(1, "Asset name is required").max(255),
  category: assetCategoryEnum,
  amount: z.coerce.number().positive("Amount must be positive"),
  currency: z.string().max(3).default("INR"),
  dateAdded: z.coerce.date(),
  notes: z.string().optional(),
});

const updateAssetSchema = createAssetSchema.partial();

const createLiabilitySchema = z.object({
  name: z.string().min(1, "Liability name is required").max(255),
  category: liabilityCategoryEnum,
  amount: z.coerce.number().positive("Amount must be positive"),
  currency: z.string().max(3).default("INR"),
  interestRate: z.coerce.number().min(0).max(100).optional(),
  dueDate: z.coerce.date().optional(),
  notes: z.string().optional(),
});

const updateLiabilitySchema = createLiabilitySchema.partial();

const createGoalSchema = z.object({
  name: z.string().min(1, "Goal name is required").max(255),
  description: z.string().optional(),
  targetAmount: z.coerce.number().positive("Target amount must be positive"),
  currency: z.string().max(3).default("INR"),
  targetDate: z.coerce.date(),
  currentAmount: z.coerce.number().min(0).default(0),
});

const updateGoalSchema = createGoalSchema.partial();

// ============= ASSET ROUTER =============

const assetRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getUserAssets(ctx.user.id);
  }),

  create: protectedProcedure
    .input(createAssetSchema)
    .mutation(async ({ ctx, input }) => {
      const asset = await createAsset(ctx.user.id, {
        ...input,
        amount: input.amount.toString() as any,
        dateAdded: input.dateAdded,
      });

      if (!asset) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create asset",
        });
      }

      // Log transaction
      await createTransaction(ctx.user.id, {
        type: "asset_add",
        entityType: "asset",
        entityId: asset.id,
        description: `Added ${asset.name}`,
        amount: asset.amount,
        category: asset.category,
      });

      return asset;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: updateAssetSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: any = {};
      if (input.data.name !== undefined) updateData.name = input.data.name;
      if (input.data.category !== undefined) updateData.category = input.data.category;
      if (input.data.amount !== undefined) updateData.amount = input.data.amount.toString();
      if (input.data.currency !== undefined) updateData.currency = input.data.currency;
      if (input.data.dateAdded !== undefined) updateData.dateAdded = input.data.dateAdded;
      if (input.data.notes !== undefined) updateData.notes = input.data.notes;
      const asset = await updateAsset(ctx.user.id, input.id, updateData);

      if (!asset) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Asset not found",
        });
      }

      // Log transaction
      await createTransaction(ctx.user.id, {
        type: "asset_update",
        entityType: "asset",
        entityId: asset.id,
        description: `Updated ${asset.name}`,
        amount: asset.amount,
        category: asset.category,
      });

      return asset;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const success = await deleteAsset(ctx.user.id, input.id);

      if (!success) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Asset not found",
        });
      }

      // Log transaction
      await createTransaction(ctx.user.id, {
        type: "asset_delete",
        entityType: "asset",
        entityId: input.id,
        description: "Deleted asset",
      });

      return { success: true };
    }),
});

// ============= LIABILITY ROUTER =============

const liabilityRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getUserLiabilities(ctx.user.id);
  }),

  create: protectedProcedure
    .input(createLiabilitySchema)
    .mutation(async ({ ctx, input }) => {
      const liability = await createLiability(ctx.user.id, {
        ...input,
        amount: input.amount.toString() as any,
        interestRate: input.interestRate?.toString() as any,
      });

      if (!liability) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create liability",
        });
      }

      // Log transaction
      await createTransaction(ctx.user.id, {
        type: "liability_add",
        entityType: "liability",
        entityId: liability.id,
        description: `Added ${liability.name}`,
        amount: liability.amount,
        category: liability.category,
      });

      return liability;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: updateLiabilitySchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: any = {};
      if (input.data.name !== undefined) updateData.name = input.data.name;
      if (input.data.category !== undefined) updateData.category = input.data.category;
      if (input.data.amount !== undefined) updateData.amount = input.data.amount.toString();
      if (input.data.currency !== undefined) updateData.currency = input.data.currency;
      if (input.data.interestRate !== undefined) updateData.interestRate = input.data.interestRate.toString();
      if (input.data.dueDate !== undefined) updateData.dueDate = input.data.dueDate;
      if (input.data.notes !== undefined) updateData.notes = input.data.notes;
      const liability = await updateLiability(ctx.user.id, input.id, updateData);

      if (!liability) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Liability not found",
        });
      }

      // Log transaction
      await createTransaction(ctx.user.id, {
        type: "liability_update",
        entityType: "liability",
        entityId: liability.id,
        description: `Updated ${liability.name}`,
        amount: liability.amount,
        category: liability.category,
      });

      return liability;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const success = await deleteLiability(ctx.user.id, input.id);

      if (!success) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Liability not found",
        });
      }

      // Log transaction
      await createTransaction(ctx.user.id, {
        type: "liability_delete",
        entityType: "liability",
        entityId: input.id,
        description: "Deleted liability",
      });

      return { success: true };
    }),
});

// ============= GOAL ROUTER =============

const goalRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getUserGoals(ctx.user.id);
  }),

  create: protectedProcedure
    .input(createGoalSchema)
    .mutation(async ({ ctx, input }) => {
      const goal = await createGoal(ctx.user.id, {
        ...input,
        targetAmount: input.targetAmount.toString() as any,
        currentAmount: input.currentAmount.toString() as any,
      });

      if (!goal) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create goal",
        });
      }

      // Log transaction
      await createTransaction(ctx.user.id, {
        type: "goal_add",
        entityType: "goal",
        entityId: goal.id,
        description: `Added goal: ${goal.name}`,
        amount: goal.targetAmount,
      });

      return goal;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: updateGoalSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updateData: any = {};
      if (input.data.name !== undefined) updateData.name = input.data.name;
      if (input.data.description !== undefined) updateData.description = input.data.description;
      if (input.data.targetAmount !== undefined) updateData.targetAmount = input.data.targetAmount.toString();
      if (input.data.currency !== undefined) updateData.currency = input.data.currency;
      if (input.data.targetDate !== undefined) updateData.targetDate = input.data.targetDate;
      if (input.data.currentAmount !== undefined) updateData.currentAmount = input.data.currentAmount.toString();
      const goal = await updateGoal(ctx.user.id, input.id, updateData);

      if (!goal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Goal not found",
        });
      }

      // Log transaction
      await createTransaction(ctx.user.id, {
        type: "goal_update",
        entityType: "goal",
        entityId: goal.id,
        description: `Updated goal: ${goal.name}`,
        amount: goal.targetAmount,
      });

      return goal;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const success = await deleteGoal(ctx.user.id, input.id);

      if (!success) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Goal not found",
        });
      }

      // Log transaction
      await createTransaction(ctx.user.id, {
        type: "goal_delete",
        entityType: "goal",
        entityId: input.id,
        description: "Deleted goal",
      });

      return { success: true };
    }),
});

// ============= ANALYTICS ROUTER =============

const analyticsRouter = router({
  netWorth: protectedProcedure.query(async ({ ctx }) => {
    return calculateUserNetWorth(ctx.user.id);
  }),

  netWorthHistory: protectedProcedure.query(async ({ ctx }) => {
    return getUserNetWorthSnapshots(ctx.user.id);
  }),

  recordSnapshot: protectedProcedure.mutation(async ({ ctx }) => {
    const { totalAssets, totalLiabilities, netWorth } = await calculateUserNetWorth(ctx.user.id);

    const snapshot = await createNetWorthSnapshot(ctx.user.id, {
      totalAssets: totalAssets as any,
      totalLiabilities: totalLiabilities as any,
      netWorth: netWorth as any,
      currency: "INR",
      snapshotDate: new Date(),
    });

    return snapshot;
  }),

  portfolioBreakdown: protectedProcedure.query(async ({ ctx }) => {
    const assets = await getUserAssets(ctx.user.id);

    const breakdown: Record<string, number> = {};
    assets.forEach((asset) => {
      const category = asset.category as string;
      breakdown[category] = (breakdown[category] || 0) + parseFloat(asset.amount.toString());
    });

    return breakdown;
  }),

  riskMeter: protectedProcedure.query(async ({ ctx }) => {
    const assets = await getUserAssets(ctx.user.id);
    const { totalAssets } = await calculateUserNetWorth(ctx.user.id);

    if (totalAssets === 0) {
      return { riskScore: 0, riskLevel: "neutral", breakdown: {} };
    }

    // Risk scoring: assign weights to categories
    const riskWeights: Record<string, number> = {
      cash: 0,
      savings_account: 5,
      bonds: 10,
      fixed_deposits: 10,
      real_estate: 20,
      stocks: 50,
      mutual_funds: 40,
      crypto: 100,
      gold: 25,
      vehicles: 15,
      other: 30,
    };

    let totalRiskScore = 0;
    const breakdown: Record<string, { amount: number; percentage: number; riskWeight: number }> = {};

    assets.forEach((asset) => {
      const amount = parseFloat(asset.amount.toString());
      const percentage = (amount / totalAssets) * 100;
      const category = asset.category as string;
      const weight = riskWeights[category] || 50;

      breakdown[category] = {
        amount,
        percentage,
        riskWeight: weight,
      };

      totalRiskScore += (percentage / 100) * weight;
    });

    // Normalize risk score to 0-100
    const riskScore = Math.min(100, Math.round(totalRiskScore));

    let riskLevel: "very_low" | "low" | "medium" | "high" | "very_high";
    if (riskScore < 20) riskLevel = "very_low";
    else if (riskScore < 40) riskLevel = "low";
    else if (riskScore < 60) riskLevel = "medium";
    else if (riskScore < 80) riskLevel = "high";
    else riskLevel = "very_high";

    return { riskScore, riskLevel, breakdown };
  }),
});

// ============= TRANSACTIONS ROUTER =============

const transactionsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().default(100),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      return getUserTransactions(ctx.user.id, input.limit, input.offset);
    }),
});

// ============= IMPORT/EXPORT ROUTER =============

const importExportRouter = router({
  downloadTemplate: protectedProcedure.query(() => {
    const csv = `name,category,amount,dateAdded,notes
Example Asset,cash,50000,2024-01-15,Emergency fund
name,category,amount,interestRate,dueDate,notes
Example Liability,home_loan,5000000,7.5,2034-12-31,HDFC Bank
name,description,targetAmount,currentAmount,currency,targetDate
Example Goal,Save for vacation,500000,100000,INR,2025-12-31`;
    return { csv };
  }),

  uploadCSV: protectedProcedure
    .input(z.object({ csv: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const lines = input.csv.trim().split('\n');
      if (lines.length < 2) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'CSV file is empty' });
      }

      let imported = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const parts = line.split(',').map((p) => p.trim());

        // Try to parse as asset
        if (parts.length >= 5 && parts[1] && assetCategoryEnum.safeParse(parts[1]).success) {
          try {
            await createAsset(ctx.user.id, {
              name: parts[0],
              category: parts[1] as any,
              amount: parseFloat(parts[2]).toString() as any,
              dateAdded: new Date(parts[3]),
              notes: parts[4] || undefined,
            });
            imported++;
          } catch (e) {
            // Skip on error
          }
        }
        // Try to parse as liability
        else if (parts.length >= 6 && parts[1] && liabilityCategoryEnum.safeParse(parts[1]).success) {
          try {
            await createLiability(ctx.user.id, {
              name: parts[0],
              category: parts[1] as any,
              amount: parseFloat(parts[2]).toString() as any,
              interestRate: parts[3] ? parseFloat(parts[3]).toString() as any : undefined,
              dueDate: parts[4] ? new Date(parts[4]) : undefined,
              notes: parts[5] || undefined,
            });
            imported++;
          } catch (e) {
            // Skip on error
          }
        }
        // Try to parse as goal
        else if (parts.length >= 6) {
          try {
            await createGoal(ctx.user.id, {
              name: parts[0],
              description: parts[1] || undefined,
              targetAmount: parseFloat(parts[2]).toString() as any,
              currentAmount: parseFloat(parts[3]).toString() as any,
              currency: parts[4] || 'INR',
              targetDate: new Date(parts[5]),
            });
            imported++;
          } catch (e) {
            // Skip on error
          }
        }
      }

      return { imported };
    }),

  exportData: protectedProcedure.mutation(async ({ ctx }) => {
    const assets = await getUserAssets(ctx.user.id);
    const liabilities = await getUserLiabilities(ctx.user.id);
    const goals = await getUserGoals(ctx.user.id);

    let csv = 'type,name,category,amount,dateAdded,notes,interestRate,dueDate,description,targetAmount,currentAmount,currency,targetDate\n';

    assets.forEach((asset) => {
      csv += `asset,${asset.name},${asset.category},${asset.amount},${new Date(asset.dateAdded).toISOString().split('T')[0]},${asset.notes || ''},,,,,,\n`;
    });

    liabilities.forEach((liability) => {
      csv += `liability,${liability.name},${liability.category},${liability.amount},,${liability.notes || ''},${liability.interestRate || ''},${liability.dueDate ? new Date(liability.dueDate).toISOString().split('T')[0] : ''},,,,,\n`;
    });

    goals.forEach((goal) => {
      csv += `goal,${goal.name},,,,${goal.description || ''},,,,${goal.targetAmount},${goal.currentAmount},${goal.currency},${new Date(goal.targetDate).toISOString().split('T')[0]}\n`;
    });

    return { csv };
  }),
});
// ============= MAIN APP ROUTER =============

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  assets: assetRouter,
  liabilities: liabilityRouter,
  goals: goalRouter,
  analytics: analyticsRouter,
  transactions: transactionsRouter,
  importExport: importExportRouter,
});

export type AppRouter = typeof appRouter;
