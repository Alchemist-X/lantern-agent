import type { TradeDecision } from "@lantern/contracts";
import {
  calculateFeePct,
  calculateNetEdge,
  calculateRoundTripFeePct,
  lookupCategoryFeeParams
} from "../lib/fees.js";
import { calculateQuarterKelly } from "../lib/risk.js";
import type { RuntimeExecutionContext } from "./agent-runtime.js";
import type { PulseEntryPlan } from "./decision-metadata.js";

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function roundCurrency(value: number): number {
  return Number(value.toFixed(4));
}

function roundPct(value: number): number {
  return Number(value.toFixed(6));
}

function normalizeConfidence(raw: string) {
  const value = raw.trim().toLowerCase();
  if (value.includes("medium-high")) {
    return "medium-high" as const;
  }
  if (value.includes("高") && value.includes("中")) {
    return "medium-high" as const;
  }
  if (value.includes("medium")) {
    return "medium" as const;
  }
  if (value.includes("中")) {
    return "medium" as const;
  }
  if (value.includes("high") || value.includes("高")) {
    return "high" as const;
  }
  return "low" as const;
}

function parseRecommendationSections(markdown: string) {
  const sections: Array<{ title: string; body: string }> = [];
  const matches = [...markdown.matchAll(/^##\s+(?:\d+\.\s+)?(.+)$/gm)];
  for (const [index, match] of matches.entries()) {
    const sectionStart = match.index ?? 0;
    const title = match[1]?.trim();
    const bodyStart = sectionStart + match[0].length + 1;
    const nextSectionStart = matches[index + 1]?.index ?? markdown.length;
    if (!title) {
      continue;
    }
    sections.push({
      title,
      body: markdown.slice(bodyStart, nextSectionStart).trim()
    });
  }
  return sections;
}

function extractSectionValue(body: string, pattern: RegExp) {
  const match = body.match(pattern);
  return match?.[1]?.trim() ?? null;
}

function extractTableValue(body: string, labels: string[]) {
  for (const label of labels) {
    const regex = new RegExp(
      String.raw`^\|\s*(?:\*\*)?${escapeRegExp(label)}(?:\*\*)?\s*[:：]?\s*\|\s*(.+?)\s*\|?$`,
      "gmi"
    );
    const match = regex.exec(body);
    if (match?.[1]?.trim()) {
      return match[1].trim();
    }
  }
  return null;
}

function cleanExtractedValue(value: string) {
  return value.replace(/^\*+\s*/, "").replace(/\s*\*+$/, "").trim();
}

function extractLabeledValue(body: string, labels: string[]) {
  for (const label of labels) {
    const escaped = escapeRegExp(label);
    const patterns = [
      new RegExp(String.raw`\*\*(?:${escaped})\s*[:：]\*\*\s*([^\n|]+)`, "i"),
      new RegExp(String.raw`\*\*(?:${escaped})\*\*\s*[:：]\s*([^\n|]+)`, "i"),
      new RegExp(String.raw`(?:^|\|)\s*(?:\*\*)?${escaped}(?:\*\*)?\s*[:：]\s*([^|\n]+)`, "mi")
    ];
    for (const pattern of patterns) {
      const match = body.match(pattern);
      if (match?.[1]?.trim()) {
        return cleanExtractedValue(match[1]);
      }
    }
  }
  return null;
}

function extractReasoning(body: string) {
  const match = body.match(/###\s+(?:推理逻辑|Reasoning)\s+([\s\S]*?)(?=\n### |\n---|\n##\s+(?:\d+\.\s+)?|\s*$)/i);
  return match?.[1]?.trim() ?? null;
}

function extractPercentValue(value: string | null) {
  if (!value) {
    return null;
  }
  const match = value.match(/([0-9.]+)%/);
  return match?.[1] ? Number(match[1]) / 100 : null;
}

function extractCurrencyValue(value: string | null) {
  if (!value) {
    return null;
  }
  const match = value.match(/\$([0-9][0-9,]*(?:\.[0-9]+)?)/);
  if (!match?.[1]) {
    return null;
  }
  const normalized = match[1].replace(/,/g, "");
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function extractProbabilities(body: string) {
  const result = new Map<string, { momentumScore: number; signalStrength: number }>();
  // Allow any characters (e.g. Chinese annotations) between Yes/No and the next pipe
  const regex = /^\|\s*(Yes|No)[^|]*\|\s*([0-9.]+)%\s*\|\s*([0-9.]+)%\s*(?:\|.*)?$/gim;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(body)) !== null) {
    result.set(match[1]!.toLowerCase(), {
      momentumScore: Number(match[2]) / 100,
      signalStrength: Number(match[3]) / 100
    });
  }
  return result;
}

function inferTradeDirection(direction: string): "BUY" | null {
  if (/买入|Buy|BUY/i.test(direction)) {
    return "BUY";
  }
  return null;
}

const FALLBACK_DAYS = 180;
const DEFAULT_MAX_PLANS = 4;
const DEFAULT_BATCH_CAP_PCT = 0.2;

export function calculateMonthlyReturn(input: {
  signalStrength: number;
  momentumScore: number;
  edgeOverride?: number;
}): number {
  const edge = input.edgeOverride ?? (input.signalStrength - input.momentumScore);
  const monthsHorizon = FALLBACK_DAYS / 30;
  return edge / monthsHorizon;
}

export function rankByMonthlyReturn(
  plans: readonly PulseEntryPlan[],
  maxPlans: number = DEFAULT_MAX_PLANS
): PulseEntryPlan[] {
  return [...plans]
    .sort((a, b) => b.monthlyReturn - a.monthlyReturn)
    .slice(0, maxPlans);
}

export function applyBatchCap(
  plans: readonly PulseEntryPlan[],
  bankrollUsd: number,
  batchCapPct: number = DEFAULT_BATCH_CAP_PCT
): PulseEntryPlan[] {
  const cap = bankrollUsd * batchCapPct;
  const totalNotional = plans.reduce(
    (sum, plan) => sum + plan.decision.notional_usd,
    0
  );
  if (totalNotional <= cap) {
    return [...plans];
  }
  const scaleFactor = cap / totalNotional;
  return plans.map((plan) => {
    const scaledNotional = roundCurrency(plan.decision.notional_usd * scaleFactor);
    return {
      ...plan,
      decision: {
        ...plan.decision,
        notional_usd: scaledNotional
      }
    };
  });
}

function buildOpenDecision(input: {
  positionStopLossPct: number;
  tokenSymbol: string;
  pairSlug: string;
  tokenAddress: string;
  side: "BUY";
  quarterKellyUsd: number;
  fullKellyPct: number;
  quarterKellyPct: number;
  reportedSuggestedPct: number | null;
  liquidityCapUsd: number | null;
  signalStrength: number;
  momentumScore: number;
  confidence: TradeDecision["confidence"];
  thesisMd: string;
  sources: TradeDecision["sources"];
}) {
  return {
    action: "open",
    token_symbol: input.tokenSymbol,
    pair_slug: input.pairSlug,
    token_address: input.tokenAddress,
    side: input.side,
    notional_usd: roundCurrency(input.quarterKellyUsd),
    order_type: "SWAP",
    signal_strength: input.signalStrength,
    momentum_score: input.momentumScore,
    edge: roundCurrency(input.signalStrength - input.momentumScore),
    confidence: input.confidence,
    thesis_md: input.thesisMd,
    sources: input.sources,
    full_kelly_pct: roundPct(input.fullKellyPct),
    quarter_kelly_pct: roundPct(input.quarterKellyPct),
    reported_suggested_pct: input.reportedSuggestedPct,
    liquidity_cap_usd: input.liquidityCapUsd,
    stop_loss_pct: input.positionStopLossPct
  } satisfies TradeDecision;
}

export function buildPulseEntryPlans(input: {
  context: RuntimeExecutionContext;
  positionStopLossPct: number;
  maxPlans?: number;
  batchCapPct?: number;
}): PulseEntryPlan[] {
  const context = input.context;
  const sections = parseRecommendationSections(context.pulse.markdown);
  const plans: PulseEntryPlan[] = [];

  for (const section of sections) {
    const addressRaw = extractLabeledValue(section.body, ["Address", "地址"]);
    const candidate = context.pulse.candidates.find(
      (item) =>
        normalizeText(section.title).includes(normalizeText(item.name)) ||
        normalizeText(section.title).includes(normalizeText(item.symbol)) ||
        (addressRaw !== null && item.tokenAddress.toLowerCase() === addressRaw.toLowerCase())
    );
    if (!candidate) {
      continue;
    }

    const direction = extractTableValue(section.body, ["方向", "Direction"])
      ?? extractLabeledValue(section.body, ["方向", "Direction"]);
    const suggestedRow = extractTableValue(section.body, ["建议仓位", "仓位建议", "Suggested Size", "Position Size", "Sizing"])
      ?? extractLabeledValue(section.body, ["建议仓位", "仓位建议", "Suggested Size", "Position Size", "Sizing"]);
    const liquidityCapRow = extractTableValue(section.body, ["流动性上限", "Liquidity Cap"])
      ?? extractLabeledValue(section.body, ["流动性上限", "Liquidity Cap"]);
    const confidenceRaw = extractTableValue(section.body, ["置信度", "Confidence"])
      ?? extractLabeledValue(section.body, ["置信度", "Confidence"]);
    const thesisMd = extractReasoning(section.body)
      ?? extractLabeledValue(section.body, ["Thesis", "论点"])
      ?? "Pulse entry planner reused the pulse signal strength and recomputed quarter Kelly in code without an additional model pass.";

    if (!direction) {
      continue;
    }

    const side = inferTradeDirection(direction);
    if (!side) {
      continue;
    }

    const probabilities = extractProbabilities(section.body);
    const yesProbabilities = probabilities.get("yes");
    const momentumScore = yesProbabilities?.momentumScore ?? candidate.price;
    const signalStrength = yesProbabilities?.signalStrength ?? (0.5 + candidate.signalStrength * 0.3);
    const reportedSuggestedPct = extractPercentValue(suggestedRow);
    const liquidityCapUsd = extractCurrencyValue(liquidityCapRow);
    const kellySizing = calculateQuarterKelly({
      aiProb: signalStrength,
      marketProb: momentumScore,
      bankrollUsd: context.overview.total_equity_usd
    });
    if (!(kellySizing.quarterKellyUsd > 0)) {
      continue;
    }
    const suggestedPct = roundPct(kellySizing.quarterKellyPct);
    const pairSlug = `${candidate.symbol}-USDC`;
    const sources: TradeDecision["sources"] = [
      {
        title: `Pulse: ${candidate.symbol} on X Layer`,
        url: `dex://xlayer/${candidate.tokenAddress}`,
        retrieved_at_utc: context.pulse.generatedAtUtc
      }
    ];

    const feeParams = lookupCategoryFeeParams("crypto");
    const grossEdge = signalStrength - momentumScore;
    const entryFeePct = roundPct(calculateFeePct(momentumScore, feeParams));
    const roundTripFee = roundPct(calculateRoundTripFeePct(momentumScore, momentumScore, feeParams));
    const netEdge = roundPct(calculateNetEdge(grossEdge, momentumScore, feeParams, false));

    const monthlyReturn = calculateMonthlyReturn({
      signalStrength,
      momentumScore,
      edgeOverride: netEdge
    });

    plans.push({
      tokenSymbol: candidate.symbol,
      pairSlug,
      tokenAddress: candidate.tokenAddress,
      side,
      suggestedPct,
      fullKellyPct: kellySizing.fullKellyPct,
      quarterKellyPct: kellySizing.quarterKellyPct,
      reportedSuggestedPct,
      liquidityCapUsd,
      signalStrength,
      momentumScore,
      monthlyReturn,
      entryFeePct,
      roundTripFeePct: roundTripFee,
      netEdge,
      confidence: normalizeConfidence(confidenceRaw ?? "low"),
      thesisMd,
      sources,
      decision: buildOpenDecision({
        positionStopLossPct: input.positionStopLossPct,
        tokenSymbol: candidate.symbol,
        pairSlug,
        tokenAddress: candidate.tokenAddress,
        side,
        quarterKellyUsd: kellySizing.quarterKellyUsd,
        fullKellyPct: kellySizing.fullKellyPct,
        quarterKellyPct: kellySizing.quarterKellyPct,
        reportedSuggestedPct,
        liquidityCapUsd,
        signalStrength,
        momentumScore,
        confidence: normalizeConfidence(confidenceRaw ?? "low"),
        thesisMd,
        sources
      })
    });
  }

  const ranked = rankByMonthlyReturn(plans, input.maxPlans);
  return applyBatchCap(
    ranked,
    context.overview.total_equity_usd,
    input.batchCapPct
  );
}
