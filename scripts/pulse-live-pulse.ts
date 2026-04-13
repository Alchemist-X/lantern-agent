import path from "node:path";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import type { AgentRuntimeProvider } from "../services/orchestrator/src/config.ts";
import type {
  PulseCandidate,
  PulseFetchConfig,
  PulseSnapshot,
  PulseStatsBundle
} from "../services/orchestrator/src/pulse/market-pulse.ts";

interface StoredPulseBucketStat {
  slug: string;
  label: string;
  count: number;
  source?: string | null;
}

interface StoredPulseStatsBundle {
  fetched?: StoredPulseBucketStat[];
  filtered?: StoredPulseBucketStat[];
}

interface StoredPulseSnapshot {
  generated_at_utc: string;
  provider: AgentRuntimeProvider;
  locale: "en" | "zh";
  title: string;
  total_fetched: number;
  total_filtered: number;
  selected_candidates: number;
  min_liquidity_usd: number;
  fetch_config?: {
    pages_per_dimension?: number;
    events_per_page?: number;
    min_fetched_markets?: number;
    dimensions?: string[];
  };
  category_stats?: StoredPulseStatsBundle;
  tag_stats?: StoredPulseStatsBundle;
  risk_flags: string[];
  candidates: PulseCandidate[];
}

function toAbsolutePath(root: string, value: string) {
  return path.isAbsolute(value) ? value : path.resolve(root, value);
}

function toStatsBundle(bundle: StoredPulseStatsBundle | undefined): PulseStatsBundle {
  const normalize = (rows: StoredPulseBucketStat[] | undefined) =>
    Array.isArray(rows)
      ? rows
          .filter((row) =>
            typeof row?.slug === "string" &&
            row.slug.trim() &&
            typeof row?.label === "string" &&
            row.label.trim() &&
            typeof row?.count === "number" &&
            Number.isFinite(row.count)
          )
          .map((row) => ({
            slug: row.slug.trim(),
            label: row.label.trim(),
            count: Number(row.count),
            ...(typeof row.source === "string" && row.source.trim() ? { source: row.source.trim() } : {})
          }))
      : [];

  return {
    fetched: normalize(bundle?.fetched),
    filtered: normalize(bundle?.filtered)
  };
}

function toFetchConfig(value: StoredPulseSnapshot["fetch_config"]): PulseFetchConfig {
  return {
    pagesPerDimension: Number(value?.pages_per_dimension ?? 0),
    eventsPerPage: Number(value?.events_per_page ?? 0),
    minFetchedMarkets: Number(value?.min_fetched_markets ?? 0),
    dimensions: Array.isArray(value?.dimensions)
      ? value.dimensions.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
      : []
  };
}

export async function loadPulseSnapshotFromArtifacts(input: {
  artifactStorageRoot: string;
  pulseJsonPath: string;
  pulseMarkdownPath?: string | null;
}): Promise<PulseSnapshot> {
  const absoluteJsonPath = toAbsolutePath(process.cwd(), input.pulseJsonPath);
  const absoluteMarkdownPath = toAbsolutePath(
    process.cwd(),
    input.pulseMarkdownPath ?? absoluteJsonPath.replace(/\.json$/i, ".md")
  );
  const [jsonContent, markdown] = await Promise.all([
    readFile(absoluteJsonPath, "utf8"),
    readFile(absoluteMarkdownPath, "utf8")
  ]);
  const parsed = JSON.parse(jsonContent) as StoredPulseSnapshot;
  return {
    id: randomUUID(),
    generatedAtUtc: parsed.generated_at_utc,
    title: parsed.title,
    relativeMarkdownPath: path.relative(input.artifactStorageRoot, absoluteMarkdownPath),
    absoluteMarkdownPath,
    relativeJsonPath: path.relative(input.artifactStorageRoot, absoluteJsonPath),
    absoluteJsonPath,
    markdown,
    totalFetched: parsed.total_fetched,
    totalFiltered: parsed.total_filtered,
    selectedCandidates: parsed.selected_candidates,
    minLiquidityUsd: parsed.min_liquidity_usd,
    fetchConfig: toFetchConfig(parsed.fetch_config),
    categoryStats: toStatsBundle(parsed.category_stats),
    tagStats: toStatsBundle(parsed.tag_stats),
    candidates: Array.isArray(parsed.candidates) ? parsed.candidates : [],
    riskFlags: Array.isArray(parsed.risk_flags) ? parsed.risk_flags : [],
    tradeable: Array.isArray(parsed.risk_flags) ? parsed.risk_flags.length === 0 : true
  };
}
