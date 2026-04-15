"use client";

import { useEffect, useState, useCallback } from "react";
import { ShowcaseHero } from "../../components/showcase/hero";
import { ShowcaseProblem } from "../../components/showcase/problem";
import { ShowcaseExplainer } from "../../components/showcase/explainer";
import { ShowcaseArchitecture } from "../../components/showcase/architecture";
import { ShowcaseSkillCards } from "../../components/showcase/skill-cards";
import { ShowcaseLiveDemo } from "../../components/showcase/live-demo";
import { ShowcaseFundFlow } from "../../components/showcase/fund-flow";
import { ShowcaseMarketCards } from "../../components/showcase/market-cards";
import { ShowcaseOnchainProof } from "../../components/showcase/onchain-proof";
import "./showcase.css";

export default function ShowcasePage() {
  const [trace, setTrace] = useState<Record<string, unknown> | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 9;

  useEffect(() => {
    const load = () => {
      fetch("/api/demo-trace")
        .then((r) => (r.ok ? r.json() : null))
        .then(setTrace)
        .catch(() => {});
    };
    load();
    const i = setInterval(load, 30000);
    return () => clearInterval(i);
  }, []);

  const goNext = useCallback(
    () => setCurrentSlide((s) => Math.min(s + 1, totalSlides - 1)),
    [],
  );
  const goPrev = useCallback(
    () => setCurrentSlide((s) => Math.max(s - 1, 0)),
    [],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev]);

  const slides = [
    <ShowcaseHero key={0} trace={trace} />,
    <ShowcaseExplainer key={1} />,
    <ShowcaseFundFlow key={2} />,
    <ShowcaseProblem key={3} />,
    <ShowcaseArchitecture key={4} />,
    <ShowcaseSkillCards key={5} />,
    <ShowcaseMarketCards key={6} trace={trace} />,
    <ShowcaseLiveDemo key={7} trace={trace} />,
    <ShowcaseOnchainProof key={8} />,
  ];

  return (
    <div
      className="showcase"
      style={{ height: "100vh", overflow: "hidden", position: "relative" }}
    >
      {/* Current slide */}
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "opacity 0.3s ease",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 1000,
            padding: "0 24px",
            overflowY: "auto",
            maxHeight: "90vh",
          }}
        >
          {slides[currentSlide]}
        </div>
      </div>

      {/* Vertical dot indicators on right side */}
      <div
        style={{
          position: "fixed",
          right: 24,
          top: "50%",
          transform: "translateY(-50%)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          alignItems: "center",
          zIndex: 100,
        }}
      >
        {slides.map((_, i) => {
          const active = i === currentSlide;
          return (
            <div
              key={String(i)}
              onClick={() => setCurrentSlide(i)}
              style={{
                width: active ? 12 : 6,
                height: active ? 12 : 6,
                borderRadius: "50%",
                background: active ? "#FF9100" : "#30363D",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: active ? "0 0 8px rgba(255,145,0,0.5)" : "none",
              }}
            />
          );
        })}
      </div>

      {/* Scroll hint - only on first slide */}
      {currentSlide === 0 && (
        <div
          style={{
            position: "fixed",
            right: 56,
            bottom: 24,
            fontSize: 12,
            color: "#8B949E",
            fontFamily: "Inter, sans-serif",
            letterSpacing: 1,
            display: "flex",
            alignItems: "center",
            gap: 8,
            zIndex: 100,
            animation: "scrollHintPulse 2s ease-in-out infinite",
          }}
        >
          <span>Press &rarr; to continue</span>
        </div>
      )}

      <style>{`
        @keyframes scrollHintPulse {
          0%, 100% { opacity: 0.5; transform: translateX(0); }
          50% { opacity: 1; transform: translateX(-4px); }
        }
      `}</style>
    </div>
  );
}
