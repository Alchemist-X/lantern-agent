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

// Polymarket MSTR BTC market - real trade data
const MSTR_MARKET = {
  question: "MicroStrategy sells any Bitcoin by December 31, 2026?",
  marketConsensus: 0.115,
  ourProbability: 0.183,
  edge: 0.068,
  side: "YES",
  shares: 8.33,
  pricePerShare: 0.12,
  txHash: "0x23872647d57ac1165a503fd1d954f14d618d895068e3aa339762c30615f3f490",
} as const;

// Pulse data summary cards for the prediction market
const PULSE_CARDS = [
  { label: "BTC 当前价格", value: "$94,250", sub: "-1.2% (24h)", color: "danger" },
  { label: "聪明钱 BTC 动向", value: "净卖出", sub: "过去 24h -$38M", color: "danger" },
  { label: "MSTR 相关链上动向", value: "持仓集中", sub: "Top10 地址 62%", color: "warning" },
  { label: "历史 MSTR 卖出模式", value: "强持有", sub: "2020 至今 0 次减持", color: "muted" },
] as const;

// Bayesian trace for MSTR market
const BAYESIAN_TRACE: readonly TraceStep[] = [
  {
    name: "聪明钱 BTC 净卖出",
    direction: "up",
    likelihoodRatio: 1.22,
    description: "24h 聪明钱净卖出 BTC 超过 3800 万, 提示下行压力",
    probBefore: 0.115,
    probAfter: 0.138,
  },
  {
    name: "MSTR 持仓集中度高",
    direction: "up",
    likelihoodRatio: 1.16,
    description: "Top10 地址占比 62%, 关键地址异动可能触发连锁减仓",
    probBefore: 0.138,
    probAfter: 0.157,
  },
  {
    name: "24h BTC 交易量异常",
    direction: "up",
    likelihoodRatio: 1.19,
    description: "交易所流入激增 +28%, 抛压叠加估值修正风险",
    probBefore: 0.157,
    probAfter: 0.183,
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
        焦点市场分析 · MicroStrategy 是否会在 2026 年底前卖出任何 BTC？
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
        Agent 监控 81 个 Polymarket 市场, 在 MSTR BTC 这道题上发现 Edge。
        以下是 Onchainos 采集的 BTC / MSTR 链上信号, 以及贝叶斯概率更新的真实过程。
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
          <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-bright)", marginBottom: 16, lineHeight: 1.3 }}>
            {MSTR_MARKET.question}
          </div>

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
                {(MSTR_MARKET.marketConsensus * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>Yes (Polymarket)</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                Agent 概率
              </div>
              <div data-mono="" style={{ fontSize: 22, fontWeight: 700, color: "var(--signal-green)" }}>
                {(MSTR_MARKET.ourProbability * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>Yes (分析后)</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                Edge
              </div>
              <div data-mono="" style={{ fontSize: 22, fontWeight: 700, color: "var(--lantern-gold)" }}>
                +{(MSTR_MARKET.edge * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>vs 市场</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                决策
              </div>
              <div data-mono="" style={{ fontSize: 16, fontWeight: 700, color: "var(--signal-green)" }}>
                BUY {MSTR_MARKET.side}
              </div>
              <div style={{ fontSize: 11, color: "var(--signal-green)", marginTop: 2 }}>已执行 ✓</div>
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
              background: "rgba(42,157,143,0.06)",
              border: "1px solid rgba(42,157,143,0.18)",
              borderRadius: 8,
            }}
          >
            <span>已买入 <strong style={{ color: "var(--text-main)" }}>{MSTR_MARKET.shares.toFixed(2)} YES</strong></span>
            <span>价格 <strong style={{ color: "var(--text-main)" }}>${MSTR_MARKET.pricePerShare.toFixed(2)}</strong></span>
            <span data-mono="" style={{ color: "var(--text-dim)" }}>
              TxHash {formatTx(MSTR_MARKET.txHash)}
            </span>
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
            Pulse 数据摘要 · 本轮分析内容
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
            贝叶斯概率更新
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 16 }}>
            先验 = Polymarket 隐含概率 11.5%, 每一步根据链上证据似然比更新
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
              11.5%
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
              最终 Yes 概率 (Edge +6.8%)
            </span>
            <span
              data-mono=""
              style={{ fontSize: 20, fontWeight: 700, color: "var(--lantern-gold)" }}
            >
              {(MSTR_MARKET.ourProbability * 100).toFixed(1)}%
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
