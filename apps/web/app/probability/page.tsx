"use client";

import { useEffect, useState } from "react";
import { ProbabilityWaterfall } from "../../components/probability-waterfall";

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
  readonly marketCap: number;
  readonly holders: number;
  readonly riskLevel: number;
  readonly smartMoneyBuying: boolean;
  readonly signalWalletCount: number;
  readonly signalStrength: number;
  readonly recommendation: string;
  readonly skipReason?: string;
  readonly probabilityTrace: readonly TraceStep[];
}

interface DemoTrace {
  readonly timestamp: string;
  readonly scan: {
    readonly chain: string;
    readonly candidatesFound: number;
    readonly honeypots: number;
  };
  readonly candidates: readonly Candidate[];
  readonly recommendation: {
    readonly symbol: string;
    readonly address: string;
    readonly finalProbability: number;
    readonly trace: readonly TraceStep[];
  } | null;
  readonly execution: {
    readonly executed: boolean;
    readonly txHash?: string;
    readonly error?: string;
  };
}

export default function ProbabilityPage() {
  const [trace, setTrace] = useState<DemoTrace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrace() {
      try {
        const res = await fetch("/api/demo-trace", { cache: "no-store" });
        if (!res.ok) {
          setError("Run `pnpm agent:demo` to generate data");
          return;
        }
        const data = await res.json();
        setTrace(data);
        setError(null);
      } catch {
        setError("Failed to fetch trace");
      } finally {
        setLoading(false);
      }
    }

    fetchTrace();
    const interval = setInterval(fetchTrace, 30_000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 48, color: "#888", fontFamily: "monospace" }}>
        Loading trace...
      </div>
    );
  }

  if (error || !trace) {
    return (
      <div style={{ padding: 48, fontFamily: "monospace" }}>
        <h2 style={{ color: "#ff4444" }}>No Data</h2>
        <p style={{ color: "#888" }}>{error}</p>
        <code
          style={{
            background: "#111",
            padding: "8px 12px",
            borderRadius: 6,
            display: "inline-block",
            marginTop: 8,
          }}
        >
          pnpm agent:demo
        </code>
      </div>
    );
  }

  const rec = trace.recommendation;
  const buys = [...trace.candidates]
    .filter((c) => c.recommendation === "BUY")
    .sort((a, b) => b.signalStrength - a.signalStrength);
  const skips = trace.candidates.filter((c) => c.recommendation !== "BUY");

  // Convert recommendation trace to waterfall format
  const waterfallResult = rec
    ? {
        target: {
          tokenSymbol: rec.symbol,
          currentPrice:
            trace.candidates.find((c) => c.symbol === rec.symbol)?.price ?? 0,
          strikePrice: 0,
          hoursToExpiry: 0,
          direction: "above" as const,
        },
        prior: rec.trace.length > 0 ? (rec.trace[0]?.probBefore ?? 0.5) : 0.5,
        posterior: rec.finalProbability,
        confidence: (
          rec.finalProbability > 0.7
            ? "HIGH"
            : rec.finalProbability > 0.55
              ? "MEDIUM"
              : "LOW"
        ) as "HIGH" | "MEDIUM" | "LOW",
        steps: rec.trace.map((s) => ({
          label:
            s.direction === "bullish"
              ? `\u{1F4C8} ${s.name}`
              : s.direction === "bearish"
                ? `\u{1F4C9} ${s.name}`
                : `\u{27A1}\u{FE0F} ${s.name}`,
          description: `${s.description} (LR ${s.likelihoodRatio.toFixed(2)}\u00D7)`,
          probabilityBefore: s.probBefore,
          probabilityAfter: s.probAfter,
          delta: s.probAfter - s.probBefore,
          type: "signal" as const,
        })),
        signals: [],
        volatility: { hourly: 0, annualized: 0, method: "ewma" as const },
        metadata: {
          klinesUsed: 0,
          timeframeBar: "\u2014",
          calculatedAt: trace.timestamp,
        },
      }
    : null;

  return (
    <div
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "24px 16px",
        fontFamily: "monospace",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
          Lantern Agent \u2014 Live Analysis
        </h1>
        <div style={{ color: "#666", fontSize: 13 }}>
          {trace.scan.chain} \u00B7 {trace.scan.candidatesFound} tokens scanned
          \u00B7 {trace.scan.honeypots} honeypots filtered \u00B7{" "}
          {new Date(trace.timestamp).toLocaleString()}
        </div>
      </div>

      {/* Execution Status Banner */}
      <div
        style={{
          background: trace.execution.executed ? "#00C85311" : "#111",
          border: `1px solid ${trace.execution.executed ? "#00C85344" : "#333"}`,
          borderRadius: 8,
          padding: "12px 16px",
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: trace.execution.executed ? "#00C853" : "#888",
          }}
        >
          {trace.execution.executed
            ? `\u2713 Trade executed: ${trace.execution.txHash}`
            : trace.execution.error
              ? `\u23F8 ${trace.execution.error}`
              : "\u23F8 No execution this cycle"}
        </span>
        <span style={{ fontSize: 11, color: "#555" }}>
          {buys.length} BUY / {skips.length} SKIP
        </span>
      </div>

      {/* Top Recommendation Waterfall */}
      {waterfallResult && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ color: "#888", fontSize: 12, marginBottom: 8 }}>
            TOP RECOMMENDATION
          </div>
          <ProbabilityWaterfall result={waterfallResult} />
        </div>
      )}

      {/* All Candidates Table */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: "#888", fontSize: 12, marginBottom: 8 }}>
          ALL CANDIDATES
        </div>
        <div style={{ overflowX: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid #333", color: "#666" }}>
                <th style={{ textAlign: "left", padding: "8px 4px" }}>Token</th>
                <th style={{ textAlign: "right", padding: "8px 4px" }}>
                  Score
                </th>
                <th style={{ textAlign: "right", padding: "8px 4px" }}>24h</th>
                <th style={{ textAlign: "right", padding: "8px 4px" }}>
                  Liquidity
                </th>
                <th style={{ textAlign: "right", padding: "8px 4px" }}>
                  Holders
                </th>
                <th style={{ textAlign: "center", padding: "8px 4px" }}>
                  Smart $
                </th>
                <th style={{ textAlign: "center", padding: "8px 4px" }}>
                  Risk
                </th>
                <th style={{ textAlign: "center", padding: "8px 4px" }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {[...buys, ...skips].map((c, i) => {
                const isBuy = c.recommendation === "BUY";
                return (
                  <tr
                    key={c.address || i}
                    style={{
                      borderBottom: "1px solid #1a1a1a",
                      opacity: isBuy ? 1 : 0.5,
                    }}
                  >
                    <td
                      style={{
                        padding: "8px 4px",
                        fontWeight: isBuy ? 700 : 400,
                      }}
                    >
                      {c.symbol}
                      <span
                        style={{ color: "#444", fontSize: 11, marginLeft: 4 }}
                      >
                        {c.address.slice(0, 6)}...{c.address.slice(-4)}
                      </span>
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        padding: "8px 4px",
                        color:
                          c.signalStrength > 0.6
                            ? "#00C853"
                            : c.signalStrength > 0.5
                              ? "#FFB300"
                              : "#666",
                      }}
                    >
                      {c.signalStrength > 0
                        ? `${(c.signalStrength * 100).toFixed(1)}%`
                        : "\u2014"}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        padding: "8px 4px",
                        color: c.change24h > 0 ? "#00C853" : "#ff4444",
                      }}
                    >
                      {(c.change24h * 100).toFixed(1)}%
                    </td>
                    <td style={{ textAlign: "right", padding: "8px 4px" }}>
                      $
                      {c.liquidity > 1000
                        ? `${(c.liquidity / 1000).toFixed(0)}K`
                        : c.liquidity.toFixed(0)}
                    </td>
                    <td style={{ textAlign: "right", padding: "8px 4px" }}>
                      {c.holders.toLocaleString()}
                    </td>
                    <td style={{ textAlign: "center", padding: "8px 4px" }}>
                      {c.smartMoneyBuying
                        ? `${String(c.signalWalletCount)}\u{1F40B}`
                        : "\u2014"}
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        padding: "8px 4px",
                        color:
                          c.riskLevel <= 2
                            ? "#00C853"
                            : c.riskLevel <= 3
                              ? "#FFB300"
                              : "#ff4444",
                      }}
                    >
                      {c.riskLevel}/5
                    </td>
                    <td style={{ textAlign: "center", padding: "8px 4px" }}>
                      {isBuy ? (
                        <span
                          style={{
                            background: "#00C85322",
                            color: "#00C853",
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontSize: 11,
                          }}
                        >
                          BUY
                        </span>
                      ) : (
                        <span style={{ color: "#555", fontSize: 11 }}>
                          {c.skipReason?.split(":")[0] || "SKIP"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Signal Details for BUY candidates */}
      {buys.length > 0 && (
        <div>
          <div style={{ color: "#888", fontSize: 12, marginBottom: 8 }}>
            SIGNAL BREAKDOWN \u2014 BUY CANDIDATES
          </div>
          {buys.map((c) => (
            <div
              key={c.address}
              style={{
                background: "#111",
                border: "1px solid #222",
                borderRadius: 8,
                padding: "12px 16px",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <span style={{ fontWeight: 700 }}>{c.symbol}</span>
                <span style={{ color: "#00C853", fontWeight: 700 }}>
                  {(c.signalStrength * 100).toFixed(1)}%
                </span>
              </div>
              {c.probabilityTrace.map((step, j) => (
                <div
                  key={`${c.address}-${String(j)}`}
                  style={{ fontSize: 12, color: "#888", marginBottom: 2 }}
                >
                  {step.direction === "bullish" ? "\u{1F4C8}" : "\u{1F4C9}"}{" "}
                  <span
                    style={{
                      color:
                        step.direction === "bullish" ? "#00C853" : "#ff4444",
                    }}
                  >
                    {step.probAfter > step.probBefore ? "+" : ""}
                    {((step.probAfter - step.probBefore) * 100).toFixed(1)}%
                  </span>{" "}
                  {step.description}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div
        style={{
          color: "#333",
          fontSize: 11,
          marginTop: 32,
          paddingTop: 16,
          borderTop: "1px solid #1a1a1a",
        }}
      >
        Lantern Agent \u00B7 Bayesian Probability Engine \u00B7 OKX Onchain OS
        \u00D7 X Layer (196) \u00B7 Auto-refreshes every 30s
      </div>
    </div>
  );
}
