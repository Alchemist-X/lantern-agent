"use client";

import { useInView } from "./use-in-view";

function LanternSmall() {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="24" y="8" width="16" height="4" rx="1" stroke="#FF9100" strokeWidth="2" />
      <line x1="32" y1="4" x2="32" y2="8" stroke="#FF9100" strokeWidth="2" />
      <path
        d="M22 16 C22 12 24 12 32 12 C40 12 42 12 42 16 L44 40 C44 48 40 52 32 52 C24 52 20 48 20 40 Z"
        stroke="#FF9100"
        strokeWidth="2"
        fill="none"
      />
      <rect x="26" y="52" width="12" height="4" rx="1" stroke="#FF9100" strokeWidth="2" />
    </svg>
  );
}

export function ShowcaseExplainer() {
  const { ref, inView } = useInView(0.12);

  return (
    <section ref={ref} className="showcase-section lantern-glow">
      <h2
        className={inView ? "animate-in" : ""}
        style={{
          fontSize: 40,
          fontWeight: 700,
          textAlign: "center",
          marginBottom: 40,
          opacity: inView ? undefined : 0,
        }}
      >
        我们做了什么
      </h2>

      <div
        className={inView ? "animate-in" : ""}
        style={{
          fontSize: 17,
          lineHeight: 1.8,
          color: "var(--text-main)",
          maxWidth: 720,
          margin: "0 auto 48px",
          opacity: inView ? undefined : 0,
          animationDelay: "0.15s",
        }}
      >
        <p style={{ marginBottom: 20 }}>
          Lantern Agent 利用 Onchainos
          链上数据技能（聪明钱追踪、代币分析、安全扫描、价格数据），让 AI
          自主评估预测市场中事件发生的概率。
        </p>
        <p>
          当 Agent 计算出的概率与市场定价存在偏差时——这就是
          Edge——Agent 自动下单。
        </p>
      </div>

      {/* StS2 Comic-style Comparison Panels */}
      <style>{`
        .sts-panel-row {
          display: flex;
          gap: 16px;
          max-width: 960px;
          margin: 0 auto 40px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .sts-panel {
          flex: 1 1 280px;
          min-width: 280px;
          max-width: 320px;
          height: 260px;
          background: linear-gradient(180deg, #1a1a2e 0%, #0D1117 100%);
          border: 2px solid #EFC851;
          border-radius: 8px;
          padding: 20px 16px 16px;
          position: relative;
          box-shadow:
            inset 0 0 20px rgba(239,200,81,0.05),
            0 4px 16px rgba(0,0,0,0.4),
            0 0 24px rgba(255,145,0,0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
        }
        .sts-panel::before {
          content: "";
          position: absolute;
          inset: 4px;
          border: 1px solid rgba(239,200,81,0.2);
          border-radius: 4px;
          pointer-events: none;
        }
        .sts-panel-caption {
          font-size: 14px;
          font-weight: 700;
          color: #EFC851;
          text-align: center;
          letter-spacing: 1px;
          margin-top: 8px;
          text-shadow: 0 0 8px rgba(255,145,0,0.25);
        }
        .sts-svg-wrap {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
        }
        .sts-stroke {
          stroke: #FFF6E2;
          stroke-width: 2.5;
          stroke-linecap: round;
          stroke-linejoin: round;
          fill: none;
          filter: drop-shadow(0 0 4px rgba(255,145,0,0.15));
        }
        .sts-stroke-accent {
          stroke: #FF9100;
          stroke-width: 3;
          stroke-linecap: round;
          stroke-linejoin: round;
          fill: none;
          filter: drop-shadow(0 0 6px rgba(255,145,0,0.5));
        }
        .sts-stroke-dim {
          stroke: rgba(255,246,226,0.5);
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          fill: none;
        }
        .sts-text {
          fill: #EFC851;
          font-family: var(--font-mono, monospace);
          font-size: 14px;
          font-weight: 700;
        }
        .sts-text-dim {
          fill: rgba(255,246,226,0.6);
          font-family: var(--font-mono, monospace);
          font-size: 11px;
        }
        @media (max-width: 720px) {
          .sts-panel {
            max-width: 100%;
          }
        }
      `}</style>

      <div
        className={`sts-panel-row ${inView ? "animate-in" : ""}`}
        style={{
          opacity: inView ? undefined : 0,
          animationDelay: "0.2s",
        }}
      >
        {/* Card 1: 推理能力趋近人类 */}
        <div className="sts-panel">
          <div className="sts-svg-wrap">
            <svg viewBox="0 0 280 160" width="100%" height="160">
              <defs>
                <radialGradient id="glow1">
                  <stop offset="0%" stopColor="#FF9100" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#FF9100" stopOpacity="0" />
                </radialGradient>
              </defs>
              {/* Human on left */}
              <g transform="translate(10,20)">
                <circle cx="35" cy="50" r="11" className="sts-stroke" />
                <path d="M35 61 L35 95" className="sts-stroke" />
                <path d="M35 70 L20 85" className="sts-stroke" />
                <path d="M35 70 L50 85" className="sts-stroke" />
                <path d="M35 95 L24 118" className="sts-stroke" />
                <path d="M35 95 L46 118" className="sts-stroke" />
                {/* thought bubble with chart */}
                <path
                  d="M50 10 Q75 5 88 20 Q92 35 78 40 Q62 42 52 32 Q46 22 50 10 Z"
                  className="sts-stroke"
                />
                <path d="M58 28 L62 22 L66 26 L70 18 L74 24 L78 20" className="sts-stroke-accent" />
                <circle cx="48" cy="42" r="1.8" className="sts-stroke" />
                <circle cx="44" cy="47" r="1.2" className="sts-stroke" />
              </g>

              {/* ≈ sign */}
              <text x="140" y="80" textAnchor="middle" className="sts-text" fontSize="28">≈</text>

              {/* Agent (lantern) on right */}
              <g transform="translate(180,20)">
                <circle cx="50" cy="40" r="28" fill="url(#glow1)" />
                <rect x="38" y="26" width="24" height="30" rx="3" className="sts-stroke-accent" />
                <path d="M50 22 L50 26" className="sts-stroke" />
                <circle cx="50" cy="41" r="5" className="sts-stroke-accent" />
                <path d="M50 56 L50 92" className="sts-stroke" />
                <path d="M50 68 L32 84" className="sts-stroke" />
                <path d="M50 68 L68 84" className="sts-stroke" />
                <path d="M50 92 L38 118" className="sts-stroke" />
                <path d="M50 92 L62 118" className="sts-stroke" />
                {/* bigger thought bubble */}
                <path
                  d="M70 5 Q100 0 112 18 Q118 38 100 44 Q80 46 68 32 Q62 18 70 5 Z"
                  className="sts-stroke"
                />
                <path d="M76 26 L80 18 L84 24 L88 14 L92 22 L96 16 L100 22" className="sts-stroke-accent" />
                <circle cx="78" cy="32" r="1.5" className="sts-stroke" />
                <circle cx="92" cy="32" r="1.5" className="sts-stroke" />
                <circle cx="66" cy="48" r="1.5" className="sts-stroke" />
              </g>
            </svg>
          </div>
          <div className="sts-panel-caption">推理能力趋近人类</div>
        </div>

        {/* Card 2: 7x24 覆盖数千市场 */}
        <div className="sts-panel">
          <div className="sts-svg-wrap">
            <svg viewBox="0 0 280 160" width="100%" height="160">
              <defs>
                <radialGradient id="glow2">
                  <stop offset="0%" stopColor="#FF9100" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#FF9100" stopOpacity="0" />
                </radialGradient>
              </defs>
              {/* Sleeping human */}
              <g transform="translate(5,30)">
                <circle cx="30" cy="50" r="11" className="sts-stroke-dim" />
                <path d="M30 61 L30 90" className="sts-stroke-dim" />
                <path d="M30 70 L15 80" className="sts-stroke-dim" />
                <path d="M30 70 L45 80" className="sts-stroke-dim" />
                <path d="M30 90 L20 112" className="sts-stroke-dim" />
                <path d="M30 90 L40 112" className="sts-stroke-dim" />
                {/* Zs */}
                <text x="48" y="30" className="sts-text" fontSize="14">Z</text>
                <text x="56" y="42" className="sts-text" fontSize="11">z</text>
                <text x="62" y="52" className="sts-text" fontSize="9">z</text>
                {/* closed eye */}
                <path d="M26 48 L30 50" className="sts-stroke-dim" />
              </g>

              {/* Agent in middle */}
              <g transform="translate(95,30)">
                <circle cx="30" cy="40" r="28" fill="url(#glow2)" />
                <rect x="18" y="26" width="24" height="30" rx="3" className="sts-stroke-accent" />
                <path d="M30 22 L30 26" className="sts-stroke" />
                <circle cx="30" cy="41" r="5" className="sts-stroke-accent" />
                <path d="M30 56 L30 92" className="sts-stroke" />
                <path d="M30 68 L12 82" className="sts-stroke" />
                <path d="M30 68 L48 82" className="sts-stroke" />
                <path d="M30 92 L18 115" className="sts-stroke" />
                <path d="M30 92 L42 115" className="sts-stroke" />
              </g>

              {/* Radiating lines to grid */}
              <path d="M145 55 L195 30" className="sts-stroke-accent" strokeDasharray="3 3" />
              <path d="M145 70 L195 60" className="sts-stroke-accent" strokeDasharray="3 3" />
              <path d="M145 90 L195 100" className="sts-stroke-accent" strokeDasharray="3 3" />
              <path d="M145 105 L195 130" className="sts-stroke-accent" strokeDasharray="3 3" />

              {/* 4x4 market grid */}
              <g transform="translate(200,22)">
                {Array.from({ length: 16 }).map((_, i) => {
                  const col = i % 4;
                  const row = Math.floor(i / 4);
                  return (
                    <rect
                      key={i}
                      x={col * 18}
                      y={row * 28}
                      width="14"
                      height="20"
                      rx="2"
                      className="sts-stroke"
                      opacity={0.6 + (i % 3) * 0.15}
                    />
                  );
                })}
              </g>
            </svg>
          </div>
          <div className="sts-panel-caption">7×24 覆盖数千市场</div>
        </div>

        {/* Card 3: 秒级响应 vs 分钟级延迟 */}
        <div className="sts-panel">
          <div className="sts-svg-wrap">
            <svg viewBox="0 0 280 160" width="100%" height="160">
              <defs>
                <radialGradient id="glow3">
                  <stop offset="0%" stopColor="#FF9100" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#FF9100" stopOpacity="0" />
                </radialGradient>
              </defs>
              {/* Lightning bolt */}
              <g transform="translate(8,20)">
                <path
                  d="M22 0 L8 36 L20 36 L14 62 L32 24 L20 24 L26 0 Z"
                  className="sts-stroke-accent"
                  fill="rgba(255,145,0,0.15)"
                />
              </g>

              {/* 1s label + arrow to Agent */}
              <text x="60" y="30" className="sts-text" fontSize="13">1s</text>
              <path d="M52 38 L95 45" className="sts-stroke-accent" />
              <path d="M90 40 L95 45 L90 50" className="sts-stroke-accent" />

              {/* Agent (fast arrival) */}
              <g transform="translate(100,20)">
                <circle cx="25" cy="30" r="22" fill="url(#glow3)" />
                <rect x="15" y="18" width="20" height="26" rx="3" className="sts-stroke-accent" />
                <path d="M25 15 L25 18" className="sts-stroke" />
                <circle cx="25" cy="31" r="4" className="sts-stroke-accent" />
                <path d="M25 44 L25 72" className="sts-stroke" />
                <path d="M25 54 L12 66" className="sts-stroke" />
                <path d="M25 54 L38 66" className="sts-stroke" />
                <path d="M25 72 L15 92" className="sts-stroke" />
                <path d="M25 72 L35 92" className="sts-stroke" />
                {/* speed lines */}
                <path d="M-5 28 L8 28" className="sts-stroke-accent" />
                <path d="M-8 36 L6 36" className="sts-stroke-accent" />
                <path d="M-5 44 L8 44" className="sts-stroke-accent" />
              </g>

              {/* 3min+ dotted arrow */}
              <text x="180" y="30" className="sts-text-dim" fontSize="12">3min+</text>
              <path d="M175 40 L218 50" className="sts-stroke-dim" strokeDasharray="4 4" />
              <path d="M213 45 L218 50 L213 55" className="sts-stroke-dim" />

              {/* Slow human */}
              <g transform="translate(220,25)">
                <circle cx="22" cy="30" r="10" className="sts-stroke-dim" />
                <path d="M22 40 L22 72" className="sts-stroke-dim" />
                <path d="M22 50 L10 64" className="sts-stroke-dim" />
                <path d="M22 50 L34 64" className="sts-stroke-dim" />
                <path d="M22 72 L14 95" className="sts-stroke-dim" />
                <path d="M22 72 L30 95" className="sts-stroke-dim" />
              </g>
            </svg>
          </div>
          <div className="sts-panel-caption">秒级响应 vs 分钟级延迟</div>
        </div>
      </div>

      {/* Pipeline visualization - how Lantern thinks */}
      <div style={{
        background: "var(--bg-dungeon)",
        border: "1px solid var(--bg-border)",
        borderRadius: 16,
        padding: "24px 28px",
        margin: "32px auto",
        maxWidth: 720,
      }}>
        <div style={{
          fontSize: 12,
          color: "var(--text-dim)",
          textTransform: "uppercase",
          letterSpacing: 2,
          marginBottom: 20,
          textAlign: "center",
        }}>
          Agent 推理管线 · 约 30 秒 / 循环
        </div>

        {[
          { time: "00s", icon: "\u{1F50D}", name: "扫描市场", detail: "onchainos 抓取 100+ 代币 · 聪明钱信号 · 安全元数据" },
          { time: "10s", icon: "\u{1F4CA}", name: "聚合数据", detail: "价格 + K线 + 持有者分布 + 巨鲸动向 + 蜜罐检测" },
          { time: "20s", icon: "\u{1F9E0}", name: "贝叶斯推理", detail: "先验概率 50% → 信号逐步更新 → 最终概率 + 置信度" },
          { time: "30s", icon: "\u{1F4DC}", name: "决策归档", detail: "推荐 BUY/SKIP · JSON 写入 X Layer (零 Gas)" },
        ].map((step, i) => (
          <div key={step.time} style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "10px 0",
            borderBottom: i < 3 ? "1px solid var(--bg-border)" : "none",
          }}>
            <div data-mono="" style={{
              fontSize: 12,
              color: "var(--lantern-gold)",
              width: 40,
              flexShrink: 0,
            }}>
              [{step.time}]
            </div>
            <div style={{
              fontSize: 20,
              width: 32,
              textAlign: "center",
              flexShrink: 0,
            }}>
              {step.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-bright)",
              }}>
                {step.name}
              </div>
              <div style={{
                fontSize: 12,
                color: "var(--text-muted)",
                marginTop: 2,
              }}>
                {step.detail}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edge explanation box */}
      <div
        className={inView ? "animate-in" : ""}
        style={{
          background: "var(--bg-dungeon)",
          border: "1px solid var(--bg-border)",
          borderRadius: 16,
          padding: "40px 24px",
          maxWidth: 640,
          margin: "0 auto 48px",
          opacity: inView ? undefined : 0,
          animationDelay: "0.3s",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 32,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                marginBottom: 6,
              }}
            >
              市场说
            </div>
            <div
              data-mono=""
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "var(--text-muted)",
              }}
            >
              58%
            </div>
          </div>

          <div style={{ opacity: 0.6 }}>
            <LanternSmall />
          </div>

          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 13,
                color: "var(--text-muted)",
                marginBottom: 6,
              }}
            >
              Agent 说
            </div>
            <div
              data-mono=""
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "var(--signal-green)",
              }}
            >
              72%
            </div>
          </div>
        </div>

        <div
          data-mono=""
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "var(--lantern-gold)",
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          72% &minus; 58% = 14% Edge
        </div>

        <p
          style={{
            fontSize: 14,
            color: "var(--text-muted)",
            textAlign: "center",
            margin: 0,
          }}
        >
          这 14% 就是链上数据能照亮的利润空间
        </p>
      </div>

      <p
        className={inView ? "animate-in" : ""}
        style={{
          fontSize: 14,
          color: "var(--text-dim)",
          textAlign: "center",
          letterSpacing: 1,
          opacity: inView ? undefined : 0,
          animationDelay: "0.45s",
        }}
      >
        同时跟踪数十个市场 &middot; 每 60 秒重新评估 &middot; 7&times;24 不间断
      </p>
    </section>
  );
}
