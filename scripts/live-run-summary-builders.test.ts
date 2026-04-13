import { describe, expect, it } from "vitest";
import {
  mapBlockedItemToSummaryBlockedItem,
  mapDecisionToSummaryDecision,
  mapExecutedOrderToSummaryOrder,
  mapExecutionEventToSummaryOrder,
  mapQueuedTradeToSummaryPlan,
  mapPulseLivePlanToSummaryPlan
} from "./live-run-summary-builders.ts";

describe("live run summary builders", () => {
  it("maps provider decisions and queued trades into summary models", () => {
    const decision = {
      action: "open" as const,
      market_slug: "demo-market",
      event_slug: "demo-event",
      token_id: "token-1",
      side: "BUY" as const,
      notional_usd: 2,
      thesis_md: "Positive edge."
    };

    expect(mapDecisionToSummaryDecision(decision)).toEqual({
      action: "open",
      marketSlug: "demo-market",
      eventSlug: "demo-event",
      tokenId: "token-1",
      side: "BUY",
      notionalUsd: 2,
      thesisMd: "Positive edge."
    });

    expect(mapQueuedTradeToSummaryPlan({ decision }, 20)).toEqual({
      action: "open",
      marketSlug: "demo-market",
      eventSlug: "demo-event",
      tokenId: "token-1",
      side: "BUY",
      notionalUsd: 2,
      bankrollRatio: 0.1,
      thesisMd: "Positive edge."
    });
  });

  it("maps pulse-live plans and executed orders into summary models", () => {
    expect(mapPulseLivePlanToSummaryPlan({
      action: "open",
      marketSlug: "demo-market",
      eventSlug: "demo-event",
      tokenId: "token-1",
      side: "BUY",
      notionalUsd: 1,
      bankrollRatio: 0.05,
      thesisMd: "Open one token."
    })).toEqual({
      action: "open",
      marketSlug: "demo-market",
      eventSlug: "demo-event",
      tokenId: "token-1",
      side: "BUY",
      notionalUsd: 1,
      bankrollRatio: 0.05,
      thesisMd: "Open one token."
    });

    expect(mapExecutedOrderToSummaryOrder({
      action: "open",
      marketSlug: "demo-market",
      tokenId: "token-1",
      side: "BUY",
      notionalUsd: 1,
      executionAmount: 1,
      unit: "usd",
      filledNotionalUsd: 0.99,
      orderId: "order-1",
      avgPrice: 0.99,
      ok: true
    })).toEqual({
      action: "open",
      marketSlug: "demo-market",
      tokenId: "token-1",
      side: "BUY",
      requestedNotionalUsd: 1,
      executionAmount: 1,
      executionUnit: "usd",
      filledNotionalUsd: 0.99,
      orderId: "order-1",
      avgPrice: 0.99,
      ok: true
    });
  });

  it("maps execution events and blocked items into summary models", () => {
    expect(mapExecutionEventToSummaryOrder({
      marketSlug: "demo-market",
      tokenId: "token-1",
      side: "BUY",
      requestedNotionalUsd: 2,
      filledNotionalUsd: 1.98,
      avgPrice: 0.99,
      orderId: "order-2",
      status: "filled"
    })).toEqual({
      marketSlug: "demo-market",
      tokenId: "token-1",
      side: "BUY",
      requestedNotionalUsd: 2,
      filledNotionalUsd: 1.98,
      avgPrice: 0.99,
      orderId: "order-2",
      status: "filled",
      ok: true
    });

    expect(mapBlockedItemToSummaryBlockedItem({
      action: "open",
      marketSlug: "blocked-market",
      tokenId: "token-2",
      reason: "guardrails removed the open decision"
    })).toEqual({
      action: "open",
      marketSlug: "blocked-market",
      tokenId: "token-2",
      reason: "guardrails removed the open decision"
    });
  });
});
