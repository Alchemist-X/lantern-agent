import type { TradeDecision } from "@lantern/contracts";
import type {
  SummaryBlockedItem,
  SummaryDecision,
  SummaryOrder,
  SummaryPlan
} from "./live-run-summary.ts";

type DecisionLike = Pick<
  TradeDecision,
  "action" | "pair_slug" | "token_symbol" | "token_address" | "side" | "notional_usd" | "thesis_md"
>;

type QueueTradeLike = {
  decision: DecisionLike;
};

type PulseLivePlanLike = {
  action: TradeDecision["action"];
  marketSlug: string;
  eventSlug?: string;
  tokenId?: string;
  side?: TradeDecision["side"];
  notionalUsd: number;
  bankrollRatio?: number | null;
  thesisMd?: string | null;
};

type ExecutionEventLike = {
  marketSlug: string;
  tokenId?: string | null;
  side?: TradeDecision["side"] | null;
  requestedNotionalUsd?: number | null;
  filledNotionalUsd?: number | null;
  avgPrice?: number | null;
  orderId?: string | null;
  status?: string | null;
};

type ExecutedOrderLike = {
  action?: TradeDecision["action"] | null;
  marketSlug: string;
  tokenId?: string | null;
  side?: TradeDecision["side"] | null;
  notionalUsd?: number | null;
  executionAmount?: number | null;
  unit?: "usd" | "shares" | null;
  filledNotionalUsd?: number | null;
  orderId?: string | null;
  avgPrice?: number | null;
  ok?: boolean | null;
};

type BlockedItemLike = {
  action?: TradeDecision["action"] | null;
  marketSlug: string;
  tokenId?: string | null;
  reason: string;
};

export function mapDecisionToSummaryDecision(decision: DecisionLike): SummaryDecision {
  return {
    action: decision.action,
    marketSlug: decision.pair_slug,
    eventSlug: decision.token_symbol,
    tokenId: decision.token_address,
    side: decision.side,
    notionalUsd: decision.notional_usd,
    thesisMd: decision.thesis_md
  };
}

export function mapQueuedTradeToSummaryPlan(trade: QueueTradeLike, bankrollUsd: number): SummaryPlan {
  return {
    action: trade.decision.action,
    marketSlug: trade.decision.pair_slug,
    eventSlug: trade.decision.token_symbol,
    tokenId: trade.decision.token_address,
    side: trade.decision.side,
    notionalUsd: trade.decision.notional_usd,
    bankrollRatio: bankrollUsd > 0 ? trade.decision.notional_usd / bankrollUsd : 0,
    thesisMd: trade.decision.thesis_md
  };
}

export function mapPulseLivePlanToSummaryPlan(plan: PulseLivePlanLike): SummaryPlan {
  return {
    action: plan.action,
    marketSlug: plan.marketSlug,
    eventSlug: plan.eventSlug,
    tokenId: plan.tokenId,
    side: plan.side,
    notionalUsd: plan.notionalUsd,
    bankrollRatio: plan.bankrollRatio ?? null,
    thesisMd: plan.thesisMd
  };
}

export function mapExecutionEventToSummaryOrder(event: ExecutionEventLike): SummaryOrder {
  return {
    marketSlug: event.marketSlug,
    tokenId: event.tokenId,
    side: event.side,
    requestedNotionalUsd: event.requestedNotionalUsd,
    filledNotionalUsd: event.filledNotionalUsd,
    avgPrice: event.avgPrice,
    orderId: event.orderId,
    status: event.status,
    ok: event.status === "filled"
  };
}

export function mapExecutedOrderToSummaryOrder(order: ExecutedOrderLike): SummaryOrder {
  return {
    action: order.action,
    marketSlug: order.marketSlug,
    tokenId: order.tokenId,
    side: order.side,
    requestedNotionalUsd: order.notionalUsd,
    executionAmount: order.executionAmount,
    executionUnit: order.unit,
    filledNotionalUsd: order.filledNotionalUsd,
    orderId: order.orderId,
    avgPrice: order.avgPrice,
    ok: order.ok
  };
}

export function mapBlockedItemToSummaryBlockedItem(item: BlockedItemLike): SummaryBlockedItem {
  return {
    action: item.action ?? null,
    marketSlug: item.marketSlug,
    tokenId: item.tokenId ?? null,
    reason: item.reason
  };
}
