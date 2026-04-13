import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Lantern Agent — Autonomous DEX Trading Agent on X Layer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 40%, #16213e 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#ffffff",
          padding: "60px 80px",
        }}
      >
        {/* Top badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "40px",
            padding: "8px 20px",
            borderRadius: "24px",
            border: "1px solid rgba(56, 189, 248, 0.3)",
            background: "rgba(56, 189, 248, 0.08)",
            fontSize: "18px",
            color: "#38bdf8",
            letterSpacing: "0.05em",
          }}
        >
          AUTONOMOUS DEX TRADING AGENT ON X LAYER
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "36px",
            color: "#e2e8f0",
            textAlign: "center",
            lineHeight: 1.6,
            maxWidth: "900px",
            fontWeight: 500,
          }}
        >
          AI autonomous trading on X Layer DEX
        </div>
        <div
          style={{
            fontSize: "28px",
            color: "#94a3b8",
            textAlign: "center",
            lineHeight: 1.6,
            maxWidth: "900px",
            marginTop: "12px",
          }}
        >
          Token pair discovery. Kelly Criterion sizing.
        </div>

        {/* Bottom stats */}
        <div
          style={{
            display: "flex",
            gap: "48px",
            marginTop: "48px",
            fontSize: "16px",
            color: "#64748b",
            letterSpacing: "0.05em",
          }}
        >
          <div style={{ display: "flex", gap: "8px" }}>
            <span style={{ color: "#22c55e" }}>LIVE</span>
            <span>TRADING</span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <span>24/7</span>
            <span>AUTONOMOUS</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
