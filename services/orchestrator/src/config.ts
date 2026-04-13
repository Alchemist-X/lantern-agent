import "dotenv/config";

import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFile } from "./lib/env-file.js";

function readNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function readString(name: string, fallback: string): string {
  const raw = process.env[name];
  return raw && raw.trim() ? raw.trim() : fallback;
}

function readEnum<T extends readonly string[]>(
  name: string,
  fallback: T[number],
  allowed: T
): T[number] {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  return allowed.includes(raw) ? raw : fallback;
}

export const agentDecisionStrategies = ["provider-runtime", "pulse-direct"] as const;
export type AgentDecisionStrategy = (typeof agentDecisionStrategies)[number];

export const skillLocales = ["en", "zh"] as const;
export type SkillLocale = (typeof skillLocales)[number];

export interface PulseConfig {
  maxCandidates: number;
  minLiquidityUsd: number;
  minFetchedMarkets: number;
  minTradeableCandidates: number;
  maxAgeMinutes: number;
  maxMarkdownChars: number;
  reportTimeoutSeconds: number;
}

export interface OkxApiConfig {
  chainId: string;
  walletAddress: string;
  slippagePct: number;
  rpcUrl: string;
}

export interface OrchestratorConfig {
  repoRoot: string;
  port: number;
  redisUrl: string;
  envFilePath: string | null;
  internalToken: string;
  agentPollIntervalSeconds: number;
  syncIntervalSeconds: number;
  backtestCron: string;
  resolutionBaseIntervalMinutes: number;
  resolutionUrgentIntervalMinutes: number;
  drawdownStopPct: number;
  positionStopLossPct: number;
  maxTotalExposurePct: number;
  maxEventExposurePct: number;
  maxPositions: number;
  maxTradePct: number;
  minTradeUsd: number;
  initialBankrollUsd: number;
  decisionStrategy: AgentDecisionStrategy;
  artifactStorageRoot: string;
  providerTimeoutSeconds: number;
  runtimeProvider: string;
  pulseTimeoutMode: string;
  pulseFetchTimeoutSeconds: number;
  pulse: PulseConfig;
  okx: OkxApiConfig;
}

export function loadConfig(): OrchestratorConfig {
  const envFilePath = loadEnvFile();
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

  return {
    repoRoot,
    port: readNumber("PORT", 4001),
    redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
    envFilePath,
    internalToken: process.env.ORCHESTRATOR_INTERNAL_TOKEN ?? "replace-me",
    agentPollIntervalSeconds: readNumber("AGENT_POLL_INTERVAL_SECONDS", 60),
    syncIntervalSeconds: readNumber("SYNC_INTERVAL_SECONDS", 30),
    backtestCron: process.env.BACKTEST_CRON ?? "10 0 * * *",
    resolutionBaseIntervalMinutes: readNumber("RESOLUTION_BASE_INTERVAL_MINUTES", 60),
    resolutionUrgentIntervalMinutes: readNumber("RESOLUTION_URGENT_INTERVAL_MINUTES", 15),
    drawdownStopPct: readNumber("DRAWDOWN_STOP_PCT", 0.3),
    positionStopLossPct: readNumber("POSITION_STOP_LOSS_PCT", 0.3),
    maxTotalExposurePct: readNumber("MAX_TOTAL_EXPOSURE_PCT", 0.8),
    maxEventExposurePct: readNumber("MAX_EVENT_EXPOSURE_PCT", 0.3),
    maxPositions: readNumber("MAX_POSITIONS", 22),
    maxTradePct: readNumber("MAX_TRADE_PCT", 0.15),
    minTradeUsd: readNumber("MIN_TRADE_USD", 5),
    initialBankrollUsd: readNumber("INITIAL_BANKROLL_USD", 10000),
    decisionStrategy: readEnum("AGENT_DECISION_STRATEGY", "pulse-direct", agentDecisionStrategies),
    artifactStorageRoot: path.resolve(readString("ARTIFACT_STORAGE_ROOT", path.join(repoRoot, "runtime-artifacts"))),
    providerTimeoutSeconds: readNumber("PROVIDER_TIMEOUT_SECONDS", 0),
    runtimeProvider: readString("AGENT_RUNTIME_PROVIDER", "none"),
    pulseTimeoutMode: readString("PULSE_TIMEOUT_MODE", "bounded"),
    pulseFetchTimeoutSeconds: readNumber("PULSE_FETCH_TIMEOUT_SECONDS", 120),
    pulse: {
      maxCandidates: readNumber("PULSE_MAX_CANDIDATES", 20),
      minLiquidityUsd: readNumber("PULSE_MIN_LIQUIDITY_USD", 5000),
      minFetchedMarkets: readNumber("PULSE_MIN_FETCHED_MARKETS", 50),
      minTradeableCandidates: readNumber("PULSE_MIN_TRADEABLE_CANDIDATES", 3),
      maxAgeMinutes: readNumber("PULSE_MAX_AGE_MINUTES", 30),
      maxMarkdownChars: readNumber("PULSE_MAX_MARKDOWN_CHARS", 24000),
      reportTimeoutSeconds: readNumber("PULSE_REPORT_TIMEOUT_SECONDS", 120),
    },
    okx: {
      chainId: readString("OKX_CHAIN_ID", "66"),
      walletAddress: readString("OKX_WALLET_ADDRESS", ""),
      slippagePct: readNumber("OKX_SLIPPAGE_PCT", 0.5),
      rpcUrl: readString("OKX_RPC_URL", "https://rpc.xlayer.tech"),
    },
  };
}
