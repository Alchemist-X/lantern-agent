import { describe, expect, it } from "vitest";
import { computeMaxBuyNotionalWithinSlippage } from "./execution-planning.js";

describe("computeMaxBuyNotionalWithinSlippage", () => {
  it("returns 0 when the book is empty or null", () => {
    expect(computeMaxBuyNotionalWithinSlippage(null).maxNotionalUsd).toBe(0);
    expect(computeMaxBuyNotionalWithinSlippage([]).maxNotionalUsd).toBe(0);
  });

  it("walks levels within 4% of best ask", () => {
    // bestAsk=0.50, ceiling = 0.50 * 1.04 = 0.52
    // Levels within ceiling: 0.50 (size 100), 0.51 (size 50), 0.52 (size 30)
    // Level 0.53 (size 1000) exceeds ceiling → excluded
    const asks = [
      { price: 0.50, size: 100 },
      { price: 0.51, size: 50 },
      { price: 0.52, size: 30 },
      { price: 0.53, size: 1000 }
    ];
    const result = computeMaxBuyNotionalWithinSlippage(asks, 0.04);
    // 0.50*100 + 0.51*50 + 0.52*30 = 50 + 25.5 + 15.6 = 91.1
    expect(result.maxNotionalUsd).toBeCloseTo(91.1, 2);
    expect(result.worstPrice).toBe(0.52);
    expect(result.levelsConsumed).toBe(3);
  });

  it("stops at the first level that exceeds the slippage ceiling", () => {
    // bestAsk=0.50, ceiling=0.52 at 4%
    // 0.53 > ceiling, so nothing beyond 0.50 is consumed
    const asks = [
      { price: 0.50, size: 20 },
      { price: 0.53, size: 1000 }
    ];
    const result = computeMaxBuyNotionalWithinSlippage(asks, 0.04);
    expect(result.maxNotionalUsd).toBeCloseTo(10, 4);
    expect(result.levelsConsumed).toBe(1);
  });

  it("handles deep liquidity at best ask (entire depth within cap)", () => {
    const asks = [{ price: 0.80, size: 10_000 }];
    const result = computeMaxBuyNotionalWithinSlippage(asks, 0.04);
    expect(result.maxNotionalUsd).toBeCloseTo(8000, 2);
    expect(result.levelsConsumed).toBe(1);
  });

  it("respects custom slippage tolerance (2%)", () => {
    // bestAsk=0.50, ceiling=0.51 at 2%
    const asks = [
      { price: 0.50, size: 100 },
      { price: 0.51, size: 50 },
      { price: 0.52, size: 30 }
    ];
    const result = computeMaxBuyNotionalWithinSlippage(asks, 0.02);
    // Should include 0.50 and 0.51, exclude 0.52
    expect(result.maxNotionalUsd).toBeCloseTo(50 + 25.5, 2);
    expect(result.levelsConsumed).toBe(2);
  });

  it("defaults to 4% slippage when not specified", () => {
    const asks = [
      { price: 1.00, size: 100 },
      { price: 1.03, size: 200 }, // within 4%
      { price: 1.05, size: 1000 } // outside 4%
    ];
    const result = computeMaxBuyNotionalWithinSlippage(asks);
    expect(result.maxNotionalUsd).toBeCloseTo(100 + 206, 2);
    expect(result.levelsConsumed).toBe(2);
  });

  it("handles zero or negative best price defensively", () => {
    const result = computeMaxBuyNotionalWithinSlippage([{ price: 0, size: 100 }]);
    expect(result.maxNotionalUsd).toBe(0);
  });
});
