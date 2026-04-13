import type { Job } from "bullmq";
import { Worker } from "bullmq";
import { JOBS, inferPaperSellAmount, type TradeDecision } from "@lantern/contracts";
import { executionEvents, getDb, positions } from "@lantern/db";
import { and, eq, gt, isNull } from "drizzle-orm";
import type { ExecutorConfig } from "../config.js";
import { executeSwap, fetchWalletBalances, flattenAllPositions, getTokenPrice, USDC_ADDRESS, type OkxDexConfig } from "../lib/okx-dex.js";
import { calculatePositionPnlPct, shouldTriggerStopLoss } from "../lib/risk.js";
import {
  currentOpenExposureUsd,
  findOpenPosition,
  getStatus,
  markStatus,
  recordExecutionEvent,
  upsertPosition,
  writeSnapshot,
  latestSnapshot
} from "../lib/store.js";

function inferSellAmount(position: Awaited<ReturnType<typeof findOpenPosition>>, decision: TradeDecision): number {
  return inferPaperSellAmount(
    position
      ? {
          id: position.id,
          token_symbol: position.tokenSymbol,
          pair_slug: position.pairSlug,
          token_address: position.tokenAddress,
          side: position.side as "BUY" | "SELL",
          size: Number(position.size),
          avg_cost: Number(position.avgCost),
          current_price: Number(position.currentPrice),
          current_value_usd: Number(position.currentValueUsd),
          unrealized_pnl_pct: Number(position.unrealizedPnlPct),
          stop_loss_pct: Number(position.stopLossPct),
          opened_at: position.openedAt.toISOString(),
          updated_at: position.updatedAt.toISOString()
        }
      : null,
    decision
  );
}

async function handleTradeJob(job: Job, config: ExecutorConfig) {
  const status = await getStatus();
  const decision = job.data.decision as TradeDecision;
  const dexConfig: OkxDexConfig = {
    walletAddress: config.walletAddress,
    chainId: config.chainId,
    slippagePct: config.slippagePct,
    rpcUrl: config.rpcUrl
  };

  if (status === "halted" && decision.action === "open") {
    await recordExecutionEvent({
      runId: job.data.runId,
      decisionId: job.data.decisionId,
      pairSlug: decision.pair_slug,
      tokenAddress: decision.token_address,
      side: decision.side,
      status: "drawdown_halt",
      requestedNotionalUsd: decision.notional_usd,
      filledNotionalUsd: 0,
      avgPrice: null,
      rawResponse: { rejected: true, reason: "system halted" }
    });
    return;
  }

  const position = await findOpenPosition(decision.token_address);
  const amount =
    decision.side === "BUY"
      ? decision.notional_usd
      : inferSellAmount(position, decision);

  const isBuy = decision.side === "BUY";
  const result = await executeSwap(dexConfig, {
    fromToken: isBuy ? USDC_ADDRESS : decision.token_address,
    toToken: isBuy ? decision.token_address : USDC_ADDRESS,
    readableAmount: String(amount)
  });

  const tokenPrice = await getTokenPrice(decision.token_address).catch(() => 0.5);
  const avgPrice = tokenPrice > 0 ? tokenPrice : 0.5;
  const sizeDelta = decision.side === "BUY" ? amount / avgPrice : -amount;
  const previousSize = position ? Number(position.size) : 0;
  const nextSize = Math.max(0, previousSize + sizeDelta);
  const nextAvgCost =
    decision.side === "BUY"
      ? position
        ? (previousSize * Number(position.avgCost) + amount) / Math.max(nextSize, 1)
        : avgPrice
      : position
        ? Number(position.avgCost)
        : avgPrice;
  const currentValueUsd = nextSize * avgPrice;
  const currentPrice = avgPrice;
  const pnlPct = calculatePositionPnlPct(nextAvgCost, currentPrice);

  await upsertPosition({
    tokenSymbol: decision.token_symbol,
    pairSlug: decision.pair_slug,
    tokenAddress: decision.token_address,
    side: decision.side,
    outcomeLabel: decision.side,
    size: nextSize,
    avgCost: nextAvgCost,
    currentPrice,
    currentValueUsd,
    unrealizedPnlPct: pnlPct,
    stopLossPct: decision.stop_loss_pct
  });

  await recordExecutionEvent({
    runId: job.data.runId,
    decisionId: job.data.decisionId,
    pairSlug: decision.pair_slug,
    tokenAddress: decision.token_address,
    side: decision.side,
    status: result.txHash ? "filled" : "rejected",
    requestedNotionalUsd: decision.notional_usd,
    filledNotionalUsd: Number(result.toAmount) || 0,
    avgPrice: tokenPrice,
    orderId: result.txHash,
    rawResponse: result
  });
}

async function handleSyncJob(config: ExecutorConfig) {
  const dexConfig: OkxDexConfig = {
    walletAddress: config.walletAddress,
    chainId: config.chainId,
    slippagePct: config.slippagePct,
    rpcUrl: config.rpcUrl
  };
  const latest = await latestSnapshot();
  const remoteBalances = await fetchWalletBalances(dexConfig).catch(() => []);
  const db = getDb();
  const localPositions = await db.query.positions.findMany({
    where: isNull(positions.closedAt)
  });

  const remoteByToken = new Map(remoteBalances.map((b) => [b.tokenAddress, b]));
  for (const remote of remoteBalances) {
    if (remote.tokenAddress.toLowerCase() === USDC_ADDRESS.toLowerCase()) {
      continue;
    }
    const currentPrice = await getTokenPrice(remote.tokenAddress).catch(() => 0);
    if (currentPrice <= 0) {
      continue;
    }
    const size = Number(remote.balance);
    const balanceUsd = Number(remote.balanceUsd) || size * currentPrice;
    const localMatch = localPositions.find((p) => p.tokenAddress === remote.tokenAddress);
    const avgCost = localMatch ? Number(localMatch.avgCost) : currentPrice;
    const pnlPct = calculatePositionPnlPct(avgCost, currentPrice);

    await upsertPosition({
      tokenSymbol: remote.symbol || remote.tokenAddress,
      pairSlug: `${remote.symbol || remote.tokenAddress}/USDC`,
      tokenAddress: remote.tokenAddress,
      side: "BUY",
      outcomeLabel: remote.symbol || "Unknown",
      size,
      avgCost,
      currentPrice,
      currentValueUsd: balanceUsd,
      unrealizedPnlPct: pnlPct,
      stopLossPct: config.positionStopLossPct
    });

    if (shouldTriggerStopLoss(avgCost, currentPrice, config.positionStopLossPct)) {
      await executeSwap(dexConfig, {
        fromToken: remote.tokenAddress,
        toToken: USDC_ADDRESS,
        readableAmount: remote.balance
      });
      await recordExecutionEvent({
        pairSlug: `${remote.symbol || remote.tokenAddress}/USDC`,
        tokenAddress: remote.tokenAddress,
        side: "SELL",
        status: "stop_loss_triggered",
        requestedNotionalUsd: balanceUsd,
        filledNotionalUsd: balanceUsd,
        avgPrice: currentPrice,
        rawResponse: { stop_loss: true }
      });
    }
  }

  for (const local of localPositions) {
    if (!remoteByToken.has(local.tokenAddress)) {
      await db.update(positions).set({
        closedAt: new Date(),
        currentValueUsd: "0",
        updatedAt: new Date()
      }).where(eq(positions.id, local.id));
    }
  }

  const openPositions = await db.query.positions.findMany({
    where: isNull(positions.closedAt)
  });
  const openExposureUsd = await currentOpenExposureUsd();
  const previousCash = latest ? Number(latest.cashBalanceUsd) : config.initialBankrollUsd;
  const recentEvents = await db.query.executionEvents.findMany({
    where: latest
      ? gt(executionEvents.timestampUtc, latest.createdAt)
      : undefined
  });
  const cashDeltaUsd = recentEvents.reduce((sum, event) => {
    const filled = Number(event.filledNotionalUsd);
    if (!(filled > 0)) {
      return sum;
    }
    return event.side === "SELL" ? sum + filled : sum - filled;
  }, 0);
  const cashBalanceUsd = Number((previousCash + cashDeltaUsd).toFixed(2));
  const totalEquityUsd = Number((cashBalanceUsd + openExposureUsd).toFixed(2));
  const highWaterMarkUsd = Math.max(latest ? Number(latest.highWaterMarkUsd) : config.initialBankrollUsd, totalEquityUsd);
  const drawdownPct = highWaterMarkUsd > 0 ? Math.max(0, (highWaterMarkUsd - totalEquityUsd) / highWaterMarkUsd) : 0;
  const halted = drawdownPct >= config.drawdownStopPct;

  await writeSnapshot({
    cashBalanceUsd,
    totalEquityUsd,
    highWaterMarkUsd,
    drawdownPct,
    openPositions: openPositions.length,
    halted
  });

  if (halted) {
    await markStatus("halted", `Portfolio drawdown reached ${(drawdownPct * 100).toFixed(2)}%.`);
  }
}

async function handleFlattenJob(config: ExecutorConfig) {
  const dexConfig: OkxDexConfig = {
    walletAddress: config.walletAddress,
    chainId: config.chainId,
    slippagePct: config.slippagePct,
    rpcUrl: config.rpcUrl
  };

  await flattenAllPositions(dexConfig);

  const db = getDb();
  const openPositions = await db.query.positions.findMany({
    where: isNull(positions.closedAt)
  });

  for (const position of openPositions) {
    const price = await getTokenPrice(position.tokenAddress).catch(() => Number(position.currentPrice));
    await db.update(positions).set({
      currentPrice: String(price),
      currentValueUsd: "0",
      size: "0",
      closedAt: new Date(),
      updatedAt: new Date()
    }).where(eq(positions.id, position.id));
    await recordExecutionEvent({
      pairSlug: position.pairSlug,
      tokenAddress: position.tokenAddress,
      side: "SELL",
      status: "manual_flatten",
      requestedNotionalUsd: Number(position.currentValueUsd),
      filledNotionalUsd: Number(position.currentValueUsd),
      avgPrice: price
    });
  }
}

export function createQueueWorker(config: ExecutorConfig, connection: { host?: string } | any) {
  return new Worker(
    "execution-jobs",
    async (job) => {
      switch (job.name) {
        case JOBS.executeTrade:
          await handleTradeJob(job, config);
          break;
        case JOBS.syncPortfolio:
          await handleSyncJob(config);
          break;
        case JOBS.flattenPortfolio:
          await handleFlattenJob(config);
          break;
        case JOBS.cancelOpenOrders:
          await recordExecutionEvent({
            pairSlug: "system",
            tokenAddress: "system",
            side: "SELL",
            status: "canceled",
            requestedNotionalUsd: 0,
            filledNotionalUsd: 0,
            avgPrice: null,
            rawResponse: {
              note: "No open orders are expected because v1 uses FOK only."
            }
          });
          break;
        default:
          throw new Error(`Unhandled job: ${job.name}`);
      }
    },
    { connection }
  );
}
