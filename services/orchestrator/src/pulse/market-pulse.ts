import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { RunMode } from "@lantern/contracts";
import type { OrchestratorConfig, SkillLocale } from "../config.js";
type AgentRuntimeProvider = string;
import { buildArtifactRelativePath, writeStoredArtifact } from "../lib/artifacts.js";
import type { ProgressReporter } from "../lib/terminal-progress.js";
import type { PulseFilterArgs } from "./pulse-filters.js";

const exec = promisify(execFile);
const CLI = "/Users/Aincrad/.local/bin/onchainos";
const CHAIN = "196";
const MIN_LIQ = 10_000;
const MAX_RISK = 3;
const BATCH = 5;

// -- Exported types ---------------------------------------------------------

export interface PulseCandidate {
  tokenAddress: string; symbol: string; name: string;
  price: number; priceChange24h: number; volume24h: number;
  liquidity: number; holders: number; marketCap: number;
  smartMoneyBuyCount: number; riskLevel: number; isHoneypot: boolean;
  signalStrength: number;
}

export interface PulseSnapshot {
  id: string; generatedAtUtc: string; title: string;
  relativeMarkdownPath: string; absoluteMarkdownPath: string;
  relativeJsonPath: string; absoluteJsonPath: string;
  markdown: string; totalFetched: number; totalFiltered: number;
  selectedCandidates: number; minLiquidityUsd: number;
  candidates: PulseCandidate[]; riskFlags: string[]; tradeable: boolean;
}

// Legacy type stubs kept for backward compatibility with full-pulse.ts
export interface PulseTag { slug: string; label: string; }
export interface PulseBucketStat { slug: string; label: string; count: number; source?: string; }
export interface PulseStatsBundle { fetched: PulseBucketStat[]; filtered: PulseBucketStat[]; }
export interface PulseFetchConfig {
  pagesPerDimension: number; eventsPerPage: number;
  minFetchedMarkets: number; dimensions: string[];
}

// -- CLI helper -------------------------------------------------------------

async function cli(args: string[]): Promise<unknown> {
  const { stdout } = await exec(CLI, [...args, "--output", "json"], { timeout: 30_000 });
  return JSON.parse(stdout);
}

function unwrap(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const inner = (data as Record<string, unknown>)?.data;
  return Array.isArray(inner) ? inner : [];
}

function num(v: unknown): number {
  if (v === undefined || v === null || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// -- Data fetchers ----------------------------------------------------------

async function fetchHotTokens(): Promise<Record<string, unknown>[]> {
  return unwrap(await cli(["token", "hot-tokens", "--chain", CHAIN, "--ranking-type", "4"])) as Record<string, unknown>[];
}

async function fetchSignals(): Promise<Map<string, Record<string, unknown>>> {
  const map = new Map<string, Record<string, unknown>>();
  for (const s of unwrap(await cli(["signal", "list", "--chain", CHAIN, "--wallet-type", "1,2,3"]))) {
    const addr = String((s as Record<string, unknown>).tokenContractAddress ?? "").toLowerCase();
    if (addr) map.set(addr, s as Record<string, unknown>);
  }
  return map;
}

async function fetchPrice(address: string): Promise<Record<string, unknown>> {
  try {
    const d = await cli(["token", "price-info", "--address", address, "--chain", CHAIN]);
    const r = d && typeof d === "object" && !Array.isArray(d) ? (d as Record<string, unknown>).data ?? d : d;
    return (r ?? {}) as Record<string, unknown>;
  } catch { return {}; }
}

async function fetchSecurity(addrs: string[]): Promise<Map<string, Record<string, unknown>>> {
  const map = new Map<string, Record<string, unknown>>();
  if (addrs.length === 0) return map;
  try {
    const data = await cli(["security", "token-scan", "--tokens", addrs.map((a) => `${CHAIN}:${a}`).join(",")]);
    for (const r of unwrap(data)) {
      const rec = r as Record<string, unknown>;
      const addr = String(rec.address ?? rec.tokenContractAddress ?? "").toLowerCase();
      if (addr) map.set(addr, rec);
    }
  } catch { /* non-fatal */ }
  return map;
}

// -- Assembly & scoring -----------------------------------------------------

function strength(buys: number, change: number): number {
  return Number((Math.min(buys / 10, 1) * 0.6 + Math.min(Math.max(change / 20, 0), 1) * 0.4).toFixed(4));
}

function assemble(
  tok: Record<string, unknown>, price: Record<string, unknown>,
  sig: Record<string, unknown> | undefined, sec: Record<string, unknown> | undefined
): PulseCandidate {
  const p = num(price.price) || num(tok.price);
  const ch = num(price.priceChange24H) || num(tok.priceChange24H);
  const buys = num(sig?.buyCount);
  return {
    tokenAddress: String(tok.tokenContractAddress ?? ""),
    symbol: String(tok.tokenSymbol ?? "???"),
    name: String(tok.tokenName ?? tok.tokenSymbol ?? "Unknown"),
    price: p, priceChange24h: ch,
    volume24h: num(price.volume24H) || num(tok.volume24H),
    liquidity: num(price.liquidity) || num(tok.liquidity),
    holders: num(price.holdersCount) || num(tok.holdersCount),
    marketCap: num(price.marketCap) || num(tok.marketCap),
    smartMoneyBuyCount: buys,
    riskLevel: num(sec?.riskLevel), isHoneypot: sec?.isHoneypot === true,
    signalStrength: strength(buys, ch)
  };
}

// -- Helpers ----------------------------------------------------------------

function fmtUsd(v: number): string {
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(2)}`;
}
function fmtPct(v: number): string { return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`; }
function riskLbl(l: number): string { return l <= 1 ? "Low" : l <= 2 ? "Medium" : l <= 3 ? "Medium-High" : "High"; }
function conf(s: number): string { return s >= 0.7 ? "HIGH" : s >= 0.4 ? "MEDIUM" : "LOW"; }

export function evaluatePulseRiskFlags(
  snap: { generatedAtUtc: string; totalFetched?: number; candidates: PulseCandidate[] },
  config: OrchestratorConfig
): string[] {
  const flags: string[] = [];
  const age = (Date.now() - new Date(snap.generatedAtUtc).getTime()) / 60000;
  if (typeof snap.totalFetched === "number" && snap.totalFetched < config.pulse.minFetchedMarkets)
    flags.push(`fetched token universe is below target (${snap.totalFetched}/${config.pulse.minFetchedMarkets})`);
  if (snap.candidates.length < config.pulse.minTradeableCandidates)
    flags.push(`tradeable candidates below minimum threshold (${snap.candidates.length}/${config.pulse.minTradeableCandidates})`);
  if (age > config.pulse.maxAgeMinutes)
    flags.push(`pulse snapshot is stale (${age.toFixed(1)}m > ${config.pulse.maxAgeMinutes}m)`);
  return flags;
}

export function resolvePulseFetchTimeoutMs(config: OrchestratorConfig): number | null {
  if (config.pulseTimeoutMode === "unbounded" || config.pulseFetchTimeoutSeconds <= 0) return null;
  return config.pulseFetchTimeoutSeconds * 1000;
}

// -- Markdown ---------------------------------------------------------------

function buildMarkdown(ts: string, cands: readonly PulseCandidate[]): string {
  const l: string[] = [
    "## Pulse Report \u2014 X Layer DEX",
    `Generated: ${ts} | Chain: X Layer (${CHAIN})`, "",
    "### Top Candidates", "",
    "| # | Token | Price | 24h Change | Volume | Liquidity | Signal | Risk |",
    "|---|-------|-------|-----------|--------|-----------|--------|------|"
  ];
  for (const [i, c] of cands.entries()) {
    const sa = `${c.tokenAddress.slice(0, 6)}...${c.tokenAddress.slice(-4)}`;
    l.push(`| ${i + 1} | ${c.symbol} (${sa}) | $${c.price.toFixed(4)} | ${fmtPct(c.priceChange24h)} | ${fmtUsd(c.volume24h)} | ${fmtUsd(c.liquidity)} | ${c.signalStrength.toFixed(2)} | ${riskLbl(c.riskLevel)} |`);
  }
  l.push("", "### Candidate Details", "");
  for (const [i, c] of cands.entries()) {
    const aiP = (0.5 + c.signalStrength * 0.3).toFixed(2);
    const tag = c.signalStrength >= 0.6 ? "Strong Buy Signal" : c.signalStrength >= 0.3 ? "Moderate Buy Signal" : "Weak Signal";
    l.push(
      `## ${i + 1}. ${c.name} \u2014 ${tag}`,
      `- **Address:** ${c.tokenAddress}`,
      `- **Direction:** BUY`,
      `- **AI Probability:** ${aiP}`,
      `- **Market Price:** $${c.price.toFixed(4)}`,
      `- **Confidence:** ${conf(c.signalStrength)}`,
      `- **Signal Strength:** ${c.signalStrength.toFixed(2)} (${c.smartMoneyBuyCount} smart money buys, ${fmtPct(c.priceChange24h)} momentum)`,
      `- **Thesis:** Smart money accumulation detected with ${fmtPct(c.priceChange24h)} volume momentum on ${c.symbol}`,
      "",
      "| Outcome | Market Prob | AI Prob |",
      "|---------|------------|---------|",
      `| Yes | ${(c.price * 100).toFixed(1)}% | ${(Number(aiP) * 100).toFixed(1)}% |`,
      `| No | ${((1 - c.price) * 100).toFixed(1)}% | ${((1 - Number(aiP)) * 100).toFixed(1)}% |`,
      ""
    );
  }
  return l.join("\n");
}

// -- Main -------------------------------------------------------------------

export async function generatePulseSnapshot(input: {
  config: OrchestratorConfig; provider: AgentRuntimeProvider;
  locale: SkillLocale; runId: string; mode: RunMode;
  progress?: ProgressReporter; filters?: PulseFilterArgs;
}): Promise<PulseSnapshot> {
  const ts = new Date().toISOString();
  input.progress?.stage({ percent: 10, label: "Pulse fetch started", detail: "fetching hot tokens from X Layer via onchainos" });

  const hotTokens = await fetchHotTokens();
  input.progress?.stage({ percent: 20, label: "Hot tokens fetched", detail: `${hotTokens.length} tokens` });

  const sigMap = await fetchSignals();
  input.progress?.stage({ percent: 30, label: "Smart money signals loaded", detail: `${sigMap.size} entries` });

  const addrs = hotTokens.map((t) => String(t.tokenContractAddress ?? "")).filter(Boolean);
  const priceMap = new Map<string, Record<string, unknown>>();
  for (let i = 0; i < addrs.length; i += BATCH) {
    const batch = addrs.slice(i, i + BATCH);
    const res = await Promise.all(batch.map(fetchPrice));
    batch.forEach((a, j) => priceMap.set(a.toLowerCase(), res[j]!));
  }
  input.progress?.stage({ percent: 50, label: "Price info collected", detail: `${priceMap.size} tokens enriched` });

  const secMap = await fetchSecurity(addrs);
  input.progress?.stage({ percent: 60, label: "Security scan complete", detail: `${secMap.size} tokens scanned` });

  const all = hotTokens.map((t) => {
    const a = String(t.tokenContractAddress ?? "").toLowerCase();
    return assemble(t, priceMap.get(a) ?? {}, sigMap.get(a), secMap.get(a));
  });
  const filtered = all.filter((c) => c.liquidity >= MIN_LIQ && c.riskLevel <= MAX_RISK && !c.isHoneypot);
  const ranked = [...filtered].sort((a, b) => b.signalStrength - a.signalStrength);
  const candidates = ranked.slice(0, input.config.pulse.maxCandidates);

  input.progress?.stage({ percent: 65, label: "Candidates ranked", detail: `${all.length} fetched | ${filtered.length} passed | ${candidates.length} selected` });

  const markdown = buildMarkdown(ts, candidates);
  const title = `Pulse ${ts.slice(0, 10)} X Layer [${input.provider}]`;
  const mkPath = buildArtifactRelativePath({ kind: "pulse-report", publishedAtUtc: ts, runtime: input.provider, mode: input.mode, runId: input.runId, extension: "md" });
  const jsonPath = buildArtifactRelativePath({ kind: "pulse-report", publishedAtUtc: ts, runtime: input.provider, mode: input.mode, runId: input.runId, extension: "json" });

  const absMd = await writeStoredArtifact(input.config.repoRoot, mkPath, markdown);
  const absJson = await writeStoredArtifact(input.config.repoRoot, jsonPath, JSON.stringify({
    generated_at_utc: ts, chain_id: CHAIN, total_fetched: all.length, total_filtered: filtered.length, candidates
  }, null, 2));

  input.progress?.stage({ percent: 68, label: "Pulse archive written", detail: mkPath });

  const riskFlags = evaluatePulseRiskFlags({ generatedAtUtc: ts, totalFetched: all.length, candidates }, input.config);

  return {
    id: randomUUID(), generatedAtUtc: ts, title,
    relativeMarkdownPath: mkPath, absoluteMarkdownPath: absMd,
    relativeJsonPath: jsonPath, absoluteJsonPath: absJson,
    markdown, totalFetched: all.length, totalFiltered: filtered.length,
    selectedCandidates: candidates.length, minLiquidityUsd: MIN_LIQ,
    candidates, riskFlags, tradeable: riskFlags.length === 0
  };
}
