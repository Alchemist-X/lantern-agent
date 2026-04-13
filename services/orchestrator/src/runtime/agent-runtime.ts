import type { OverviewResponse, PublicPosition, RunMode, TradeDecisionSet } from "@lantern/contracts";
import type { ProgressReporter } from "../lib/terminal-progress.js";
import type { PulseSnapshot } from "../pulse/market-pulse.js";
import type { PositionReviewResult, PulseEntryPlan } from "./decision-metadata.js";

export interface RuntimeExecutionContext {
  runId: string;
  mode: RunMode;
  overview: OverviewResponse;
  positions: PublicPosition[];
  pulse: PulseSnapshot;
  progress?: ProgressReporter;
}

export interface RuntimeExecutionResult {
  decisionSet: TradeDecisionSet;
  promptSummary: string;
  reasoningMd: string;
  logsMd: string;
  positionReviews?: PositionReviewResult[];
  entryPlans?: PulseEntryPlan[];
}

export interface AgentRuntime {
  name: string;
  run(context: RuntimeExecutionContext): Promise<RuntimeExecutionResult>;
}
