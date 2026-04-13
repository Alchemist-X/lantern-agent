import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { chooseOrderType } from "./execution-planning.js";

beforeEach(() => {
  vi.stubEnv("ENABLE_LIMIT_ORDERS", "true");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("chooseOrderType", () => {
  describe("returns SWAP for time-critical actions", () => {
    it("uses SWAP for close actions", () => {
      const result = chooseOrderType({
        action: "close",
        side: "SELL",
        bestBid: 0.80,
        bestAsk: 0.82,
        feeRate: 0.04
      });
      expect(result.orderType).toBe("SWAP");
      expect(result.gtcLimitPrice).toBeNull();
    });

    it("uses SWAP for reduce actions", () => {
      const result = chooseOrderType({
        action: "reduce",
        side: "SELL",
        bestBid: 0.80,
        bestAsk: 0.82,
        feeRate: 0.04
      });
      expect(result.orderType).toBe("SWAP");
    });
  });

  describe("returns SWAP for fee-free markets", () => {
    it("uses SWAP when negRisk is true", () => {
      const result = chooseOrderType({
        action: "open",
        side: "BUY",
        bestBid: 0.80,
        bestAsk: 0.82,
        negRisk: true,
        feeRate: 0
      });
      expect(result.orderType).toBe("SWAP");
    });

    it("uses SWAP when feeRate is 0 (geopolitics)", () => {
      const result = chooseOrderType({
        action: "open",
        side: "BUY",
        bestBid: 0.50,
        bestAsk: 0.52,
        negRisk: false,
        feeRate: 0
      });
      expect(result.orderType).toBe("SWAP");
    });
  });

  describe("returns SWAP for wide spreads", () => {
    it("uses SWAP when spread exceeds 5%", () => {
      // spread = (0.60 - 0.50) / 0.60 = 16.7%
      const result = chooseOrderType({
        action: "open",
        side: "BUY",
        bestBid: 0.50,
        bestAsk: 0.60,
        feeRate: 0.04
      });
      expect(result.orderType).toBe("SWAP");
    });
  });

  describe("returns LIMIT for fee-bearing open orders with reasonable spread", () => {
    it("uses LIMIT for politics market with tight spread", () => {
      const result = chooseOrderType({
        action: "open",
        side: "BUY",
        bestBid: 0.580,
        bestAsk: 0.585,
        feeRate: 0.04
      });
      expect(result.orderType).toBe("LIMIT");
      // Spread ~0.85% → tight → bid + 1 tick
      expect(result.gtcLimitPrice).toBe(0.581);
    });

    it("uses LIMIT with mid-price for normal spread", () => {
      // spread = (0.82 - 0.78) / 0.82 = 4.9%
      const result = chooseOrderType({
        action: "open",
        side: "BUY",
        bestBid: 0.780,
        bestAsk: 0.820,
        feeRate: 0.04
      });
      expect(result.orderType).toBe("LIMIT");
      // Spread ~4.9%, > 3% → bid + 30% of spread = 0.780 + 0.012 = 0.792
      expect(result.gtcLimitPrice).toBe(0.792);
    });

    it("uses LIMIT with mid-price for 2% spread", () => {
      const result = chooseOrderType({
        action: "open",
        side: "BUY",
        bestBid: 0.490,
        bestAsk: 0.500,
        feeRate: 0.072 // crypto
      });
      expect(result.orderType).toBe("LIMIT");
      // Spread 2% → mid-price = 0.495
      expect(result.gtcLimitPrice).toBe(0.495);
    });
  });

  describe("returns SWAP for non-BUY sides", () => {
    it("uses SWAP for SELL open actions", () => {
      const result = chooseOrderType({
        action: "open",
        side: "SELL",
        bestBid: 0.80,
        bestAsk: 0.82,
        feeRate: 0.04
      });
      expect(result.orderType).toBe("SWAP");
    });
  });

  describe("handles missing book data", () => {
    it("uses SWAP when bestBid is null", () => {
      const result = chooseOrderType({
        action: "open",
        side: "BUY",
        bestBid: null,
        bestAsk: 0.82,
        feeRate: 0.04
      });
      expect(result.orderType).toBe("SWAP");
    });

    it("uses SWAP when bestAsk is null", () => {
      const result = chooseOrderType({
        action: "open",
        side: "BUY",
        bestBid: 0.80,
        bestAsk: null,
        feeRate: 0.04
      });
      expect(result.orderType).toBe("SWAP");
    });
  });

  describe("disabled by default", () => {
    it("always returns SWAP when ENABLE_LIMIT_ORDERS is not set", () => {
      vi.stubEnv("ENABLE_LIMIT_ORDERS", "");
      const result = chooseOrderType({
        action: "open",
        side: "BUY",
        bestBid: 0.780,
        bestAsk: 0.800,
        feeRate: 0.04
      });
      expect(result.orderType).toBe("SWAP");
    });
  });
});
