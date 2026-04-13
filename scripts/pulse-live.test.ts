import { describe, expect, it } from "vitest";
import {
  buildPulseLiveRunIdentityRows,
  buildPulseLiveOverview,
  computeExchangeBuyMinNotionalUsd,
  calculatePositionPnlPct,
  calculatePositionValueUsd,
  isBelowExchangeBuyMinimum,
  isBelowExchangeSellMinimum,
  applyPulseFilters,
  hasPulseFilters,
  parsePulseFilterArgs,
  type PulseFilterArgs
} from "./pulse-live-helpers.ts";

describe("pulse-live helpers", () => {
  it("computes the exchange minimum buy notional from best ask and min order size", () => {
    expect(computeExchangeBuyMinNotionalUsd({
      bestAsk: 0.43,
      minOrderSize: 5
    })).toBeCloseTo(2.15);
  });

  it("returns null when exchange sizing metadata is unavailable", () => {
    expect(computeExchangeBuyMinNotionalUsd({
      bestAsk: null,
      minOrderSize: 5
    })).toBeNull();
  });

  it("builds an overview from collateral and open exposure without capping", () => {
    const overview = buildPulseLiveOverview({
      collateralBalanceUsd: 18,
      positions: [
        {
          id: "position-1",
          event_slug: "demo-event",
          market_slug: "demo-market",
          token_id: "token-1",
          side: "BUY",
          outcome_label: "Yes",
          size: 1,
          avg_cost: 0.4,
          current_price: 0.6,
          current_value_usd: 0.6,
          unrealized_pnl_pct: 0.5,
          stop_loss_pct: 0.3,
          opened_at: "2026-03-16T00:00:00.000Z",
          updated_at: "2026-03-16T00:00:00.000Z"
        }
      ]
    });

    expect(overview.cash_balance_usd).toBe(18);
    expect(overview.total_equity_usd).toBe(18.6);
    expect(overview.open_positions).toBe(1);
  });

  it("uses actual equity even when it exceeds what would have been a static cap", () => {
    const overview = buildPulseLiveOverview({
      collateralBalanceUsd: 500,
      positions: [
        {
          id: "position-1",
          event_slug: "demo-event",
          market_slug: "demo-market",
          token_id: "token-1",
          side: "BUY",
          outcome_label: "Yes",
          size: 100,
          avg_cost: 0.4,
          current_price: 0.6,
          current_value_usd: 60,
          unrealized_pnl_pct: 0.5,
          stop_loss_pct: 0.3,
          opened_at: "2026-03-16T00:00:00.000Z",
          updated_at: "2026-03-16T00:00:00.000Z"
        }
      ]
    });

    expect(overview.cash_balance_usd).toBe(500);
    expect(overview.total_equity_usd).toBe(560);
    expect(overview.high_water_mark_usd).toBe(560);
  });

  it("blocks buys below the exchange minimum order size", () => {
    expect(isBelowExchangeBuyMinimum({
      notionalUsd: 1.2,
      bestAsk: 0.43,
      minOrderSize: 5
    })).toBe(true);
    expect(isBelowExchangeBuyMinimum({
      notionalUsd: 2.15,
      bestAsk: 0.43,
      minOrderSize: 5
    })).toBe(false);
  });

  it("blocks sells below the exchange minimum share size", () => {
    expect(isBelowExchangeSellMinimum({
      size: 4.9,
      minOrderSize: 5
    })).toBe(true);
    expect(isBelowExchangeSellMinimum({
      size: 5,
      minOrderSize: 5
    })).toBe(false);
  });

  it("surfaces execution mode and decision strategy in terminal summary rows", () => {
    expect(buildPulseLiveRunIdentityRows({
      executionMode: "live",
      decisionStrategy: "pulse-direct"
    })).toEqual([
      ["Execution Mode", "live"],
      ["Decision Strategy", "pulse-direct"]
    ]);
  });

  it("computes position value and pnl from market price", () => {
    expect(calculatePositionValueUsd(2, 0.37)).toBeCloseTo(0.74);
    expect(calculatePositionPnlPct(0.4, 0.5)).toBeCloseTo(0.25);
  });
});

const noFilters: PulseFilterArgs = {
  category: null,
  tag: null,
  minProb: null,
  maxProb: null,
  minLiquidity: null
};

function makeCandidate(overrides: {
  categorySlug?: string | null;
  tags?: Array<{ slug: string }>;
  outcomePrices?: number[];
  liquidityUsd?: number;
} = {}) {
  return {
    question: "Will X happen?",
    categorySlug: overrides.categorySlug ?? null,
    tags: overrides.tags ?? [],
    outcomePrices: overrides.outcomePrices ?? [0.5, 0.5],
    liquidityUsd: overrides.liquidityUsd ?? 1000
  };
}

describe("hasPulseFilters", () => {
  it("returns false when no filters are set", () => {
    expect(hasPulseFilters(noFilters)).toBe(false);
  });

  it("returns true when category filter is set", () => {
    expect(hasPulseFilters({ ...noFilters, category: "sports" })).toBe(true);
  });

  it("returns true when tag filter is set", () => {
    expect(hasPulseFilters({ ...noFilters, tag: "nba" })).toBe(true);
  });

  it("returns true when probability range filter is set", () => {
    expect(hasPulseFilters({ ...noFilters, minProb: 0.1 })).toBe(true);
    expect(hasPulseFilters({ ...noFilters, maxProb: 0.9 })).toBe(true);
  });

  it("returns true when min-liquidity filter is set", () => {
    expect(hasPulseFilters({ ...noFilters, minLiquidity: 5000 })).toBe(true);
  });
});

describe("applyPulseFilters", () => {
  it("returns all candidates when no filters are set", () => {
    const candidates = [makeCandidate(), makeCandidate()];
    expect(applyPulseFilters(candidates, noFilters)).toHaveLength(2);
  });

  it("filters by category slug", () => {
    const candidates = [
      makeCandidate({ categorySlug: "sports" }),
      makeCandidate({ categorySlug: "politics" }),
      makeCandidate({ categorySlug: "sports" })
    ];
    const result = applyPulseFilters(candidates, { ...noFilters, category: "sports" });
    expect(result).toHaveLength(2);
    expect(result.every((c) => c.categorySlug === "sports")).toBe(true);
  });

  it("filters by tag slug", () => {
    const candidates = [
      makeCandidate({ tags: [{ slug: "nba" }, { slug: "basketball" }] }),
      makeCandidate({ tags: [{ slug: "bitcoin" }] }),
      makeCandidate({ tags: [] })
    ];
    const result = applyPulseFilters(candidates, { ...noFilters, tag: "nba" });
    expect(result).toHaveLength(1);
  });

  it("filters by minimum probability (maxPrice must be >= minProb)", () => {
    const candidates = [
      makeCandidate({ outcomePrices: [0.05, 0.95] }),
      makeCandidate({ outcomePrices: [0.50, 0.50] }),
      makeCandidate({ outcomePrices: [0.08, 0.92] })
    ];
    const result = applyPulseFilters(candidates, { ...noFilters, minProb: 0.93 });
    expect(result).toHaveLength(1);
    expect(result[0].outcomePrices).toEqual([0.05, 0.95]);
  });

  it("filters by maximum probability (minPrice must be <= maxProb)", () => {
    const candidates = [
      makeCandidate({ outcomePrices: [0.95, 0.05] }),
      makeCandidate({ outcomePrices: [0.50, 0.50] }),
      makeCandidate({ outcomePrices: [0.92, 0.08] })
    ];
    const result = applyPulseFilters(candidates, { ...noFilters, maxProb: 0.06 });
    expect(result).toHaveLength(1);
    expect(result[0].outcomePrices).toEqual([0.95, 0.05]);
  });

  it("filters by minimum liquidity", () => {
    const candidates = [
      makeCandidate({ liquidityUsd: 500 }),
      makeCandidate({ liquidityUsd: 5000 }),
      makeCandidate({ liquidityUsd: 10000 })
    ];
    const result = applyPulseFilters(candidates, { ...noFilters, minLiquidity: 3000 });
    expect(result).toHaveLength(2);
  });

  it("applies multiple filters together", () => {
    const candidates = [
      makeCandidate({ categorySlug: "sports", tags: [{ slug: "nba" }], outcomePrices: [0.3, 0.7], liquidityUsd: 5000 }),
      makeCandidate({ categorySlug: "sports", tags: [{ slug: "nba" }], outcomePrices: [0.85, 0.15], liquidityUsd: 5000 }),
      makeCandidate({ categorySlug: "politics", tags: [{ slug: "nba" }], outcomePrices: [0.3, 0.7], liquidityUsd: 5000 }),
      makeCandidate({ categorySlug: "sports", tags: [{ slug: "hockey" }], outcomePrices: [0.3, 0.7], liquidityUsd: 5000 })
    ];
    const result = applyPulseFilters(candidates, {
      category: "sports",
      tag: "nba",
      minProb: 0.20,
      maxProb: 0.14,
      minLiquidity: 1000
    });
    // candidate 1: sports+nba, prices [0.3, 0.7] -> minPrice 0.3 > maxProb 0.14 -> FILTERED
    // candidate 2: sports+nba, prices [0.85, 0.15] -> minPrice 0.15 > maxProb 0.14 -> FILTERED
    expect(result).toHaveLength(0);
  });

  it("passes candidates matching all filter criteria", () => {
    const candidates = [
      makeCandidate({ categorySlug: "sports", tags: [{ slug: "nba" }], outcomePrices: [0.4, 0.6], liquidityUsd: 5000 }),
      makeCandidate({ categorySlug: "sports", tags: [{ slug: "nba" }], outcomePrices: [0.02, 0.98], liquidityUsd: 5000 }),
      makeCandidate({ categorySlug: "politics", tags: [{ slug: "nba" }], outcomePrices: [0.4, 0.6], liquidityUsd: 5000 }),
      makeCandidate({ categorySlug: "sports", tags: [{ slug: "hockey" }], outcomePrices: [0.4, 0.6], liquidityUsd: 200 })
    ];
    const result = applyPulseFilters(candidates, {
      category: "sports",
      tag: "nba",
      minProb: 0.50,
      maxProb: null,
      minLiquidity: 1000
    });
    // candidate 1: sports+nba, maxPrice 0.6 >= 0.50 -> PASS, liquidity 5000 >= 1000 -> PASS
    // candidate 2: sports+nba, maxPrice 0.98 >= 0.50 -> PASS, liquidity 5000 >= 1000 -> PASS
    // candidate 3: politics -> FILTERED by category
    // candidate 4: hockey -> FILTERED by tag
    expect(result).toHaveLength(2);
    expect(result.every((c) => c.categorySlug === "sports")).toBe(true);
  });

  it("does not mutate the original array", () => {
    const candidates = [
      makeCandidate({ categorySlug: "sports" }),
      makeCandidate({ categorySlug: "politics" })
    ];
    const original = [...candidates];
    applyPulseFilters(candidates, { ...noFilters, category: "sports" });
    expect(candidates).toEqual(original);
  });
});

describe("parsePulseFilterArgs", () => {
  it("parses --category flag", () => {
    const filters = parsePulseFilterArgs(["--category", "sports"]);
    expect(filters.category).toBe("sports");
  });

  it("parses --tag flag", () => {
    const filters = parsePulseFilterArgs(["--tag", "nba"]);
    expect(filters.tag).toBe("nba");
  });

  it("parses --min-prob and --max-prob flags", () => {
    const filters = parsePulseFilterArgs(["--min-prob", "0.10", "--max-prob", "0.90"]);
    expect(filters.minProb).toBeCloseTo(0.10);
    expect(filters.maxProb).toBeCloseTo(0.90);
  });

  it("parses --min-liquidity flag", () => {
    const filters = parsePulseFilterArgs(["--min-liquidity", "5000"]);
    expect(filters.minLiquidity).toBe(5000);
  });

  it("returns null for unspecified filter flags", () => {
    const filters = parsePulseFilterArgs(["--recommend-only"]);
    expect(filters).toEqual({
      category: null,
      tag: null,
      minProb: null,
      maxProb: null,
      minLiquidity: null
    });
  });

  it("combines multiple filter flags", () => {
    const filters = parsePulseFilterArgs(["--recommend-only", "--json", "--category", "sports", "--min-prob", "0.20"]);
    expect(filters.category).toBe("sports");
    expect(filters.minProb).toBeCloseTo(0.20);
    expect(filters.tag).toBeNull();
    expect(filters.maxProb).toBeNull();
    expect(filters.minLiquidity).toBeNull();
  });

  it("ignores non-numeric values for numeric flags", () => {
    const filters = parsePulseFilterArgs(["--min-prob", "abc"]);
    expect(filters.minProb).toBeNull();
  });
});
