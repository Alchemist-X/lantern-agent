import { describe, expect, it } from "vitest";
import {
  applyTradeGuards,
  applyTradeGuardsDetailed,
  calculateDrawdownPct,
  calculateQuarterKelly,
  shouldHaltForDrawdown
} from "./risk.js";

describe("orchestrator risk helpers", () => {
  it("computes drawdown from high water mark", () => {
    expect(calculateDrawdownPct({ highWaterMarkUsd: 100, totalEquityUsd: 80 })).toBeCloseTo(0.2);
  });

  it("halts once drawdown crosses the configured threshold", () => {
    expect(shouldHaltForDrawdown({ highWaterMarkUsd: 100, totalEquityUsd: 79 }, 0.2)).toBe(true);
  });

  it("derives quarter Kelly sizing", () => {
    const sizing = calculateQuarterKelly({
      aiProb: 0.62,
      marketProb: 0.45,
      bankrollUsd: 1000
    });

    expect(sizing.fullKellyPct).toBeGreaterThan(0);
    expect(sizing.quarterKellyUsd).toBeGreaterThan(0);
  });

  it("clips trade size by exposure and minimum ticket size", () => {
    const amount = applyTradeGuards({
      requestedUsd: 200,
      bankrollUsd: 1000,
      minTradeUsd: 10,
      maxTradePct: 0.05,
      liquidityCapUsd: 120,
      totalExposureUsd: 100,
      maxTotalExposurePct: 0.5,
      openPositions: 1,
      maxPositions: 10
    });

    expect(amount).toBeCloseTo(50);
  });

  it("clips trade size by per-event exposure headroom", () => {
    const amount = applyTradeGuards({
      requestedUsd: 200,
      bankrollUsd: 1000,
      minTradeUsd: 10,
      maxTradePct: 0.1,
      liquidityCapUsd: 200,
      totalExposureUsd: 100,
      maxTotalExposurePct: 0.8,
      eventExposureUsd: 280,
      maxEventExposurePct: 0.3,
      openPositions: 1,
      maxPositions: 10
    });

    expect(amount).toBeCloseTo(20);
  });

  it("clips the Kelly target by liquidity cap before returning the executable amount", () => {
    const amount = applyTradeGuards({
      requestedUsd: 80,
      bankrollUsd: 1000,
      minTradeUsd: 10,
      maxTradePct: 0.2,
      liquidityCapUsd: 35,
      totalExposureUsd: 0,
      maxTotalExposurePct: 1,
      openPositions: 0,
      maxPositions: 10
    });

    expect(amount).toBeCloseTo(35);
  });

  it("allows tiny trades when the configured minimum ticket size is lowered", () => {
    const amount = applyTradeGuards({
      requestedUsd: 0.42,
      bankrollUsd: 20,
      minTradeUsd: 0.01,
      maxTradePct: 0.5,
      liquidityCapUsd: 10,
      totalExposureUsd: 0,
      maxTotalExposurePct: 1,
      openPositions: 0,
      maxPositions: 10
    });

    expect(amount).toBeCloseTo(0.42);
  });
});

describe("applyTradeGuardsDetailed", () => {
  it("identifies total_exposure as the binding constraint", () => {
    const result = applyTradeGuardsDetailed({
      requestedUsd: 200,
      bankrollUsd: 1000,
      minTradeUsd: 10,
      maxTradePct: 0.05,
      liquidityCapUsd: 120,
      totalExposureUsd: 100,
      maxTotalExposurePct: 0.5,
      openPositions: 1,
      maxPositions: 10
    });

    expect(result.amount).toBeCloseTo(50);
    expect(result.bindingConstraint).toBe("max_trade_pct");
    expect(result.constraints.length).toBeGreaterThanOrEqual(5);
  });

  it("identifies max_positions as the binding constraint when at capacity", () => {
    const result = applyTradeGuardsDetailed({
      requestedUsd: 200,
      bankrollUsd: 1000,
      minTradeUsd: 10,
      maxTradePct: 0.5,
      liquidityCapUsd: 200,
      totalExposureUsd: 0,
      maxTotalExposurePct: 1,
      openPositions: 10,
      maxPositions: 10
    });

    expect(result.amount).toBe(0);
    expect(result.bindingConstraint).toBe("max_positions");
  });

  it("identifies event_exposure as the binding constraint", () => {
    const result = applyTradeGuardsDetailed({
      requestedUsd: 200,
      bankrollUsd: 1000,
      minTradeUsd: 10,
      maxTradePct: 0.1,
      liquidityCapUsd: 200,
      totalExposureUsd: 100,
      maxTotalExposurePct: 0.8,
      eventExposureUsd: 280,
      maxEventExposurePct: 0.3,
      openPositions: 1,
      maxPositions: 10
    });

    expect(result.amount).toBeCloseTo(20);
    expect(result.bindingConstraint).toBe("event_exposure");
  });

  it("identifies liquidity_cap as the binding constraint", () => {
    const result = applyTradeGuardsDetailed({
      requestedUsd: 80,
      bankrollUsd: 1000,
      minTradeUsd: 10,
      maxTradePct: 0.2,
      liquidityCapUsd: 35,
      totalExposureUsd: 0,
      maxTotalExposurePct: 1,
      openPositions: 0,
      maxPositions: 10
    });

    expect(result.amount).toBeCloseTo(35);
    expect(result.bindingConstraint).toBe("liquidity_cap");
  });

  it("identifies min_trade as the binding constraint when amount is positive but below floor", () => {
    const result = applyTradeGuardsDetailed({
      requestedUsd: 200,
      bankrollUsd: 1000,
      minTradeUsd: 100,
      maxTradePct: 0.05,
      liquidityCapUsd: 200,
      totalExposureUsd: 0,
      maxTotalExposurePct: 1,
      openPositions: 0,
      maxPositions: 10
    });

    expect(result.amount).toBe(0);
    expect(result.bindingConstraint).toBe("min_trade");
  });

  it("includes constraint details with limits and headrooms", () => {
    const result = applyTradeGuardsDetailed({
      requestedUsd: 200,
      bankrollUsd: 1000,
      minTradeUsd: 10,
      maxTradePct: 0.05,
      liquidityCapUsd: 120,
      totalExposureUsd: 400,
      maxTotalExposurePct: 0.5,
      eventExposureUsd: 200,
      maxEventExposurePct: 0.3,
      openPositions: 3,
      maxPositions: 10
    });

    const totalExposure = result.constraints.find((c) => c.label === "total_exposure");
    expect(totalExposure?.limit).toBe(500);
    expect(totalExposure?.headroom).toBe(100);

    const eventExposure = result.constraints.find((c) => c.label === "event_exposure");
    expect(eventExposure?.limit).toBe(300);
    expect(eventExposure?.headroom).toBe(100);

    const maxTrade = result.constraints.find((c) => c.label === "max_trade_pct");
    expect(maxTrade?.limit).toBe(50);
  });

  it("backward-compatible wrapper returns same value as detailed result", () => {
    const input = {
      requestedUsd: 200,
      bankrollUsd: 1000,
      minTradeUsd: 10,
      maxTradePct: 0.05,
      liquidityCapUsd: 120,
      totalExposureUsd: 100,
      maxTotalExposurePct: 0.5,
      openPositions: 1,
      maxPositions: 10
    };

    const simpleResult = applyTradeGuards(input);
    const detailedResult = applyTradeGuardsDetailed(input);

    expect(simpleResult).toBe(detailedResult.amount);
  });
});
