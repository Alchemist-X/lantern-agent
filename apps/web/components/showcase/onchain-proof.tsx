"use client";
import { useInView } from "./use-in-view";

// Lantern SVG inline
const LanternSVG = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#FF9100" strokeWidth="1.5" style={{ filter: "drop-shadow(0 0 6px #FF910040)" }}>
    <path d="M10 2h4v2h-4z" />
    <path d="M8 4Q6 8 6 14Q6 16 8 16H16Q18 16 18 14Q18 8 16 4Z" />
    <line x1="7" y1="8" x2="17" y2="8" />
    <line x1="6.5" y1="12" x2="17.5" y2="12" />
    <path d="M9 16v2h6v-2" />
  </svg>
);

export function ShowcaseOnchainProof() {
  const { ref, inView } = useInView();

  const txHash = "0x3787e3c8b68263cf0e834d99883912d8b20ec5aeea18d131afd5c9e0ef5974ee";
  const polyTxHash = "0x23872647d57ac1165a503fd1d954f14d618d895068e3aa339762c30615f3f490";
  const wallet = "0xb266dd8d835e3388d0eaf0bf7efff3bb732dfed6";

  return (
    <div ref={ref} style={{ opacity: inView ? 1 : 0, transition: "opacity 0.5s ease" }}>
      <h2 style={{ fontFamily: "Cinzel, serif", fontSize: 40, color: "#FFF6E2", marginBottom: 8, textAlign: "center" }}>
        链上可验证
      </h2>
      <p style={{ textAlign: "center", color: "#8B949E", fontSize: 15, marginBottom: 40 }}>
        每一个决策都写在 X Layer 上——零 Gas 费，永久可查
      </p>

      {/* Core message */}
      <div style={{
        background: "radial-gradient(ellipse 400px 250px at 50% 30%, rgba(255,145,0,0.06) 0%, transparent 100%)",
        border: "1px solid #FF910030",
        borderRadius: 16,
        padding: "32px 28px",
        marginBottom: 28,
        textAlign: "center",
      }}>
        <LanternSVG size={48} />
        <div style={{ fontSize: 22, fontWeight: 700, color: "#FFF6E2", marginTop: 16, marginBottom: 8, fontFamily: "Cinzel, serif" }}>
          为什么在 X Layer 上？
        </div>
        <p style={{ fontSize: 17, color: "#E0E0E0", lineHeight: 1.8, maxWidth: 600, margin: "0 auto" }}>
          Agent 每 60 秒将决策日志以 JSON 写入 X Layer。
          <br />
          因为<span style={{ color: "#FF9100", fontWeight: 700 }}>零 Gas 费</span>，
          这种高频写入在其他链上成本不可持续，
          <br />
          但在 X Layer 上<span style={{ color: "#2a9d8f", fontWeight: 700 }}>完全免费</span>。
        </p>
        <p style={{ fontSize: 15, color: "#8B949E", marginTop: 16 }}>
          这是<span style={{ color: "#EFC851" }}>链上 AI 审计</span>——只有零 Gas 链才能支撑的应用模式
        </p>
      </div>

      {/* Three proof cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 28 }}>
        {/* Card 1: X Layer Decision Log */}
        <a href={`https://www.okx.com/web3/explorer/xlayer/tx/${txHash}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
          <div style={{
            background: "#1C2128",
            border: "1px solid #2a9d8f40",
            borderRadius: 12,
            padding: "20px 16px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}>
            <div style={{ fontSize: 12, color: "#2a9d8f", fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
              X Layer 决策日志
            </div>
            <div style={{ fontSize: 14, color: "#FFF6E2", fontWeight: 600, marginBottom: 8 }}>
              Agent 推理结果上链
            </div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#8B949E", wordBreak: "break-all", marginBottom: 12 }}>
              {txHash.slice(0, 22)}...
            </div>
            <div style={{ fontSize: 12, color: "#484F58" }}>
              339 字节 · 零 Gas · 点击查看 ↗
            </div>
          </div>
        </a>

        {/* Card 2: Polymarket Trade */}
        <a href={`https://polygonscan.com/tx/${polyTxHash}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
          <div style={{
            background: "#1C2128",
            border: "1px solid #EFC85140",
            borderRadius: 12,
            padding: "20px 16px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}>
            <div style={{ fontSize: 12, color: "#EFC851", fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
              Polymarket 实盘交易
            </div>
            <div style={{ fontSize: 14, color: "#FFF6E2", fontWeight: 600, marginBottom: 8 }}>
              $1 → 8.33 YES 股
            </div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#8B949E", wordBreak: "break-all", marginBottom: 12 }}>
              {polyTxHash.slice(0, 22)}...
            </div>
            <div style={{ fontSize: 12, color: "#484F58" }}>
              MSTR BTC 市场 · Polygon · 点击查看 ↗
            </div>
          </div>
        </a>

        {/* Card 3: Agentic Wallet */}
        <a href={`https://www.okx.com/web3/explorer/xlayer/address/${wallet}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
          <div style={{
            background: "#1C2128",
            border: "1px solid #FF910030",
            borderRadius: 12,
            padding: "20px 16px",
            cursor: "pointer",
            transition: "all 0.2s",
          }}>
            <div style={{ fontSize: 12, color: "#FF9100", fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>
              Agentic Wallet
            </div>
            <div style={{ fontSize: 14, color: "#FFF6E2", fontWeight: 600, marginBottom: 8 }}>
              Agent 的链上身份
            </div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#8B949E", wordBreak: "break-all", marginBottom: 12 }}>
              {wallet.slice(0, 22)}...
            </div>
            <div style={{ fontSize: 12, color: "#484F58" }}>
              X Layer · 零 Gas · 点击查看 ↗
            </div>
          </div>
        </a>
      </div>

      {/* What's on-chain */}
      <div style={{
        background: "#161B22",
        borderRadius: 12,
        padding: "20px 24px",
        border: "1px solid #30363D",
      }}>
        <div style={{ fontSize: 13, color: "#8B949E", fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>
          链上决策记录内容
        </div>
        <pre style={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 12,
          color: "#E0E0E0",
          background: "#0D1117",
          padding: 16,
          borderRadius: 8,
          overflow: "auto",
          lineHeight: 1.6,
        }}>
{`{
  "agent": "lantern",
  "chain": "xlayer-196",
  "recommendation": {
    "token": "XDOG",
    "probability": 0.773,
    "signals": 4
  },
  "polymarkets": {
    "scanned": 81,
    "withEdge": 1
  }
}`}
        </pre>
        <p style={{ fontSize: 13, color: "#484F58", marginTop: 12 }}>
          任何人都可以在 X Layer Explorer 中解码 input data 验证上述内容
        </p>
      </div>
    </div>
  );
}
