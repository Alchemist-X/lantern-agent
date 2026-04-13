import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { PulseCandidate, PulseSnapshot } from "./market-pulse.js";

const exec = promisify(execFile);
const CLI = "/Users/Aincrad/.local/bin/onchainos";
const CHAIN = "196";

// ---------------------------------------------------------------------------
// CLI helpers
// ---------------------------------------------------------------------------

interface CliResult {
  data: Record<string, unknown>;
  ok: boolean;
}

async function cli(args: string[]): Promise<CliResult> {
  try {
    const { stdout } = await exec(CLI, [...args, "--output", "json"], {
      timeout: 30_000,
    });
    const parsed = JSON.parse(stdout);
    const data =
      parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : { items: parsed };
    return { data, ok: true };
  } catch {
    return { data: {}, ok: false };
  }
}

// ---------------------------------------------------------------------------
// Per-candidate enrichment via onchainos
// ---------------------------------------------------------------------------

interface EnrichedCandidate {
  candidate: PulseCandidate;
  priceInfo: Record<string, unknown>;
  advancedInfo: Record<string, unknown>;
  klines: unknown[];
}

async function enrichCandidate(
  candidate: PulseCandidate,
): Promise<EnrichedCandidate> {
  const [priceResult, advancedResult, klineResult] = await Promise.all([
    cli([
      "token",
      "price-info",
      "--address",
      candidate.tokenAddress,
      "--chain",
      CHAIN,
    ]),
    cli([
      "token",
      "advanced-info",
      "--address",
      candidate.tokenAddress,
      "--chain",
      CHAIN,
    ]),
    cli([
      "market",
      "kline",
      "--address",
      candidate.tokenAddress,
      "--chain",
      CHAIN,
      "--bar",
      "1H",
      "--limit",
      "24",
    ]),
  ]);

  const priceData = priceResult.ok
    ? ((priceResult.data.data as Record<string, unknown>) ?? priceResult.data)
    : {};
  const advancedData = advancedResult.ok
    ? ((advancedResult.data.data as Record<string, unknown>) ??
      advancedResult.data)
    : {};
  const klineItems = klineResult.ok
    ? Array.isArray(klineResult.data.data)
      ? (klineResult.data.data as unknown[])
      : Array.isArray(klineResult.data.items)
        ? (klineResult.data.items as unknown[])
        : []
    : [];

  return {
    candidate,
    priceInfo: priceData as Record<string, unknown>,
    advancedInfo: advancedData as Record<string, unknown>,
    klines: klineItems,
  };
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function fmtUsd(v: number): string {
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(2)}`;
}

function fmtPct(v: number): string {
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

function confidenceLabel(signal: number): "HIGH" | "MEDIUM" | "LOW" {
  if (signal >= 0.7) return "HIGH";
  if (signal >= 0.4) return "MEDIUM";
  return "LOW";
}

function riskLabel(level: number): string {
  if (level <= 1) return "Low";
  if (level <= 2) return "Medium";
  if (level <= 3) return "Medium-High";
  return "High";
}

function direction(c: PulseCandidate): "BUY" | "SELL" {
  return c.priceChange24h >= 0 ? "BUY" : "SELL";
}

function aiProbability(c: PulseCandidate): number {
  return Number((0.5 + c.signalStrength * 0.3).toFixed(2));
}

function momentumScore(c: PulseCandidate): number {
  return Number(
    Math.max(-1, Math.min(1, c.priceChange24h / 50)).toFixed(4),
  );
}

// ---------------------------------------------------------------------------
// Markdown generation
// ---------------------------------------------------------------------------

function buildSummaryTable(
  enriched: readonly EnrichedCandidate[],
): string[] {
  const lines: string[] = [
    "### Top Candidates",
    "",
    "| # | Token | Price | 24h Change | Volume | Liquidity | Signal | Risk |",
    "|---|-------|-------|-----------|--------|-----------|--------|------|",
  ];
  for (const [i, e] of enriched.entries()) {
    const c = e.candidate;
    const shortAddr = `${c.tokenAddress.slice(0, 6)}...${c.tokenAddress.slice(-4)}`;
    lines.push(
      `| ${i + 1} | ${c.symbol} (${shortAddr}) | $${c.price.toFixed(4)} | ${fmtPct(c.priceChange24h)} | ${fmtUsd(c.volume24h)} | ${fmtUsd(c.liquidity)} | ${c.signalStrength.toFixed(2)} | ${riskLabel(c.riskLevel)} |`,
    );
  }
  return lines;
}

function buildCandidateSection(
  index: number,
  enriched: EnrichedCandidate,
): string[] {
  const c = enriched.candidate;
  const dir = direction(c);
  const aiProb = aiProbability(c);
  const conf = confidenceLabel(c.signalStrength);
  const mom = momentumScore(c);
  const tag =
    c.signalStrength >= 0.6
      ? "Strong Buy Signal"
      : c.signalStrength >= 0.3
        ? "Moderate Buy Signal"
        : "Weak Signal";

  const klineCount = enriched.klines.length;
  const riskLvl = Number(enriched.advancedInfo.riskLevel ?? c.riskLevel);

  return [
    `## ${index + 1}. ${c.symbol} \u2014 ${tag}`,
    `- **Address:** ${c.tokenAddress}`,
    `- **Direction:** ${dir}`,
    `- **AI Probability:** ${aiProb}`,
    `- **Market Price:** $${c.price.toFixed(4)}`,
    `- **Confidence:** ${conf}`,
    `- **Signal Strength:** ${c.signalStrength.toFixed(2)} (${c.smartMoneyBuyCount} smart money buys, ${fmtPct(c.priceChange24h)} momentum)`,
    `- **Momentum Score:** ${mom}`,
    `- **Risk Level:** ${riskLabel(riskLvl)}`,
    `- **Kline Data:** ${klineCount} hourly candles loaded`,
    `- **Thesis:** Smart money accumulation detected with ${fmtPct(c.priceChange24h)} volume momentum on ${c.symbol}`,
    "",
    "| Outcome | Market Prob | AI Prob |",
    "|---------|------------|---------|",
    `| Yes | ${(c.price * 100).toFixed(1)}% | ${(aiProb * 100).toFixed(1)}% |`,
    `| No | ${((1 - c.price) * 100).toFixed(1)}% | ${((1 - aiProb) * 100).toFixed(1)}% |`,
    "",
  ];
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function generateFullPulse(
  snapshot: PulseSnapshot,
): Promise<string> {
  const enriched = await Promise.all(
    snapshot.candidates.map((c) => enrichCandidate(c)),
  );

  const lines: string[] = [
    "## Pulse Report \u2014 X Layer DEX",
    `Generated: ${snapshot.generatedAtUtc} | Chain: X Layer (${CHAIN})`,
    "",
    ...buildSummaryTable(enriched),
    "",
    "### Candidate Details",
    "",
  ];

  for (const [i, e] of enriched.entries()) {
    lines.push(...buildCandidateSection(i, e));
  }

  if (snapshot.riskFlags.length > 0) {
    lines.push(
      "### Risk Flags",
      "",
      ...snapshot.riskFlags.map((f) => `- ${f}`),
      "",
    );
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Render timeout helper (kept for backward compatibility with tests)
// ---------------------------------------------------------------------------

const DEFAULT_PULSE_DIRECT_RENDER_TIMEOUT_SECONDS = 1200;

interface PulseRenderTimeoutConfig {
  pulseTimeoutMode: string;
  decisionStrategy: string;
  pulse: {
    reportTimeoutSeconds: number;
    directRenderTimeoutSeconds: number;
  };
}

export function resolvePulseRenderTimeoutMs(config: PulseRenderTimeoutConfig): number {
  if (config.pulseTimeoutMode === "unbounded") {
    return 0;
  }
  if (config.pulse.reportTimeoutSeconds > 0) {
    return config.pulse.reportTimeoutSeconds * 1000;
  }
  if (config.decisionStrategy === "pulse-direct") {
    const seconds =
      config.pulse.directRenderTimeoutSeconds > 0
        ? config.pulse.directRenderTimeoutSeconds
        : DEFAULT_PULSE_DIRECT_RENDER_TIMEOUT_SECONDS;
    return seconds * 1000;
  }
  return 0;
}
