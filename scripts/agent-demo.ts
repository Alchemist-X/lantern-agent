#!/usr/bin/env tsx
/**
 * Lantern Agent -- Demo Cycle
 *
 * Runs one complete scan -> analyze -> decide -> execute cycle
 * and writes the reasoning trace to runtime-artifacts/
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const exec = promisify(execFile);
const ONCHAINOS = "/Users/Aincrad/.local/bin/onchainos";
const CHAIN = "196";
const SCRIPT_DIR = typeof __dirname !== "undefined" ? __dirname : new URL(".", import.meta.url).pathname;
const ARTIFACTS_DIR = join(SCRIPT_DIR, "..", "runtime-artifacts", "demo");

// --- Helpers ---

async function run(args: string[]): Promise<unknown> {
  console.log(`  -> onchainos ${args.join(" ")}`);
  try {
    const { stdout } = await exec(ONCHAINOS, args, { timeout: 30_000 });
    const trimmed = stdout.trim();
    if (!trimmed) return null;
    return JSON.parse(trimmed);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`  [!] Failed: ${msg.slice(0, 120)}`);
    return null;
  }
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function usd(n: number): string {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

// --- Probability Engine (inline, simplified) ---

interface SignalStep {
  name: string;
  direction: "bullish" | "bearish" | "neutral";
  likelihoodRatio: number;
  description: string;
  probBefore: number;
  probAfter: number;
}

function bayesUpdate(prior: number, lr: number): number {
  const p = Math.max(0.01, Math.min(0.99, prior));
  return Math.max(0.01, Math.min(0.99, (p * lr) / (p * lr + (1 - p))));
}

// --- Types ---

interface TokenCandidate {
  address: string;
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  liquidity: number;
  marketCap: number;
  holders: number;
  riskLevel: number;
  top10HoldPct: number;
  txsBuy: number;
  txsSell: number;
  smartMoneyBuying: boolean;
  signalWalletCount: number;
  signalAmountUsd: number;
  soldRatioPct: number;
  isHoneypot: boolean;
  signalStrength: number;
  probabilityTrace: SignalStep[];
  finalProbability: number;
  recommendation: "BUY" | "SKIP";
  skipReason?: string;
}

// --- PHASE 1: SCAN ---

async function scanMarket(): Promise<TokenCandidate[]> {
  console.log("\n======================================");
  console.log("  PHASE 1: SCAN -- Market Discovery");
  console.log("======================================\n");

  // 1a. Hot tokens
  console.log("[1/3] Fetching hot tokens on X Layer...");
  const hotResult = (await run([
    "token",
    "hot-tokens",
    "--chain",
    CHAIN,
    "--ranking-type",
    "4",
  ])) as { ok: boolean; data: any[] } | null;
  const hotTokens = hotResult?.ok ? hotResult.data : [];
  console.log(`  Found ${hotTokens.length} trending tokens\n`);

  // 1b. Smart money signals
  console.log("[2/3] Fetching smart money signals...");
  const signalResult = (await run([
    "signal",
    "list",
    "--chain",
    CHAIN,
    "--wallet-type",
    "1,2,3",
  ])) as { ok: boolean; data: any[] } | null;
  const signals = signalResult?.ok ? signalResult.data : [];
  console.log(`  Found ${signals.length} active signals\n`);

  // 1c. Build signal map by token address
  const signalMap = new Map<
    string,
    { walletCount: number; amountUsd: number; soldRatio: number }
  >();
  for (const sig of signals) {
    const addr = sig.token?.tokenAddress?.toLowerCase();
    if (!addr) continue;
    signalMap.set(addr, {
      walletCount: parseInt(sig.triggerWalletCount || "0", 10),
      amountUsd: parseFloat(sig.amountUsd || "0"),
      soldRatio: parseFloat(sig.soldRatioPercent || "100"),
    });
  }

  // 1d. Merge into candidates
  const candidates: TokenCandidate[] = [];
  for (const t of hotTokens.slice(0, 15)) {
    // Top 15
    const addr = (t.tokenContractAddress || "").toLowerCase();
    const sig = signalMap.get(addr);

    const change = parseFloat(t.change || "0");
    const volume = parseFloat(t.volume || "0");
    const liquidity = parseFloat(t.liquidity || "0");
    const marketCap = parseFloat(t.marketCap || "0");
    const holders = parseInt(t.holders || "0", 10);
    const riskLevel = parseInt(t.riskLevelControl || "5", 10);
    const top10 = parseFloat(t.top10HoldPercent || "100");
    const txsBuy = parseInt(t.txsBuy || "0", 10);
    const txsSell = parseInt(t.txsSell || "0", 10);

    candidates.push({
      address: addr,
      symbol: t.tokenSymbol || "???",
      price: parseFloat(t.price || "0"),
      change24h: change,
      volume,
      liquidity,
      marketCap,
      holders,
      riskLevel,
      top10HoldPct: top10,
      txsBuy,
      txsSell,
      smartMoneyBuying: sig !== undefined,
      signalWalletCount: sig?.walletCount ?? 0,
      signalAmountUsd: sig?.amountUsd ?? 0,
      soldRatioPct: sig?.soldRatio ?? 100,
      isHoneypot: false,
      signalStrength: 0,
      probabilityTrace: [],
      finalProbability: 0,
      recommendation: "SKIP",
    });
  }

  console.log(`[3/3] Merged ${candidates.length} candidates\n`);
  return candidates;
}

// --- PHASE 2: ANALYZE ---

async function analyzeCandidates(
  candidates: TokenCandidate[]
): Promise<TokenCandidate[]> {
  console.log("======================================");
  console.log("  PHASE 2: ANALYZE -- Risk & Security");
  console.log("======================================\n");

  if (candidates.length === 0) return candidates;

  // 2a. Batch security scan
  const tokenList = candidates.map((c) => `${CHAIN}:${c.address}`).join(",");
  console.log("[1/2] Running security scan...");
  const secResult = (await run([
    "security",
    "token-scan",
    "--tokens",
    tokenList,
  ])) as { ok: boolean; data: any[] } | null;

  if (secResult?.ok && Array.isArray(secResult.data)) {
    for (const item of secResult.data) {
      const addr = (item.tokenContractAddress || "").toLowerCase();
      const candidate = candidates.find((c) => c.address === addr);
      if (candidate && item.isRiskToken) {
        candidate.isHoneypot = true;
      }
    }
  }

  const honeypots = candidates.filter((c) => c.isHoneypot).length;
  console.log(
    `  Scanned ${candidates.length} tokens, found ${honeypots} honeypots\n`
  );

  // 2b. Get kline data for top candidates (for volatility)
  console.log("[2/2] Fetching price data for top candidates...");
  for (const c of candidates.slice(0, 5)) {
    const priceResult = (await run([
      "token",
      "price-info",
      "--address",
      c.address,
      "--chain",
      CHAIN,
    ])) as { ok: boolean; data: any[] } | null;
    if (priceResult?.ok && priceResult.data?.[0]) {
      const d = priceResult.data[0];
      // Update with more precise data
      c.price = parseFloat(d.price || c.price.toString());
      c.volume = parseFloat(d.volume24H || c.volume.toString());
      c.liquidity = parseFloat(d.liquidity || c.liquidity.toString());
    }
  }
  console.log(`  Enriched top 5 candidates with price data\n`);

  return candidates;
}

// --- PHASE 3: DECIDE ---

function decideCandidates(candidates: TokenCandidate[]): TokenCandidate[] {
  console.log("======================================");
  console.log("  PHASE 3: DECIDE -- Bayesian Scoring");
  console.log("======================================\n");

  for (const c of candidates) {
    const trace: SignalStep[] = [];

    // Skip honeypots immediately
    if (c.isHoneypot) {
      c.recommendation = "SKIP";
      c.skipReason = "Honeypot detected";
      c.finalProbability = 0;
      continue;
    }

    // Skip very low liquidity
    if (c.liquidity < 5000) {
      c.recommendation = "SKIP";
      c.skipReason = `Liquidity too low: ${usd(c.liquidity)}`;
      c.finalProbability = 0;
      continue;
    }

    // Skip high risk
    if (c.riskLevel >= 4) {
      c.recommendation = "SKIP";
      c.skipReason = `Risk level ${c.riskLevel}/5`;
      c.finalProbability = 0;
      continue;
    }

    // Start with base probability: 50% (uninformed prior)
    let prob = 0.5;

    // Signal 1: Price momentum (24h change)
    {
      const momentum = c.change24h;
      let lr = 1.0;
      if (momentum > 0.05) lr = 1.3;
      else if (momentum > 0.02) lr = 1.15;
      else if (momentum < -0.05) lr = 0.7;
      else if (momentum < -0.02) lr = 0.85;

      if (Math.abs(lr - 1) > 0.01) {
        const before = prob;
        prob = bayesUpdate(prob, lr);
        trace.push({
          name: "price_momentum",
          direction: lr > 1 ? "bullish" : "bearish",
          likelihoodRatio: lr,
          description: `24h price change: ${(momentum * 100).toFixed(1)}%`,
          probBefore: before,
          probAfter: prob,
        });
      }
    }

    // Signal 2: Buy/Sell ratio
    {
      const totalTxs = c.txsBuy + c.txsSell;
      if (totalTxs > 5) {
        const buyRatio = c.txsBuy / totalTxs;
        let lr = 1.0;
        if (buyRatio > 0.7) lr = 1.4;
        else if (buyRatio > 0.6) lr = 1.2;
        else if (buyRatio < 0.3) lr = 0.65;
        else if (buyRatio < 0.4) lr = 0.8;

        if (Math.abs(lr - 1) > 0.01) {
          const before = prob;
          prob = bayesUpdate(prob, lr);
          trace.push({
            name: "buy_sell_ratio",
            direction: lr > 1 ? "bullish" : "bearish",
            likelihoodRatio: lr,
            description: `Buy/Sell: ${c.txsBuy}/${c.txsSell} (${(buyRatio * 100).toFixed(0)}% buys)`,
            probBefore: before,
            probAfter: prob,
          });
        }
      }
    }

    // Signal 3: Smart money consensus
    {
      if (c.smartMoneyBuying && c.signalWalletCount >= 2) {
        const lr = 1 + 0.3 * Math.min(c.signalWalletCount, 5);
        const before = prob;
        prob = bayesUpdate(prob, lr);
        trace.push({
          name: "smart_money_consensus",
          direction: "bullish",
          likelihoodRatio: lr,
          description: `${c.signalWalletCount} smart money wallets buying, ${usd(c.signalAmountUsd)} total`,
          probBefore: before,
          probAfter: prob,
        });
      }
    }

    // Signal 4: Sold ratio (low = conviction holding)
    {
      if (c.smartMoneyBuying && c.soldRatioPct < 40) {
        const lr = 1.3;
        const before = prob;
        prob = bayesUpdate(prob, lr);
        trace.push({
          name: "low_sold_ratio",
          direction: "bullish",
          likelihoodRatio: lr,
          description: `Only ${c.soldRatioPct.toFixed(0)}% of holders have sold (diamond hands)`,
          probBefore: before,
          probAfter: prob,
        });
      }
    }

    // Signal 5: Holder concentration risk
    {
      if (c.top10HoldPct > 40) {
        const lr = 0.7;
        const before = prob;
        prob = bayesUpdate(prob, lr);
        trace.push({
          name: "high_concentration",
          direction: "bearish",
          likelihoodRatio: lr,
          description: `Top 10 holders own ${c.top10HoldPct.toFixed(1)}% of supply`,
          probBefore: before,
          probAfter: prob,
        });
      }
    }

    // Signal 6: Net inflow direction
    {
      const inflowSignal = c.volume > 0 && c.change24h > 0;
      if (inflowSignal && c.volume > 1000) {
        const lr = 1.15;
        const before = prob;
        prob = bayesUpdate(prob, lr);
        trace.push({
          name: "positive_inflow",
          direction: "bullish",
          likelihoodRatio: lr,
          description: `Positive inflow: ${usd(c.volume)} volume with price increase`,
          probBefore: before,
          probAfter: prob,
        });
      }
    }

    c.probabilityTrace = trace;
    c.finalProbability = prob;
    c.signalStrength = prob;
    c.recommendation = prob >= 0.55 ? "BUY" : "SKIP";
    if (prob < 0.55) {
      c.skipReason = `Signal strength ${pct(prob)} below threshold (55%)`;
    }
  }

  // Print decision table
  console.log(
    "+----------+----------+------------+----------+------------+----------+"
  );
  console.log(
    "| Token    | Prob     | Smart $    | Risk     | Liquidity  | Action   |"
  );
  console.log(
    "+----------+----------+------------+----------+------------+----------+"
  );
  for (const c of candidates.slice(0, 10)) {
    const sym = c.symbol.padEnd(8).slice(0, 8);
    const prob = pct(c.finalProbability).padStart(6);
    const sm = c.smartMoneyBuying
      ? usd(c.signalAmountUsd).padStart(10)
      : "     --   ";
    const risk = `${c.riskLevel}/5`.padStart(4);
    const liq = usd(c.liquidity).padStart(10);
    const action = c.recommendation === "BUY" ? " * BUY " : "  SKIP ";
    console.log(
      `| ${sym} | ${prob}  | ${sm} |   ${risk}  | ${liq} | ${action} |`
    );
  }
  console.log(
    "+----------+----------+------------+----------+------------+----------+\n"
  );

  return candidates;
}

// --- PHASE 4: EXECUTE ---

async function executeRecommendation(candidates: TokenCandidate[]): Promise<{
  executed: boolean;
  txHash?: string;
  error?: string;
  recommendation: TokenCandidate | null;
}> {
  console.log("======================================");
  console.log("  PHASE 4: EXECUTE -- Trade");
  console.log("======================================\n");

  const buys = candidates
    .filter((c) => c.recommendation === "BUY")
    .sort((a, b) => b.finalProbability - a.finalProbability);

  if (buys.length === 0) {
    console.log("  No BUY recommendations. Skipping execution.\n");
    return { executed: false, recommendation: null };
  }

  const best = buys[0]!;
  console.log(`  Best recommendation: ${best.symbol}`);
  console.log(`  Signal strength: ${pct(best.finalProbability)}`);
  console.log(`  Price: ${best.price}`);
  console.log(`  Liquidity: ${usd(best.liquidity)}`);
  console.log(
    `  Smart money: ${best.signalWalletCount} wallets, ${usd(best.signalAmountUsd)}`
  );
  console.log();

  // Check balance first
  const balResult = (await run(["wallet", "balance", "--chain", CHAIN])) as {
    ok: boolean;
    data: any;
  } | null;
  const totalValue = parseFloat(balResult?.data?.totalValueUsd || "0");

  if (totalValue < 1) {
    console.log(
      `  [!] Wallet balance: ${usd(totalValue)} -- insufficient for trade`
    );
    console.log(
      "  -> Skipping execution (fund wallet to enable live trading)\n"
    );
    return {
      executed: false,
      error: "Insufficient balance",
      recommendation: best,
    };
  }

  // Attempt swap
  const tradeUsd = Math.min(totalValue * 0.05, 10); // 5% of balance or $10 max
  console.log(`  Executing swap: ${usd(tradeUsd)} USDC -> ${best.symbol}...`);

  const swapResult = (await run([
    "swap",
    "execute",
    "--from",
    "0x74b7f16337b8972027f6196a17a631ac6de26d22", // USDC on X Layer
    "--to",
    best.address,
    "--readable-amount",
    tradeUsd.toFixed(2),
    "--chain",
    CHAIN,
    "--wallet",
    process.env.OKX_WALLET_ADDRESS || "",
    "--slippage",
    "1",
    "--force",
  ])) as { ok: boolean; data: any } | null;

  if (swapResult?.ok) {
    const txHash = swapResult.data?.swapTxHash || "unknown";
    console.log(`  [ok] Swap executed! TxHash: ${txHash}\n`);
    return { executed: true, txHash, recommendation: best };
  } else {
    console.log(`  [x] Swap failed\n`);
    return {
      executed: false,
      error: "Swap execution failed",
      recommendation: best,
    };
  }
}

// --- PHASE 5: OUTPUT ---

function outputTrace(
  candidates: TokenCandidate[],
  executionResult: {
    executed: boolean;
    txHash?: string;
    error?: string;
    recommendation: TokenCandidate | null;
  }
) {
  console.log("======================================");
  console.log("  PHASE 5: OUTPUT -- Reasoning Trace");
  console.log("======================================\n");

  const best = executionResult.recommendation;

  if (best && best.probabilityTrace.length > 0) {
    console.log(`  Bayesian Waterfall for ${best.symbol}:`);
    console.log(`  ${"--".repeat(25)}`);
    console.log(`  Start:          50.0% (uninformed prior)`);
    for (const step of best.probabilityTrace) {
      const tag =
        step.direction === "bullish"
          ? "[UP]"
          : step.direction === "bearish"
            ? "[DN]"
            : "[--]";
      const delta = step.probAfter - step.probBefore;
      const sign = delta >= 0 ? "+" : "";
      console.log(
        `  ${tag} ${step.name.padEnd(22)} ${sign}${(delta * 100).toFixed(1)}%  ->  ${pct(step.probAfter)}`
      );
      console.log(`     ${step.description}`);
    }
    console.log(`  ${"--".repeat(25)}`);
    console.log(
      `  Final:          ${pct(best.finalProbability)} (${best.recommendation})`
    );
    console.log();
  }

  // Write artifact
  mkdirSync(ARTIFACTS_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const artifact = {
    timestamp: new Date().toISOString(),
    cycle: "demo",
    scan: {
      chain: "X Layer (196)",
      candidatesFound: candidates.length,
      honeypots: candidates.filter((c) => c.isHoneypot).length,
    },
    candidates: candidates.map((c) => ({
      symbol: c.symbol,
      address: c.address,
      price: c.price,
      change24h: c.change24h,
      liquidity: c.liquidity,
      marketCap: c.marketCap,
      holders: c.holders,
      riskLevel: c.riskLevel,
      smartMoneyBuying: c.smartMoneyBuying,
      signalWalletCount: c.signalWalletCount,
      signalStrength: c.finalProbability,
      recommendation: c.recommendation,
      skipReason: c.skipReason,
      probabilityTrace: c.probabilityTrace,
    })),
    recommendation: best
      ? {
          symbol: best.symbol,
          address: best.address,
          finalProbability: best.finalProbability,
          trace: best.probabilityTrace,
        }
      : null,
    execution: executionResult,
  };

  const artifactPath = join(ARTIFACTS_DIR, `${timestamp}.json`);
  writeFileSync(artifactPath, JSON.stringify(artifact, null, 2));
  console.log(`  Artifact saved: ${artifactPath}`);

  // Also write latest.json for dashboard consumption
  const latestPath = join(ARTIFACTS_DIR, "latest.json");
  writeFileSync(latestPath, JSON.stringify(artifact, null, 2));
  console.log(`  Latest saved:   ${latestPath}\n`);

  return artifact;
}

// --- MAIN ---

async function main() {
  console.log("\nLantern Agent -- Demo Cycle");
  console.log(`   Chain: X Layer (196)`);
  console.log(`   Time: ${new Date().toISOString()}\n`);

  const startTime = Date.now();

  // Phase 1: Scan
  const candidates = await scanMarket();

  // Phase 2: Analyze
  const analyzed = await analyzeCandidates(candidates);

  // Phase 3: Decide
  const decided = decideCandidates(analyzed);

  // Phase 4: Execute
  const execResult = await executeRecommendation(decided);

  // Phase 5: Output
  outputTrace(decided, execResult);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log("======================================");
  console.log(`  Cycle complete in ${elapsed}s`);
  console.log(
    `  Candidates: ${candidates.length} scanned -> ${decided.filter((c) => c.recommendation === "BUY").length} recommended`
  );
  console.log(
    `  Executed: ${execResult.executed ? `Yes (${execResult.txHash})` : `No (${execResult.error || "no recommendation"})`}`
  );
  console.log("======================================\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
