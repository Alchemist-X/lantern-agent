import { randomUUID } from "node:crypto";
import {
  artifacts,
  getDb,
  getOverview,
  getPublicPositions,
  getPublicRunDetail,
  getPublicRuns,
  getPublicTrades
} from "@lantern/db";
import { loadConfig } from "../config.js";
import { buildBacktestReportArtifact } from "../lib/portfolio-report-artifacts.js";

const BACKTEST_LOOKBACK_DAYS = 21;

export async function runBacktestJob() {
  const config = loadConfig();
  const db = getDb();
  const timestamp = new Date().toISOString();
  const windowStart = new Date(new Date(timestamp).getTime() - BACKTEST_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const [overview, positions, runs, trades] = await Promise.all([
    getOverview(),
    getPublicPositions(),
    getPublicRuns(),
    getPublicTrades()
  ]);
  const recentRuns = runs.filter((run) => {
    const generatedAt = new Date(run.generated_at_utc);
    return !Number.isNaN(generatedAt.getTime()) && generatedAt >= windowStart;
  });
  const runDetails = (await Promise.all(recentRuns.map((run) => getPublicRunDetail(run.id))))
    .filter((detail): detail is NonNullable<typeof detail> => detail !== null);
  const recentTrades = trades.filter((trade) => {
    const executedAt = new Date(trade.timestamp_utc);
    return !Number.isNaN(executedAt.getTime()) && executedAt >= windowStart;
  });

  const artifact = await buildBacktestReportArtifact({
    config,
    generatedAtUtc: timestamp,
    runId: randomUUID(),
    overview,
    positions,
    runDetails,
    trades: recentTrades,
    lookbackDays: BACKTEST_LOOKBACK_DAYS
  });

  await db.insert(artifacts).values({
    id: randomUUID(),
    runId: null,
    kind: artifact.kind,
    title: artifact.title,
    path: artifact.path,
    content: artifact.content,
    publishedAtUtc: new Date(timestamp)
  });
}
