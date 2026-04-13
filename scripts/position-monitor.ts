/**
 * Standalone position monitor — model-free stop-loss guardian.
 *
 * Polls remote positions at a fixed interval, computes unrealized P&L
 * against each position's VWAP entry cost, and auto-liquidates when
 * the loss exceeds a configurable threshold (default 30%).
 *
 * No DB, no Redis, no BullMQ — runs as a single long-lived process.
 *
 * Usage:
 *   ENV_FILE=.env.pizza npx tsx scripts/position-monitor.ts
 *   ENV_FILE=.env.pizza npx tsx scripts/position-monitor.ts --dry-run
 *
 * Environment variables:
 *   MONITOR_POLL_SECONDS   — polling interval (default: 30)
 *   MONITOR_STOP_LOSS_PCT  — stop-loss threshold (default: 0.30 = 30%)
 *   MONITOR_LOG_DIR        — directory for stop-loss event logs (default: run-error/)
 */

import { loadConfig } from "../services/executor/src/config.ts";
// TODO: implement OKX DEX equivalents for position monitoring

type RemotePosition = { tokenId: string; outcome: string; size: number; title?: string; eventSlug?: string; marketSlug?: string };

async function fetchRemotePositions(_config: unknown): Promise<RemotePosition[]> {
  throw new Error("fetchRemotePositions: pending OKX DEX migration — migrate to OKX DEX");
}
async function computeAvgCost(_config: unknown, _tokenId: string): Promise<number> {
  throw new Error("computeAvgCost: pending OKX DEX migration — migrate to OKX DEX");
}
async function readBook(_config: unknown, _tokenId: string): Promise<{ bestAsk: number; bestBid: number; minOrderSize: number } | null> {
  throw new Error("readBook: pending OKX DEX migration — migrate to OKX DEX");
}
async function executeMarketOrder(_config: unknown, _params: { tokenId: string; side: string; amount: number }): Promise<{ ok: boolean; orderId: string | null; avgPrice: number | null; filledNotionalUsd: number | null; rawResponse: unknown }> {
  throw new Error("executeMarketOrder: pending OKX DEX migration — migrate to OKX DEX");
}
async function validateSellBalance(_owner: string, _tokenId: string, _size: number): Promise<{ ok: boolean; onChainBalance: number | null; shortfall: number }> {
  throw new Error("validateSellBalance: pending OKX DEX migration — migrate to OKX DEX");
}
import {
  calculatePositionPnlPct,
  shouldTriggerStopLoss
} from "../services/executor/src/lib/risk.ts";
import { existsSync, mkdirSync, appendFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

interface MonitorConfig {
  pollSeconds: number;
  stopLossPct: number;
  logDir: string;
  dryRun: boolean;
}

function loadMonitorConfig(): MonitorConfig {
  return {
    pollSeconds: Number(process.env.MONITOR_POLL_SECONDS) || 30,
    stopLossPct: Number(process.env.MONITOR_STOP_LOSS_PCT) || 0.3,
    logDir: process.env.MONITOR_LOG_DIR || "run-error",
    dryRun: process.argv.includes("--dry-run")
  };
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

function timestamp(): string {
  return new Date().toISOString();
}

function log(level: "INFO" | "WARN" | "ERR" | "OK", msg: string): void {
  const color =
    level === "OK" ? "\x1b[32m" :
    level === "WARN" ? "\x1b[33m" :
    level === "ERR" ? "\x1b[31m" :
    "\x1b[36m";
  const reset = "\x1b[0m";
  console.log(`${color}[${level}]${reset} ${timestamp()} ${msg}`);
}

function logStopLossEvent(
  logDir: string,
  event: {
    timestamp: string;
    tokenId: string;
    title: string;
    avgCost: number;
    currentPrice: number;
    pnlPct: number;
    shares: number;
    action: "SELL" | "DRY_RUN";
    orderId: string | null;
    error: string | null;
  }
): void {
  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true });
  }
  const logPath = join(logDir, "stop-loss-events.jsonl");
  appendFileSync(logPath, JSON.stringify(event) + "\n");
}

// ---------------------------------------------------------------------------
// Position snapshot (in-memory state)
// ---------------------------------------------------------------------------

interface PositionSnapshot {
  tokenId: string;
  title: string;
  outcome: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  pnlPct: number;
}

async function snapshotPositions(
  executorConfig: ReturnType<typeof loadConfig>
): Promise<PositionSnapshot[]> {
  const remotes = await fetchRemotePositions(executorConfig);
  const snapshots: PositionSnapshot[] = [];

  for (const remote of remotes) {
    const [avgCost, book] = await Promise.all([
      computeAvgCost(executorConfig, remote.tokenId),
      readBook(executorConfig, remote.tokenId)
    ]);
    if (avgCost == null || avgCost <= 0) {
      continue;
    }
    // Use Gamma API bestBid if CLOB book looks like a neg-risk raw book
    const clobBid = book?.bestBid ?? 0;
    const currentPrice = clobBid > 0.01 ? clobBid : avgCost;

    snapshots.push({
      tokenId: remote.tokenId,
      title: remote.title ?? remote.marketSlug ?? remote.tokenId.slice(0, 12),
      outcome: remote.outcome,
      shares: remote.size,
      avgCost,
      currentPrice,
      pnlPct: calculatePositionPnlPct(avgCost, currentPrice)
    });
  }
  return snapshots;
}

// ---------------------------------------------------------------------------
// Monitor loop
// ---------------------------------------------------------------------------

async function checkAndAct(
  executorConfig: ReturnType<typeof loadConfig>,
  monitorConfig: MonitorConfig,
  cycleCount: number
): Promise<void> {
  const positions = await snapshotPositions(executorConfig);
  if (positions.length === 0) {
    log("INFO", `Cycle #${cycleCount} | No open positions`);
    return;
  }

  const lines = positions.map((p) => {
    const pnlStr = (p.pnlPct * 100).toFixed(1);
    const prefix = p.pnlPct >= 0 ? "+" : "";
    return `  ${p.title.substring(0, 45).padEnd(45)} ${prefix}${pnlStr}%  cost=${p.avgCost.toFixed(3)} now=${p.currentPrice.toFixed(3)} shares=${p.shares.toFixed(1)}`;
  });
  log("INFO", `Cycle #${cycleCount} | ${positions.length} positions\n${lines.join("\n")}`);

  for (const pos of positions) {
    if (!shouldTriggerStopLoss(pos.avgCost, pos.currentPrice, monitorConfig.stopLossPct)) {
      continue;
    }

    const pnlStr = (pos.pnlPct * 100).toFixed(1);
    log("ERR", `STOP-LOSS TRIGGERED | ${pos.title} | ${pnlStr}% loss (threshold -${(monitorConfig.stopLossPct * 100).toFixed(0)}%)`);

    if (monitorConfig.dryRun) {
      log("WARN", `DRY RUN — would sell ${pos.shares.toFixed(1)} shares of ${pos.title}`);
      logStopLossEvent(monitorConfig.logDir, {
        timestamp: timestamp(),
        tokenId: pos.tokenId,
        title: pos.title,
        avgCost: pos.avgCost,
        currentPrice: pos.currentPrice,
        pnlPct: pos.pnlPct,
        shares: pos.shares,
        action: "DRY_RUN",
        orderId: null,
        error: null
      });
      continue;
    }

    try {
      const balanceCheck = await validateSellBalance(executorConfig.funderAddress, pos.tokenId, pos.shares);
      if (!balanceCheck.ok) {
        log("WARN", `On-chain balance insufficient for ${pos.title}: requested=${pos.shares.toFixed(1)} on-chain=${balanceCheck.onChainBalance?.toFixed(1)} — skipping`);
        continue;
      }
      const result = await executeMarketOrder(executorConfig, {
        tokenId: pos.tokenId,
        side: "SELL",
        amount: pos.shares
      });
      if (result.ok) {
        log("OK", `SOLD ${pos.shares.toFixed(1)} shares | orderId=${result.orderId} | avgPrice=${result.avgPrice} | proceeds=$${result.filledNotionalUsd.toFixed(2)}`);
      } else {
        log("ERR", `SELL FAILED | ${pos.title} | response: ${JSON.stringify(result.rawResponse)}`);
      }
      logStopLossEvent(monitorConfig.logDir, {
        timestamp: timestamp(),
        tokenId: pos.tokenId,
        title: pos.title,
        avgCost: pos.avgCost,
        currentPrice: pos.currentPrice,
        pnlPct: pos.pnlPct,
        shares: pos.shares,
        action: "SELL",
        orderId: result.orderId ?? null,
        error: result.ok ? null : "order failed"
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      log("ERR", `SELL ERROR | ${pos.title} | ${errMsg}`);
      logStopLossEvent(monitorConfig.logDir, {
        timestamp: timestamp(),
        tokenId: pos.tokenId,
        title: pos.title,
        avgCost: pos.avgCost,
        currentPrice: pos.currentPrice,
        pnlPct: pos.pnlPct,
        shares: pos.shares,
        action: "SELL",
        orderId: null,
        error: errMsg
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main() {
  const executorConfig = loadConfig();
  const monitorConfig = loadMonitorConfig();

  log("INFO", "Position Monitor starting");
  log("INFO", `  Wallet: ${executorConfig.funderAddress.slice(0, 10)}...`);
  log("INFO", `  Stop-loss: -${(monitorConfig.stopLossPct * 100).toFixed(0)}%`);
  log("INFO", `  Poll interval: ${monitorConfig.pollSeconds}s`);
  log("INFO", `  Mode: ${monitorConfig.dryRun ? "DRY RUN (no trades)" : "LIVE (will execute sells)"}`);
  log("INFO", `  Log dir: ${monitorConfig.logDir}`);
  log("INFO", "");

  let cycleCount = 0;

  const tick = async () => {
    cycleCount++;
    try {
      await checkAndAct(executorConfig, monitorConfig, cycleCount);
    } catch (err) {
      log("ERR", `Cycle #${cycleCount} failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  await tick();
  setInterval(() => void tick(), monitorConfig.pollSeconds * 1000);
}

main().catch((err) => {
  log("ERR", `Fatal: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
