"use client";

interface MarketOutcome {
  readonly label: string;
  readonly price: number;
}

interface MarketEdge {
  readonly ourProbability: number;
  readonly marketProbability: number;
  readonly edge: number;
  readonly signals: readonly string[];
}

interface PolymarketEntry {
  readonly title: string;
  readonly slug: string;
  readonly endDate: string;
  readonly volume: number;
  readonly liquidity: number;
  readonly targetToken?: string;
  readonly strikePrice?: number;
  readonly outcomes: readonly MarketOutcome[];
  readonly edge: MarketEdge | null;
}

interface PolymarketData {
  readonly totalMarkets: number;
  readonly withEdge: readonly PolymarketEntry[];
}

interface TraceData {
  readonly polymarkets?: PolymarketData;
}

function parseTraceData(raw: Record<string, unknown> | null): TraceData | null {
  if (!raw) return null;
  return raw as unknown as TraceData;
}

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`;
  return `$${vol.toFixed(0)}`;
}

const PLACEHOLDER_MARKETS: readonly PolymarketEntry[] = [
  {
    title: "Bitcoin above $100K by end of April?",
    slug: "btc-100k",
    endDate: "2026-04-30",
    volume: 2500000,
    liquidity: 180000,
    targetToken: "BTC",
    strikePrice: 100000,
    outcomes: [
      { label: "Yes", price: 0.62 },
      { label: "No", price: 0.38 },
    ],
    edge: { ourProbability: 0.74, marketProbability: 0.62, edge: 0.12, signals: ["smart_money"] },
  },
  {
    title: "ETH above $4,000 by May 2026?",
    slug: "eth-4k",
    endDate: "2026-05-31",
    volume: 1200000,
    liquidity: 95000,
    targetToken: "ETH",
    strikePrice: 4000,
    outcomes: [
      { label: "Yes", price: 0.45 },
      { label: "No", price: 0.55 },
    ],
    edge: { ourProbability: 0.58, marketProbability: 0.45, edge: 0.13, signals: ["whale_accumulation"] },
  },
  {
    title: "SOL above $200 by June?",
    slug: "sol-200",
    endDate: "2026-06-30",
    volume: 800000,
    liquidity: 60000,
    targetToken: "SOL",
    strikePrice: 200,
    outcomes: [
      { label: "Yes", price: 0.35 },
      { label: "No", price: 0.65 },
    ],
    edge: null,
  },
  {
    title: "Total crypto market cap above $4T?",
    slug: "total-mc-4t",
    endDate: "2026-06-30",
    volume: 500000,
    liquidity: 40000,
    outcomes: [
      { label: "Yes", price: 0.52 },
      { label: "No", price: 0.48 },
    ],
    edge: null,
  },
  {
    title: "BTC dominance above 60% by May?",
    slug: "btc-dom-60",
    endDate: "2026-05-31",
    volume: 350000,
    liquidity: 28000,
    targetToken: "BTC",
    outcomes: [
      { label: "Yes", price: 0.71 },
      { label: "No", price: 0.29 },
    ],
    edge: { ourProbability: 0.65, marketProbability: 0.71, edge: -0.06, signals: ["alt_rotation"] },
  },
  {
    title: "Ethereum ETF net inflows positive in April?",
    slug: "eth-etf",
    endDate: "2026-04-30",
    volume: 420000,
    liquidity: 32000,
    targetToken: "ETH",
    outcomes: [
      { label: "Yes", price: 0.58 },
      { label: "No", price: 0.42 },
    ],
    edge: null,
  },
] as const;

function MarketCard({ market }: { readonly market: PolymarketEntry }) {
  const yesOutcome = market.outcomes.find((o) => o.label === "Yes");
  const noOutcome = market.outcomes.find((o) => o.label === "No");
  const yesPrice = yesOutcome?.price ?? 0.5;
  const noPrice = noOutcome?.price ?? 0.5;
  const hasEdge = market.edge !== null && Math.abs(market.edge.edge) > 0.03;
  const edgePct = market.edge ? (Math.abs(market.edge.edge) * 100).toFixed(1) : null;

  return (
    <div
      style={{
        width: 260,
        height: 180,
        background: "var(--bg-card)",
        border: "1px solid var(--bg-border)",
        borderRadius: 12,
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        cursor: "default",
        transition: "border-color 0.25s ease, box-shadow 0.25s ease",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = "var(--lantern-gold)";
        el.style.boxShadow = "0 4px 16px rgba(239,200,81,0.1)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.borderColor = "var(--bg-border)";
        el.style.boxShadow = "none";
      }}
    >
      {/* Edge badge */}
      {hasEdge && edgePct !== null && (
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            fontSize: 11,
            fontWeight: 700,
            color: "var(--lantern-gold)",
            background: "rgba(239,200,81,0.12)",
            border: "1px solid rgba(239,200,81,0.3)",
            borderRadius: 4,
            padding: "2px 8px",
            fontFamily: "JetBrains Mono, monospace",
          }}
        >
          +{edgePct}%
        </div>
      )}

      {/* Market question */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--text-bright)",
          lineHeight: 1.4,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          paddingRight: hasEdge ? 48 : 0,
        }}
      >
        {market.title}
      </div>

      {/* Yes/No bar */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 6,
            fontSize: 12,
            fontFamily: "JetBrains Mono, monospace",
          }}
        >
          <span style={{ color: "var(--signal-green)" }}>
            Yes {(yesPrice * 100).toFixed(0)}%
          </span>
          <span style={{ color: "var(--danger-red)" }}>
            No {(noPrice * 100).toFixed(0)}%
          </span>
        </div>
        <div
          style={{
            height: 6,
            borderRadius: 3,
            background: "var(--bg-border)",
            overflow: "hidden",
            display: "flex",
          }}
        >
          <div
            style={{
              width: `${(yesPrice * 100).toFixed(0)}%`,
              height: "100%",
              background: "var(--signal-green)",
              borderRadius: "3px 0 0 3px",
            }}
          />
          <div
            style={{
              flex: 1,
              height: "100%",
              background: "rgba(230,57,70,0.4)",
              borderRadius: "0 3px 3px 0",
            }}
          />
        </div>
      </div>

      {/* Volume */}
      <div
        style={{
          fontSize: 12,
          color: "var(--text-dim)",
          fontFamily: "JetBrains Mono, monospace",
        }}
      >
        Vol {formatVolume(market.volume)}
        {market.targetToken && (
          <span style={{ marginLeft: 8, color: "var(--text-muted)" }}>
            {market.targetToken}
          </span>
        )}
      </div>
    </div>
  );
}

export function ShowcaseMarketCards({
  trace: raw,
}: {
  readonly trace: Record<string, unknown> | null;
}) {
  const trace = parseTraceData(raw);
  const polyData = trace?.polymarkets;

  const markets: readonly PolymarketEntry[] =
    polyData && polyData.withEdge.length > 0
      ? polyData.withEdge.slice(0, 9)
      : PLACEHOLDER_MARKETS;

  const totalScanned = polyData?.totalMarkets ?? 81;
  const withEdgeCount = markets.filter(
    (m) => m.edge !== null && Math.abs(m.edge.edge) > 0.03,
  ).length;

  return (
    <section className="showcase-section lantern-glow-strong">
      <h2
        style={{
          fontSize: 40,
          fontWeight: 700,
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        市场扫描
      </h2>

      <p
        style={{
          fontSize: 15,
          color: "var(--text-muted)",
          textAlign: "center",
          marginBottom: 16,
        }}
      >
        Agent 正在监控的预测市场
      </p>

      <p
        style={{
          fontSize: 13,
          color: "var(--text-dim)",
          textAlign: "center",
          marginBottom: 40,
          fontFamily: "JetBrains Mono, monospace",
        }}
      >
        {totalScanned} 市场已扫描 &middot; {withEdgeCount} 个发现 Edge
      </p>

      {/* Card grid */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          justifyContent: "center",
        }}
      >
        {markets.map((market) => (
          <MarketCard key={market.slug} market={market} />
        ))}
      </div>

      {!polyData && (
        <p
          style={{
            fontSize: 12,
            color: "var(--text-dim)",
            textAlign: "center",
            marginTop: 24,
            fontStyle: "italic",
          }}
        >
          示例数据 &middot; 运行{" "}
          <span
            style={{
              color: "var(--lantern-gold)",
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            pnpm agent:demo
          </span>{" "}
          获取实时市场
        </p>
      )}
    </section>
  );
}
