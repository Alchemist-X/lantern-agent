"use client";

import { useInView } from "./use-in-view";

function LanternMini() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="24" y="8" width="16" height="4" rx="1" stroke="#FF9100" strokeWidth="2.5" />
      <line x1="32" y1="4" x2="32" y2="8" stroke="#FF9100" strokeWidth="2.5" />
      <path
        d="M22 16 C22 12 24 12 32 12 C40 12 42 12 42 16 L44 40 C44 48 40 52 32 52 C24 52 20 48 20 40 Z"
        stroke="#FF9100"
        strokeWidth="2.5"
        fill="none"
      />
      <rect x="26" y="52" width="12" height="4" rx="1" stroke="#FF9100" strokeWidth="2.5" />
    </svg>
  );
}

const otherSteps = ["人问 AI", "AI 建议", "人确认", "执行"];
const lanternSteps = [
  "Agent 扫描",
  "Agent 分析",
  "Agent 决策",
  "Agent 执行",
  "Agent 监控",
];

const advantages = [
  {
    title: "推理能力",
    desc: "AI 复杂任务推理接近人类，Onchainos 弥合信息差距",
  },
  {
    title: "秒级响应",
    desc: "Agent 秒级响应 vs 人类 3-5 分钟",
  },
  {
    title: "全天覆盖",
    desc: "7\u00d724 监控数千个市场",
  },
];

export function ShowcaseProblem() {
  const { ref, inView } = useInView(0.1);

  return (
    <section ref={ref} className="showcase-section">
      <h2
        className={inView ? "animate-in" : ""}
        style={{
          fontSize: 40,
          fontWeight: 700,
          textAlign: "center",
          marginBottom: 16,
          opacity: inView ? undefined : 0,
        }}
      >
        为什么需要自主交易 Agent
      </h2>

      <p
        className={inView ? "animate-in" : ""}
        style={{
          fontSize: 17,
          fontStyle: "italic",
          color: "var(--text-main)",
          textAlign: "center",
          marginBottom: 48,
          opacity: inView ? undefined : 0,
          animationDelay: "0.1s",
        }}
      >
        &ldquo;99% 的交易 Agent 是带了 AI 皮肤的按钮&rdquo;
      </p>

      {/* Side-by-side comparison */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          marginBottom: 48,
        }}
      >
        {/* Left: Others */}
        <div
          className={inView ? "animate-slide-left" : ""}
          style={{
            background: "var(--bg-abyss)",
            border: "1px solid var(--bg-border)",
            borderRadius: 12,
            padding: 28,
            opacity: inView ? undefined : 0,
            animationDelay: "0.2s",
          }}
        >
          <div
            style={{
              fontSize: 14,
              color: "var(--text-muted)",
              marginBottom: 20,
              fontWeight: 600,
            }}
          >
            其他 Agent
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {otherSteps.map((step, i) => (
              <div key={step}>
                <div
                  style={{
                    fontSize: 14,
                    color: "var(--text-muted)",
                    padding: "10px 0",
                    animation: inView
                      ? `stepReveal 0.4s ease-out ${0.3 + i * 0.1}s forwards`
                      : undefined,
                    opacity: inView ? 0 : 0,
                  }}
                >
                  {step}
                </div>
                {i < otherSteps.length - 1 && (
                  <div
                    style={{
                      borderLeft: "1px dashed var(--bg-border)",
                      height: 16,
                      marginLeft: 8,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--text-dim)",
              marginTop: 16,
            }}
          >
            4 步, 有人在回路
          </div>
        </div>

        {/* Right: Lantern */}
        <div
          className={inView ? "animate-slide-right" : ""}
          style={{
            background: "var(--bg-dungeon)",
            border: "1px solid rgba(239,200,81,0.25)",
            borderRadius: 12,
            padding: 28,
            opacity: inView ? undefined : 0,
            animationDelay: "0.2s",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 20,
            }}
          >
            <LanternMini />
            <span
              style={{
                fontSize: 14,
                color: "var(--lantern-orange)",
                fontWeight: 600,
              }}
            >
              Lantern Agent
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {lanternSteps.map((step, i) => (
              <div key={step}>
                <div
                  style={{
                    fontSize: 14,
                    color: "var(--text-bright)",
                    padding: "10px 0",
                    animation: inView
                      ? `stepReveal 0.4s ease-out ${0.3 + i * 0.1}s forwards`
                      : undefined,
                    opacity: inView ? 0 : 0,
                  }}
                >
                  {step}
                </div>
                {i < lanternSteps.length - 1 && (
                  <div
                    style={{
                      borderLeft: "2px solid var(--lantern-orange)",
                      height: 16,
                      marginLeft: 8,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          <div
            data-mono=""
            style={{
              fontSize: 12,
              color: "var(--signal-green)",
              marginTop: 16,
            }}
          >
            0 人工步骤
          </div>
        </div>
      </div>

      {/* Advantage cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
          marginBottom: 48,
        }}
      >
        {advantages.map((adv, i) => (
          <div
            key={adv.title}
            className={inView ? "animate-in" : ""}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--bg-border)",
              borderRadius: 10,
              padding: 24,
              opacity: inView ? undefined : 0,
              animationDelay: `${0.4 + i * 0.12}s`,
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "var(--lantern-orange)",
                marginBottom: 8,
              }}
            >
              {adv.title}
            </div>
            <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
              {adv.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom quote */}
      <h3
        className={inView ? "animate-in" : ""}
        style={{
          fontSize: 24,
          fontWeight: 600,
          textAlign: "center",
          color: "var(--text-bright)",
          opacity: inView ? undefined : 0,
          animationDelay: "0.7s",
        }}
      >
        Agent 不再是辅助，而是构建、交易、竞争的主体。
      </h3>
    </section>
  );
}
