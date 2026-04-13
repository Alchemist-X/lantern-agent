import { z } from "zod";

export const runModeSchema = z.enum(["review", "scan", "full"]);
export type RunMode = z.infer<typeof runModeSchema>;
export const publicRunStatusSchema = z.enum(["queued", "running", "completed", "failed", "awaiting-approval"]);
export type PublicRunStatus = z.infer<typeof publicRunStatusSchema>;

export const actionSchema = z.enum(["open", "close", "reduce", "hold", "skip"]);
export const sideSchema = z.enum(["BUY", "SELL"]);
export const orderTypeSchema = z.enum(["SWAP", "LIMIT"]);
export const confidenceSchema = z.enum(["low", "medium", "medium-high", "high"]);
export const executionUnitSchema = z.enum(["usd", "shares"]);

export const sourceSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  retrieved_at_utc: z.string(),
  note: z.string().optional()
});

export const artifactSchema = z.object({
  kind: z.enum([
    "pulse-report",
    "review-report",
    "monitor-report",
    "rebalance-report",
    "resolution-report",
    "backtest-report",
    "runtime-log"
  ]),
  title: z.string(),
  path: z.string(),
  content: z.string().optional(),
  published_at_utc: z.string()
});

export const decisionSchema = z.object({
  action: actionSchema,
  token_symbol: z.string().min(1),
  pair_slug: z.string().min(1),
  token_address: z.string().min(1),
  side: sideSchema,
  notional_usd: z.number().positive(),
  order_type: orderTypeSchema,
  signal_strength: z.number().min(0).max(1),
  momentum_score: z.number().min(-1).max(1),
  edge: z.number(),
  confidence: confidenceSchema,
  thesis_md: z.string().min(1),
  sources: z.array(sourceSchema).min(1),
  full_kelly_pct: z.number().min(0).max(1).optional(),
  quarter_kelly_pct: z.number().min(0).max(1).optional(),
  reported_suggested_pct: z.number().min(0).max(1).nullable().optional(),
  liquidity_cap_usd: z.number().positive().nullable().optional(),
  position_value_usd: z.number().nonnegative().optional(),
  execution_amount: z.number().positive().optional(),
  execution_unit: executionUnitSchema.optional(),
  stop_loss_pct: z.number().min(0).max(1).default(0.3)
});

export const tradeDecisionSetSchema = z.object({
  run_id: z.string().uuid(),
  runtime: z.string().min(1),
  generated_at_utc: z.string(),
  bankroll_usd: z.number().nonnegative(),
  mode: runModeSchema,
  decisions: z.array(decisionSchema),
  artifacts: z.array(artifactSchema)
});

export type TradeDecisionSet = z.infer<typeof tradeDecisionSetSchema>;
export type TradeDecision = z.infer<typeof decisionSchema>;
export type Artifact = z.infer<typeof artifactSchema>;

export const adminActionSchema = z.enum([
  "pause",
  "resume",
  "run-now",
  "cancel-open-orders",
  "flatten"
]);
export type AdminAction = z.infer<typeof adminActionSchema>;

export const systemStatusSchema = z.enum(["running", "paused", "halted"]);
export type SystemStatus = z.infer<typeof systemStatusSchema>;

export interface OverviewPoint {
  timestamp: string;
  total_equity_usd: number;
  drawdown_pct: number;
}

export interface OverviewResponse {
  status: SystemStatus;
  cash_balance_usd: number;
  total_equity_usd: number;
  high_water_mark_usd: number;
  drawdown_pct: number;
  open_positions: number;
  last_run_at: string | null;
  latest_risk_event: string | null;
  equity_curve: OverviewPoint[];
}

export interface PublicPosition {
  id: string;
  token_symbol: string;
  pair_slug: string;
  token_address: string;
  side: "BUY" | "SELL";
  size: number;
  avg_cost: number;
  current_price: number;
  current_value_usd: number;
  unrealized_pnl_pct: number;
  stop_loss_pct: number;
  opened_at: string;
  updated_at: string;
}

export interface PublicTrade {
  id: string;
  pair_slug: string;
  token_address: string;
  status: string;
  side: "BUY" | "SELL";
  requested_notional_usd: number;
  filled_notional_usd: number;
  avg_price: number | null;
  order_id: string | null;
  timestamp_utc: string;
}

export interface PublicArtifactListItem {
  id: string;
  title: string;
  kind: z.infer<typeof artifactSchema>["kind"];
  path: string;
  published_at_utc: string;
}

export interface PublicRunSummary {
  id: string;
  mode: RunMode;
  runtime: string;
  status: PublicRunStatus;
  bankroll_usd: number;
  decision_count: number;
  generated_at_utc: string;
}

export interface PublicRunDetail extends PublicRunSummary {
  prompt_summary: string;
  reasoning_md: string;
  logs_md: string;
  decisions: TradeDecision[];
  artifacts: Artifact[];
  tracked_sources: PublicTrackedSource[];
  resolution_checks: PublicResolutionCheck[];
}

export interface PublicTrackedSource {
  id: string;
  run_id: string | null;
  decision_id: string | null;
  token_symbol: string;
  pair_slug: string;
  title: string;
  url: string;
  source_kind: string;
  role: string;
  status: string;
  retrieved_at_utc: string;
  last_checked_at: string | null;
  note: string | null;
  content_hash: string | null;
}

export interface PublicResolutionCheck {
  id: string;
  token_symbol: string;
  pair_slug: string;
  track_status: string;
  interval_minutes: number;
  next_check_at: string | null;
  last_checked_at: string | null;
  summary: string;
  trackability: string | null;
  source_url: string | null;
  source_type: string | null;
  report_path: string | null;
}

function roundCurrency(value: number): number {
  return Number(value.toFixed(2));
}

function roundPositionMetric(value: number): number {
  return Number(value.toFixed(6));
}

function calculatePaperPositionPnlPct(avgCost: number, currentPrice: number): number {
  if (avgCost <= 0) {
    return 0;
  }
  return roundPositionMetric((currentPrice - avgCost) / avgCost);
}

export function inferPaperSellAmount(
  position: PublicPosition | null | undefined,
  decision: Pick<TradeDecision, "action" | "notional_usd">
): number {
  if (!position) {
    return 0;
  }

  if (decision.action === "close") {
    return position.size;
  }

  if (decision.action === "reduce" && position.current_value_usd > 0) {
    return Math.min(position.size, position.size * (decision.notional_usd / position.current_value_usd));
  }

  return 0;
}

export interface PaperTradeResult {
  status: "filled" | "rejected";
  avgPrice: number;
  filledNotionalUsd: number;
  nextPosition: PublicPosition | null;
  rejectionReason?: string;
}

export function getPaperFillPrice(side: "BUY" | "SELL"): number {
  return side === "BUY" ? 0.52 : 0.48;
}

export function buildPaperOrderResult(input: { side: "BUY" | "SELL"; amount: number }) {
  const avgPrice = getPaperFillPrice(input.side);
  return {
    ok: true,
    avgPrice,
    filledNotionalUsd:
      input.side === "BUY"
        ? roundCurrency(input.amount)
        : roundCurrency(input.amount * avgPrice),
    rawResponse: {
      mock: true,
      paper: true
    }
  };
}

export function applyPaperTradeDecision(input: {
  position: PublicPosition | null | undefined;
  decision: TradeDecision;
  avgPrice: number;
  timestampUtc: string;
}): PaperTradeResult {
  const currentPosition = input.position ?? null;
  const executionAmount =
    input.decision.side === "BUY"
      ? input.decision.notional_usd
      : inferPaperSellAmount(currentPosition, input.decision);

  if (!(executionAmount > 0) || !(input.avgPrice > 0)) {
    return {
      status: "rejected",
      avgPrice: input.avgPrice,
      filledNotionalUsd: 0,
      nextPosition: currentPosition,
      rejectionReason: currentPosition ? "decision has no executable size" : "no open position is available"
    };
  }

  const previousSize = currentPosition?.size ?? 0;
  const sizeDelta = input.decision.side === "BUY" ? executionAmount / input.avgPrice : -executionAmount;
  const nextSize = Math.max(0, previousSize + sizeDelta);
  const nextAvgCost =
    input.decision.side === "BUY"
      ? currentPosition
        ? (previousSize * currentPosition.avg_cost + executionAmount) / Math.max(nextSize, Number.EPSILON)
        : input.avgPrice
      : currentPosition?.avg_cost ?? input.avgPrice;
  const currentPrice = roundPositionMetric(input.avgPrice);
  const currentValueUsd = roundCurrency(nextSize * currentPrice);

  return {
    status: "filled",
    avgPrice: currentPrice,
    filledNotionalUsd:
      input.decision.side === "BUY"
        ? roundCurrency(executionAmount)
        : roundCurrency(executionAmount * currentPrice),
    nextPosition: nextSize <= 0
      ? null
      : {
          id: currentPosition?.id ?? input.decision.token_address,
          token_symbol: currentPosition?.token_symbol ?? input.decision.token_symbol,
          pair_slug: currentPosition?.pair_slug ?? input.decision.pair_slug,
          token_address: input.decision.token_address,
          side: currentPosition?.side ?? input.decision.side,
          size: roundPositionMetric(nextSize),
          avg_cost: roundPositionMetric(nextAvgCost),
          current_price: currentPrice,
          current_value_usd: currentValueUsd,
          unrealized_pnl_pct: calculatePaperPositionPnlPct(nextAvgCost, currentPrice),
          stop_loss_pct: input.decision.stop_loss_pct,
          opened_at: currentPosition?.opened_at ?? input.timestampUtc,
          updated_at: input.timestampUtc
        }
  };
}

export const QUEUES = {
  execution: "execution-jobs"
} as const;

export const JOBS = {
  executeTrade: "execute-trade",
  syncPortfolio: "sync-portfolio",
  flattenPortfolio: "flatten-portfolio",
  cancelOpenOrders: "cancel-open-orders"
} as const;
