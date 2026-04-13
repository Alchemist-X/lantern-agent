import { describe, expect, it } from "vitest";
import {
  applyPulseFilters,
  calculateCandidateScore,
  filterShortTermPriceMarkets,
  hasPulseFilters,
  lookupTypeWeight,
  sortCandidatesByScore,
  type PulseFilterArgs
} from "./pulse-filters.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeCandidate(overrides: Partial<{
  question: string;
  endDate: string;
  categorySlug: string | null;
  liquidityUsd: number;
  volume24hUsd: number;
  outcomePrices: number[];
  tags: Array<{ slug: string }>;
}> = {}) {
  return {
    question: overrides.question ?? "Will X happen?",
    endDate: overrides.endDate ?? "2026-12-31T00:00:00.000Z",
    categorySlug: overrides.categorySlug ?? null,
    liquidityUsd: overrides.liquidityUsd ?? 10000,
    volume24hUsd: overrides.volume24hUsd ?? 5000,
    outcomePrices: overrides.outcomePrices ?? [0.5, 0.5],
    tags: overrides.tags ?? [],
  };
}

const NOW_MS = new Date("2026-03-31T12:00:00.000Z").getTime();

function daysFromNow(days: number): string {
  return new Date(NOW_MS + days * 24 * 60 * 60 * 1000).toISOString();
}

// ---------------------------------------------------------------------------
// hasPulseFilters
// ---------------------------------------------------------------------------

describe("hasPulseFilters", () => {
  it("returns false when all fields are null", () => {
    const filters: PulseFilterArgs = {
      category: null,
      tag: null,
      minProb: null,
      maxProb: null,
      minLiquidity: null,
    };
    expect(hasPulseFilters(filters)).toBe(false);
  });

  it("returns true when any field is set", () => {
    expect(hasPulseFilters({ category: "politics", tag: null, minProb: null, maxProb: null, minLiquidity: null })).toBe(true);
    expect(hasPulseFilters({ category: null, tag: "elections", minProb: null, maxProb: null, minLiquidity: null })).toBe(true);
    expect(hasPulseFilters({ category: null, tag: null, minProb: 0.1, maxProb: null, minLiquidity: null })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// applyPulseFilters
// ---------------------------------------------------------------------------

describe("applyPulseFilters", () => {
  it("filters by category", () => {
    const candidates = [
      makeCandidate({ categorySlug: "politics" }),
      makeCandidate({ categorySlug: "crypto" }),
    ];
    const result = applyPulseFilters(candidates, {
      category: "politics",
      tag: null,
      minProb: null,
      maxProb: null,
      minLiquidity: null,
    });
    expect(result).toHaveLength(1);
    expect(result[0]!.categorySlug).toBe("politics");
  });

  it("filters by minimum liquidity", () => {
    const candidates = [
      makeCandidate({ liquidityUsd: 3000 }),
      makeCandidate({ liquidityUsd: 15000 }),
    ];
    const result = applyPulseFilters(candidates, {
      category: null,
      tag: null,
      minProb: null,
      maxProb: null,
      minLiquidity: 5000,
    });
    expect(result).toHaveLength(1);
    expect(result[0]!.liquidityUsd).toBe(15000);
  });

  it("returns all candidates when no filters apply", () => {
    const candidates = [makeCandidate(), makeCandidate()];
    const result = applyPulseFilters(candidates, {
      category: null,
      tag: null,
      minProb: null,
      maxProb: null,
      minLiquidity: null,
    });
    expect(result).toHaveLength(2);
  });

  it("does not mutate the input array", () => {
    const candidates = [
      makeCandidate({ categorySlug: "politics" }),
      makeCandidate({ categorySlug: "crypto" }),
    ];
    const original = [...candidates];
    applyPulseFilters(candidates, {
      category: "politics",
      tag: null,
      minProb: null,
      maxProb: null,
      minLiquidity: null,
    });
    expect(candidates).toEqual(original);
  });
});

// ---------------------------------------------------------------------------
// filterShortTermPriceMarkets
// ---------------------------------------------------------------------------

describe("filterShortTermPriceMarkets", () => {
  it("removes crypto markets expiring in < 7 days", () => {
    const candidates = [
      makeCandidate({ categorySlug: "crypto", endDate: daysFromNow(3) }),
      makeCandidate({ categorySlug: "politics", endDate: daysFromNow(3) }),
    ];
    const result = filterShortTermPriceMarkets(candidates, NOW_MS);
    expect(result).toHaveLength(1);
    expect(result[0]!.categorySlug).toBe("politics");
  });

  it("removes stocks markets expiring in < 7 days", () => {
    const candidates = [
      makeCandidate({ categorySlug: "stocks", endDate: daysFromNow(2) }),
    ];
    const result = filterShortTermPriceMarkets(candidates, NOW_MS);
    expect(result).toHaveLength(0);
  });

  it("removes commodities markets expiring in < 7 days", () => {
    const candidates = [
      makeCandidate({ categorySlug: "commodities", endDate: daysFromNow(5) }),
    ];
    const result = filterShortTermPriceMarkets(candidates, NOW_MS);
    expect(result).toHaveLength(0);
  });

  it("keeps crypto markets with >= 7 days to expiry", () => {
    const candidates = [
      makeCandidate({ categorySlug: "crypto", endDate: daysFromNow(10) }),
    ];
    const result = filterShortTermPriceMarkets(candidates, NOW_MS);
    expect(result).toHaveLength(1);
  });

  it("removes price-prediction questions with short expiry regardless of category", () => {
    const priceQuestions = [
      "Will BTC price hit $100,000 by Friday?",
      "Will Ethereum $5,000 by end of week?",
      "Bitcoin up or down this week?",
      "Will SOL $200 before Monday?",
      "Will the price dip below $50,000?",
    ];
    for (const question of priceQuestions) {
      const candidates = [
        makeCandidate({ question, endDate: daysFromNow(2), categorySlug: null }),
      ];
      const result = filterShortTermPriceMarkets(candidates, NOW_MS);
      expect(result).toHaveLength(0);
    }
  });

  it("keeps non-price questions even with short expiry", () => {
    const candidates = [
      makeCandidate({
        question: "Will the Senate pass the infrastructure bill?",
        endDate: daysFromNow(2),
        categorySlug: "politics"
      }),
    ];
    const result = filterShortTermPriceMarkets(candidates, NOW_MS);
    expect(result).toHaveLength(1);
  });

  it("keeps price-prediction questions with long expiry", () => {
    const candidates = [
      makeCandidate({
        question: "Will BTC price hit $200,000 by December?",
        endDate: daysFromNow(60),
        categorySlug: null,
      }),
    ];
    const result = filterShortTermPriceMarkets(candidates, NOW_MS);
    expect(result).toHaveLength(1);
  });

  it("handles invalid endDate gracefully (keeps the candidate)", () => {
    const candidates = [
      makeCandidate({
        question: "Will BTC price hit $100,000?",
        endDate: "invalid-date",
        categorySlug: "crypto",
      }),
    ];
    const result = filterShortTermPriceMarkets(candidates, NOW_MS);
    expect(result).toHaveLength(1);
  });

  it("does not mutate the input array", () => {
    const candidates = [
      makeCandidate({ categorySlug: "crypto", endDate: daysFromNow(1) }),
      makeCandidate({ categorySlug: "politics", endDate: daysFromNow(1) }),
    ];
    const original = [...candidates];
    filterShortTermPriceMarkets(candidates, NOW_MS);
    expect(candidates).toEqual(original);
  });

  it("matches price reach above pattern", () => {
    const candidates = [
      makeCandidate({
        question: "Will the price reach above $10?",
        endDate: daysFromNow(3),
        categorySlug: null,
      }),
    ];
    const result = filterShortTermPriceMarkets(candidates, NOW_MS);
    expect(result).toHaveLength(0);
  });

  it("matches DOGE price pattern", () => {
    const candidates = [
      makeCandidate({
        question: "Will DOGE hit $1 this week?",
        endDate: daysFromNow(3),
        categorySlug: null,
      }),
    ];
    const result = filterShortTermPriceMarkets(candidates, NOW_MS);
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// lookupTypeWeight
// ---------------------------------------------------------------------------

describe("lookupTypeWeight", () => {
  it("returns exact weights for known categories", () => {
    expect(lookupTypeWeight("politics")).toBe(1.5);
    expect(lookupTypeWeight("geopolitics")).toBe(1.5);
    expect(lookupTypeWeight("foreign-policy")).toBe(1.5);
    expect(lookupTypeWeight("tech")).toBe(1.5);
    expect(lookupTypeWeight("ai")).toBe(1.5);
    expect(lookupTypeWeight("economics")).toBe(1.2);
    expect(lookupTypeWeight("finance")).toBe(1.2);
    expect(lookupTypeWeight("sports")).toBe(1.0);
    expect(lookupTypeWeight("esports")).toBe(1.0);
    expect(lookupTypeWeight("culture")).toBe(1.0);
    expect(lookupTypeWeight("crypto")).toBe(0.3);
    expect(lookupTypeWeight("weather")).toBe(0.5);
  });

  it("is case-insensitive", () => {
    expect(lookupTypeWeight("Politics")).toBe(1.5);
    expect(lookupTypeWeight("CRYPTO")).toBe(0.3);
    expect(lookupTypeWeight("  Tech  ")).toBe(1.5);
  });

  it("matches partial aliases", () => {
    expect(lookupTypeWeight("us-election-2026")).toBe(1.5);
    expect(lookupTypeWeight("trump-impeachment")).toBe(1.5);
    expect(lookupTypeWeight("nba-playoffs")).toBe(1.0);
    expect(lookupTypeWeight("bitcoin-price")).toBe(0.3);
    expect(lookupTypeWeight("fed-rate")).toBe(1.2);
    expect(lookupTypeWeight("hurricane-season")).toBe(0.5);
    expect(lookupTypeWeight("oscar-winners")).toBe(1.0);
    expect(lookupTypeWeight("stock-market")).toBe(1.2);
    expect(lookupTypeWeight("ai-regulation")).toBe(1.5);
  });

  it("falls back to 0.8 (other) for null, empty, or unknown categories", () => {
    expect(lookupTypeWeight(null)).toBe(0.8);
    expect(lookupTypeWeight(undefined)).toBe(0.8);
    expect(lookupTypeWeight("")).toBe(0.8);
    expect(lookupTypeWeight("   ")).toBe(0.8);
    expect(lookupTypeWeight("some-random-slug")).toBe(0.8);
  });
});

// ---------------------------------------------------------------------------
// calculateCandidateScore
// ---------------------------------------------------------------------------

describe("calculateCandidateScore", () => {
  it("returns higher score for politics than crypto at same liquidity", () => {
    const politics = calculateCandidateScore({
      liquidityUsd: 50000,
      volume24hUsd: 20000,
      categorySlug: "politics",
    });
    const crypto = calculateCandidateScore({
      liquidityUsd: 50000,
      volume24hUsd: 20000,
      categorySlug: "crypto",
    });
    expect(politics).toBeGreaterThan(crypto);
    expect(politics / crypto).toBeCloseTo(1.5 / 0.3, 1);
  });

  it("returns zero when both liquidity and volume are zero", () => {
    expect(calculateCandidateScore({
      liquidityUsd: 0,
      volume24hUsd: 0,
      categorySlug: "politics",
    })).toBe(0);
  });

  it("handles zero volume gracefully (log10(1) = 0 => score = 0)", () => {
    expect(calculateCandidateScore({
      liquidityUsd: 10000,
      volume24hUsd: 0,
      categorySlug: "politics",
    })).toBe(0);
  });

  it("uses log10 scaling so massive liquidity does not dominate", () => {
    const moderate = calculateCandidateScore({
      liquidityUsd: 100_000,
      volume24hUsd: 50_000,
      categorySlug: "politics",
    });
    const massive = calculateCandidateScore({
      liquidityUsd: 10_000_000,
      volume24hUsd: 5_000_000,
      categorySlug: "crypto",
    });
    // politics (1.5 weight) with moderate liquidity should compete
    // against crypto (0.3 weight) with 100x more liquidity
    // log10(100001) * log10(50001) * 1.5 vs log10(10000001) * log10(5000001) * 0.3
    // ~5.0 * ~4.7 * 1.5 = ~35.25 vs ~7.0 * ~6.7 * 0.3 = ~14.07
    expect(moderate).toBeGreaterThan(massive);
  });

  it("uses default weight for null category", () => {
    const withNull = calculateCandidateScore({
      liquidityUsd: 10000,
      volume24hUsd: 5000,
      categorySlug: null,
    });
    const withOther = calculateCandidateScore({
      liquidityUsd: 10000,
      volume24hUsd: 5000,
      categorySlug: "other",
    });
    expect(withNull).toBeCloseTo(withOther, 6);
  });
});

// ---------------------------------------------------------------------------
// sortCandidatesByScore
// ---------------------------------------------------------------------------

describe("sortCandidatesByScore", () => {
  it("sorts candidates by descending composite score", () => {
    const candidates = [
      makeCandidate({ categorySlug: "crypto", liquidityUsd: 50000, volume24hUsd: 20000 }),
      makeCandidate({ categorySlug: "politics", liquidityUsd: 50000, volume24hUsd: 20000 }),
      makeCandidate({ categorySlug: "weather", liquidityUsd: 50000, volume24hUsd: 20000 }),
    ];
    const sorted = sortCandidatesByScore(candidates);
    expect(sorted[0]!.categorySlug).toBe("politics");
    expect(sorted[1]!.categorySlug).toBe("weather");
    expect(sorted[2]!.categorySlug).toBe("crypto");
  });

  it("does not mutate the input array", () => {
    const candidates = [
      makeCandidate({ categorySlug: "crypto", liquidityUsd: 50000, volume24hUsd: 20000 }),
      makeCandidate({ categorySlug: "politics", liquidityUsd: 50000, volume24hUsd: 20000 }),
    ];
    const original = [...candidates];
    sortCandidatesByScore(candidates);
    expect(candidates).toEqual(original);
  });

  it("returns empty array for empty input", () => {
    expect(sortCandidatesByScore([])).toEqual([]);
  });

  it("allows high-liquidity lower-weight to outrank low-liquidity higher-weight", () => {
    const candidates = [
      makeCandidate({ categorySlug: "politics", liquidityUsd: 100, volume24hUsd: 50 }),
      makeCandidate({ categorySlug: "crypto", liquidityUsd: 10_000_000, volume24hUsd: 5_000_000 }),
    ];
    const sorted = sortCandidatesByScore(candidates);
    // crypto has massive liquidity; even with 0.3 weight it should beat
    // politics with tiny liquidity
    expect(sorted[0]!.categorySlug).toBe("crypto");
    expect(sorted[1]!.categorySlug).toBe("politics");
  });
});
