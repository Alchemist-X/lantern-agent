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

interface Candidate {
  readonly symbol: string;
  readonly address: string;
  readonly price: number;
  readonly change24h: number;
  readonly liquidity: number;
  readonly holders: number;
  readonly riskLevel: number;
  readonly smartMoneyBuying: boolean;
  readonly signalWalletCount: number;
  readonly signalStrength: number;
  readonly recommendation: string;
}

interface OnchainosCall {
  readonly command: string;
  readonly timestamp: string;
  readonly success: boolean;
  readonly resultPreview: string;
}

interface DemoTrace {
  readonly timestamp: string;
  readonly candidates: readonly Candidate[];
  readonly onchainosCallLog?: readonly OnchainosCall[];
  readonly recommendation: {
    readonly symbol: string;
    readonly address: string;
    readonly finalProbability: number;
    readonly trace: readonly TraceStep[];
  } | null;
}

function parseTrace(raw: Record<string, unknown> | null): DemoTrace | null {
  if (!raw) return null;
  if (typeof raw.timestamp !== "string") return null;
  if (!Array.isArray(raw.candidates)) return null;

  const callLog = Array.isArray(raw.onchainosCallLog)
    ? (raw.onchainosCallLog as OnchainosCall[])
    : undefined;

  return {
    ...(raw as unknown as Omit<DemoTrace, "onchainosCallLog">),
    onchainosCallLog: callLog,
  } as DemoTrace;
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
          marginBottom: 16,
        }}
      >
        Onchainos 数据采集
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
  { label: "代币30%", icon: "\u2705" },
  { label: "持仓10", icon: "\u2705" },
  { label: "最小$5", icon: "\u2705" },
] as const;

function formatPrice(price: number): string {
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(2)}`;
}

function ConfidenceBadge({ probability }: { readonly probability: number }) {
  const level = probability > 0.7 ? "HIGH" : probability > 0.55 ? "MEDIUM" : "LOW";
  const color = probability > 0.7 ? "var(--signal-green)" : probability > 0.55 ? "var(--warning-amber)" : "var(--text-muted)";

  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color,
        background: `${color}18`,
        padding: "2px 8px",
        borderRadius: 4,
        letterSpacing: 1,
      }}
    >
      {level}
    </span>
  );
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
      <div style={{ width: 120, fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>
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
          marginBottom: 48,
          opacity: inView ? undefined : 0,
          animationDelay: "0.1s",
        }}
      >
        最近一次 Pulse 循环的完整推理过程
      </p>

      {!trace ? (
        <div
          className={inView ? "animate-in" : ""}
          style={{
            background: "var(--bg-dungeon)",
            border: "1px solid var(--bg-border)",
            borderRadius: 12,
            padding: "40px 24px",
            textAlign: "center",
            opacity: inView ? undefined : 0,
            animationDelay: "0.2s",
          }}
        >
          <p
            data-mono=""
            style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}
          >
            运行 <span style={{ color: "var(--lantern-gold)" }}>pnpm agent:demo</span> 生成数据
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {/* Recommendation card */}
          {trace.recommendation && (() => {
            const rec = trace.recommendation;
            const candidate = trace.candidates.find((c) => c.symbol === rec.symbol);
            return (
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text-bright)", marginBottom: 4 }}>
                      {rec.symbol}
                    </div>
                    {candidate && (
                      <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                        {formatPrice(candidate.price)}
                        <span
                          style={{
                            marginLeft: 8,
                            color: candidate.change24h > 0 ? "var(--signal-green)" : "var(--danger-red)",
                          }}
                        >
                          {candidate.change24h > 0 ? "+" : ""}{(candidate.change24h * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      data-mono=""
                      style={{
                        fontSize: 36,
                        fontWeight: 700,
                        color: "var(--signal-green)",
                        lineHeight: 1,
                      }}
                    >
                      {(rec.finalProbability * 100).toFixed(1)}%
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <ConfidenceBadge probability={rec.finalProbability} />
                    </div>
                  </div>
                </div>

                {candidate && (
                  <div
                    style={{
                      display: "flex",
                      gap: 16,
                      marginTop: 16,
                      flexWrap: "wrap",
                      fontSize: 12,
                      color: "var(--text-muted)",
                    }}
                  >
                    {candidate.smartMoneyBuying && (
                      <span>Smart Money: {candidate.signalWalletCount} wallets</span>
                    )}
                    <span>Liquidity: ${candidate.liquidity > 1000 ? `${(candidate.liquidity / 1000).toFixed(0)}K` : String(candidate.liquidity)}</span>
                    <span>Holders: {candidate.holders.toLocaleString()}</span>
                    <span>Risk: {candidate.riskLevel}/5</span>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Pulse Data Detail - what we analyzed */}
          {trace.candidates && trace.candidates.length > 0 && (
            <div
              className={inView ? "animate-in" : ""}
              style={{
                background: "var(--bg-dungeon)",
                border: "1px solid var(--bg-border)",
                borderRadius: 12,
                padding: "24px",
                opacity: inView ? undefined : 0,
                animationDelay: "0.25s",
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
                marginBottom: 16,
              }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                    X Layer 代币扫描
                  </div>
                  <div data-mono="" style={{ fontSize: 18, fontWeight: 700, color: "var(--text-bright)" }}>
                    {trace.candidates.length} 个候选
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                    聪明钱信号
                  </div>
                  <div data-mono="" style={{ fontSize: 18, fontWeight: 700, color: "var(--text-bright)" }}>
                    {trace.candidates.filter(c => c.smartMoneyBuying).length} 个代币有共识
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                    安全扫描
                  </div>
                  <div data-mono="" style={{ fontSize: 18, fontWeight: 700, color: "var(--signal-green)" }}>
                    0 蜜罐 / {trace.candidates.length} 通过
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                    BUY 推荐
                  </div>
                  <div data-mono="" style={{ fontSize: 18, fontWeight: 700, color: "var(--lantern-orange)" }}>
                    {trace.candidates.filter(c => c.recommendation === "BUY").length} 个 · 最高 {Math.max(...trace.candidates.map(c => c.signalStrength * 100)).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Top 3 candidates detail table */}
              <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                Top 3 代币详情
              </div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "var(--text-main)" }}>
                {trace.candidates.slice(0, 3).map((c, i) => (
                  <div key={c.address} style={{
                    display: "grid",
                    gridTemplateColumns: "24px 1fr 80px 80px 80px",
                    gap: 8,
                    padding: "6px 0",
                    borderBottom: i < 2 ? "1px solid var(--bg-border)" : "none",
                    color: c.recommendation === "BUY" ? "var(--text-main)" : "var(--text-dim)",
                  }}>
                    <div>{i + 1}</div>
                    <div>{c.symbol} <span style={{ color: "var(--text-dim)" }}>{c.address.slice(0, 8)}...</span></div>
                    <div style={{ textAlign: "right" }}>{(c.signalStrength * 100).toFixed(1)}%</div>
                    <div style={{ textAlign: "right", color: c.change24h > 0 ? "var(--signal-green)" : "var(--danger-red)" }}>
                      {c.change24h > 0 ? "+" : ""}{(c.change24h * 100).toFixed(1)}%
                    </div>
                    <div style={{ textAlign: "right", color: c.riskLevel <= 2 ? "var(--signal-green)" : "var(--warning-amber)" }}>
                      Risk {c.riskLevel}/5
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Onchainos call log */}
          {trace.onchainosCallLog && trace.onchainosCallLog.length > 0 && (
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

          {/* Bayesian waterfall */}
          {trace.recommendation && trace.recommendation.trace.length > 0 && (
            <div
              className={inView ? "animate-in" : ""}
              style={{
                background: "var(--bg-dungeon)",
                border: "1px solid var(--bg-border)",
                borderRadius: 16,
                padding: "24px",
                opacity: inView ? undefined : 0,
                animationDelay: "0.45s",
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "var(--text-bright)",
                  marginBottom: 16,
                }}
              >
                贝叶斯概率更新
              </div>

              {trace.recommendation.trace.map((step, i) => (
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
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600, color: "var(--lantern-gold)" }}>
                  最终概率
                </span>
                <span
                  data-mono=""
                  style={{ fontSize: 20, fontWeight: 700, color: "var(--lantern-gold)" }}
                >
                  {(trace.recommendation.finalProbability * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {/* Candidate mini-cards */}
          <div
            className={inView ? "animate-in" : ""}
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              opacity: inView ? undefined : 0,
              animationDelay: "0.6s",
            }}
          >
            {trace.candidates.map((c) => {
              const isBuy = c.recommendation === "BUY";
              return (
                <div
                  key={c.address}
                  style={{
                    fontSize: 12,
                    padding: "4px 12px",
                    borderRadius: 16,
                    border: `1px solid ${isBuy ? "var(--signal-green)" : "var(--bg-border)"}`,
                    color: isBuy ? "var(--signal-green)" : "var(--text-dim)",
                    background: isBuy ? "rgba(42,157,143,0.08)" : "transparent",
                  }}
                >
                  {c.symbol} {isBuy ? "BUY" : "SKIP"}
                </div>
              );
            })}
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
      )}
    </section>
  );
}
