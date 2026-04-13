import type {
  PublicPosition,
  TradeDecision,
  TradeDecisionSet
} from "@lantern/contracts";

export type EdgeAssessment = "yes" | "no";
export type PulseCoverage = "supporting" | "opposing" | "none";
export type PositionReviewBasis =
  | "pulse-supports-current"
  | "pulse-supports-current-weak-edge"
  | "pulse-supports-current-negative-edge"
  | "pulse-opposes-current"
  | "stop-loss-breached"
  | "no-fresh-signal"
  | "near-stop-loss-without-fresh-signal";

export interface PositionReviewResult {
  position: PublicPosition;
  action: "hold" | "close" | "reduce";
  stillHasEdge: boolean;
  edgeAssessment: EdgeAssessment;
  edgeValue: number;
  pulseCoverage: PulseCoverage;
  humanReviewFlag: boolean;
  confidence: TradeDecision["confidence"];
  reason: string;
  reviewConclusion: string;
  suggestedExitPct: number;
  basis: PositionReviewBasis;
  decision: TradeDecision;
}

export interface PulseEntryPlan {
  tokenSymbol: string;
  pairSlug: string;
  tokenAddress: string;
  side: "BUY";
  suggestedPct: number;
  fullKellyPct: number;
  quarterKellyPct: number;
  reportedSuggestedPct: number | null;
  liquidityCapUsd: number | null;
  signalStrength: number;
  momentumScore: number;
  monthlyReturn: number;
  entryFeePct: number;
  roundTripFeePct: number;
  netEdge: number;
  confidence: TradeDecision["confidence"];
  thesisMd: string;
  sources: TradeDecision["sources"];
  decision: TradeDecision;
}

export interface DecisionCompositionResult {
  decisions: TradeDecisionSet["decisions"];
  skippedEntries: Array<{
    pairSlug: string;
    tokenAddress: string;
    reason: string;
  }>;
}
