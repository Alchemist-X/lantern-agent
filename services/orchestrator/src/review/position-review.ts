import type {
  PublicPosition,
  TradeDecision
} from "@lantern/contracts";
import { inferPaperSellAmount } from "@lantern/contracts";
import type { RuntimeExecutionContext } from "../runtime/agent-runtime.js";
import type {
  PositionReviewResult,
  PulseEntryPlan
} from "../runtime/decision-metadata.js";

const STRONG_EDGE_THRESHOLD = 0.05;
const NEGATIVE_EDGE_CLOSE_THRESHOLD = -0.05;
const NEAR_STOP_LOSS_RATIO = 0.7;

function roundCurrency(value: number): number {
  return Number(value.toFixed(4));
}

function roundExecutionAmount(value: number): number {
  return Number(value.toFixed(6));
}

function clampNotional(value: number, max: number): number {
  return Math.max(0.01, Math.min(max, roundCurrency(value)));
}

function buildPositionSource(position: PublicPosition): TradeDecision["sources"][number] {
  return {
    title: "Current position context",
    url: `runtime-context://positions/${position.id}`,
    retrieved_at_utc: new Date().toISOString()
  };
}

function buildHeldSignalScores(position: PublicPosition, plan: PulseEntryPlan | null) {
  if (!plan) {
    return {
      signalStrength: position.current_price,
      momentumScore: position.current_price
    };
  }

  const sameSide = plan.side === position.side;
  return sameSide
    ? {
        signalStrength: plan.signalStrength,
        momentumScore: plan.momentumScore
      }
    : {
        signalStrength: 1 - plan.signalStrength,
        momentumScore: 1 - plan.momentumScore
      };
}

function buildDecision(input: {
  position: PublicPosition;
  action: PositionReviewResult["action"];
  side: TradeDecision["side"];
  signalStrength: number;
  momentumScore: number;
  confidence: TradeDecision["confidence"];
  thesisMd: string;
  sources: TradeDecision["sources"];
  notionalUsd?: number;
}): TradeDecision {
  const positionValueUsd = roundCurrency(input.position.current_value_usd);
  const notionalUsd = clampNotional(input.notionalUsd ?? input.position.current_value_usd, input.position.current_value_usd);
  const executionAmount = inferPaperSellAmount(input.position, {
    action: input.action,
    notional_usd: notionalUsd
  });
  const shouldDescribeExecution = input.side === "SELL" && input.action !== "hold";

  return {
    action: input.action,
    token_symbol: input.position.token_symbol,
    pair_slug: input.position.pair_slug,
    token_address: input.position.token_address,
    side: input.side,
    notional_usd: notionalUsd,
    order_type: "SWAP",
    signal_strength: input.signalStrength,
    momentum_score: input.momentumScore,
    edge: roundCurrency(input.signalStrength - input.momentumScore),
    confidence: input.confidence,
    thesis_md: input.thesisMd,
    sources: input.sources,
    position_value_usd: shouldDescribeExecution ? positionValueUsd : undefined,
    execution_amount: shouldDescribeExecution && executionAmount > 0 ? roundExecutionAmount(executionAmount) : undefined,
    execution_unit: shouldDescribeExecution && executionAmount > 0 ? "shares" : undefined,
    stop_loss_pct: input.position.stop_loss_pct
  };
}

function findRelevantPulsePlan(position: PublicPosition, plans: PulseEntryPlan[]) {
  const relevant = plans.filter(
    (plan) => plan.pairSlug === position.pair_slug || plan.tokenAddress === position.token_address
  );
  const matching = relevant.find((plan) => plan.tokenAddress === position.token_address && plan.side === position.side);
  const opposing = relevant.find((plan) => plan.tokenAddress === position.token_address && plan.side !== position.side);
  return {
    matching: matching ?? null,
    opposing: opposing ?? null
  };
}

function calculateReduceNotional(position: PublicPosition): number {
  return clampNotional(Math.max(position.current_value_usd / 2, 0.01), position.current_value_usd);
}

function classifyMatchingPlan(input: {
  position: PublicPosition;
  matching: PulseEntryPlan;
}): Pick<
  PositionReviewResult,
  | "action"
  | "stillHasEdge"
  | "edgeAssessment"
  | "edgeValue"
  | "pulseCoverage"
  | "humanReviewFlag"
  | "confidence"
  | "reason"
  | "reviewConclusion"
  | "suggestedExitPct"
  | "basis"
> & {
  signalStrength: number;
  momentumScore: number;
  thesisMd: string;
  sources: TradeDecision["sources"];
  side: TradeDecision["side"];
  notionalUsd?: number;
} {
  const heldSignals = buildHeldSignalScores(input.position, input.matching);
  const edgeValue = roundCurrency(heldSignals.signalStrength - heldSignals.momentumScore);

  if (edgeValue <= NEGATIVE_EDGE_CLOSE_THRESHOLD) {
    return {
      action: "close",
      stillHasEdge: false,
      edgeAssessment: "no",
      edgeValue,
      pulseCoverage: "supporting",
      humanReviewFlag: true,
      confidence: input.matching.confidence,
      reason: `Pulse still covers ${input.position.token_symbol}, but the refreshed edge turned materially negative (${edgeValue.toFixed(4)}).`,
      reviewConclusion: `Close the position because the refreshed Pulse view no longer justifies holding ${input.position.token_symbol} at the current price.`,
      suggestedExitPct: 1,
      basis: "pulse-supports-current-negative-edge",
      signalStrength: heldSignals.signalStrength,
      momentumScore: heldSignals.momentumScore,
      thesisMd: `Pulse still references ${input.position.token_symbol}, but the refreshed signal no longer clears market pricing. Exit instead of carrying a negative edge. ${input.matching.thesisMd}`,
      sources: [buildPositionSource(input.position), ...input.matching.sources],
      side: "SELL"
    };
  }

  if (edgeValue < 0) {
    return {
      action: "reduce",
      stillHasEdge: false,
      edgeAssessment: "no",
      edgeValue,
      pulseCoverage: "supporting",
      humanReviewFlag: true,
      confidence: input.matching.confidence,
      reason: `Pulse still references ${input.position.token_symbol}, but the refreshed edge is slightly negative (${edgeValue.toFixed(4)}), so the position should be trimmed rather than left unchanged.`,
      reviewConclusion: "Reduce the position because the thesis is not fully broken, but the edge is no longer good enough to justify full size.",
      suggestedExitPct: 0.5,
      basis: "pulse-supports-current-negative-edge",
      signalStrength: heldSignals.signalStrength,
      momentumScore: heldSignals.momentumScore,
      thesisMd: `Pulse still supports ${input.position.token_symbol}, but only weakly. Trim size and keep the remainder under review. ${input.matching.thesisMd}`,
      sources: [buildPositionSource(input.position), ...input.matching.sources],
      side: "SELL",
      notionalUsd: calculateReduceNotional(input.position)
    };
  }

  if (edgeValue < STRONG_EDGE_THRESHOLD) {
    return {
      action: "hold",
      stillHasEdge: true,
      edgeAssessment: "yes",
      edgeValue,
      pulseCoverage: "supporting",
      humanReviewFlag: true,
      confidence: input.matching.confidence,
      reason: `Pulse still supports ${input.position.token_symbol}, but the refreshed edge is only ${edgeValue.toFixed(4)} and should be watched.`,
      reviewConclusion: "Keep the position for now, but flag it for human review because the edge has become weak.",
      suggestedExitPct: 0,
      basis: "pulse-supports-current-weak-edge",
      signalStrength: heldSignals.signalStrength,
      momentumScore: heldSignals.momentumScore,
      thesisMd: `Pulse still supports ${input.position.token_symbol}, but only with a weak residual edge. Hold for now and review sizing manually. ${input.matching.thesisMd}`,
      sources: [buildPositionSource(input.position), ...input.matching.sources],
      side: input.position.side
    };
  }

  return {
    action: "hold",
    stillHasEdge: true,
    edgeAssessment: "yes",
    edgeValue,
    pulseCoverage: "supporting",
    humanReviewFlag: false,
    confidence: input.matching.confidence,
    reason: `Pulse still supports ${input.position.token_symbol} with a positive refreshed edge (${edgeValue.toFixed(4)}).`,
    reviewConclusion: "Keep the position because Pulse still defends the held side and the refreshed edge remains positive.",
    suggestedExitPct: 0,
    basis: "pulse-supports-current",
    signalStrength: heldSignals.signalStrength,
    momentumScore: heldSignals.momentumScore,
    thesisMd: `Pulse still supports the current ${input.position.token_symbol} position. ${input.matching.thesisMd}`,
    sources: [buildPositionSource(input.position), ...input.matching.sources],
    side: input.position.side
  };
}

export function reviewCurrentPositions(input: {
  context: RuntimeExecutionContext;
  entryPlans: PulseEntryPlan[];
}): PositionReviewResult[] {
  const results: PositionReviewResult[] = [];

  for (const position of input.context.positions) {
    const { matching, opposing } = findRelevantPulsePlan(position, input.entryPlans);

    if (position.unrealized_pnl_pct <= -position.stop_loss_pct) {
      const signalStr = Math.max(0, position.current_price - Math.abs(position.unrealized_pnl_pct));
      const decision = buildDecision({
        position,
        action: "close",
        side: "SELL",
        signalStrength: signalStr,
        momentumScore: position.current_price,
        confidence: "medium",
        thesisMd: `This position breached the configured stop-loss threshold (${(position.stop_loss_pct * 100).toFixed(1)}%), so the portfolio review exits it even without waiting for a fresh pulse contradiction.`,
        sources: [buildPositionSource(position)]
      });
      results.push({
        position,
        action: "close",
        stillHasEdge: false,
        edgeAssessment: "no",
        edgeValue: roundCurrency(signalStr - position.current_price),
        pulseCoverage: "none",
        humanReviewFlag: false,
        confidence: "medium",
        reason: "Position breached the configured stop-loss threshold.",
        reviewConclusion: "Close the position because it already breached the configured stop-loss threshold.",
        suggestedExitPct: 1,
        basis: "stop-loss-breached",
        decision
      });
      continue;
    }

    if (opposing) {
      const heldSignals = buildHeldSignalScores(position, opposing);
      const decision = buildDecision({
        position,
        action: "close",
        side: "SELL",
        signalStrength: heldSignals.signalStrength,
        momentumScore: heldSignals.momentumScore,
        confidence: opposing.confidence,
        thesisMd: `Pulse now favors the opposite side for ${position.token_symbol}, so the existing position no longer has a defended edge. ${opposing.thesisMd}`,
        sources: [buildPositionSource(position), ...opposing.sources]
      });
      results.push({
        position,
        action: "close",
        stillHasEdge: false,
        edgeAssessment: "no",
        edgeValue: roundCurrency(heldSignals.signalStrength - heldSignals.momentumScore),
        pulseCoverage: "opposing",
        humanReviewFlag: true,
        confidence: opposing.confidence,
        reason: `Pulse now favors the opposite side for ${position.token_symbol}.`,
        reviewConclusion: `Close the position because Pulse now prefers the opposite direction for ${position.token_symbol}.`,
        suggestedExitPct: 1,
        basis: "pulse-opposes-current",
        decision
      });
      continue;
    }

    if (matching) {
      const classification = classifyMatchingPlan({ position, matching });
      const decision = buildDecision({
        position,
        action: classification.action,
        side: classification.side,
        signalStrength: classification.signalStrength,
        momentumScore: classification.momentumScore,
        confidence: classification.confidence,
        thesisMd: classification.thesisMd,
        sources: classification.sources,
        notionalUsd: classification.notionalUsd
      });
      results.push({
        position,
        action: classification.action,
        stillHasEdge: classification.stillHasEdge,
        edgeAssessment: classification.edgeAssessment,
        edgeValue: classification.edgeValue,
        pulseCoverage: classification.pulseCoverage,
        humanReviewFlag: classification.humanReviewFlag,
        confidence: classification.confidence,
        reason: classification.reason,
        reviewConclusion: classification.reviewConclusion,
        suggestedExitPct: classification.suggestedExitPct,
        basis: classification.basis,
        decision
      });
      continue;
    }

    const nearStopLoss = position.unrealized_pnl_pct <= -(position.stop_loss_pct * NEAR_STOP_LOSS_RATIO);
    if (nearStopLoss) {
      const decision = buildDecision({
        position,
        action: "reduce",
        side: "SELL",
        signalStrength: position.current_price,
        momentumScore: position.current_price,
        confidence: "low",
        thesisMd: "No fresh Pulse coverage was produced for this position, and it is already approaching the configured stop-loss threshold. Reduce size and flag the remainder for human review.",
        sources: [buildPositionSource(position)],
        notionalUsd: calculateReduceNotional(position)
      });
      results.push({
        position,
        action: "reduce",
        stillHasEdge: false,
        edgeAssessment: "no",
        edgeValue: 0,
        pulseCoverage: "none",
        humanReviewFlag: true,
        confidence: "low",
        reason: "No fresh Pulse support was found and the position is already near its stop-loss threshold.",
        reviewConclusion: "Trim the position because there is no fresh Pulse defense and the downside buffer is already thin.",
        suggestedExitPct: 0.5,
        basis: "near-stop-loss-without-fresh-signal",
        decision
      });
      continue;
    }

    const decision = buildDecision({
      position,
      action: "hold",
      side: position.side,
      signalStrength: position.current_price,
      momentumScore: position.current_price,
      confidence: "low",
      thesisMd: "No contradictory pulse recommendation was produced for this existing position. Keep it unchanged for now, but flag it for human review because no fresh edge refresh was found in the current pulse set.",
      sources: [buildPositionSource(position)]
    });
    results.push({
      position,
      action: "hold",
      stillHasEdge: true,
      edgeAssessment: "yes",
      edgeValue: 0,
      pulseCoverage: "none",
      humanReviewFlag: true,
      confidence: "low",
      reason: "No contradictory pulse signal was found, but there was also no fresh dedicated pulse support.",
      reviewConclusion: "Keep the position unchanged for now, but require human review because no fresh Pulse edge refresh was produced.",
      suggestedExitPct: 0,
      basis: "no-fresh-signal",
      decision
    });
  }

  return results;
}
