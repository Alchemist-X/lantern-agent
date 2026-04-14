"use client";

interface ProbabilitySignal {
  readonly name: string;
  readonly displayName: string;
  readonly category: string;
  readonly direction: string;
  readonly likelihoodRatio: number;
  readonly magnitude: string;
  readonly source: string;
  readonly timestamp: number;
}

interface ProbabilityStep {
  readonly label: string;
  readonly description: string;
  readonly probabilityBefore: number;
  readonly probabilityAfter: number;
  readonly delta: number;
  readonly type: "prior" | "signal" | "adjustment";
  readonly signal?: ProbabilitySignal;
}

interface ProbabilityTarget {
  readonly tokenSymbol: string;
  readonly currentPrice: number;
  readonly strikePrice: number;
  readonly hoursToExpiry: number;
  readonly direction: string;
}

interface ProbabilityResult {
  readonly target: ProbabilityTarget;
  readonly prior: number;
  readonly posterior: number;
  readonly confidence: string;
  readonly steps: readonly ProbabilityStep[];
  readonly volatility: {
    readonly hourly: number;
    readonly annualized: number;
    readonly method: string;
  };
  readonly metadata: {
    readonly klinesUsed: number;
    readonly timeframeBar: string;
    readonly calculatedAt: string;
  };
}

interface Props {
  readonly result: ProbabilityResult;
  readonly polymarketPrice?: number;
}

function confidenceBadgeStyle(confidence: string): React.CSSProperties {
  if (confidence === "HIGH") {
    return { background: "#00C85322", color: "#00C853" };
  }
  if (confidence === "MEDIUM") {
    return { background: "#FFB30022", color: "#FFB300" };
  }
  return { background: "#88888822", color: "#888" };
}

function barColorForStep(step: ProbabilityStep): string {
  if (step.type === "prior") {
    return "#555";
  }
  return step.delta > 0 ? "#00C853" : "#ff4444";
}

function edgeLabel(edge: number): string {
  const abs = Math.abs(edge);
  if (abs > 0.08) {
    return "STRONG \u2014 Standard position";
  }
  if (abs > 0.03) {
    return "MODERATE \u2014 Small position";
  }
  return "WEAK \u2014 No trade";
}

export function ProbabilityWaterfall({ result, polymarketPrice }: Props) {
  const edge =
    polymarketPrice !== undefined ? result.posterior - polymarketPrice : null;
  const edgeColor =
    edge !== null && edge > 0 ? "#00C853" : "#ff4444";

  return (
    <div style={{ fontFamily: "monospace" }}>
      {/* Target Card */}
      <div
        style={{
          background: "#111",
          border: "1px solid #333",
          borderRadius: 12,
          padding: "20px 24px",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ color: "#888", fontSize: 12, marginBottom: 4 }}>
              PREDICTION TARGET
            </div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>
              {result.target.tokenSymbol}{" "}
              {result.target.direction === "above" ? ">" : "<"} $
              {result.target.strikePrice.toLocaleString()}
            </div>
            <div style={{ color: "#888", fontSize: 13, marginTop: 4 }}>
              in {result.target.hoursToExpiry}h | Current: $
              {result.target.currentPrice.toLocaleString()}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#888", fontSize: 12, marginBottom: 4 }}>
              OUR ESTIMATE
            </div>
            <div style={{ fontSize: 36, fontWeight: 700, color: "#00C853" }}>
              {(result.posterior * 100).toFixed(1)}%
            </div>
            <div
              style={{
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 4,
                display: "inline-block",
                ...confidenceBadgeStyle(result.confidence),
              }}
            >
              {result.confidence} CONFIDENCE
            </div>
          </div>
        </div>
      </div>

      {/* Waterfall Chart */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ color: "#888", fontSize: 12, marginBottom: 12 }}>
          BAYESIAN UPDATE TRACE
        </div>
        {result.steps.map((step, i) => {
          const barLeft = Math.min(step.probabilityBefore, step.probabilityAfter);
          const barWidth = Math.abs(step.delta);
          const isPositive = step.delta > 0;
          const color = barColorForStep(step);

          return (
            <div
              key={`${step.label}-${String(i)}`}
              style={{
                display: "grid",
                gridTemplateColumns: "220px 1fr 60px",
                alignItems: "center",
                gap: 12,
                marginBottom: 8,
                padding: "8px 0",
                borderBottom: "1px solid #1a1a1a",
              }}
            >
              {/* Label */}
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {step.label}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#666",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {step.description}
                </div>
              </div>

              {/* Bar */}
              <div
                style={{
                  position: "relative",
                  height: 28,
                  background: "#1a1a1a",
                  borderRadius: 4,
                }}
              >
                {/* Filled area up to current probability */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: `${String(step.probabilityAfter * 100)}%`,
                    height: "100%",
                    background: "#222",
                    borderRadius: 4,
                  }}
                />
                {/* Delta highlight */}
                <div
                  style={{
                    position: "absolute",
                    left: `${String(barLeft * 100)}%`,
                    top: 2,
                    width: `${String(Math.max(barWidth * 100, 0.5))}%`,
                    height: "calc(100% - 4px)",
                    background: color,
                    borderRadius: 3,
                    opacity: 0.8,
                    transition: "all 0.3s ease",
                  }}
                />
                {/* Probability marker line */}
                <div
                  style={{
                    position: "absolute",
                    left: `${String(step.probabilityAfter * 100)}%`,
                    top: 0,
                    width: 2,
                    height: "100%",
                    background: "#fff",
                    borderRadius: 1,
                  }}
                />
              </div>

              {/* Value */}
              <div style={{ textAlign: "right", fontSize: 14, fontWeight: 700 }}>
                <span style={{ color }}>
                  {isPositive ? "+" : ""}
                  {(step.delta * 100).toFixed(1)}%
                </span>
                <div
                  style={{ fontSize: 11, color: "#888", fontWeight: 400 }}
                >
                  {(step.probabilityAfter * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edge Comparison */}
      {polymarketPrice !== undefined && edge !== null && (
        <div
          style={{
            background: "#111",
            border: `1px solid ${Math.abs(edge) > 0.03 ? `${edgeColor}44` : "#333"}`,
            borderRadius: 12,
            padding: "20px 24px",
            marginBottom: 24,
          }}
        >
          <div style={{ color: "#888", fontSize: 12, marginBottom: 12 }}>
            EDGE ANALYSIS
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: "#888" }}>Polymarket</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#888" }}>
                {(polymarketPrice * 100).toFixed(1)}%
              </div>
            </div>
            <div style={{ fontSize: 20, color: "#555" }}>vs</div>
            <div>
              <div style={{ fontSize: 12, color: "#888" }}>Lantern</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: "#00C853" }}>
                {(result.posterior * 100).toFixed(1)}%
              </div>
            </div>
          </div>
          <div
            style={{
              marginTop: 16,
              padding: "12px 16px",
              background: `${edgeColor}11`,
              borderRadius: 8,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{ fontSize: 14, color: edgeColor, fontWeight: 700 }}
            >
              Edge: {edge > 0 ? "+" : ""}
              {(edge * 100).toFixed(1)}%
            </span>
            <span style={{ fontSize: 12, color: "#888" }}>
              {edgeLabel(edge)}
            </span>
          </div>
        </div>
      )}

      {/* Methodology Footer */}
      <div style={{ color: "#444", fontSize: 11, lineHeight: 1.6 }}>
        <div style={{ marginBottom: 4, color: "#666", fontWeight: 600 }}>
          METHODOLOGY
        </div>
        Prior: Black-Scholes + Empirical Frequency (
        {"\u03C3"}=
        {(result.volatility.annualized * 100).toFixed(0)}%,{" "}
        {result.volatility.method.toUpperCase()})
        <br />
        Updates: Bayesian likelihood ratio fusion (
        {result.steps.filter((s) => s.type === "signal").length} signals)
        <br />
        Data: {result.metadata.klinesUsed} {"\u00D7"}{" "}
        {result.metadata.timeframeBar} candles | Calculated:{" "}
        {new Date(result.metadata.calculatedAt).toLocaleTimeString()}
      </div>
    </div>
  );
}
