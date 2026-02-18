/**
 * @swagger
 * /api/ai/budget:
 *   get:
 *     summary: Get AI budget status
 *     tags: [AI]
 *     responses:
 *       200:
 *         description: Budget status
 */

import { NextResponse } from "next/server";
import { checkBudget, getDailyUsageSummary, AI_COST_CONFIG } from "@/services/ai/ai.budget.service";
import { getCacheStats } from "@/services/ai/ai.cache.service";

export async function GET() {
  const budget = checkBudget();
  const usage = getDailyUsageSummary();
  const cacheStats = getCacheStats();

  return NextResponse.json({
    success: true,
    data: {
      budget: {
        withinBudget: budget.withinBudget,
        dailySpend: `$${budget.dailySpend.toFixed(4)}`,
        remainingBudget: `$${budget.remainingBudget.toFixed(4)}`,
        dailyLimit: `$${AI_COST_CONFIG.limits.dailyBudget.toFixed(2)}`,
        hourlyCallsRemaining: budget.hourlyCallsRemaining,
      },
      usage: {
        date: usage.date,
        totalTokens: usage.totalTokens,
        totalCost: `$${usage.totalCost.toFixed(4)}`,
        callCount: usage.callCount,
      },
      cache: cacheStats,
    },
  });
}