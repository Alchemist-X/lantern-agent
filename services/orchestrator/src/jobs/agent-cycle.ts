import { randomUUID } from "node:crypto";
import { JOBS, QUEUES, tradeDecisionSetSchema, type TradeDecisionSet } from "@lantern/contracts";
import {
  agentDecisions,
  agentRuns,
  artifacts,
  executionEvents,
  getDb,
  getOverview,
  getPublicPositions,
  trackedSources
} from "@lantern/db";
import { Queue } from "bullmq";
import type { OrchestratorConfig } from "../config.js";
import { applyTradeGuards } from "../lib/risk.js";
import { getSystemStatus } from "../lib/state.js";
import type { AgentRuntime } from "../runtime/agent-runtime.js";
import { runDailyPulseCore } from "./daily-pulse-core.js";
import { executeHeartbeatSwap } from "./heartbeat-swap.js";

export interface ExecutableTradePlan {
  decisionId: string | null;
  decision: TradeDecisionSet["decisions"][number];
}

export interface QueuedTradeJobSummary extends ExecutableTradePlan {
  jobId: string;
}

function detectSourceKind(url: string): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (hostname.includes("okx.com")) {
      return "okx-dex";
    }
    return hostname.replace(/^www\./, "");
  } catch {
    return "external";
  }
}

async function persistRun(result: {
  promptSummary: string;
  reasoningMd: string;
  logsMd: string;
  decisionSet: TradeDecisionSet;
}) {
  const db = getDb();

  await db.insert(agentRuns).values({
    id: result.decisionSet.run_id,
    runtime: result.decisionSet.runtime,
    mode: result.decisionSet.mode,
    status: "completed",
    bankrollUsd: String(result.decisionSet.bankroll_usd),
    promptSummary: result.promptSummary,
    reasoningMd: result.reasoningMd,
    logsMd: result.logsMd,
    generatedAtUtc: new Date(result.decisionSet.generated_at_utc)
  });

  const decisionIdMap = new Map<string, string>();

  for (const decision of result.decisionSet.decisions) {
    const decisionId = randomUUID();
    decisionIdMap.set(`${decision.pair_slug}:${decision.action}`, decisionId);

    await db.insert(agentDecisions).values({
      id: decisionId,
      runId: result.decisionSet.run_id,
      action: decision.action,
      tokenSymbol: decision.token_symbol,
      pairSlug: decision.pair_slug,
      tokenAddress: decision.token_address,
      side: decision.side,
      notionalUsd: String(decision.notional_usd),
      orderType: decision.order_type,
      signalStrength: String(decision.signal_strength),
      momentumScore: String(decision.momentum_score),
      edge: String(decision.edge),
      confidence: decision.confidence,
      thesisMd: decision.thesis_md,
      sources: decision.sources,
      stopLossPct: String(decision.stop_loss_pct),
      resolutionTrackRequired: true
    });

    for (const source of decision.sources) {
      await db.insert(trackedSources).values({
        id: randomUUID(),
        runId: result.decisionSet.run_id,
        decisionId,
        tokenSymbol: decision.token_symbol,
        pairSlug: decision.pair_slug,
        title: source.title,
        url: source.url,
        sourceKind: detectSourceKind(source.url),
        role: "decision-source",
        status: "captured",
        retrievedAtUtc: new Date(source.retrieved_at_utc),
        lastCheckedAt: new Date(source.retrieved_at_utc),
        note: source.note ?? null,
        contentHash: null,
        metadata: {}
      });
    }
  }

  for (const artifact of result.decisionSet.artifacts) {
    await db.insert(artifacts).values({
      id: randomUUID(),
      runId: result.decisionSet.run_id,
      kind: artifact.kind,
      title: artifact.title,
      path: artifact.path,
      content: artifact.content ?? null,
      publishedAtUtc: new Date(artifact.published_at_utc)
    });
  }

  return decisionIdMap;
}

export async function queueTradeExecution(input: {
  executionQueue: Queue;
  runId: string;
  decisionId: string | null;
  decision: TradeDecisionSet["decisions"][number];
}) {
  const job = await input.executionQueue.add(
    JOBS.executeTrade,
    {
      runId: input.runId,
      decisionId: input.decisionId,
      decision: input.decision
    },
    {
      removeOnComplete: true,
      removeOnFail: false
    }
  );

  const db = getDb();
  await db.insert(executionEvents).values({
    id: randomUUID(),
    runId: input.runId,
    decisionId: input.decisionId,
    pairSlug: input.decision.pair_slug,
    tokenAddress: input.decision.token_address,
    side: input.decision.side,
    status: "submitted",
    requestedNotionalUsd: String(input.decision.notional_usd),
    filledNotionalUsd: "0",
    rawResponse: {
      queued: true,
      queue: QUEUES.execution,
      jobId: job.id
    }
  });

  return {
    decisionId: input.decisionId,
    decision: input.decision,
    jobId: String(job.id)
  } satisfies QueuedTradeJobSummary;
}

export async function runAgentCycle(deps: {
  runtime: AgentRuntime;
  executionQueue: Queue;
  config: OrchestratorConfig;
  queueStrategy?: "all" | "manual";
}) {
  const status = await getSystemStatus();
  if (status !== "running") {
    return { skipped: true, reason: `system status is ${status}` };
  }

  const [overview, positions] = await Promise.all([getOverview(), getPublicPositions()]);
  const runId = randomUUID();
  const mode = "full";
  const coreResult = await runDailyPulseCore({
    config: deps.config,
    runtime: deps.runtime,
    runId,
    mode,
    overview,
    positions
  });
  const decisionSet = tradeDecisionSetSchema.parse(coreResult.decisionSet);
  const decisionIdMap = await persistRun({ ...coreResult.result, decisionSet });
  const executableTrades: ExecutableTradePlan[] = [];
  const queuedTradeJobs: QueuedTradeJobSummary[] = [];

  let projectedTotalExposureUsd = positions.reduce((sum, position) => sum + position.current_value_usd, 0);
  let projectedOpenPositions = overview.open_positions;
  const eventExposureUsd = new Map<string, number>();
  for (const position of positions) {
    eventExposureUsd.set(
      position.token_symbol,
      (eventExposureUsd.get(position.token_symbol) ?? 0) + position.current_value_usd
    );
  }

  for (const decision of decisionSet.decisions) {
    if (!["open", "close", "reduce"].includes(decision.action)) {
      continue;
    }

    const queuedNotional = decision.action === "open"
      ? applyTradeGuards({
          requestedUsd: decision.notional_usd,
          bankrollUsd: overview.total_equity_usd,
          minTradeUsd: deps.config.minTradeUsd,
          maxTradePct: deps.config.maxTradePct,
          liquidityCapUsd: decision.liquidity_cap_usd ?? decision.notional_usd,
          totalExposureUsd: projectedTotalExposureUsd,
          maxTotalExposurePct: deps.config.maxTotalExposurePct,
          eventExposureUsd: eventExposureUsd.get(decision.token_symbol) ?? 0,
          maxEventExposurePct: deps.config.maxEventExposurePct,
          openPositions: projectedOpenPositions,
          maxPositions: deps.config.maxPositions
        })
      : decision.notional_usd;

    if (queuedNotional <= 0 && decision.action === "open") {
      continue;
    }
    const executableTrade = {
      decisionId: decisionIdMap.get(`${decision.pair_slug}:${decision.action}`) ?? null,
      decision: {
        ...decision,
        notional_usd: queuedNotional
      }
    } satisfies ExecutableTradePlan;
    executableTrades.push(executableTrade);

    if (decision.action === "open") {
      projectedTotalExposureUsd += queuedNotional;
      projectedOpenPositions += 1;
      eventExposureUsd.set(
        decision.token_symbol,
        (eventExposureUsd.get(decision.token_symbol) ?? 0) + queuedNotional
      );
    }

    if (deps.queueStrategy !== "manual") {
      queuedTradeJobs.push(await queueTradeExecution({
        executionQueue: deps.executionQueue,
        runId: decisionSet.run_id,
        decisionId: executableTrade.decisionId,
        decision: executableTrade.decision
      }));
    }
  }

  // If no trades were queued, fire a heartbeat swap to keep the agent active on-chain
  let heartbeatTxHash: string | null = null;
  if (queuedTradeJobs.length === 0) {
    const heartbeatResult = await executeHeartbeatSwap(deps.config.okx);
    heartbeatTxHash = heartbeatResult?.txHash ?? null;
  }

  return {
    skipped: false,
    runId: decisionSet.run_id,
    decisions: decisionSet.decisions.length,
    executableTrades,
    queuedTradeJobs,
    heartbeatTxHash
  };
}
