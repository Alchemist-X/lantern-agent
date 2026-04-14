"use client";

import { useInView } from "./use-in-view";

const CYCLE_NODES = ["扫描", "分析", "决策", "执行"] as const;

const LAYERS = [
  {
    label: "L1 市场发现",
    skills: ["onchainos token", "signal", "security"],
  },
  {
    label: "L2 决策引擎",
    skills: ["Kelly 公式", "持仓审查", "风控"],
  },
  {
    label: "L3 交易执行",
    skills: ["swap", "gateway", "wallet"],
  },
  {
    label: "L4 状态存储",
    skills: ["PostgreSQL", "Next.js", "归档"],
  },
] as const;

function Badge({ text }: { readonly text: string }) {
  return (
    <span
      data-mono=""
      style={{
        display: "inline-block",
        fontSize: 10,
        color: "var(--text-muted)",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid var(--bg-border)",
        borderRadius: 4,
        padding: "2px 6px",
        margin: 2,
      }}
    >
      {text}
    </span>
  );
}

export function ShowcaseArchitecture() {
  const { ref, inView } = useInView(0.12);

  return (
    <section ref={ref} className="showcase-section lantern-glow">
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
        工作原理
      </h2>

      <p
        className={inView ? "animate-in" : ""}
        style={{
          fontSize: 17,
          color: "var(--text-muted)",
          textAlign: "center",
          marginBottom: 48,
          opacity: inView ? undefined : 0,
          animationDelay: "0.1s",
        }}
      >
        每 60 秒，完成一个完整循环
      </p>

      {/* Cycle visualization */}
      <div
        className={inView ? "animate-in" : ""}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
          marginBottom: 16,
          flexWrap: "wrap",
          opacity: inView ? undefined : 0,
          animationDelay: "0.2s",
        }}
      >
        {CYCLE_NODES.map((node, i) => (
          <div
            key={node}
            style={{ display: "flex", alignItems: "center" }}
          >
            <div
              style={{
                width: 80,
                height: 80,
                border: "2px solid var(--lantern-orange)",
                borderRadius: 12,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 600,
                color: "var(--text-bright)",
              }}
            >
              {node}
            </div>
            {i < CYCLE_NODES.length - 1 && (
              <div
                style={{
                  width: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--lantern-orange)",
                  fontSize: 20,
                }}
              >
                &rarr;
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Curved return arrow with "60 秒" label */}
      <div
        className={inView ? "animate-in" : ""}
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 48,
          opacity: inView ? undefined : 0,
          animationDelay: "0.25s",
        }}
      >
        <div
          style={{
            width: 360,
            height: 40,
            borderBottom: "2px dashed var(--lantern-gold)",
            borderLeft: "2px dashed var(--lantern-gold)",
            borderRight: "2px dashed var(--lantern-gold)",
            borderRadius: "0 0 20px 20px",
            position: "relative",
          }}
        >
          <span
            data-mono=""
            style={{
              position: "absolute",
              bottom: -10,
              left: "50%",
              transform: "translateX(-50%)",
              background: "var(--bg-abyss)",
              padding: "0 12px",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--lantern-gold)",
            }}
          >
            60 秒
          </span>
          {/* Left arrow tip */}
          <span
            style={{
              position: "absolute",
              top: -6,
              left: -2,
              color: "var(--lantern-gold)",
              fontSize: 14,
            }}
          >
            &#9650;
          </span>
        </div>
      </div>

      {/* 4 layer cards */}
      <div
        className={inView ? "animate-in" : ""}
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 48,
          opacity: inView ? undefined : 0,
          animationDelay: "0.35s",
        }}
      >
        {LAYERS.map((layer) => (
          <div
            key={layer.label}
            style={{
              width: 150,
              background: "var(--bg-card)",
              border: "1px solid var(--bg-border)",
              borderRadius: 10,
              padding: "16px 12px",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--text-bright)",
                marginBottom: 10,
              }}
            >
              {layer.label}
            </div>
            <div>
              {layer.skills.map((skill) => (
                <Badge key={skill} text={skill} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom tagline */}
      <p
        className={inView ? "animate-in" : ""}
        style={{
          fontSize: 14,
          color: "var(--signal-green)",
          textAlign: "center",
          letterSpacing: 0.5,
          opacity: inView ? undefined : 0,
          animationDelay: "0.45s",
        }}
      >
        &#9889; X Layer &middot; 零 Gas &middot; 500+ DEX &middot; 60 秒循环
      </p>
    </section>
  );
}
