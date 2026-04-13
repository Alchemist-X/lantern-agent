import type { OverviewResponse, PublicPosition, PublicTrade } from "@lantern/contracts";
import type { PublicPulseRecommendationExample } from "./public-run-pulse";
import { STATIC_PUBLIC_PULSE_RECOMMENDATION_EXAMPLES } from "./public-run-pulse-static";
import type { SpectatorActivityEvent, SpectatorProfile } from "./public-wallet";
import {
  getPublicOverviewData,
  getPublicPositionsData,
  getPublicTradesData,
  getSpectatorActivityData,
  getSpectatorProfileData,
  isSpectatorWalletMode
} from "./public-wallet";

interface GammaTag {
  label?: string;
  slug?: string;
}

export interface PreviewNavPoint {
  timestamp: string;
  timestamp_utc: string;
  total_equity_usd: number;
  unit_nav: number;
  equity_usd: number;
  nav_index: number;
  label: string;
  source: "curve" | "snapshot" | "estimated";
}

export interface PreviewNavSummary {
  timestamp: string;
  start_equity_usd: number;
  current_equity_usd: number;
  current_nav_index: number;
  change_pct: number;
  is_approximate: boolean;
  note: string;
}

export interface PreviewTerminalEntry {
  id: string;
  timestamp_utc: string;
  kind: "command" | "search" | "signal" | "execution" | "note";
  level: "info" | "success" | "warning" | "muted";
  label: string;
  detail: string;
  market_url: string | null;
}

export interface PreviewMarketClusterItem {
  id: string;
  pair_slug: string;
  token_symbol: string;
  label: string;
  url: string;
  value_usd: number;
  last_seen_at_utc: string | null;
  source_tags: string[];
}

export interface PreviewMarketCluster {
  key: string;
  label: string;
  description: string;
  total_value_usd: number;
  item_count: number;
  items: PreviewMarketClusterItem[];
}

export interface PreviewCluster {
  slug: string;
  label: string;
  exposure_usd: number;
  market_count: number;
  token_symbols: string[];
}

export interface PreviewPositionInsight {
  id: string;
  title: string;
  pair_slug: string;
  token_symbol: string;
  side: string;
  current_value_usd: number;
  current_price: number;
  avg_cost: number;
  unrealized_pnl_pct: number;
  analysis_md: string;
  cluster_label: string;
  market_url: string;
}

export interface PreviewAgentFeedEntry {
  id: string;
  timestamp_utc: string;
  phase: "search" | "score" | "decision" | "execution";
  label: string;
  detail: string;
  pair_slug: string | null;
  market_url: string | null;
  tone: "neutral" | "positive" | "warning";
}

export interface PreviewDashboardData {
  spectatorMode: boolean;
  overview: OverviewResponse;
  profile: SpectatorProfile | null;
  positions: PublicPosition[];
  topPositions: PublicPosition[];
  trades: PublicTrade[];
  recentTrades: PublicTrade[];
  activity: SpectatorActivityEvent[];
  recentActivity: SpectatorActivityEvent[];
  pulseExamples: PublicPulseRecommendationExample[];
  latestPulse: PublicPulseRecommendationExample | null;
  navSeries: PreviewNavPoint[];
  navSummary: PreviewNavSummary;
  terminalFeed: PreviewTerminalEntry[];
  marketClusters: PreviewMarketCluster[];
  trackedNav: PreviewNavPoint[];
  trackedNavNote: string;
  clusters: PreviewCluster[];
  positionInsights: PreviewPositionInsight[];
  agentFeed: PreviewAgentFeedEntry[];
}

const MARKET_CLUSTER_META = {
  politics: {
    label: "政治 / 地缘",
    description: "选举、政策、战争、外交和政府事件。"
  },
  sports: {
    label: "体育",
    description: "世界杯、联赛、冠军和赛事结果。"
  },
  macro: {
    label: "宏观 / 经济",
    description: "利率、通胀、能源、大宗和经济预期。"
  },
  crypto: {
    label: "加密",
    description: "比特币、以太坊和链上叙事。"
  },
  ai: {
    label: "AI / 科技",
    description: "模型、平台和科技公司相关市场。"
  },
  other: {
    label: "其他事件",
    description: "当前暂未细分到更具体主题。"
  }
} as const;

type MarketClusterMeta = (typeof MARKET_CLUSTER_META)[keyof typeof MARKET_CLUSTER_META];

function byTimestampDesc<T extends { timestamp_utc?: string | null }>(items: T[]): T[] {
  return [...items].sort((left, right) => {
    const leftTime = left.timestamp_utc ? new Date(left.timestamp_utc).getTime() : 0;
    const rightTime = right.timestamp_utc ? new Date(right.timestamp_utc).getTime() : 0;
    return rightTime - leftTime;
  });
}

function byCurrentValueDesc(items: PublicPosition[]): PublicPosition[] {
  return [...items].sort((left, right) => right.current_value_usd - left.current_value_usd);
}

function round(value: number, digits = 4): number {
  return Number(value.toFixed(digits));
}

function clipText(value: string | null | undefined, maxLength = 180): string {
  if (!value) {
    return "暂无可展示的说明。";
  }

  const normalized = value
    .replace(/[#>*_`-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trim()}...`;
}

export function formatMarketLabel(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .slice(0, 10)
    .join(" ");
}

function xlayerTokenUrl(tokenSlug: string): string {
  return `https://www.okx.com/web3/explorer/xlayer/token/${tokenSlug}`;
}

export function buildMarketUrl(eventSlug: string, marketSlug?: string | null): string {
  const slug = (eventSlug || marketSlug || "").trim();
  if (!slug) {
    return "https://www.okx.com/web3/explorer/xlayer";
  }
  return xlayerTokenUrl(slug);
}

const PREVIEW_PULSE_RUN_PRIORITY = [
  "7504bda8-c58e-4492-b43a-7c6d64315bcf",
  "2911461a-1dcb-4186-aab0-7aecc6ad012c",
  "a2420cbb-f0d2-46ca-8931-77b4ee3cfd67"
] as const;

function choosePulseExamples(): PublicPulseRecommendationExample[] {
  const byRunId = new Map(STATIC_PUBLIC_PULSE_RECOMMENDATION_EXAMPLES.map((example) => [example.run_id, example] as const));
  const selected: PublicPulseRecommendationExample[] = [];

  for (const runId of PREVIEW_PULSE_RUN_PRIORITY) {
    const example = byRunId.get(runId);
    if (example) {
      selected.push(example);
    }
  }

  if (selected.length < 3) {
    for (const example of STATIC_PUBLIC_PULSE_RECOMMENDATION_EXAMPLES) {
      if (!selected.some((item) => item.run_id === example.run_id)) {
        selected.push(example);
      }
      if (selected.length >= 3) {
        break;
      }
    }
  }

  return selected.slice(0, 3);
}

function inferCluster(tags: GammaTag[], title: string, eventSlug: string, marketSlug: string): { slug: string; label: string } {
  const values = [
    ...tags.flatMap((tag) => [tag.slug ?? "", tag.label ?? ""]),
    title,
    eventSlug,
    marketSlug
  ].join(" ").toLowerCase();

  if (/(politics|geopolitics|election|president|congress|trump|biden|senate|government|fed|iran|israel|ceasefire|war|diplomacy)/.test(values)) {
    return { slug: "politics", label: MARKET_CLUSTER_META.politics.label };
  }

  if (/(sports|fifa|nba|nfl|nhl|mlb|world-cup|football|soccer|tennis|golf|championship|cup)/.test(values)) {
    return { slug: "sports", label: MARKET_CLUSTER_META.sports.label };
  }

  if (/(bitcoin|btc|ethereum|eth|crypto|solana|doge)/.test(values)) {
    return { slug: "crypto", label: MARKET_CLUSTER_META.crypto.label };
  }

  if (/(oil|inflation|cpi|macro|recession|rates|interest|economy|gold|crude)/.test(values)) {
    return { slug: "macro", label: MARKET_CLUSTER_META.macro.label };
  }

  if (/(openai|ai|gpt|model|nvidia|microsoft|apple|tech)/.test(values)) {
    return { slug: "ai", label: MARKET_CLUSTER_META.ai.label };
  }

  return { slug: "other", label: MARKET_CLUSTER_META.other.label };
}

async function fetchEventClusters(
  positions: PublicPosition[],
  pulseExamples: PublicPulseRecommendationExample[]
): Promise<Map<string, { slug: string; label: string }>> {
  const uniqueKeys = new Map<string, { marketSlug: string }>();

  for (const position of positions) {
    uniqueKeys.set(position.token_symbol, { marketSlug: position.pair_slug });
  }

  for (const example of pulseExamples) {
    uniqueKeys.set(example.token_symbol, { marketSlug: example.pair_slug });
  }

  const entries = Array.from(uniqueKeys.entries()).slice(0, 12);
  const responses = entries.map(([eventSlug, meta]) => {
    const inferred = inferCluster([], "", eventSlug, meta.marketSlug);
    return [eventSlug, inferred] as const;
  });

  return new Map(responses);
}

function getClusterMeta(label: string): { label: string; description: string } {
  const meta = Object.values(MARKET_CLUSTER_META).find((item) => item.label === label) as MarketClusterMeta | undefined;
  return meta ?? MARKET_CLUSTER_META.other;
}

function buildTrackedNavSeries(
  overview: OverviewResponse,
  activities: SpectatorActivityEvent[],
  positions: PublicPosition[]
): { points: PreviewNavPoint[]; note: string } {
  if (activities.length === 0) {
    const timestamp = new Date().toISOString();
    return {
      points: [
        {
          timestamp,
          timestamp_utc: timestamp,
          total_equity_usd: round(overview.total_equity_usd, 2),
          unit_nav: 1,
          equity_usd: round(overview.total_equity_usd, 2),
          nav_index: 1,
          label: "当前快照",
          source: "snapshot"
        }
      ],
      note: "当前没有公开活动记录，因此这里只能展示单点单位净值。"
    };
  }

  const ascending = [...activities].sort((left, right) => {
    return new Date(left.timestamp_utc).getTime() - new Date(right.timestamp_utc).getTime();
  });

  const currentPriceByToken = new Map(positions.map((position) => [position.token_address, position.current_price]));
  const stateByToken = new Map<string, { shares: number; lastPrice: number }>();
  const snapshots: Array<{ timestamp: string; visibleValue: number }> = [];
  let cashShadow = 0;

  for (const activity of ascending) {
    const tokenId = activity.token_address;
    const currentState = stateByToken.get(tokenId) ?? {
      shares: 0,
      lastPrice: currentPriceByToken.get(tokenId) ?? activity.price ?? 0
    };

    if (activity.type === "TRADE" && activity.side === "BUY") {
      currentState.shares += activity.share_size;
      cashShadow -= activity.usdc_size;
    } else if (activity.type === "TRADE" && activity.side === "SELL") {
      currentState.shares = Math.max(0, currentState.shares - activity.share_size);
      cashShadow += activity.usdc_size;
    } else if (activity.type === "REDEEM") {
      if (activity.share_size > 0) {
        currentState.shares = Math.max(0, currentState.shares - activity.share_size);
      }
      cashShadow += activity.usdc_size;
    }

    if (typeof activity.price === "number" && Number.isFinite(activity.price) && activity.price > 0) {
      currentState.lastPrice = activity.price;
    }

    stateByToken.set(tokenId, currentState);

    const markedValue = Array.from(stateByToken.entries()).reduce((sum, [candidateTokenId, candidate]) => {
      const mark = candidate.lastPrice || currentPriceByToken.get(candidateTokenId) || 0;
      return sum + candidate.shares * mark;
    }, 0);

    snapshots.push({
      timestamp: activity.timestamp_utc,
      visibleValue: cashShadow + markedValue
    });
  }

  const currentVisibleValue = Array.from(stateByToken.entries()).reduce((sum, [candidateTokenId, candidate]) => {
    const mark = currentPriceByToken.get(candidateTokenId) ?? candidate.lastPrice ?? 0;
    return sum + candidate.shares * mark;
  }, cashShadow);

  const firstSnapshot = snapshots[0]!;
  const offset = overview.total_equity_usd - currentVisibleValue;
  const firstEquity = Math.max(0.0001, offset + firstSnapshot.visibleValue);
  const points: PreviewNavPoint[] = snapshots.map((snapshot, index) => {
    const equity = offset + snapshot.visibleValue;
    const navIndex = round(equity / firstEquity, 4);
    return {
      timestamp: snapshot.timestamp,
      timestamp_utc: snapshot.timestamp,
      total_equity_usd: round(equity, 2),
      unit_nav: navIndex,
      equity_usd: round(equity, 2),
      nav_index: navIndex,
      label: `估算点 ${String(index + 1).padStart(2, "0")}`,
      source: "estimated"
    } satisfies PreviewNavPoint;
  });

  if (points.length === 1) {
    points.push({
      timestamp: new Date().toISOString(),
      timestamp_utc: new Date().toISOString(),
      total_equity_usd: round(overview.total_equity_usd, 2),
      unit_nav: round(overview.total_equity_usd / firstEquity, 4),
      equity_usd: round(overview.total_equity_usd, 2),
      nav_index: round(overview.total_equity_usd / firstEquity, 4),
      label: "当前快照",
      source: "snapshot"
    });
  }

  return {
    points,
    note: "该单位净值曲线基于公开可见活动与当前可见持仓做估算，外部出入金和不可见现金流水不会被完整还原。"
  };
}

function buildNavSummary(overview: OverviewResponse, series: PreviewNavPoint[], note: string): PreviewNavSummary {
  const first = series[0] ?? {
    equity_usd: overview.total_equity_usd
  };
  const current = series[series.length - 1] ?? {
    timestamp_utc: new Date().toISOString(),
    equity_usd: overview.total_equity_usd,
    nav_index: 1
  };

  return {
    timestamp: current.timestamp_utc,
    start_equity_usd: round(first.equity_usd, 2),
    current_equity_usd: round(current.equity_usd, 2),
    current_nav_index: current.nav_index,
    change_pct: current.nav_index - 1,
    is_approximate: series.some((point) => point.source !== "curve"),
    note
  };
}

function buildPositionInsights(
  positions: PublicPosition[],
  pulseExamples: PublicPulseRecommendationExample[],
  clusterByEventSlug: Map<string, { slug: string; label: string }>
): PreviewPositionInsight[] {
  return positions.slice(0, 6).map((position) => {
    const pulse = pulseExamples.find((item) => item.pair_slug === position.pair_slug || item.token_symbol === position.token_symbol);
    const cluster = clusterByEventSlug.get(position.token_symbol) ?? { slug: "other", label: MARKET_CLUSTER_META.other.label };
    const fallbackReason = position.unrealized_pnl_pct >= 0
      ? `当前仓位仍在盈利区间，现价 ${position.current_price.toFixed(3)} 高于平均成本 ${position.avg_cost.toFixed(3)}，更适合作为继续持有或观察对象。`
      : `当前仓位回撤中，现价 ${position.current_price.toFixed(3)} 低于平均成本 ${position.avg_cost.toFixed(3)}，页面应该把减仓或继续观察的理由讲清楚。`;

    return {
      id: position.id,
      title: position.pair_slug,
      pair_slug: position.pair_slug,
      token_symbol: position.token_symbol,
      side: position.side,
      current_value_usd: position.current_value_usd,
      current_price: position.current_price,
      avg_cost: position.avg_cost,
      unrealized_pnl_pct: position.unrealized_pnl_pct,
      analysis_md: clipText(pulse?.decision_reason_md ?? fallbackReason, 180),
      cluster_label: cluster.label,
      market_url: buildMarketUrl(position.token_symbol, position.pair_slug)
    };
  });
}

function buildClusters(
  positions: PublicPosition[],
  clusterByEventSlug: Map<string, { slug: string; label: string }>
): PreviewCluster[] {
  const aggregate = new Map<string, PreviewCluster>();

  for (const position of positions) {
    const cluster = clusterByEventSlug.get(position.token_symbol) ?? { slug: "other", label: MARKET_CLUSTER_META.other.label };
    const existing = aggregate.get(cluster.slug) ?? {
      slug: cluster.slug,
      label: cluster.label,
      exposure_usd: 0,
      market_count: 0,
      token_symbols: []
    };

    existing.exposure_usd += position.current_value_usd;
    existing.market_count += 1;
    if (!existing.token_symbols.includes(position.token_symbol)) {
      existing.token_symbols.push(position.token_symbol);
    }
    aggregate.set(cluster.slug, existing);
  }

  return Array.from(aggregate.values())
    .sort((left, right) => right.exposure_usd - left.exposure_usd)
    .map((item) => ({
      ...item,
      exposure_usd: round(item.exposure_usd, 2)
    }));
}

function buildMarketClusters(positionInsights: PreviewPositionInsight[]): PreviewMarketCluster[] {
  const grouped = new Map<string, PreviewMarketCluster>();

  for (const insight of positionInsights) {
    const clusterKey = insight.cluster_label;
    const meta = getClusterMeta(clusterKey);
    const existing = grouped.get(clusterKey) ?? {
      key: clusterKey.toLowerCase(),
      label: clusterKey,
      description: meta.description,
      total_value_usd: 0,
      item_count: 0,
      items: []
    };

    existing.total_value_usd += insight.current_value_usd;
    existing.item_count += 1;
    existing.items.push({
      id: insight.id,
      pair_slug: insight.pair_slug,
      token_symbol: insight.token_symbol,
      label: formatMarketLabel(insight.pair_slug),
      url: insight.market_url,
      value_usd: round(insight.current_value_usd, 2),
      last_seen_at_utc: null,
      source_tags: [insight.cluster_label, insight.side]
    });
    grouped.set(clusterKey, existing);
  }

  return Array.from(grouped.values())
    .map((cluster) => ({
      ...cluster,
      items: cluster.items.sort((left, right) => right.value_usd - left.value_usd).slice(0, 5),
      total_value_usd: round(cluster.total_value_usd, 2)
    }))
    .sort((left, right) => right.total_value_usd - left.total_value_usd);
}

function buildAgentFeed(
  pulseExamples: PublicPulseRecommendationExample[],
  recentTrades: PublicTrade[],
  recentActivity: SpectatorActivityEvent[],
  overview: OverviewResponse
): PreviewAgentFeedEntry[] {
  const entries: PreviewAgentFeedEntry[] = [
    {
      id: "preflight",
      timestamp_utc: overview.last_run_at ?? new Date().toISOString(),
      phase: "decision",
      label: "PREFLIGHT",
      detail: `visible equity ${overview.total_equity_usd.toFixed(2)} USD · open positions ${overview.open_positions}`,
      pair_slug: null,
      market_url: null,
      tone: "neutral"
    }
  ];

  for (const example of pulseExamples.slice(0, 3)) {
    for (const source of (example.sources ?? []).slice(0, 3)) {
      entries.push({
        id: `${example.run_id}-${source.url}`,
        timestamp_utc: source.retrieved_at_utc ?? example.generated_at_utc,
        phase: "search",
        label: "SEARCH",
        detail: `${source.title} · ${source.url.replace(/^https?:\/\//, "")}`,
        pair_slug: example.pair_slug,
        market_url: buildMarketUrl(example.token_symbol, example.pair_slug),
        tone: "neutral"
      });
    }

    entries.push({
      id: `${example.run_id}-score`,
      timestamp_utc: example.generated_at_utc,
      phase: "score",
      label: "SCORE",
      detail: `${example.pair_slug} · 推荐 ${example.recommended_notional_usd.toFixed(2)} USD`,
      pair_slug: example.pair_slug,
      market_url: buildMarketUrl(example.token_symbol, example.pair_slug),
      tone: "neutral"
    });

    entries.push({
      id: `${example.run_id}-decision`,
      timestamp_utc: example.generated_at_utc,
      phase: "decision",
      label: "THESIS",
      detail: clipText(example.decision_reason_md, 140),
      pair_slug: example.pair_slug,
      market_url: buildMarketUrl(example.token_symbol, example.pair_slug),
      tone: example.pulse_evidence_status === "present" ? "positive" : "warning"
    });

    for (const trade of example.executed_trades) {
      entries.push({
        id: `${example.run_id}-${trade.order_id ?? trade.pair_slug}`,
        timestamp_utc: trade.timestamp_utc ?? example.generated_at_utc,
        phase: "execution",
        label: "EXECUTE",
        detail: `${trade.side} ${trade.pair_slug} · ${trade.filled_notional_usd.toFixed(2)} USD`,
        pair_slug: trade.pair_slug,
        market_url: buildMarketUrl(trade.token_symbol, trade.pair_slug),
        tone: "positive"
      });
    }
  }

  if (entries.length <= 1) {
    for (const trade of recentTrades.slice(0, 6)) {
      entries.push({
        id: trade.id,
        timestamp_utc: trade.timestamp_utc,
        phase: "execution",
        label: "EXECUTE",
        detail: `${trade.side} ${trade.pair_slug} · ${(trade.filled_notional_usd || trade.requested_notional_usd).toFixed(2)} USD`,
        pair_slug: trade.pair_slug,
        market_url: buildMarketUrl(trade.pair_slug, trade.pair_slug),
        tone: "positive"
      });
    }
  }

  for (const activity of recentActivity.slice(0, 3)) {
    entries.push({
      id: `activity-${activity.id}`,
      timestamp_utc: activity.timestamp_utc,
      phase: "search",
      label: activity.type,
      detail: `${activity.side ?? activity.direction} · ${formatMarketLabel(activity.pair_slug)}`,
      pair_slug: activity.pair_slug,
      market_url: buildMarketUrl(activity.token_symbol, activity.pair_slug),
      tone: "neutral"
    });
  }

  return entries
    .sort((left, right) => new Date(right.timestamp_utc).getTime() - new Date(left.timestamp_utc).getTime())
    .slice(0, 14);
}

function toTerminalFeed(entries: PreviewAgentFeedEntry[]): PreviewTerminalEntry[] {
  return entries.map((entry) => ({
    id: entry.id,
    timestamp_utc: entry.timestamp_utc,
    kind: entry.phase === "search"
      ? "search"
      : entry.phase === "execution"
        ? "execution"
        : entry.phase === "score"
          ? "signal"
          : "command",
    level: entry.tone === "positive" ? "success" : entry.tone === "warning" ? "warning" : entry.phase === "search" ? "muted" : "info",
    label: entry.label,
    detail: entry.detail,
    market_url: entry.market_url
  }));
}

export async function getPreviewDashboardData(): Promise<PreviewDashboardData> {
  const spectatorMode = isSpectatorWalletMode();
  const [overview, positions, trades, profile, activity, pulseExamples] = await Promise.all([
    getPublicOverviewData(),
    getPublicPositionsData(),
    getPublicTradesData(),
    getSpectatorProfileData(),
    getSpectatorActivityData(),
    choosePulseExamples()
  ]);

  const orderedPositions = byCurrentValueDesc(positions);
  const orderedTrades = byTimestampDesc(trades);
  const orderedActivity = byTimestampDesc(activity);
  const clusterByEventSlug = await fetchEventClusters(orderedPositions, pulseExamples);
  const trackedNav = buildTrackedNavSeries(overview, orderedActivity, orderedPositions);
  const navSeries = trackedNav.points;
  const navSummary = buildNavSummary(overview, navSeries, trackedNav.note);
  const latestPulse = pulseExamples.find((example) => example.pulse_evidence_status === "present") ?? pulseExamples[0] ?? null;
  const positionInsights = buildPositionInsights(orderedPositions, pulseExamples, clusterByEventSlug);
  const clusters = buildClusters(orderedPositions, clusterByEventSlug);
  const marketClusters = buildMarketClusters(positionInsights);
  const agentFeed = buildAgentFeed(pulseExamples, orderedTrades, orderedActivity, overview);
  const terminalFeed = toTerminalFeed(agentFeed);

  return {
    spectatorMode,
    overview,
    profile,
    positions: orderedPositions,
    topPositions: orderedPositions.slice(0, 5),
    trades: orderedTrades,
    recentTrades: orderedTrades.slice(0, 6),
    activity: orderedActivity,
    recentActivity: orderedActivity.slice(0, 8),
    pulseExamples,
    latestPulse,
    navSeries,
    navSummary,
    terminalFeed,
    marketClusters,
    trackedNav: navSeries,
    trackedNavNote: trackedNav.note,
    clusters,
    positionInsights,
    agentFeed
  };
}
