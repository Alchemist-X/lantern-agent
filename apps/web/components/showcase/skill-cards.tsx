"use client";

import { useInView } from "./use-in-view";

interface SkillData {
  readonly name: string;
  readonly onchainos: string;
  readonly commands: number;
  readonly description: string;
  readonly signalType: "Signal" | "Data" | "Power";
}

const SKILLS: readonly SkillData[] = [
  { name: "代币发现", onchainos: "okx-dex-token", commands: 13, description: "热门代币·价格·风险·持有者", signalType: "Signal" },
  { name: "聪明钱信号", onchainos: "okx-dex-signal", commands: 5, description: "鲸鱼·KOL·聚合买入信号", signalType: "Signal" },
  { name: "安全扫描", onchainos: "okx-security", commands: 5, description: "蜜罐检测·交易预检·授权审查", signalType: "Data" },
  { name: "市场数据", onchainos: "okx-dex-market", commands: 9, description: "实时价格·K线·PnL追踪", signalType: "Data" },
  { name: "聚合交易", onchainos: "okx-dex-swap", commands: 6, description: "500+ DEX源·报价·执行", signalType: "Signal" },
  { name: "链上网关", onchainos: "okx-onchain-gateway", commands: 6, description: "Gas估算·交易模拟·广播", signalType: "Power" },
  { name: "钱包管理", onchainos: "okx-agentic-wallet", commands: 16, description: "余额·转账·签名·历史", signalType: "Data" },
] as const;

function signalColor(type: SkillData["signalType"]): string {
  switch (type) {
    case "Signal":
      return "var(--signal-green)";
    case "Data":
      return "var(--block-blue)";
    case "Power":
      return "var(--lantern-orange)";
  }
}

function LanternMini({ color }: { readonly color: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="24" y="8" width="16" height="4" rx="1" stroke={color} strokeWidth="3" />
      <line x1="32" y1="4" x2="32" y2="8" stroke={color} strokeWidth="3" />
      <path
        d="M22 16 C22 12 24 12 32 12 C40 12 42 12 42 16 L44 40 C44 48 40 52 32 52 C24 52 20 48 20 40 Z"
        stroke={color}
        strokeWidth="3"
        fill="none"
      />
      <rect x="26" y="52" width="12" height="4" rx="1" stroke={color} strokeWidth="3" />
    </svg>
  );
}

function SkillCard({
  skill,
  delay,
  visible,
}: {
  readonly skill: SkillData;
  readonly delay: number;
  readonly visible: boolean;
}) {
  const color = signalColor(skill.signalType);

  return (
    <div
      className={visible ? "animate-in" : ""}
      style={{
        width: 170,
        height: 240,
        background: "var(--bg-card)",
        border: "1px solid #EFC85130",
        borderRadius: 12,
        padding: "16px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        cursor: "default",
        transition: "transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
        opacity: visible ? undefined : 0,
        animationDelay: `${String(delay)}ms`,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(-6px)";
        el.style.borderColor = "#EFC851";
        el.style.boxShadow = "0 8px 24px rgba(239,200,81,0.12)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget;
        el.style.transform = "translateY(0)";
        el.style.borderColor = "#EFC85130";
        el.style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", justifyContent: "center" }}>
        <LanternMini color={color} />
      </div>

      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "var(--text-bright)",
          textAlign: "center",
        }}
      >
        {skill.name}
      </div>

      <div
        data-mono=""
        style={{
          fontSize: 12,
          color: "var(--text-muted)",
          textAlign: "center",
        }}
      >
        {skill.onchainos}
      </div>

      <div
        data-mono=""
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: "var(--lantern-gold)",
          textAlign: "center",
        }}
      >
        {skill.commands} 命令
      </div>

      <div
        style={{
          fontSize: 12,
          color: "var(--text-muted)",
          textAlign: "center",
          flex: 1,
        }}
      >
        {skill.description}
      </div>

      {/* Signal bar */}
      <div
        style={{
          height: 4,
          borderRadius: 2,
          background: "linear-gradient(90deg, #e63946, #484F58, #2a9d8f)",
          opacity: 0.6,
        }}
      />
    </div>
  );
}

export function ShowcaseSkillCards() {
  const { ref, inView } = useInView(0.1);

  const filled = 7;
  const total = 14;

  return (
    <section ref={ref} className="showcase-section lantern-glow-strong">
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
        你的灯笼 &mdash; 7 盏灯，7 个维度
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
        7 个 Onchainos 技能 &middot; 60 条命令 &middot; 完整交易管线
      </p>

      {/* Card grid: 4 top + 3 bottom centered */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          marginBottom: 48,
        }}
      >
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          {SKILLS.slice(0, 4).map((skill, i) => (
            <SkillCard key={skill.onchainos} skill={skill} delay={i * 150} visible={inView} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          {SKILLS.slice(4).map((skill, i) => (
            <SkillCard key={skill.onchainos} skill={skill} delay={(i + 4) * 150} visible={inView} />
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div
        className={inView ? "animate-in" : ""}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          opacity: inView ? undefined : 0,
          animationDelay: "1.2s",
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          {Array.from({ length: total }, (_, i) => (
            <div
              key={String(i)}
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: i < filled ? "var(--lantern-orange)" : "var(--bg-border)",
              }}
            />
          ))}
        </div>
        <p
          style={{
            fontSize: 13,
            color: "var(--text-muted)",
            margin: 0,
          }}
        >
          7/14 技能已集成 &middot; 5 个扩展管线可用
        </p>
      </div>
    </section>
  );
}
