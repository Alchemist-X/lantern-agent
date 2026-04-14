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
