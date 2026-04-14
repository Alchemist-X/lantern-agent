"use client";

interface FundStep {
  readonly number: number;
  readonly name: string;
  readonly description: string;
  readonly protocol: string;
  readonly highlight?: boolean;
}

const STEPS: readonly FundStep[] = [
  {
    number: 1,
    name: "OnchainOS Agentic Wallet",
    description: "Agent 链上身份 · TEE 签名保护 · 15 条 EVM 链 + Solana",
    protocol: "onchainos",
  },
  {
    number: 2,
    name: "Polymarket 账户",
    description: "通过 Agentic Wallet 签名授权存入 USDC 到 Polymarket CLOB",
    protocol: "Polymarket CLOB",
  },
  {
    number: 3,
    name: "Agent 自主决策",
    description: "扫描 81 个市场 · 贝叶斯推理 · 识别定价偏差 · 无需人工确认",
    protocol: "Lantern Engine",
    highlight: true,
  },
  {
    number: 4,
    name: "链上下单",
    description: "FOK 订单 · 真实成交 · TxHash 永久可查",
    protocol: "Polygon 137",
  },
  {
    number: 5,
    name: "X Layer 决策归档",
    description: "每次循环的完整推理日志写入 X Layer (零 Gas)",
    protocol: "X Layer 196",
  },
] as const;

function StepCard({
  step,
  isLast,
}: {
  readonly step: FundStep;
  readonly isLast: boolean;
}) {
  const isHighlight = step.highlight === true;

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          background: isHighlight ? "var(--bg-dungeon)" : "var(--bg-card)",
          border: `1px solid ${isHighlight ? "var(--lantern-orange)" : "var(--bg-border)"}`,
          borderRadius: 12,
          padding: "20px 24px",
          position: "relative",
          boxShadow: isHighlight
            ? "0 0 24px rgba(255,145,0,0.12)"
            : "none",
        }}
      >
        {/* Step number */}
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: isHighlight ? "var(--lantern-orange)" : "var(--lantern-gold)",
            minWidth: 48,
            textAlign: "center",
            fontFamily: "JetBrains Mono, monospace",
            lineHeight: 1,
            opacity: isHighlight ? 1 : 0.7,
          }}
        >
          {step.number}
        </div>

        {/* Center: name + description */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: isHighlight ? "var(--lantern-orange)" : "var(--text-bright)",
              marginBottom: 4,
            }}
          >
            {step.name}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              lineHeight: 1.5,
            }}
          >
            {step.description}
          </div>
        </div>

        {/* Right: protocol badge */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: isHighlight ? "var(--lantern-orange)" : "var(--text-muted)",
            background: isHighlight
              ? "rgba(255,145,0,0.12)"
              : "rgba(255,255,255,0.04)",
            border: `1px solid ${isHighlight ? "rgba(255,145,0,0.3)" : "var(--bg-border)"}`,
            borderRadius: 4,
            padding: "4px 10px",
            fontFamily: "JetBrains Mono, monospace",
            letterSpacing: 0.5,
            flexShrink: 0,
          }}
        >
          {step.protocol}
        </div>

        {/* Lantern glow on highlight */}
        {isHighlight && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: 48,
              transform: "translateY(-50%)",
              width: 80,
              height: 80,
              borderRadius: "50%",
              background:
                "radial-gradient(circle, rgba(255,145,0,0.1) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
        )}
      </div>

      {/* Arrow connector */}
      {!isLast && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "4px 0",
          }}
        >
          <div
            style={{
              width: 2,
              height: 20,
              background: "var(--bg-border)",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: -4,
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "4px solid transparent",
                borderRight: "4px solid transparent",
                borderTop: "6px solid var(--bg-border)",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function ShowcaseFundFlow() {
  return (
    <section className="showcase-section lantern-glow">
      <h2
        style={{
          fontSize: 40,
          fontWeight: 700,
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        资金路径
      </h2>

      <p
        style={{
          fontSize: 15,
          color: "var(--text-muted)",
          textAlign: "center",
          marginBottom: 40,
        }}
      >
        从 Agentic Wallet 到预测市场的完整自主路径
      </p>

      <div
        style={{
          maxWidth: 640,
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        {STEPS.map((step, i) => (
          <StepCard
            key={step.number}
            step={step}
            isLast={i === STEPS.length - 1}
          />
        ))}
      </div>

      <p
        style={{
          fontSize: 13,
          color: "var(--text-dim)",
          textAlign: "center",
          marginTop: 32,
          letterSpacing: 0.5,
        }}
      >
        Polygon USDC &middot; 低 Gas &middot; Agent 全程自动化
      </p>
    </section>
  );
}
