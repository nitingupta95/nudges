/**
 * AI Budget Manager
 * Tracks and controls AI API spending
 */

// ============================================
// TYPES
// ============================================

export interface AIUsageRecord {
  operation: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  timestamp: Date;
}

export interface DailyUsage {
  date: string;
  totalTokens: number;
  totalCost: number;
  callCount: number;
}

// ============================================
// COST CONFIGURATION
// ============================================

export const AI_COST_CONFIG = {
  models: {
    "gpt-4o-mini": {
      inputCostPer1K: 0.00015,
      outputCostPer1K: 0.0006,
    },
    "text-embedding-3-small": {
      inputCostPer1K: 0.00002,
      outputCostPer1K: 0,
    },
  },
  limits: {
    dailyBudget: 10.0,
    hourlyRateLimit: 1000,
    fallbackThreshold: 0.9,
  },
};

// ============================================
// IN-MEMORY TRACKING
// ============================================

const usageTracker = {
  dailyTokens: 0,
  dailyCost: 0,
  hourlyCallCount: 0,
  lastResetDay: new Date().toDateString(),
  lastResetHour: new Date().getHours(),
};

function checkAndResetCounters(): void {
  const now = new Date();
  const today = now.toDateString();
  const currentHour = now.getHours();

  if (usageTracker.lastResetDay !== today) {
    usageTracker.dailyTokens = 0;
    usageTracker.dailyCost = 0;
    usageTracker.lastResetDay = today;
  }

  if (usageTracker.lastResetHour !== currentHour) {
    usageTracker.hourlyCallCount = 0;
    usageTracker.lastResetHour = currentHour;
  }
}

// ============================================
// BUDGET MANAGEMENT
// ============================================

/**
 * Check if we're within budget
 */
export function checkBudget(): {
  withinBudget: boolean;
  dailySpend: number;
  remainingBudget: number;
  hourlyCallsRemaining: number;
} {
  checkAndResetCounters();

  const withinBudget =
    usageTracker.dailyCost <
    AI_COST_CONFIG.limits.dailyBudget * AI_COST_CONFIG.limits.fallbackThreshold;

  const hourlyCallsRemaining =
    AI_COST_CONFIG.limits.hourlyRateLimit - usageTracker.hourlyCallCount;

  return {
    withinBudget: withinBudget && hourlyCallsRemaining > 0,
    dailySpend: usageTracker.dailyCost,
    remainingBudget: AI_COST_CONFIG.limits.dailyBudget - usageTracker.dailyCost,
    hourlyCallsRemaining: Math.max(0, hourlyCallsRemaining),
  };
}

/**
 * Record AI usage
 */
export async function recordUsage(
  operation: string,
  model: keyof typeof AI_COST_CONFIG.models,
  inputTokens: number,
  outputTokens: number
): Promise<void> {
  checkAndResetCounters();

  const modelConfig = AI_COST_CONFIG.models[model];
  const cost =
    (inputTokens / 1000) * modelConfig.inputCostPer1K +
    (outputTokens / 1000) * modelConfig.outputCostPer1K;

  usageTracker.dailyTokens += inputTokens + outputTokens;
  usageTracker.dailyCost += cost;
  usageTracker.hourlyCallCount += 1;

  console.log(
    `AI Usage: ${operation} - ${inputTokens + outputTokens} tokens, $${cost.toFixed(6)}`
  );
}

/**
 * Calculate cost for a model call
 */
export function estimateCost(
  model: keyof typeof AI_COST_CONFIG.models,
  inputTokens: number,
  outputTokens: number
): number {
  const modelConfig = AI_COST_CONFIG.models[model];
  return (
    (inputTokens / 1000) * modelConfig.inputCostPer1K +
    (outputTokens / 1000) * modelConfig.outputCostPer1K
  );
}

/**
 * Get daily usage summary
 */
export function getDailyUsageSummary(): DailyUsage {
  checkAndResetCounters();

  return {
    date: usageTracker.lastResetDay,
    totalTokens: usageTracker.dailyTokens,
    totalCost: usageTracker.dailyCost,
    callCount: usageTracker.hourlyCallCount,
  };
}

/**
 * Should use fallback (based on budget)
 */
export function shouldUseFallback(): boolean {
  const { withinBudget } = checkBudget();
  return !withinBudget;
}