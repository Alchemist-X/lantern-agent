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
        决策公开 · X Layer 链上透明
      </h2>
      <p style={{ textAlign: "center", color: "#8B949E", fontSize: 15, marginBottom: 40 }}>
        Agent 的历史行为和决策依据都上链公开
      </p>

      {/* Core message - one liner */}
      <div style={{
        background: "radial-gradient(ellipse 400px 200px at 50% 50%, rgba(255,145,0,0.06) 0%, transparent 100%)",
        border: "1px solid #FF910030",
        borderRadius: 16,
        padding: "28px 28px",
        marginBottom: 28,
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
      }}>
        <LanternSVG size={40} />
        <div style={{ width: 80, height: 1, background: "#FF910040" }} />
        <p style={{ fontSize: 17, color: "#E0E0E0", lineHeight: 1.6, margin: 0 }}>
          &ldquo;Agent 的历史行为和决策依据都上链公开&rdquo;
        </p>
      </div>

      {/* Decision publication flow */}
      <div style={{
        background: "#0D1117",
        border: "1px solid #30363D",
        borderRadius: 16,
        padding: "28px 28px",
        marginBottom: 28,
      }}>
        <div style={{
          fontSize: 13,
          color: "#EFC851",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 2,
          marginBottom: 20,
          textAlign: "center",
        }}>
          决策公开流程
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Step 1 */}
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{
              width: 28, height: 28, flexShrink: 0,
              borderRadius: 14,
              background: "#FF910020",
              border: "1px solid #FF9100",
              color: "#FF9100",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "JetBrains Mono, monospace",
              fontWeight: 700, fontSize: 13,
            }}>1</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: "#FFF6E2", fontWeight: 600, marginBottom: 6 }}>
                Agent 完成一次 Pulse 分析
              </div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#8B949E", lineHeight: 1.8 }}>
                ├─ 扫描 15 个代币<br />
                ├─ 记录 10 次 Onchainos API 调用<br />
                └─ 贝叶斯推理得出最终概率
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{
              width: 28, height: 28, flexShrink: 0,
              borderRadius: 14,
              background: "#FF910020",
              border: "1px solid #FF9100",
              color: "#FF9100",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "JetBrains Mono, monospace",
              fontWeight: 700, fontSize: 13,
            }}>2</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: "#FFF6E2", fontWeight: 600, marginBottom: 6 }}>
                编码为 JSON (339 字节)
              </div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#8B949E" }}>
                {"{ agent, chain, recommendation, signals, probability }"}
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{
              width: 28, height: 28, flexShrink: 0,
              borderRadius: 14,
              background: "#FF910020",
              border: "1px solid #FF9100",
              color: "#FF9100",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "JetBrains Mono, monospace",
              fontWeight: 700, fontSize: 13,
            }}>3</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: "#FFF6E2", fontWeight: 600, marginBottom: 6 }}>
                调用 onchainos wallet contract-call
              </div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#8B949E" }}>
                发送到 X Layer (chain 196)
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{
              width: 28, height: 28, flexShrink: 0,
              borderRadius: 14,
              background: "#2a9d8f20",
              border: "1px solid #2a9d8f",
              color: "#2a9d8f",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "JetBrains Mono, monospace",
              fontWeight: 700, fontSize: 13,
            }}>4</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: "#FFF6E2", fontWeight: 600, marginBottom: 6 }}>
                永久上链 (零 Gas 费)
              </div>
              <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12, color: "#8B949E", lineHeight: 1.8 }}>
                TxHash: {txHash.slice(0, 10)}...<br />
                <span style={{ color: "#484F58" }}>任何人都可以通过 Explorer 解码验证</span>
              </div>
            </div>
          </div>
        </div>
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
              Polymarket 实盘交易 (示例)
            </div>
            <div style={{ fontSize: 14, color: "#FFF6E2", fontWeight: 600, marginBottom: 8 }}>
              历史真实成交 TxHash
            </div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 11, color: "#8B949E", wordBreak: "break-all", marginBottom: 12 }}>
              {polyTxHash.slice(0, 22)}...
            </div>
            <div style={{ fontSize: 12, color: "#484F58" }}>
              Polygon · 示例真实交易 · 点击查看 ↗
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
