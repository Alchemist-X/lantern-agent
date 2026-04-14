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
import "./showcase.css";

export default function ShowcasePage() {
  const [trace, setTrace] = useState<Record<string, unknown> | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 8;

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

      {/* Navigation bar fixed at bottom */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "linear-gradient(transparent, #0D1117)",
          zIndex: 100,
        }}
      >
        <button
          onClick={goPrev}
          disabled={currentSlide === 0}
          style={{
            background: "none",
            border: "1px solid #30363D",
            color: currentSlide === 0 ? "#484F58" : "#E0E0E0",
            padding: "8px 20px",
            borderRadius: 8,
            cursor: currentSlide === 0 ? "default" : "pointer",
            fontFamily: "Inter, sans-serif",
            fontSize: 14,
          }}
        >
          &larr; 上一页
        </button>

        {/* Dot indicators */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {slides.map((_, i) => (
            <div
              key={String(i)}
              onClick={() => setCurrentSlide(i)}
              style={{
                width: i === currentSlide ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === currentSlide ? "#FF9100" : "#30363D",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            />
          ))}
          <span
            style={{
              marginLeft: 12,
              fontSize: 12,
              color: "#484F58",
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            {currentSlide + 1} / {slides.length}
          </span>
        </div>

        <button
          onClick={goNext}
          disabled={currentSlide === totalSlides - 1}
          style={{
            background:
              currentSlide === totalSlides - 1 ? "none" : "#FF910020",
            border: `1px solid ${currentSlide === totalSlides - 1 ? "#30363D" : "#FF910050"}`,
            color: currentSlide === totalSlides - 1 ? "#484F58" : "#FF9100",
            padding: "8px 20px",
            borderRadius: 8,
            cursor:
              currentSlide === totalSlides - 1 ? "default" : "pointer",
            fontFamily: "Inter, sans-serif",
            fontSize: 14,
          }}
        >
          下一页 &rarr;
        </button>
      </div>
    </div>
  );
}
