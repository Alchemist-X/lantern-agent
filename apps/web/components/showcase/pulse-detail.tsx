"use client";

import { useInView } from "./use-in-view";

interface TraceStep {
  readonly name: string;
  readonly direction: string;
  readonly likelihoodRatio: number;
  readonly description: string;
  readonly probBefore: number;
  readonly probAfter: number;
}

interface OnchainosCall {
  readonly command: string;
  readonly timestamp: string;
  readonly success: boolean;
  readonly resultPreview: string;
}

interface PolymarketDataRaw {
  readonly totalMarkets?: number;
  readonly marketsWithEdge?: number;
  readonly markets?: readonly unknown[];
  readonly watchlist?: readonly unknown[];
}

interface RecommendationRaw {
  readonly trace?: readonly TraceStep[];
}

interface DemoTrace {
  readonly onchainosCallLog?: readonly OnchainosCall[];
  readonly polymarkets?: PolymarketDataRaw;
  readonly recommendation?: RecommendationRaw | null;
}

function parseTrace(raw: Record<string, unknown> | null): DemoTrace | null {
  if (!raw) return null;
  const callLog = Array.isArray(raw.onchainosCallLog)
    ? (raw.onchainosCallLog as OnchainosCall[])
    : undefined;
  const polymarkets =
    raw.polymarkets && typeof raw.polymarkets === "object"
      ? (raw.polymarkets as PolymarketDataRaw)
      : undefined;
  const recommendation =
    raw.recommendation && typeof raw.recommendation === "object"
      ? (raw.recommendation as RecommendationRaw)
      : null;
  return {
    onchainosCallLog: callLog,
    polymarkets,
    recommendation,
  };
}

function formatCallTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return "--:--:--";
  }
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

// Fallback Bayesian trace (same as live-demo) if trace.recommendation.trace is absent
const FALLBACK_BAYESIAN: readonly TraceStep[] = [
  {
    name: "BTC 接近 $80k 阈值",
    direction: "up",
    likelihoodRatio: 1.18,
    description: "距 $80k 仅 +6.6%",
    probBefore: 0.67,
    probAfter: 0.71,
  },
  {
    name: "24h 价格动量",
    direction: "up",
    likelihoodRatio: 1.15,
    description: "+4.62% in 24h",
    probBefore: 0.71,
    probAfter: 0.745,
  },
  {
    name: "成交量回落",
    direction: "up",
    likelihoodRatio: 1.05,
    description: "12h 成交量 -26%",
    probBefore: 0.745,
    probAfter: 0.76,
  },
  {
    name: "距 $60k 缓冲",
    direction: "up",
    likelihoodRatio: 1.04,
    description: "-20.05% 下跌空间",
    probBefore: 0.76,
    probAfter: 0.76,
  },
] as const;

// Fallback Onchainos call log if trace is absent
const FALLBACK_CALLS: readonly OnchainosCall[] = [
  {
    command: "okx dex.market ticker --symbol BTC",
    timestamp: "2026-04-13T02:14:03Z",
    success: true,
    resultPreview: "price=$75,044 24h=+4.62%",
  },
  {
    command: "okx dex.market kline --symbol BTC --interval 1h",
    timestamp: "2026-04-13T02:14:05Z",
    success: true,
    resultPreview: "24 candles loaded",
  },
  {
    command: "okx dex.token search --symbol BTC",
    timestamp: "2026-04-13T02:14:08Z",
    success: true,
    resultPreview: "tokenId=btc-mainnet",
  },
  {
    command: "okx dex.market volume --symbol BTC --window 12h",
    timestamp: "2026-04-13T02:14:11Z",
    success: true,
    resultPreview: "vol=$134M delta=-26%",
  },
  {
    command: "okx wallet.portfolio --address 0xAb...12",
    timestamp: "2026-04-13T02:14:14Z",
    success: true,
    resultPreview: "usdc=$1,000 eth=0.8",
  },
  {
    command: "okx dex.signal whale --symbol BTC --window 24h",
    timestamp: "2026-04-13T02:14:18Z",
    success: true,
    resultPreview: "net_inflow=+$8.2M",
  },
  {
    command: "okx security.scan --address polymarket",
    timestamp: "2026-04-13T02:14:22Z",
    success: true,
    resultPreview: "safe, no risk flags",
  },
  {
    command: "okx onchain.gateway gas --chain polygon",
    timestamp: "2026-04-13T02:14:25Z",
    success: true,
    resultPreview: "gas=35 gwei",
  },
] as const;

interface FunnelStep {
  readonly label: string;
  readonly sublabel: string;
  readonly count: number;
  readonly widthPct: number;
  readonly accent?: boolean;
}

function FunnelRow({
  step,
  index,
  visible,
}: {
  readonly step: FunnelStep;
  readonly index: number;
  readonly visible: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "10px 0",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-12px)",
        transition: `opacity 0.4s ease ${String(index * 120)}ms, transform 0.4s ease ${String(index * 120)}ms`,
      }}
    >
      {/* Left label */}
      <div style={{ width: 170, flexShrink: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: step.accent ? "var(--lantern-gold)" : "var(--text-bright)",
            marginBottom: 2,
          }}
        >
          {step.label}
        </div>
        <div
          data-mono=""
          style={{
            fontSize: 10,
            color: "var(--text-dim)",
            lineHeight: 1.3,
          }}
        >
          {step.sublabel}
        </div>
      </div>

      {/* Bar */}
      <div
        style={{
          flex: 1,
          height: 22,
          background: "var(--bg-border)",
          borderRadius: 4,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: visible ? `${step.widthPct.toFixed(1)}%` : "0%",
            background: step.accent
              ? "linear-gradient(90deg, #FF9100 0%, #EFC851 100%)"
              : "linear-gradient(90deg, rgba(255,145,0,0.75) 0%, rgba(239,200,81,0.85) 100%)",
            borderRadius: 4,
            transition: `width 0.9s ease-out ${String(index * 150 + 200)}ms`,
            boxShadow: step.accent
              ? "0 0 12px rgba(255,145,0,0.6)"
              : "0 0 6px rgba(255,145,0,0.2)",
          }}
        />
      </div>

      {/* Count */}
      <div
        data-mono=""
        style={{
          width: 80,
          flexShrink: 0,
          textAlign: "right",
          fontSize: 28,
          fontWeight: 700,
          color: step.accent ? "var(--lantern-gold)" : "var(--text-bright)",
          fontFamily: "JetBrains Mono, monospace",
          lineHeight: 1,
        }}
      >
        {step.accent ? "🎯 " : ""}
        {step.count.toLocaleString()}
      </div>
    </div>
  );
}

function FilterFunnel({
  trace,
  visible,
}: {
  readonly trace: DemoTrace | null;
  readonly visible: boolean;
}) {
  const poly = trace?.polymarkets;
  const step2 = poly?.totalMarkets ?? 245;
  const step3 = Array.isArray(poly?.watchlist) ? poly.watchlist.length : 15;
  const step4 = Array.isArray(poly?.markets) ? poly.markets.length : 10;

  // Bar widths proportional (log-ish for visual clarity)
  const max = 2560;
  const scale = (n: number): number => {
    // use sqrt scale so small numbers are still visible
    return Math.max((Math.sqrt(n) / Math.sqrt(max)) * 100, 4);
  };

  const steps: readonly FunnelStep[] = [
    {
      label: "Step 1 · 原始抓取",
      sublabel: "Polymarket API /markets?order=volume24hr",
      count: 2560,
      widthPct: scale(2560),
    },
    {
      label: "Step 2 · 价格市场过滤",
      sublabel: "regex: (BTC|ETH|SOL).*(above|hit|reach).*$N",
      count: step2,
      widthPct: scale(step2),
    },
    {
      label: "Step 3 · Watchlist",
      sublabel: "按 24h 成交量排序, 保留 top",
      count: step3,
      widthPct: scale(step3),
    },
    {
      label: "Step 4 · Edge 计算",
      sublabel: "Black-Scholes + 链上价 vs Poly 定价",
      count: step4,
      widthPct: scale(step4),
    },
    {
      label: "Step 5 · 焦点锁定",
      sublabel: "最高 |edge| · 可信度阈值达标",
      count: 1,
      widthPct: scale(1),
      accent: true,
    },
  ];

  return (
    <div
      style={{
        background: "#1C2128",
        border: "1px solid var(--bg-border)",
        borderRadius: 16,
        padding: "24px 28px",
      }}
    >
      <div
        style={{
          fontSize: 26,
          fontWeight: 700,
          fontFamily: "Cinzel, serif",
          color: "var(--text-bright)",
          marginBottom: 4,
          letterSpacing: 1,
        }}
      >
        市场筛选漏斗
      </div>
      <div
        style={{
          fontSize: 12,
          color: "var(--text-muted)",
          marginBottom: 18,
        }}
      >
        Agent 把 2,560 个候选市场逐层过滤到 1 个焦点，每一步都有明确依据
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {steps.map((step, i) => (
          <FunnelRow
            key={step.label}
            step={step}
            index={i}
            visible={visible}
          />
        ))}
      </div>

      <div
        style={{
          marginTop: 14,
          padding: "10px 14px",
          background: "rgba(255,145,0,0.06)",
          border: "1px solid rgba(255,145,0,0.2)",
          borderRadius: 8,
          fontSize: 12,
          color: "var(--text-muted)",
          lineHeight: 1.5,
        }}
      >
        灯笼照亮漏斗 · 2,560 → 245 → 15 → 10 → <span style={{ color: "var(--lantern-gold)", fontWeight: 700 }}>1</span>{" "}
        (压缩比 2560:1)
      </div>
    </div>
  );
}

function OnchainosPanel({
  calls,
  visible,
}: {
  readonly calls: readonly OnchainosCall[];
  readonly visible: boolean;
}) {
  const MAX = 8;
  const displayed = calls.slice(0, MAX);
  const total = calls.length;

  const firstTs = calls[0] ? new Date(calls[0].timestamp).getTime() : 0;
  const lastTs = calls.length > 0 ? new Date(calls[calls.length - 1]!.timestamp).getTime() : 0;
  const totalSeconds = firstTs && lastTs ? ((lastTs - firstTs) / 1000).toFixed(0) : "45";

  return (
    <div
      style={{
        background: "#1C2128",
        borderLeft: "3px solid #FF9100",
        border: "1px solid var(--bg-border)",
        borderLeftWidth: 3,
        borderLeftColor: "#FF9100",
        borderRadius: 12,
        padding: "20px 22px",
      }}
    >
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "#FF9100",
          marginBottom: 4,
        }}
      >
        Onchainos 调用时间线
      </div>
      <div
        data-mono=""
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          marginBottom: 14,
          fontFamily: "JetBrains Mono, monospace",
        }}
      >
        共 {total} 次 · 耗时 ~{totalSeconds}s
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {displayed.map((call, i) => (
          <div
            key={`${call.timestamp}-${String(i)}`}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateX(0)" : "translateX(-6px)",
              transition: `opacity 0.3s ease ${String(i * 80)}ms, transform 0.3s ease ${String(i * 80)}ms`,
            }}
          >
            <div
              data-mono=""
              style={{
                fontSize: 11,
                color: "var(--text-dim)",
                flexShrink: 0,
                width: 58,
                paddingTop: 1,
                fontFamily: "JetBrains Mono, monospace",
              }}
            >
              {formatCallTime(call.timestamp)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                data-mono=""
                style={{
                  fontSize: 12,
                  color: "var(--text-main)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  fontFamily: "JetBrains Mono, monospace",
                }}
              >
                {truncate(call.command, 44)}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: call.success ? "var(--signal-green)" : "var(--danger-red)",
                  marginTop: 1,
                }}
              >
                {call.success ? "\u2713" : "\u2717"}{" "}
                {truncate(call.resultPreview || (call.success ? "ok" : "failed"), 36)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {total > MAX ? (
        <div
          data-mono=""
          style={{
            fontSize: 11,
            color: "var(--text-dim)",
            marginTop: 12,
            paddingTop: 8,
            borderTop: "1px solid var(--bg-border)",
            fontFamily: "JetBrains Mono, monospace",
          }}
        >
          ... 省略其余 {total - MAX} 次调用
        </div>
      ) : null}
    </div>
  );
}

function CompactBayesianStep({
  step,
  index,
  visible,
}: {
  readonly step: TraceStep;
  readonly index: number;
  readonly visible: boolean;
}) {
  const delta = step.probAfter - step.probBefore;
  const deltaPct = (delta * 100).toFixed(1);
  const cumulativePct = (step.probAfter * 100).toFixed(1);
  const isPositive = delta >= 0;
  const barWidth = Math.min(Math.abs(delta) * 500, 100);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "5px 0",
        borderBottom: "1px solid var(--bg-border)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-10px)",
        transition: `opacity 0.4s ease ${String(index * 200)}ms, transform 0.4s ease ${String(index * 200)}ms`,
      }}
    >
      <div
        style={{
          flex: 1,
          fontSize: 11,
          color: "var(--text-muted)",
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {step.name}
      </div>
      <div
        data-mono=""
        style={{
          width: 48,
          fontSize: 11,
          fontWeight: 600,
          color: isPositive ? "var(--signal-green)" : "var(--danger-red)",
          textAlign: "right",
          flexShrink: 0,
          fontFamily: "JetBrains Mono, monospace",
        }}
      >
        {isPositive ? "+" : ""}
        {deltaPct}%
      </div>
      <div
        style={{
          width: 60,
          height: 6,
          background: "var(--bg-border)",
          borderRadius: 3,
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            height: "100%",
            width: visible ? `${String(barWidth)}%` : "0%",
            background: isPositive ? "var(--signal-green)" : "var(--danger-red)",
            borderRadius: 3,
            transition: `width 0.6s ease-out ${String(index * 200 + 100)}ms`,
          }}
        />
      </div>
      <div
        data-mono=""
        style={{
          width: 44,
          fontSize: 11,
          color: "var(--text-main)",
          textAlign: "right",
          flexShrink: 0,
          fontFamily: "JetBrains Mono, monospace",
        }}
      >
        {cumulativePct}%
      </div>
    </div>
  );
}

function BayesianPanel({
  trace,
  visible,
}: {
  readonly trace: DemoTrace | null;
  readonly visible: boolean;
}) {
  const traceSteps =
    trace?.recommendation && Array.isArray(trace.recommendation.trace)
      ? trace.recommendation.trace
      : FALLBACK_BAYESIAN;
  const steps = traceSteps.slice(0, 4);
  const finalProb = steps.length > 0 ? steps[steps.length - 1]!.probAfter : 0.76;
  const priorProb = steps.length > 0 ? steps[0]!.probBefore : 0.67;

  return (
    <div
      style={{
        background: "#1C2128",
        border: "1px solid var(--bg-border)",
        borderRadius: 12,
        padding: "20px 22px",
      }}
    >
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "var(--lantern-gold)",
          marginBottom: 4,
        }}
      >
        贝叶斯推理轨迹
      </div>
      <div
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          marginBottom: 14,
        }}
      >
        先验 {(priorProb * 100).toFixed(1)}% · 每步按似然比更新
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        {steps.map((step, i) => (
          <CompactBayesianStep
            key={step.name}
            step={step}
            index={i}
            visible={visible}
          />
        ))}
      </div>

      <div
        style={{
          marginTop: 12,
          padding: "8px 12px",
          background: "rgba(239,200,81,0.08)",
          border: "1px solid var(--lantern-gold)",
          borderRadius: 6,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--lantern-gold)" }}>
          后验概率
        </span>
        <span
          data-mono=""
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "var(--lantern-gold)",
            fontFamily: "JetBrains Mono, monospace",
          }}
        >
          {(finalProb * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

export function ShowcasePulseDetail({
  trace: raw,
}: {
  readonly trace: Record<string, unknown> | null;
}) {
  const { ref, inView } = useInView(0.1);
  const trace = parseTrace(raw);

  const calls =
    trace?.onchainosCallLog && trace.onchainosCallLog.length > 0
      ? trace.onchainosCallLog
      : FALLBACK_CALLS;

  return (
    <section
      ref={ref}
      className="showcase-section lantern-glow"
      style={{ background: "#0D1117" }}
    >
      <h2
        className={inView ? "animate-in" : ""}
        style={{
          fontSize: 40,
          fontWeight: 700,
          textAlign: "center",
          marginBottom: 8,
          fontFamily: "Cinzel, serif",
          letterSpacing: 1.5,
          opacity: inView ? undefined : 0,
        }}
      >
        2,560 → 1 · 焦点如何诞生
      </h2>

      <p
        className={inView ? "animate-in" : ""}
        style={{
          fontSize: 15,
          color: "var(--text-muted)",
          textAlign: "center",
          marginBottom: 32,
          opacity: inView ? undefined : 0,
          animationDelay: "0.1s",
        }}
      >
        筛选漏斗 + Onchainos 调用 + 贝叶斯更新 · Pulse 内部执行全景
      </p>

      {/* Section A: Funnel */}
      <div
        className={inView ? "animate-in" : ""}
        style={{
          marginBottom: 28,
          opacity: inView ? undefined : 0,
          animationDelay: "0.2s",
        }}
      >
        <FilterFunnel trace={trace} visible={inView} />
      </div>

      {/* Section B: Two panels side by side */}
      <div
        className={inView ? "animate-in" : ""}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
          opacity: inView ? undefined : 0,
          animationDelay: "0.35s",
        }}
      >
        <OnchainosPanel calls={calls} visible={inView} />
        <BayesianPanel trace={trace} visible={inView} />
      </div>

      <style>{`
        @media (max-width: 760px) {
          .showcase-section > div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
