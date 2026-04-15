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

interface DemoTrace {
  readonly timestamp: string;
  readonly candidates: readonly unknown[];
  readonly onchainosCallLog?: readonly OnchainosCall[];
  readonly recommendation: unknown;
}

function parseTrace(raw: Record<string, unknown> | null): DemoTrace | null {
  if (!raw) return null;
  if (typeof raw.timestamp !== "string") return null;

  const callLog = Array.isArray(raw.onchainosCallLog)
    ? (raw.onchainosCallLog as OnchainosCall[])
    : undefined;

  return {
    timestamp: raw.timestamp,
    candidates: Array.isArray(raw.candidates) ? raw.candidates : [],
    onchainosCallLog: callLog,
    recommendation: raw.recommendation ?? null,
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

function truncateCommand(cmd: string, max: number): string {
  return cmd.length > max ? `${cmd.slice(0, max)}...` : cmd;
}

function OnchainosTimeline({
  calls,
  visible,
}: {
  readonly calls: readonly OnchainosCall[];
  readonly visible: boolean;
}) {
  const MAX_DISPLAY = 6;
  const displayed = calls.slice(0, MAX_DISPLAY);
  const totalCalls = calls.length;

  const firstTs = calls[0] ? new Date(calls[0].timestamp).getTime() : 0;
  const lastTs =
    calls.length > 0
      ? new Date(calls[calls.length - 1]!.timestamp).getTime()
      : 0;
  const totalSeconds = firstTs && lastTs ? ((lastTs - firstTs) / 1000).toFixed(1) : "0";

  return (
    <div
      style={{
        background: "#161B22",
        borderLeft: "3px solid #FF9100",
        borderRadius: 12,
        padding: "20px 24px",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}
    >
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: "#FF9100",
          marginBottom: 8,
        }}
      >
        Onchainos 数据采集
      </div>
      <div
        style={{
          fontSize: 12,
          color: "var(--text-muted, #8B949E)",
          marginBottom: 16,
          lineHeight: 1.5,
        }}
      >
        为了分析这个市场, Agent 调用了以下 Onchainos 数据:
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {displayed.map((call, i) => (
          <div
            key={`${call.timestamp}-${String(i)}`}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              opacity: visible ? 1 : 0,
              transform: visible ? "translateX(0)" : "translateX(-8px)",
              transition: `opacity 0.3s ease ${String(i * 120)}ms, transform 0.3s ease ${String(i * 120)}ms`,
            }}
          >
            {/* Timestamp */}
            <div
              data-mono=""
              style={{
                fontSize: 11,
                color: "var(--text-dim, #484F58)",
                flexShrink: 0,
                width: 60,
                paddingTop: 1,
              }}
            >
              {formatCallTime(call.timestamp)}
            </div>

            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                data-mono=""
                style={{
                  fontSize: 13,
                  color: "var(--text-main, #E0E0E0)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {truncateCommand(call.command, 50)}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: call.success
                    ? "var(--signal-green, #2a9d8f)"
                    : "var(--danger-red, #e63946)",
                  marginTop: 2,
                }}
              >
                {call.success ? "\u2713" : "\u2717"}{" "}
                {call.resultPreview
                  ? truncateCommand(call.resultPreview, 40)
                  : call.success
                    ? "ok"
                    : "failed"}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary footer */}
      <div
        data-mono=""
        style={{
          fontSize: 11,
          color: "var(--text-dim, #484F58)",
          marginTop: 14,
          paddingTop: 10,
          borderTop: "1px solid var(--bg-border, #30363D)",
        }}
      >
        {totalCalls > MAX_DISPLAY
          ? `... 共 ${String(totalCalls)} 次 API 调用，耗时 ${totalSeconds}s`
          : `共 ${String(totalCalls)} 次 API 调用，耗时 ${totalSeconds}s`}
      </div>
    </div>
  );
}

const RISK_CHECKS = [
  { label: "回撤20%", icon: "\u2705" },
  { label: "止损30%", icon: "\u2705" },
  { label: "敞口50%", icon: "\u2705" },
  { label: "单市场30%", icon: "\u2705" },
  { label: "持仓10", icon: "\u2705" },
  { label: "最小$1", icon: "\u2705" },
] as const;

// Polymarket focus — "Will Bitcoin reach $80,000 in April?"
// Fresh pipeline output: BTC @ $73,792 · strike $80k (+8.4%) · 382h 到期 · BS σ=65%
// Market Yes = 27.5%, Black-Scholes Yes = 21.7%, Edge = -5.8% (市场高估 Yes)
const BTC_MARKET = {
  question: "Will Bitcoin reach $80,000 in April?",
  marketConsensus: 0.275, // market implied for Yes
  ourProbability: 0.217,  // Black-Scholes implied Yes
  edge: -0.058,
  side: "Yes",
  shares: 0,
  pricePerShare: 0.275,
  polymarketUrl:
    "https://polymarket.com/event/what-price-will-bitcoin-hit-in-april-2026",
  // No on-chain trade executed for this demo focus market.
  txHash: "",
} as const;

// Pulse data summary cards — all sourced from the fresh trace
const PULSE_CARDS = [
  { label: "BTC 当前价格", value: "$73,792", sub: "Onchainos 实时查询", color: "success" },
  { label: "距 $80k 目标", value: "+8.4%", sub: "$6,208 空间待冲", color: "warning" },
  { label: "剩余到期", value: "~16 天", sub: "至 2026-04-29", color: "muted" },
  { label: "年化波动率", value: "65%", sub: "BTC 历史区间典型值", color: "muted" },
] as const;

// Black-Scholes (risk-neutral) probability trace for BTC reach $80k in April.
// Prior = market implied 27.5%. BS σ=65% annualized, T ≈ 16 天.
// 展示: 距离 + 时间 + 波动率 如何把后验推到 21.7% (低于市场, 市场高估)。
const BAYESIAN_TRACE: readonly TraceStep[] = [
  {
    name: "距离惩罚 (+8.4%)",
    direction: "down",
    likelihoodRatio: 0.85,
    description: "BTC $73,792 距 $80k 还差 +8.4%, 需在 16 天内突破年化波动率近 2σ 的位移",
    probBefore: 0.275,
    probAfter: 0.24,
  },
  {
    name: "剩余时间仅 16 天",
    direction: "down",
    likelihoodRatio: 0.92,
    description: "短剩余到期 → σ√T 压缩, BS 概率分布更集中, 尾部概率快速收敛",
    probBefore: 0.24,
    probAfter: 0.22,
  },
  {
    name: "波动率 σ=65% 合成",
    direction: "down",
    likelihoodRatio: 0.99,
    description: "BTC 年化 65% 属正常区间, 代入 BS 公式得 P(S_T > 80k) ≈ 21.7%",
    probBefore: 0.22,
    probAfter: 0.217,
  },
] as const;

function formatTx(tx: string): string {
  return `${tx.slice(0, 10)}...${tx.slice(-8)}`;
}

function BayesianStep({
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
  const isPositive = delta > 0;
  const barWidth = Math.min(Math.abs(delta) * 400, 100);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 0",
        borderBottom: "1px solid var(--bg-border)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-12px)",
        transition: `opacity 0.4s ease ${String(index * 300)}ms, transform 0.4s ease ${String(index * 300)}ms`,
      }}
    >
      <div style={{ width: 160, fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>
        {step.name}
      </div>
      <div
        data-mono=""
        style={{
          width: 55,
          fontSize: 12,
          fontWeight: 600,
          color: isPositive ? "var(--signal-green)" : "var(--danger-red)",
          textAlign: "right",
          flexShrink: 0,
        }}
      >
        {isPositive ? "+" : ""}{deltaPct}%
      </div>
      <div
        style={{
          flex: 1,
          height: 8,
          background: "var(--bg-border)",
          borderRadius: 4,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: isPositive ? "50%" : undefined,
            right: isPositive ? undefined : "50%",
            height: "100%",
            width: `${String(barWidth)}%`,
            background: isPositive ? "var(--signal-green)" : "var(--danger-red)",
            borderRadius: 4,
            animation: visible ? "barGrow 0.6s ease-out forwards" : undefined,
            animationDelay: `${String(index * 300)}ms`,
            transformOrigin: isPositive ? "left" : "right",
          }}
        />
      </div>
      <div
        data-mono=""
        style={{
          width: 48,
          fontSize: 12,
          color: "var(--text-main)",
          textAlign: "right",
          flexShrink: 0,
        }}
      >
        {cumulativePct}%
      </div>
    </div>
  );
}

function colorForTone(tone: string): string {
  if (tone === "danger") return "var(--danger-red)";
  if (tone === "warning") return "var(--warning-amber)";
  if (tone === "muted") return "var(--text-muted)";
  if (tone === "success") return "var(--signal-green)";
  return "var(--text-bright)";
}

export function ShowcaseLiveDemo({ trace: raw }: { readonly trace: Record<string, unknown> | null }) {
  const { ref, inView } = useInView(0.1);
  const trace = parseTrace(raw);

  return (
    <section ref={ref} className="showcase-section lantern-glow">
      <h2
        className={inView ? "animate-in" : ""}
        style={{
          fontSize: 40,
          fontWeight: 700,
          textAlign: "center",
          marginBottom: 8,
          opacity: inView ? undefined : 0,
        }}
      >
        实时分析管线
      </h2>

      <p
        className={inView ? "animate-in" : ""}
        style={{
          fontSize: 15,
          color: "var(--text-muted)",
          textAlign: "center",
          marginBottom: 16,
          opacity: inView ? undefined : 0,
          animationDelay: "0.1s",
        }}
      >
        焦点市场分析 · Bitcoin 4 月能否触及 $80,000？
      </p>

      <div
        className={inView ? "animate-in" : ""}
        style={{
          maxWidth: 720,
          margin: "0 auto 40px",
          padding: "12px 18px",
          borderLeft: "3px solid var(--lantern-gold)",
          background: "rgba(239,200,81,0.06)",
          borderRadius: "0 8px 8px 0",
          fontSize: 13,
          color: "var(--text-muted)",
          lineHeight: 1.6,
          opacity: inView ? undefined : 0,
          animationDelay: "0.15s",
        }}
      >
        Agent 扫描 249 个 Polymarket 价格市场, 以 Black-Scholes 模型 (年化波动率 σ=65%) 给出无偏概率。
        下方是对 "BTC 4 月能否触及 $80,000?" 这一焦点市场的 BS 分解: 从 27.5% 的市场先验出发, 距离、时间、波动率
        三项共同把 Lantern 概率修正到 21.7% (Edge = -5.8%, 市场高估 Yes)。
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Target market card - Polymarket */}
        <div
          className={inView ? "animate-in" : ""}
          style={{
            background: "var(--bg-dungeon)",
            border: "1px solid var(--lantern-gold)",
            borderRadius: 16,
            padding: "24px",
            opacity: inView ? undefined : 0,
            animationDelay: "0.2s",
          }}
        >
          <div style={{ fontSize: 11, color: "var(--lantern-gold)", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
            Polymarket · 焦点市场
          </div>
          <a
            href={BTC_MARKET.polymarketUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "var(--text-bright)",
              marginBottom: 16,
              lineHeight: 1.3,
              display: "block",
              textDecoration: "none",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--lantern-gold)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-bright)";
            }}
          >
            {BTC_MARKET.question} <span style={{ fontSize: 14, opacity: 0.7 }}>↗</span>
          </a>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                市场共识
              </div>
              <div data-mono="" style={{ fontSize: 22, fontWeight: 700, color: "var(--text-main)" }}>
                {(BTC_MARKET.marketConsensus * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>{BTC_MARKET.side} (Polymarket)</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                Agent 概率
              </div>
              <div data-mono="" style={{ fontSize: 22, fontWeight: 700, color: "var(--signal-green)" }}>
                {(BTC_MARKET.ourProbability * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>{BTC_MARKET.side} (分析后)</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                Edge
              </div>
              <div data-mono="" style={{ fontSize: 22, fontWeight: 700, color: BTC_MARKET.edge >= 0 ? "var(--lantern-gold)" : "var(--danger-red)" }}>
                {BTC_MARKET.edge >= 0 ? "+" : ""}{(BTC_MARKET.edge * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>vs 市场</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                决策
              </div>
              <div data-mono="" style={{ fontSize: 16, fontWeight: 700, color: BTC_MARKET.edge >= 0 ? "var(--signal-green)" : "var(--danger-red)" }}>
                {BTC_MARKET.edge >= 0 ? `BUY ${BTC_MARKET.side}` : `AVOID ${BTC_MARKET.side}`}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                {BTC_MARKET.edge >= 0 ? "有正 Edge, 已下单 ✓" : "市场高估, 回避本笔 (演示)"}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              fontSize: 12,
              color: "var(--text-muted)",
              padding: "12px 14px",
              background: "rgba(139,148,158,0.06)",
              border: "1px solid rgba(139,148,158,0.18)",
              borderRadius: 8,
            }}
          >
            <span>模型: <strong style={{ color: "var(--text-main)" }}>Black-Scholes (σ=65% 年化)</strong></span>
            <span>Yes 价 <strong style={{ color: "var(--text-main)" }}>${BTC_MARKET.pricePerShare.toFixed(2)}</strong></span>
            <a
              href={BTC_MARKET.polymarketUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--lantern-gold)", fontWeight: 600, textDecoration: "none" }}
            >
              View on Polymarket ↗
            </a>
            {BTC_MARKET.txHash.length > 0 && (
              <a
                href={`https://polygonscan.com/tx/${BTC_MARKET.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                data-mono=""
                style={{ color: "var(--text-dim)", textDecoration: "none" }}
              >
                TxHash {formatTx(BTC_MARKET.txHash)} ↗
              </a>
            )}
          </div>
        </div>

        {/* Onchainos call log */}
        {trace?.onchainosCallLog && trace.onchainosCallLog.length > 0 && (
          <div
            className={inView ? "animate-in" : ""}
            style={{
              opacity: inView ? undefined : 0,
              animationDelay: "0.3s",
            }}
          >
            <OnchainosTimeline
              calls={trace.onchainosCallLog}
              visible={inView}
            />
          </div>
        )}

        {/* Pulse Data Summary - reframed for prediction market */}
        <div
          className={inView ? "animate-in" : ""}
          style={{
            background: "var(--bg-dungeon)",
            border: "1px solid var(--bg-border)",
            borderRadius: 12,
            padding: "24px",
            opacity: inView ? undefined : 0,
            animationDelay: "0.4s",
          }}
        >
          <div style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--lantern-gold)",
            marginBottom: 16,
          }}>
            BS 模型输入参数
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
          }}>
            {PULSE_CARDS.map((card) => (
              <div key={card.label}>
                <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                  {card.label}
                </div>
                <div data-mono="" style={{ fontSize: 18, fontWeight: 700, color: colorForTone(card.color) }}>
                  {card.value}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>
                  {card.sub}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bayesian waterfall */}
        <div
          className={inView ? "animate-in" : ""}
          style={{
            background: "var(--bg-dungeon)",
            border: "1px solid var(--bg-border)",
            borderRadius: 16,
            padding: "24px",
            opacity: inView ? undefined : 0,
            animationDelay: "0.5s",
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--text-bright)",
              marginBottom: 6,
            }}
          >
            Black-Scholes 概率分解
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
            先验 = Polymarket 对 &quot;{BTC_MARKET.side}&quot; 的隐含概率 {(BTC_MARKET.marketConsensus * 100).toFixed(1)}%;
            下面按 距离 / 时间 / 波动率 三项因子逐步推导至 BS 模型的无偏概率
          </div>

          {/* Prior bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "6px 0",
              borderBottom: "1px solid var(--bg-border)",
              opacity: inView ? 1 : 0,
              transition: "opacity 0.4s ease",
            }}
          >
            <div style={{ width: 160, fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>
              市场先验 (Polymarket)
            </div>
            <div data-mono="" style={{ width: 55, fontSize: 12, fontWeight: 600, color: "var(--text-dim)", textAlign: "right", flexShrink: 0 }}>
              —
            </div>
            <div style={{ flex: 1, height: 8 }} />
            <div data-mono="" style={{ width: 48, fontSize: 12, color: "var(--text-main)", textAlign: "right", flexShrink: 0 }}>
              {(BTC_MARKET.marketConsensus * 100).toFixed(1)}%
            </div>
          </div>

          {BAYESIAN_TRACE.map((step, i) => (
            <BayesianStep
              key={step.name}
              step={step}
              index={i}
              visible={inView}
            />
          ))}

          {/* Final result */}
          <div
            style={{
              marginTop: 16,
              padding: "12px 16px",
              background: "rgba(239,200,81,0.08)",
              border: "1px solid var(--lantern-gold)",
              borderRadius: 8,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--lantern-gold)" }}>
              BS 模型 &quot;{BTC_MARKET.side}&quot; 概率 (Edge {BTC_MARKET.edge >= 0 ? "+" : ""}{(BTC_MARKET.edge * 100).toFixed(1)}%)
            </span>
            <span
              data-mono=""
              style={{ fontSize: 20, fontWeight: 700, color: "var(--lantern-gold)" }}
            >
              {(BTC_MARKET.ourProbability * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Risk check */}
        <div
          className={inView ? "animate-in" : ""}
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 12,
            flexWrap: "wrap",
            opacity: inView ? undefined : 0,
            animationDelay: "0.7s",
          }}
        >
          {RISK_CHECKS.map((check) => (
            <div
              key={check.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "6px 12px",
                background: "rgba(42,157,143,0.06)",
                border: "1px solid rgba(42,157,143,0.2)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--signal-green)",
                boxShadow: "0 0 8px rgba(42,157,143,0.1)",
              }}
            >
              <span>{check.icon}</span>
              <span>{check.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
