#!/usr/bin/env tsx
/**
 * Lantern Agent -- On-Chain Decision Logger
 *
 * Runs a scan cycle and writes the decision trace to X Layer.
 * X Layer has zero gas fees, so this is completely free.
 */
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const exec = promisify(execFile);
const ONCHAINOS = "/Users/Aincrad/.local/bin/onchainos";
const WALLET = "0xb266dd8d835e3388d0eaf0bf7efff3bb732dfed6";
// WOKB contract on X Layer -- has a payable fallback so contract-call succeeds
// (EOAs revert on estimateGas; a real contract with fallback accepts arbitrary data)
const XLAYER_TARGET = "0xe538905cf8410324e03A5A23C1c177a474D59b2b";
const ROOT = join(__dirname, "..");
const ARTIFACTS = join(ROOT, "runtime-artifacts", "demo");

async function run(args: string[]): Promise<unknown> {
  try {
    const { stdout } = await exec(ONCHAINOS, args, { timeout: 30_000 });
    return stdout.trim() ? JSON.parse(stdout.trim()) : null;
  } catch {
    return null;
  }
}

async function main() {
  console.log("Lantern Agent -- On-Chain Decision Logger\n");

  // Step 1: Run agent demo first to get fresh data
  console.log("[1/3] Running agent scan cycle...");
  try {
    await exec("pnpm", ["agent:demo"], { cwd: ROOT, timeout: 60_000 });
  } catch (e) {
    console.log("  Agent demo had issues, continuing with existing data...");
  }

  // Step 2: Read the latest trace
  let trace: Record<string, unknown>;
  try {
    trace = JSON.parse(readFileSync(join(ARTIFACTS, "latest.json"), "utf-8"));
  } catch {
    console.log("  No trace data found. Run pnpm agent:demo first.");
    return;
  }

  // Step 3: Build a compact on-chain record
  const scan = trace.scan as Record<string, unknown> | undefined;
  const recommendation = trace.recommendation as Record<string, unknown> | undefined;
  const polymarkets = trace.polymarkets as Record<string, unknown> | undefined;
  const execution = trace.execution as Record<string, unknown> | undefined;

  const onchainRecord = {
    agent: "lantern",
    chain: "xlayer-196",
    timestamp: trace.timestamp,
    scan: {
      candidates: scan?.candidatesFound ?? 0,
      honeypots: scan?.honeypots ?? 0,
    },
    recommendation: recommendation
      ? {
          token: recommendation.symbol,
          address: recommendation.address,
          probability: recommendation.finalProbability,
          signals: (
            (recommendation.trace as unknown[]) || []
          ).length,
        }
      : null,
    polymarkets: {
      scanned: polymarkets?.totalMarkets ?? 0,
      withEdge:
        (polymarkets?.marketsWithEdge as number) ??
        ((polymarkets?.withEdge as unknown[]) || []).length,
    },
    execution: {
      executed: (execution?.executed as boolean) ?? false,
      txHash: (execution?.txHash as string) ?? null,
    },
  };

  console.log("\n[2/3] On-chain record:");
  console.log(JSON.stringify(onchainRecord, null, 2));

  // Step 4: Encode as hex and write to X Layer
  const jsonStr = JSON.stringify(onchainRecord);
  const hexData = "0x" + Buffer.from(jsonStr).toString("hex");

  console.log(`\n[3/3] Writing to X Layer (${jsonStr.length} bytes)...`);

  const result = (await run([
    "wallet",
    "contract-call",
    "--to",
    XLAYER_TARGET, // WOKB contract -- fallback accepts arbitrary data
    "--chain",
    "196",
    "--input-data",
    hexData,
    "--gas-limit",
    "60000",
    "--force",
  ])) as { ok: boolean; data?: { txHash: string } } | null;

  if (result?.ok && result.data?.txHash) {
    console.log(`\n  Decision trace written to X Layer!`);
    console.log(`  TxHash: ${result.data.txHash}`);
    console.log(
      `  Explorer: https://www.okx.com/web3/explorer/xlayer/tx/${result.data.txHash}`,
    );

    // Save the txHash to artifacts
    const logPath = join(ARTIFACTS, "onchain-log.json");
    let logs: unknown[] = [];
    try {
      logs = JSON.parse(readFileSync(logPath, "utf-8"));
    } catch {
      /* first entry */
    }
    logs.push({
      timestamp: new Date().toISOString(),
      txHash: result.data.txHash,
      record: onchainRecord,
    });
    writeFileSync(logPath, JSON.stringify(logs, null, 2));
    console.log(`  Log saved: ${logPath}`);
  } else {
    console.log("  Failed to write to X Layer");
    console.log("  Result:", JSON.stringify(result));
  }
}

main().catch(console.error);
