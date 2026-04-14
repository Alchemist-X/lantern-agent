"use client";

import { useInView } from "./use-in-view";

const LINKS = [
  { label: "GitHub", href: "https://github.com/Alchemist-X/lantern-agent" },
  { label: "仪表盘", href: "/probability" },
  { label: "文档", href: "/" },
] as const;

function LanternGlow() {
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {/* Upward glow */}
      <div
        style={{
          position: "absolute",
          top: "-40px",
          left: "50%",
          transform: "translateX(-50%)",
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,145,0,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <svg
        width="48"
        height="48"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "relative", zIndex: 1 }}
      >
        <rect x="24" y="8" width="16" height="4" rx="1" stroke="#FF9100" strokeWidth="2" />
        <line x1="32" y1="4" x2="32" y2="8" stroke="#FF9100" strokeWidth="2" />
        <path
          d="M22 16 C22 12 24 12 32 12 C40 12 42 12 42 16 L44 40 C44 48 40 52 32 52 C24 52 20 48 20 40 Z"
          stroke="#FF9100"
          strokeWidth="2"
          fill="none"
        />
        <ellipse cx="32" cy="30" rx="6" ry="8" stroke="#FF9100" strokeWidth="1" opacity="0.5" />
        <line x1="32" y1="22" x2="32" y2="38" stroke="#FF9100" strokeWidth="1" opacity="0.4" />
        <rect x="26" y="52" width="12" height="4" rx="1" stroke="#FF9100" strokeWidth="2" />
        <line x1="28" y1="56" x2="26" y2="62" stroke="#FF9100" strokeWidth="1" opacity="0.6" />
        <line x1="36" y1="56" x2="38" y2="62" stroke="#FF9100" strokeWidth="1" opacity="0.6" />
      </svg>
    </div>
  );
}

export function ShowcaseFooter() {
  const { ref, inView } = useInView(0.12);

  return (
    <footer
      ref={ref}
      className="showcase-section"
      style={{
        textAlign: "center",
        paddingBottom: 60,
      }}
    >
      {/* Link buttons */}
      <div
        className={inView ? "animate-in" : ""}
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 16,
          marginBottom: 32,
          flexWrap: "wrap",
          opacity: inView ? undefined : 0,
        }}
      >
        {LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target={link.href.startsWith("http") ? "_blank" : undefined}
            rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
            style={{
              display: "inline-block",
              padding: "10px 24px",
              fontSize: 14,
              fontWeight: 600,
              color: "var(--text-bright)",
              background: "var(--bg-card)",
              border: "1px solid var(--bg-border)",
              borderRadius: 8,
              textDecoration: "none",
              transition: "border-color 0.2s ease, background 0.2s ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = "var(--lantern-orange)";
              el.style.background = "var(--bg-dungeon)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.borderColor = "var(--bg-border)";
              el.style.background = "var(--bg-card)";
            }}
          >
            {link.label}
          </a>
        ))}
      </div>

      {/* Tech stack */}
      <p
        className={inView ? "animate-in" : ""}
        style={{
          fontSize: 13,
          color: "var(--text-dim)",
          marginBottom: 8,
          opacity: inView ? undefined : 0,
          animationDelay: "0.15s",
        }}
      >
        TypeScript &middot; Next.js 16 &middot; Fastify 5 &middot; PostgreSQL &middot; BullMQ
      </p>

      {/* Hackathon line */}
      <p
        className={inView ? "animate-in" : ""}
        style={{
          fontSize: 13,
          color: "var(--text-dim)",
          marginBottom: 40,
          opacity: inView ? undefined : 0,
          animationDelay: "0.25s",
        }}
      >
        OKX Build X Hackathon &middot; X Layer Arena &middot; 2026 年 4 月
      </p>

      {/* Lantern */}
      <div
        className={inView ? "animate-in" : ""}
        style={{
          marginBottom: 12,
          opacity: inView ? undefined : 0,
          animationDelay: "0.35s",
        }}
      >
        <LanternGlow />
      </div>

      {/* Caption */}
      <p
        className={inView ? "animate-in" : ""}
        style={{
          fontSize: 13,
          color: "var(--text-dim)",
          margin: 0,
          opacity: inView ? undefined : 0,
          animationDelay: "0.45s",
        }}
      >
        灯笼不灭
      </p>
    </footer>
  );
}
