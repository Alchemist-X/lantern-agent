import { describe, expect, it } from "vitest";
import {
  calculatePositionPnlPct,
  shouldTriggerStopLoss
} from "../services/executor/src/lib/risk.ts";

describe("position monitor stop-loss logic", () => {
  describe("calculatePositionPnlPct", () => {
    it("returns 0% when price equals cost", () => {
      expect(calculatePositionPnlPct(0.85, 0.85)).toBeCloseTo(0, 6);
    });

    it("returns positive pnl when price rises", () => {
      // cost=0.80, price=0.90 → +12.5%
      expect(calculatePositionPnlPct(0.80, 0.90)).toBeCloseTo(0.125, 6);
    });

    it("returns negative pnl when price drops", () => {
      // cost=0.80, price=0.60 → -25%
      expect(calculatePositionPnlPct(0.80, 0.60)).toBeCloseTo(-0.25, 6);
    });

    it("returns 0 when avgCost is 0", () => {
      expect(calculatePositionPnlPct(0, 0.50)).toBe(0);
    });

    it("handles near-zero cost gracefully", () => {
      expect(calculatePositionPnlPct(0.001, 0.0005)).toBeCloseTo(-0.5, 2);
    });
  });

  describe("shouldTriggerStopLoss with 30% threshold", () => {
    const threshold = 0.30;

    it("does NOT trigger at -29% loss", () => {
      // cost=1.00, price=0.71 → pnl = -29%
      expect(shouldTriggerStopLoss(1.00, 0.71, threshold)).toBe(false);
    });

    it("triggers at exactly -30% loss", () => {
      // cost=1.00, price=0.70 → pnl = -30%
      expect(shouldTriggerStopLoss(1.00, 0.70, threshold)).toBe(true);
    });

    it("triggers at -50% loss", () => {
      // cost=0.80, price=0.40 → pnl = -50%
      expect(shouldTriggerStopLoss(0.80, 0.40, threshold)).toBe(true);
    });

    it("does NOT trigger when price rises", () => {
      expect(shouldTriggerStopLoss(0.50, 0.60, threshold)).toBe(false);
    });

    it("does NOT trigger when price unchanged", () => {
      expect(shouldTriggerStopLoss(0.85, 0.85, threshold)).toBe(false);
    });
  });

  describe("real-world scenarios", () => {
    const threshold = 0.30;

    it("Iran market: cost=0.863, price drops to 0.60 → -30.5% → triggers", () => {
      expect(shouldTriggerStopLoss(0.863, 0.60, threshold)).toBe(true);
    });

    it("Iran market: cost=0.863, price=0.97 → +12.4% → safe", () => {
      expect(shouldTriggerStopLoss(0.863, 0.97, threshold)).toBe(false);
    });

    it("FIFA market: cost=0.873, price=0.61 → -30.1% → triggers", () => {
      expect(shouldTriggerStopLoss(0.873, 0.61, threshold)).toBe(true);
    });

    it("FIFA market: cost=0.873, price=0.62 → -29.0% → safe", () => {
      expect(shouldTriggerStopLoss(0.873, 0.62, threshold)).toBe(false);
    });

    it("Rubio market: cost=0.895, price=0.626 → -30.1% → triggers", () => {
      expect(shouldTriggerStopLoss(0.895, 0.626, threshold)).toBe(true);
    });

    it("neg-risk market near $1: cost=0.945, price=0.66 → -30.2% → triggers", () => {
      // Mets: high entry, needs significant drop
      expect(shouldTriggerStopLoss(0.945, 0.66, threshold)).toBe(true);
      expect(shouldTriggerStopLoss(0.945, 0.67, threshold)).toBe(false);
    });
  });
});
