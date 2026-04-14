"use client";

/* ------------------------------------------------------------------ */
/*  Type definitions                                                   */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  CSS variables & keyframe stylesheet                                */
/* ------------------------------------------------------------------ */

const CSS_VARS = {
  bg: "#0a0a0a",
  cardBg: "#0f0f0f",
  cardBorder: "#1a1a1a",
  green: "#00E676",
  red: "#ff5252",
  text: "#e0e0e0",
  muted: "#666",
  fontMono:
    "'SF Mono', 'Cascadia Code', 'Fira Code', 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
} as const;

const KEYFRAMES_CSS = `
@keyframes wf-fadeSlideIn {
  0% {
    opacity: 0;
    transform: translateX(-18px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes wf-barGrow {
  0% {
    transform: scaleX(0);
  }
  100% {
    transform: scaleX(1);
  }
}

@keyframes wf-markerPulse {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 4px rgba(255, 255, 255, 0.4);
  }
  50% {
    opacity: 0.6;
    box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
  }
}

@keyframes wf-greenGlow {
  0%, 100% {
    box-shadow: 0 0 8px rgba(0, 230, 118, 0.15), 0 0 24px rgba(0, 230, 118, 0.06);
  }
  50% {
    box-shadow: 0 0 16px rgba(0, 230, 118, 0.3), 0 0 40px rgba(0, 230, 118, 0.12);
  }
}

@keyframes wf-confidenceDotPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
}

@keyframes wf-gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
`;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function confidenceColor(confidence: string): string {
  if (confidence === "HIGH") return CSS_VARS.green;
  if (confidence === "MEDIUM") return "#FFB300";
  return "#888";
}

function confidenceDotColor(confidence: string): string {
  if (confidence === "HIGH") return CSS_VARS.green;
  if (confidence === "MEDIUM") return "#FFB300";
  return "#888";
}

function confidenceBadgeBg(confidence: string): string {
  if (confidence === "HIGH") return `${CSS_VARS.green}18`;
  if (confidence === "MEDIUM") return "#FFB30018";
  return "#88888818";
}

function barColorForStep(step: ProbabilityStep): string {
  if (step.type === "prior") return "#555";
  return step.delta > 0 ? CSS_VARS.green : CSS_VARS.red;
}

function edgeLabel(edge: number): string {
  const abs = Math.abs(edge);
  if (abs > 0.08) return "STRONG \u2014 Standard position";
  if (abs > 0.03) return "MODERATE \u2014 Small position";
  return "WEAK \u2014 No trade";
}

function tokenGradient(symbol: string): string {
  const s = symbol.toUpperCase();
  if (s === "BTC") return "linear-gradient(135deg, #F7931A22 0%, #0f0f0f 60%)";
  if (s === "ETH") return "linear-gradient(135deg, #627EEA22 0%, #0f0f0f 60%)";
  if (s === "SOL") return "linear-gradient(135deg, #9945FF22 0%, #0f0f0f 60%)";
  return `linear-gradient(135deg, ${CSS_VARS.green}12 0%, #0f0f0f 60%)`;
}

function tokenAccent(symbol: string): string {
  const s = symbol.toUpperCase();
  if (s === "BTC") return "#F7931A";
  if (s === "ETH") return "#627EEA";
  if (s === "SOL") return "#9945FF";
  return CSS_VARS.green;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ProbabilityWaterfall({ result, polymarketPrice }: Props) {
  const edge =
    polymarketPrice !== undefined ? result.posterior - polymarketPrice : null;
  const edgeColor = edge !== null && edge > 0 ? CSS_VARS.green : CSS_VARS.red;
  const hasStrongEdge = edge !== null && Math.abs(edge) > 0.05;

  const accent = tokenAccent(result.target.tokenSymbol);

  return (
    <div
      style={{
        fontFamily: CSS_VARS.fontMono,
        color: CSS_VARS.text,
        background: CSS_VARS.bg,
      }}
    >
      {/* Inject keyframes */}
      <style>{KEYFRAMES_CSS}</style>

      {/* ---------------------------------------------------------- */}
      {/*  Target Card                                                */}
      {/* ---------------------------------------------------------- */}
      <div
        style={{
          background: tokenGradient(result.target.tokenSymbol),
          border: `1px solid ${CSS_VARS.cardBorder}`,
          borderRadius: 12,
          padding: "24px 28px",
          marginBottom: 24,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Gradient strip along the top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            background: `linear-gradient(90deg, ${accent}, ${CSS_VARS.green}, ${accent})`,
            backgroundSize: "200% 100%",
            animation: "wf-gradientShift 4s ease infinite",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {/* Left: token symbol + target */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* Large token symbol badge */}
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: `${accent}18`,
                border: `1px solid ${accent}33`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 800,
                color: accent,
                letterSpacing: "-0.02em",
                flexShrink: 0,
              }}
            >
              {result.target.tokenSymbol.slice(0, 4)}
            </div>

            <div>
              <div
                style={{
                  color: CSS_VARS.muted,
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  marginBottom: 4,
                }}
              >
                PREDICTION TARGET
              </div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                {result.target.tokenSymbol}{" "}
                {result.target.direction === "above" ? ">" : "<"} $
                {result.target.strikePrice.toLocaleString()}
              </div>
              <div
                style={{ color: CSS_VARS.muted, fontSize: 12, marginTop: 4 }}
              >
                in {result.target.hoursToExpiry}h &middot; Current: $
                {result.target.currentPrice.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Right: estimate + confidence */}
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                color: CSS_VARS.muted,
                fontSize: 11,
                letterSpacing: "0.08em",
                marginBottom: 4,
              }}
            >
              OUR ESTIMATE
            </div>
            <div
              style={{ fontSize: 38, fontWeight: 700, color: CSS_VARS.green }}
            >
              {(result.posterior * 100).toFixed(1)}%
            </div>
            {/* Confidence badge with icon dot */}
            <div
              style={{
                fontSize: 11,
                padding: "3px 10px",
                borderRadius: 4,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: confidenceBadgeBg(result.confidence),
                color: confidenceColor(result.confidence),
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: confidenceDotColor(result.confidence),
                  animation: "wf-confidenceDotPulse 2s ease-in-out infinite",
                  flexShrink: 0,
                }}
              />
              {result.confidence} CONFIDENCE
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/*  Waterfall Chart                                            */}
      {/* ---------------------------------------------------------- */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            color: CSS_VARS.muted,
            fontSize: 11,
            letterSpacing: "0.08em",
            marginBottom: 14,
          }}
        >
          BAYESIAN UPDATE TRACE
        </div>

        {result.steps.map((step, i) => {
          const barLeft = Math.min(
            step.probabilityBefore,
            step.probabilityAfter,
          );
          const barWidth = Math.abs(step.delta);
          const isPositive = step.delta > 0;
          const color = barColorForStep(step);
          const staggerDelay = i * 300;

          return (
            <div
              key={`${step.label}-${String(i)}`}
              style={{
                display: "grid",
                gridTemplateColumns: "220px 1fr 68px",
                alignItems: "center",
                gap: 12,
                marginBottom: 2,
                padding: "10px 12px",
                borderBottom: `1px solid ${CSS_VARS.cardBorder}`,
                borderRadius: 6,
                opacity: 0,
                animation: `wf-fadeSlideIn 400ms ease-out ${String(staggerDelay)}ms forwards`,
                cursor: "default",
                transition: "background 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  "#ffffff08";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  "transparent";
              }}
            >
              {/* Label */}
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    color: CSS_VARS.text,
                  }}
                >
                  {step.label}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: CSS_VARS.muted,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    transition: "color 0.2s ease",
                  }}
                  title={step.description}
                >
                  {step.description}
                </div>
              </div>

              {/* Bar */}
              <div
                style={{
                  position: "relative",
                  height: 30,
                  background: CSS_VARS.cardBorder,
                  borderRadius: 5,
                  overflow: "hidden",
                }}
              >
                {/* Filled area up to current probability */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    borderRadius: 5,
                    background: "#181818",
                    width: `${String(step.probabilityAfter * 100)}%`,
                    transformOrigin: "left center",
                    animation: `wf-barGrow 600ms ease-out ${String(staggerDelay + 200)}ms forwards`,
                    transform: "scaleX(0)",
                  }}
                />

                {/* Delta highlight */}
                <div
                  style={{
                    position: "absolute",
                    left: `${String(barLeft * 100)}%`,
                    top: 3,
                    height: "calc(100% - 6px)",
                    borderRadius: 3,
                    background: color,
                    opacity: 0.75,
                    width: `${String(Math.max(barWidth * 100, 0.5))}%`,
                    transformOrigin: "left center",
                    animation: `wf-barGrow 600ms ease-out ${String(staggerDelay + 200)}ms forwards`,
                    transform: "scaleX(0)",
                  }}
                />

                {/* Probability marker line with pulse */}
                <div
                  style={{
                    position: "absolute",
                    left: `${String(step.probabilityAfter * 100)}%`,
                    top: 0,
                    width: 2,
                    height: "100%",
                    background: "#fff",
                    borderRadius: 1,
                    animation: `wf-markerPulse 2.4s ease-in-out infinite`,
                    animationDelay: `${String(staggerDelay + 600)}ms`,
                    opacity: 0,
                  }}
                />
              </div>

              {/* Value */}
              <div
                style={{
                  textAlign: "right",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                <span style={{ color }}>
                  {isPositive ? "+" : ""}
                  {(step.delta * 100).toFixed(1)}%
                </span>
                <div
                  style={{
                    fontSize: 11,
                    color: CSS_VARS.muted,
                    fontWeight: 400,
                  }}
                >
                  {(step.probabilityAfter * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ---------------------------------------------------------- */}
      {/*  Edge Comparison Card                                       */}
      {/* ---------------------------------------------------------- */}
      {polymarketPrice !== undefined && edge !== null && (
        <div
          style={{
            background: CSS_VARS.cardBg,
            border: `1px solid ${Math.abs(edge) > 0.03 ? `${edgeColor}44` : CSS_VARS.cardBorder}`,
            borderRadius: 12,
            padding: "20px 24px",
            marginBottom: 24,
            animation: hasStrongEdge
              ? "wf-greenGlow 3s ease-in-out infinite"
              : "none",
          }}
        >
          <div
            style={{
              color: CSS_VARS.muted,
              fontSize: 11,
              letterSpacing: "0.08em",
              marginBottom: 14,
            }}
          >
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
              <div style={{ fontSize: 11, color: CSS_VARS.muted }}>
                Polymarket
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: CSS_VARS.muted,
                }}
              >
                {(polymarketPrice * 100).toFixed(1)}%
              </div>
            </div>
            <div style={{ fontSize: 18, color: "#333" }}>vs</div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: CSS_VARS.muted }}>
                Lantern
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: CSS_VARS.green,
                }}
              >
                {(result.posterior * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 16,
              padding: "12px 16px",
              background: `${edgeColor}0e`,
              borderRadius: 8,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              border: `1px solid ${edgeColor}18`,
            }}
          >
            <span
              style={{ fontSize: 14, color: edgeColor, fontWeight: 700 }}
            >
              Edge: {edge > 0 ? "+" : ""}
              {(edge * 100).toFixed(1)}%
            </span>
            <span style={{ fontSize: 12, color: CSS_VARS.muted }}>
              {edgeLabel(edge)}
            </span>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------- */}
      {/*  Methodology Footer                                        */}
      {/* ---------------------------------------------------------- */}
      <div
        style={{
          color: "#444",
          fontSize: 11,
          lineHeight: 1.7,
          padding: "16px 0 0",
          borderTop: `1px solid ${CSS_VARS.cardBorder}`,
        }}
      >
        <div
          style={{
            marginBottom: 6,
            color: CSS_VARS.muted,
            fontWeight: 600,
            fontSize: 10,
            letterSpacing: "0.08em",
          }}
        >
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
