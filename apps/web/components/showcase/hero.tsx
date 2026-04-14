"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useInView } from "./use-in-view";

interface TraceData {
  tokensScanned?: number;
  signalsFound?: number;
  buyPicks?: number;
}

function useCountUp(target: number, duration: number, active: boolean) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, active]);

  return value;
}

function LanternSvg() {
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,145,0,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "relative", zIndex: 1 }}
      >
        <rect x="24" y="8" width="16" height="4" rx="1" stroke="#FF9100" strokeWidth="1.5" />
        <line x1="32" y1="4" x2="32" y2="8" stroke="#FF9100" strokeWidth="1.5" />
        <path
          d="M22 16 C22 12 24 12 32 12 C40 12 42 12 42 16 L44 40 C44 48 40 52 32 52 C24 52 20 48 20 40 Z"
          stroke="#FF9100"
          strokeWidth="1.5"
          fill="none"
        />
        <ellipse cx="32" cy="30" rx="6" ry="8" stroke="#FF9100" strokeWidth="1" opacity="0.5" />
        <line x1="32" y1="22" x2="32" y2="38" stroke="#FF9100" strokeWidth="1" opacity="0.4" />
        <rect x="26" y="52" width="12" height="4" rx="1" stroke="#FF9100" strokeWidth="1.5" />
        <line x1="28" y1="56" x2="26" y2="62" stroke="#FF9100" strokeWidth="1" opacity="0.6" />
        <line x1="36" y1="56" x2="38" y2="62" stroke="#FF9100" strokeWidth="1" opacity="0.6" />
      </svg>
    </div>
  );
}

export function ShowcaseHero({ trace }: { trace: TraceData | null }) {
  const { ref, inView } = useInView(0.1);

  const tokensTarget = trace?.tokensScanned ?? 100;
  const signalsTarget = trace?.signalsFound ?? 6;
  const buyTarget = trace?.buyPicks ?? 3;

  const tokens = useCountUp(tokensTarget, 1800, inView);
  const signals = useCountUp(signalsTarget, 1400, inView);
  const buys = useCountUp(buyTarget, 1000, inView);

  return (
    <section
      ref={ref}
      className="showcase-section lantern-glow-strong"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 24,
        paddingTop: 60,
        paddingBottom: 60,
      }}
    >
      <div className={inView ? "animate-in" : ""} style={{ opacity: inView ? undefined : 0 }}>
        <LanternSvg />
      </div>

      <h1
        className={inView ? "animate-in" : ""}
        style={{
          fontSize: 64,
          fontWeight: 700,
          letterSpacing: 10,
          color: "var(--text-bright)",
          lineHeight: 1.2,
          margin: 0,
          opacity: inView ? undefined : 0,
          animationDelay: "0.15s",
        }}
      >
        L A N T E R N
        <br />
        <span style={{ fontSize: 48, letterSpacing: 14 }}>A G E N T</span>
      </h1>

      <p
        className={inView ? "animate-in" : ""}
        style={{
          fontSize: 17,
          color: "var(--text-muted)",
          maxWidth: 520,
          margin: "0 auto",
          lineHeight: 1.7,
          opacity: inView ? undefined : 0,
          animationDelay: "0.3s",
        }}
      >
        用链上数据，在预测市场找到别人看不到的 Edge
      </p>

      <div
        className={inView ? "animate-in" : ""}
        style={{
          display: "flex",
          gap: 24,
          marginTop: 32,
          flexWrap: "wrap",
          justifyContent: "center",
          opacity: inView ? undefined : 0,
          animationDelay: "0.45s",
        }}
      >
        <StatCard label="Tokens Scanned" value={tokens} />
        <StatCard label="Signals Found" value={signals} />
        <StatCard label="BUY Picks" value={buys} variant="green" />
      </div>

      <p
        className={inView ? "animate-in" : ""}
        style={{
          fontSize: 13,
          color: "var(--text-dim)",
          marginTop: 40,
          opacity: inView ? undefined : 0,
          animationDelay: "0.6s",
        }}
      >
        X Layer &middot; Onchainos &middot; 贝叶斯推理引擎
      </p>

      <p
        className={inView ? "animate-in" : ""}
        style={{
          fontSize: 13,
          color: "var(--text-dim)",
          opacity: inView ? undefined : 0,
          animationDelay: "0.7s",
        }}
      >
        &mdash;&mdash; OKX Build X Hackathon &middot; X Layer Arena &mdash;&mdash;
      </p>

      <div
        style={{
          marginTop: 32,
          fontSize: 24,
          color: "var(--text-dim)",
          animation: "floatDown 2s ease-in-out infinite",
        }}
      >
        &#8595;
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant?: "green";
}) {
  const isGreen = variant === "green";
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: `1px solid ${isGreen ? "var(--signal-green)" : "var(--bg-border)"}`,
        borderRadius: 12,
        padding: "20px 32px",
        minWidth: 160,
        animation: "lanternIgnite 1.2s ease-out forwards",
      }}
    >
      <div
        data-mono=""
        style={{
          fontSize: 36,
          fontWeight: 700,
          color: isGreen ? "var(--signal-green)" : "var(--lantern-orange)",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 13,
          color: "var(--text-muted)",
          marginTop: 8,
          letterSpacing: 0.5,
        }}
      >
        {label}
      </div>
    </div>
  );
}
