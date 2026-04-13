import type {
  DecisionCompositionResult,
  PositionReviewResult,
  PulseEntryPlan
} from "./decision-metadata.js";

function canMergeAddOn(input: {
  reviewResult: PositionReviewResult;
  plan: PulseEntryPlan;
}) {
  return input.reviewResult.action === "hold" && input.reviewResult.decision.side === input.plan.side;
}

function mergeAddOnDecision(input: {
  reviewResult: PositionReviewResult;
  plan: PulseEntryPlan;
}) {
  const mergedSources = [...input.reviewResult.decision.sources];
  for (const source of input.plan.decision.sources) {
    if (!mergedSources.some((item) => item.url === source.url && item.title === source.title)) {
      mergedSources.push(source);
    }
  }

  return {
    ...input.plan.decision,
    thesis_md: [
      input.reviewResult.decision.thesis_md,
      "Add-on sizing is allowed for an already-held token when Pulse still supports the same side; final size must still pass the configured bankroll and pair exposure caps.",
      input.plan.decision.thesis_md
    ].join(" "),
    sources: mergedSources
  };
}

export function composePulseDirectDecisions(input: {
  reviewResults: PositionReviewResult[];
  entryPlans: PulseEntryPlan[];
}): DecisionCompositionResult {
  const decisions = input.reviewResults.map((result) => result.decision);
  const reviewResultByAddress = new Map(input.reviewResults.map((result) => [result.position.token_address, result]));
  const decisionIndexByAddress = new Map(decisions.map((decision, index) => [decision.token_address, index]));
  const existingAddresses = new Set(input.reviewResults.map((result) => result.position.token_address));
  const queuedAddresses = new Set(decisions.map((decision) => decision.token_address));
  const skippedEntries: DecisionCompositionResult["skippedEntries"] = [];

  for (const plan of input.entryPlans) {
    if (existingAddresses.has(plan.tokenAddress)) {
      const reviewResult = reviewResultByAddress.get(plan.tokenAddress);
      const decisionIndex = decisionIndexByAddress.get(plan.tokenAddress);
      if (reviewResult && decisionIndex != null && canMergeAddOn({ reviewResult, plan })) {
        decisions[decisionIndex] = mergeAddOnDecision({ reviewResult, plan });
        continue;
      }
      skippedEntries.push({
        pairSlug: plan.pairSlug,
        tokenAddress: plan.tokenAddress,
        reason: reviewResult?.action === "hold"
          ? "entry plan targets an already-held token, but the existing holding could not be merged into an add-on decision"
          : "entry plan targets an already-held token, but portfolio review already prefers reducing or closing it"
      });
      continue;
    }

    if (queuedAddresses.has(plan.tokenAddress)) {
      skippedEntries.push({
        pairSlug: plan.pairSlug,
        tokenAddress: plan.tokenAddress,
        reason: "entry plan duplicated an already-queued token"
      });
      continue;
    }

    decisions.push(plan.decision);
    queuedAddresses.add(plan.tokenAddress);
  }

  return {
    decisions,
    skippedEntries
  };
}
