"use client";

import { useInView } from "./use-in-view";

interface PolymarketEdge {
  readonly question: string;
  readonly marketPrice: number;
  readonly lanternPrice: number;
  readonly edge: number;
  readonly signals: readonly string[];
}

interface EdgeTrace {
  readonly polymarket?: {
    readonly marketsScanned: number;
    readonly edges: readonly PolymarketEdge[];
  };
}

function LanternIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="24" y="8" width="16" height="4" rx="1" stroke="#FF9100" strokeWidth="3" />
      <line x1="32" y1="4" x2="32" y2="8" stroke="#FF9100" strokeWidth="3" />
      <path
        d="M22 16 C22 12 24 12 32 12 C40 12 42 12 42 16 L44 40 C44 48 40 52 32 52 C24 52 20 48 20 40 Z"
        stroke="#FF9100"
        strokeWidth="3"
        fill="none"
      />
      <rect x="26" y="52" width="12" height="4" rx="1" stroke="#FF9100" strokeWidth="3" />
    </svg>
  );
}

function strengthLabel(edge: number): { readonly text: string; readonly color: string } {
  const abs = Math.abs(edge);
  if (abs >= 0.15) return { text: "强信号", color: "var(--signal-green)" };
  if (abs >= 0.08) return { text: "中等", color: "var(--warning-amber)" };
  return { text: "弱", color: "var(--text-muted)" };
}

function parseEdgeTrace(raw: Record<string, unknown> | null): EdgeTrace | null {
  if (!raw) return null;
  return raw as unknown as EdgeTrace;
}

export function ShowcaseEdge({ trace: raw }: { readonly trace: Record<string, unknown> | null }) {
  const { ref, inView } = useInView(0.12);
  const trace = parseEdgeTrace(raw);

  const polyData = trace?.polymarket;
  const topEdge = polyData?.edges?.reduce<PolymarketEdge | null>(
    (best, current) => {
      if (!best) return current;
      return Math.abs(current.edge) > Math.abs(best.edge) ? current : best;
    },
    null,
  ) ?? null;

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
        预测市场 Edge 扫描
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
        链上数据 vs 市场共识 &mdash; 灯笼照亮定价盲区
      </p>

      {topEdge ? (
        <div
          className={inView ? "animate-in" : ""}
          style={{
            background: "var(--bg-dungeon)",
            border: "1px solid var(--bg-border)",
            borderRadius: 16,
            padding: "32px 24px",
            maxWidth: 640,
            margin: "0 auto",
            opacity: inView ? undefined : 0,
            animationDelay: "0.2s",
          }}
        >
          {/* Market question */}
          <div
            style={{
              fontSize: 14,
              color: "var(--text-muted)",
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            {topEdge.question}
          </div>

          {/* Two big numbers */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 32,
              marginBottom: 24,
              flexWrap: "wrap",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>
                市场定价
              </div>
              <div
                data-mono=""
                style={{ fontSize: 32, fontWeight: 700, color: "var(--text-muted)" }}
              >
                {(topEdge.marketPrice * 100).toFixed(0)}%
              </div>
            </div>

            <div style={{ opacity: 0.8 }}>
              <LanternIcon />
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 6 }}>
                Lantern
              </div>
              <div
                data-mono=""
                style={{ fontSize: 32, fontWeight: 700, color: "var(--signal-green)" }}
              >
                {(topEdge.lanternPrice * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Edge bar */}
          <div
            style={{
              height: 8,
              borderRadius: 4,
              background: "linear-gradient(90deg, var(--bg-border), var(--signal-green))",
              position: "relative",
              marginBottom: 8,
            }}
          >
            {/* Market marker */}
            <div
              style={{
                position: "absolute",
                left: `${String(Math.min(topEdge.marketPrice * 100, 100))}%`,
                top: -4,
                width: 4,
                height: 16,
                background: "var(--text-muted)",
                borderRadius: 2,
                transform: "translateX(-50%)",
              }}
            />
            {/* Lantern marker */}
            <div
              style={{
                position: "absolute",
                left: `${String(Math.min(topEdge.lanternPrice * 100, 100))}%`,
                top: -4,
                width: 4,
                height: 16,
                background: "var(--signal-green)",
                borderRadius: 2,
                transform: "translateX(-50%)",
              }}
            />
          </div>

          {/* Edge value */}
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <span
              data-mono=""
              style={{ fontSize: 28, fontWeight: 700, color: "var(--lantern-gold)" }}
            >
              +{(Math.abs(topEdge.edge) * 100).toFixed(1)}%
            </span>
          </div>

          {/* Strength label */}
          {(() => {
            const strength = strengthLabel(topEdge.edge);
            return (
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: strength.color,
                    padding: "2px 10px",
                    borderRadius: 4,
                    background: `${strength.color}15`,
                  }}
                >
                  {strength.text}
                </span>
              </div>
            );
          })()}

          {/* Signal list */}
          {topEdge.signals.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                justifyContent: "center",
              }}
            >
              {topEdge.signals.map((signal) => (
                <span
                  key={signal}
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid var(--bg-border)",
                    borderRadius: 4,
                    padding: "2px 8px",
                  }}
                >
                  {signal}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div
          className={inView ? "animate-in" : ""}
          style={{
            background: "var(--bg-dungeon)",
            border: "1px solid var(--bg-border)",
            borderRadius: 12,
            padding: "40px 24px",
            maxWidth: 640,
            margin: "0 auto",
            textAlign: "center",
            opacity: inView ? undefined : 0,
            animationDelay: "0.2s",
          }}
        >
          <p style={{ fontSize: 14, color: "var(--text-muted)", margin: 0 }}>
            81 个市场已扫描 &middot; Edge 数据待更新
          </p>
        </div>
      )}
    </section>
  );
}
