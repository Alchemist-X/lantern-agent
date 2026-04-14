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

// Raw shape from agent-demo output
interface PolymarketMarketRaw {
  readonly title?: string;
  readonly slug?: string;
  readonly endDate?: string;
  readonly volume?: number;
  readonly targetToken?: string;
  readonly strikePrice?: number;
  readonly marketProb?: number;
  readonly ourProb?: number;
  readonly edge?: number;
  readonly signals?: readonly string[];
}

interface PolymarketWatchlistRaw {
  readonly title?: string;
  readonly slug?: string;
  readonly endDate?: string;
  readonly volume?: number;
  readonly targetToken?: string;
  readonly strikePrice?: number;
  readonly yesPrice?: number;
}

interface PolymarketDataRaw {
  readonly totalMarkets?: number;
  readonly marketsWithEdge?: number;
  readonly markets?: readonly PolymarketMarketRaw[];
  readonly watchlist?: readonly PolymarketWatchlistRaw[];
  // Legacy shape (older data):
  readonly withEdge?: readonly PolymarketEntry[];
}

interface TraceData {
  readonly polymarkets?: PolymarketDataRaw;
}

function parseTraceData(raw: Record<string, unknown> | null): TraceData | null {
  if (!raw) return null;
  return raw as unknown as TraceData;
}

function normalizeRelated(data: PolymarketDataRaw | undefined): readonly PolymarketEntry[] {
  if (!data) return [];
  // Prefer new "watchlist" field (broader sample)
  if (Array.isArray(data.watchlist) && data.watchlist.length > 0) {
    return data.watchlist
      .map((m, i) => {
        const yesPrice = m.yesPrice ?? 0.5;
        return {
          title: m.title ?? `Market ${String(i + 1)}`,
          slug: m.slug ?? `market-${String(i)}`,
          endDate: m.endDate ?? "",
          volume: m.volume ?? 0,
          liquidity: 0,
          targetToken: m.targetToken,
          strikePrice: m.strikePrice,
          outcomes: [
            { label: "Yes", price: yesPrice },
            { label: "No", price: Math.max(1 - yesPrice, 0) },
          ],
          edge: null,
        };
      });
  }
  // Fallback to "markets" (edge-only)
  if (Array.isArray(data.markets) && data.markets.length > 0) {
    return data.markets.map((m, i) => {
      const yesPrice = m.marketProb ?? 0.5;
      return {
        title: m.title ?? `Market ${String(i + 1)}`,
        slug: m.slug ?? `market-${String(i)}`,
        endDate: m.endDate ?? "",
        volume: m.volume ?? 0,
        liquidity: 0,
        targetToken: m.targetToken,
        strikePrice: m.strikePrice,
        outcomes: [
          { label: "Yes", price: yesPrice },
          { label: "No", price: Math.max(1 - yesPrice, 0) },
        ],
        edge: null,
      };
    });
  }
  // Legacy fallback
  if (Array.isArray(data.withEdge) && data.withEdge.length > 0) {
    return data.withEdge.slice();
  }
  return [];
}

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`;
  return `$${vol.toFixed(0)}`;
}

// Sample related markets (kept as mini chips)
const RELATED_MARKETS: readonly PolymarketEntry[] = [
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
    edge: null,
  },
  {
    title: "ETH above $4,000 by May 2026?",
    slug: "eth-4k",
    endDate: "2026-05-31",
    volume: 1200000,
    liquidity: 95000,
    targetToken: "ETH",
    outcomes: [
      { label: "Yes", price: 0.45 },
      { label: "No", price: 0.55 },
    ],
    edge: null,
  },
  {
    title: "SOL above $200 by June?",
    slug: "sol-200",
    endDate: "2026-06-30",
    volume: 800000,
    liquidity: 60000,
    targetToken: "SOL",
    outcomes: [
      { label: "Yes", price: 0.35 },
      { label: "No", price: 0.65 },
    ],
    edge: null,
  },
] as const;

// Real Polymarket trade — MicroStrategy sells any BTC by Dec 31 2026
const FOCUS_MARKET = {
  question: "MicroStrategy sells any Bitcoin by December 31, 2026?",
  marketYesPrice: 0.115, // 11.5%
  lanternProbability: 0.183, // 18.3%
  edge: 0.068, // +6.8%
  signals: [
    { label: "聪明钱净卖出 BTC", value: "-12%", tone: "neg" as const },
    { label: "MSTR 持仓集中度高", value: "Top10 占 42%", tone: "neg" as const },
    { label: "24h 交易量异常", value: "+3.4x", tone: "pos" as const },
  ],
  sharesBought: 8.33,
  usdcSpent: 1.0,
  txHash:
    "0x23872647d57ac1165a503fd1d954f14d618d895068e3aa339762c30615f3f490",
} as const;

function buildPolymarketUrl(market: PolymarketEntry): string {
  // Use slug if it's a real event slug. Fall back to search when slug is
  // missing or looks like a conditionId (0x...) — those won't resolve as URLs.
  if (market.slug && !market.slug.startsWith("0x") && !market.slug.startsWith("market-")) {
    return `https://polymarket.com/event/${market.slug}`;
  }
  return `https://polymarket.com/markets?q=${encodeURIComponent(market.title.slice(0, 40))}`;
}

function MarqueeMarketCard({ market }: { readonly market: PolymarketEntry }) {
  const yesOutcome = market.outcomes.find((o) => o.label === "Yes");
  const yesPrice = yesOutcome?.price ?? 0.5;
  const yesPct = Math.round(yesPrice * 100);
  const noPct = 100 - yesPct;

  const tokenStrike =
    market.targetToken && market.strikePrice
      ? `${market.targetToken} · $${market.strikePrice.toLocaleString()}`
      : market.targetToken ?? null;

  const polymarketUrl = buildPolymarketUrl(market);

  return (
    <a
      href={polymarketUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        textDecoration: "none",
        color: "inherit",
        flexShrink: 0,
      }}
    >
      <div
        className="marquee-market-card"
        style={{
          width: 200,
          height: 120,
          background: "var(--bg-card)",
          border: "1px solid var(--bg-border)",
          borderRadius: 10,
          padding: "10px 12px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          cursor: "pointer",
          transition: "transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.04)";
          e.currentTarget.style.borderColor = "var(--lantern-gold)";
          e.currentTarget.style.boxShadow = "0 0 12px rgba(239,200,81,0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.borderColor = "var(--bg-border)";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--text-bright)",
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {market.title}
        </div>

        {tokenStrike ? (
          <div
            style={{
              fontSize: 11,
              color: "var(--lantern-gold)",
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            {tokenStrike}
          </div>
        ) : null}

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <span
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "var(--signal-green)",
                fontFamily: "JetBrains Mono, monospace",
                lineHeight: 1,
              }}
            >
              {yesPct}%
            </span>
            <span
              style={{
                fontSize: 10,
                color: "var(--text-dim)",
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              {formatVolume(market.volume)}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              height: 4,
              borderRadius: 2,
              overflow: "hidden",
              background: "var(--bg-border)",
            }}
          >
            <div
              style={{
                width: `${String(yesPct)}%`,
                background: "var(--signal-green)",
              }}
            />
            <div
              style={{
                width: `${String(noPct)}%`,
                background: "var(--danger-red)",
                opacity: 0.7,
              }}
            />
          </div>
        </div>
      </div>
    </a>
  );
}

function FocusMarketCard() {
  const m = FOCUS_MARKET;
  const marketPct = (m.marketYesPrice * 100).toFixed(1);
  const lanternPct = (m.lanternProbability * 100).toFixed(1);
  const edgePct = (m.edge * 100).toFixed(1);

  // Marker positions on a 0..40% probability axis for visual clarity
  const AXIS_MAX = 0.4;
  const marketX = Math.min(m.marketYesPrice / AXIS_MAX, 1) * 100;
  const lanternX = Math.min(m.lanternProbability / AXIS_MAX, 1) * 100;

  return (
    <div
      style={{
        background: "var(--bg-dungeon)",
        border: "1px solid var(--lantern-gold)",
        borderRadius: 16,
        padding: "28px 32px",
        boxShadow: "0 0 24px rgba(239,200,81,0.08)",
        marginBottom: 40,
      }}
    >
      {/* Header tag */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 2,
            color: "var(--lantern-gold)",
            padding: "3px 10px",
            background: "rgba(239,200,81,0.1)",
            border: "1px solid rgba(239,200,81,0.3)",
            borderRadius: 4,
          }}
        >
          焦点市场 · 已交易
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--signal-green)",
            padding: "3px 10px",
            background: "rgba(42,157,143,0.1)",
            borderRadius: 4,
            fontFamily: "JetBrains Mono, monospace",
          }}
        >
          ✅ 已成交
        </span>
      </div>

      {/* Question */}
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          color: "var(--text-bright)",
          lineHeight: 1.4,
          marginBottom: 24,
        }}
      >
        {m.question}
      </div>

      {/* Prob axis */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 10,
            fontSize: 13,
            fontFamily: "JetBrains Mono, monospace",
          }}
        >
          <span style={{ color: "var(--text-muted)" }}>
            市场价格: <span style={{ color: "var(--text-bright)" }}>{marketPct}% Yes</span>
          </span>
          <span style={{ color: "var(--text-muted)" }}>
            Lantern: <span style={{ color: "var(--lantern-gold)" }}>{lanternPct}% Yes</span>
          </span>
        </div>

        <div
          style={{
            position: "relative",
            height: 36,
            background: "var(--bg-border)",
            borderRadius: 6,
            overflow: "visible",
          }}
        >
          {/* Base progress band from 0 to lantern */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${lanternX.toFixed(1)}%`,
              background:
                "linear-gradient(90deg, rgba(42,157,143,0.3) 0%, rgba(239,200,81,0.4) 100%)",
              borderRadius: 6,
            }}
          />
          {/* Market marker */}
          <div
            style={{
              position: "absolute",
              left: `${marketX.toFixed(1)}%`,
              top: -4,
              bottom: -4,
              width: 2,
              background: "var(--text-bright)",
              transform: "translateX(-50%)",
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: 10,
                color: "var(--text-muted)",
                whiteSpace: "nowrap",
                marginBottom: 2,
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              市场
            </div>
          </div>
          {/* Lantern marker */}
          <div
            style={{
              position: "absolute",
              left: `${lanternX.toFixed(1)}%`,
              top: -4,
              bottom: -4,
              width: 2,
              background: "var(--lantern-gold)",
              boxShadow: "0 0 8px rgba(239,200,81,0.6)",
              transform: "translateX(-50%)",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                fontSize: 10,
                color: "var(--lantern-gold)",
                whiteSpace: "nowrap",
                marginTop: 2,
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              ▲ Lantern
            </div>
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            fontSize: 14,
            fontWeight: 700,
            color: "var(--lantern-gold)",
            fontFamily: "JetBrains Mono, monospace",
            textAlign: "center",
          }}
        >
          Edge: +{edgePct}%
        </div>
      </div>

      {/* Our analysis */}
      <div
        style={{
          background: "rgba(22,27,34,0.6)",
          border: "1px solid var(--bg-border)",
          borderRadius: 10,
          padding: "16px 18px",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: 2,
            color: "var(--text-dim)",
            fontWeight: 600,
            marginBottom: 10,
          }}
        >
          我们的分析
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {m.signals.map((s) => (
            <div
              key={s.label}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 13,
                color: "var(--text-main)",
              }}
            >
              <span>· {s.label}</span>
              <span
                style={{
                  fontFamily: "JetBrains Mono, monospace",
                  color:
                    s.tone === "pos"
                      ? "var(--signal-green)"
                      : "var(--danger-red)",
                }}
              >
                {s.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Execution */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          fontSize: 13,
        }}
      >
        <div style={{ color: "var(--text-muted)" }}>
          执行:{" "}
          <span style={{ color: "var(--text-bright)", fontWeight: 600 }}>
            买入 {m.sharesBought} YES 股 · ${m.usdcSpent.toFixed(2)} USDC
          </span>
        </div>
        <a
          href={`https://polygonscan.com/tx/${m.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "var(--lantern-gold)",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 12,
            textDecoration: "none",
          }}
        >
          TxHash: {m.txHash.slice(0, 10)}...{m.txHash.slice(-6)} ↗
        </a>
      </div>
    </div>
  );
}

function MarketMarquee({
  markets,
  totalScanned,
}: {
  readonly markets: readonly PolymarketEntry[];
  readonly totalScanned: number;
}) {
  // Duplicate the markets to create a seamless -50% translate loop
  const loopedMarkets = [...markets, ...markets];

  return (
    <div style={{ textAlign: "center" }}>
      <p
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "var(--text-bright)",
          fontFamily: "JetBrains Mono, monospace",
          marginBottom: 20,
        }}
      >
        同时监控{" "}
        <span style={{ color: "var(--lantern-gold)", fontWeight: 700 }}>
          {totalScanned}
        </span>{" "}
        个预测市场
      </p>

      {/* Marquee container */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          mask: "linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)",
          WebkitMask:
            "linear-gradient(to right, transparent, #000 10%, #000 90%, transparent)",
        }}
      >
        <div
          className="marquee-track"
          style={{
            display: "flex",
            gap: 16,
            animation: "marketMarquee 40s linear infinite",
            width: "fit-content",
          }}
        >
          {loopedMarkets.map((market, i) => (
            <MarqueeMarketCard
              key={`${market.slug}-${String(i)}`}
              market={market}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes marketMarquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>
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

  // Safely normalize whichever shape the trace has; fallback to placeholders
  const normalized = normalizeRelated(polyData);
  const watchlist: readonly PolymarketEntry[] =
    normalized.length > 0 ? normalized : RELATED_MARKETS;

  const totalScanned = polyData?.totalMarkets ?? watchlist.length;

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
        焦点市场
      </h2>

      <p
        style={{
          fontSize: 15,
          color: "var(--text-muted)",
          textAlign: "center",
          marginBottom: 40,
        }}
      >
        从 {totalScanned} 个 Polymarket 候选中, Agent 锁定的单一高 Edge 市场
      </p>

      {/* Focus hero */}
      <FocusMarketCard />

      {/* Continuous left-to-right marquee watchlist */}
      <MarketMarquee markets={watchlist} totalScanned={totalScanned} />
    </section>
  );
}
