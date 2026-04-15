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
import { ShowcasePulseDetail } from "../../components/showcase/pulse-detail";
import { ShowcaseOnchainProof } from "../../components/showcase/onchain-proof";
import "./showcase.css";

export default function ShowcasePage() {
  const [trace, setTrace] = useState<Record<string, unknown> | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 10;

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
    <ShowcasePulseDetail key={7} trace={trace} />,
    <ShowcaseLiveDemo key={8} trace={trace} />,
    <ShowcaseOnchainProof key={9} />,
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
          className="slide-content"
          style={{
            width: "100%",
            maxWidth: 1000,
            padding: "0 24px",
            overflowY: "auto",
            maxHeight: "90vh",
            scrollbarWidth: "none",
          }}
        >
          {slides[currentSlide]}
        </div>
      </div>

      {/* Left arrow button */}
      <button
        onClick={goPrev}
        disabled={currentSlide === 0}
        aria-label="上一页"
        style={{
          position: "fixed",
          left: 24,
          top: "50%",
          transform: "translateY(-50%)",
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "rgba(28, 33, 40, 0.6)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 145, 0, 0.2)",
          color: currentSlide === 0 ? "#484F58" : "#FFF6E2",
          fontSize: 24,
          cursor: currentSlide === 0 ? "default" : "pointer",
          opacity: currentSlide === 0 ? 0.3 : 0.7,
          transition: "all 0.25s ease",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onMouseEnter={(e) => {
          if (currentSlide === 0) return;
          e.currentTarget.style.opacity = "1";
          e.currentTarget.style.background = "rgba(255, 145, 0, 0.15)";
          e.currentTarget.style.borderColor = "rgba(255, 145, 0, 0.5)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = currentSlide === 0 ? "0.3" : "0.7";
          e.currentTarget.style.background = "rgba(28, 33, 40, 0.6)";
          e.currentTarget.style.borderColor = "rgba(255, 145, 0, 0.2)";
        }}
      >
        &larr;
      </button>

      {/* Right arrow button */}
      <button
        onClick={goNext}
        disabled={currentSlide === totalSlides - 1}
        aria-label="下一页"
        style={{
          position: "fixed",
          right: 24,
          top: "50%",
          transform: "translateY(-50%)",
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "rgba(28, 33, 40, 0.6)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 145, 0, 0.2)",
          color: currentSlide === totalSlides - 1 ? "#484F58" : "#FFF6E2",
          fontSize: 24,
          cursor: currentSlide === totalSlides - 1 ? "default" : "pointer",
          opacity: currentSlide === totalSlides - 1 ? 0.3 : 0.7,
          transition: "all 0.25s ease",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onMouseEnter={(e) => {
          if (currentSlide === totalSlides - 1) return;
          e.currentTarget.style.opacity = "1";
          e.currentTarget.style.background = "rgba(255, 145, 0, 0.15)";
          e.currentTarget.style.borderColor = "rgba(255, 145, 0, 0.5)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity =
            currentSlide === totalSlides - 1 ? "0.3" : "0.7";
          e.currentTarget.style.background = "rgba(28, 33, 40, 0.6)";
          e.currentTarget.style.borderColor = "rgba(255, 145, 0, 0.2)";
        }}
      >
        &rarr;
      </button>

      {/* Horizontal dot indicators at bottom center */}
      <div style={{
        position: "fixed",
        bottom: 32,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: 12,
        alignItems: "center",
        zIndex: 100,
        padding: "10px 20px",
        background: "rgba(13, 17, 22, 0.6)",
        backdropFilter: "blur(8px)",
        borderRadius: 20,
        border: "1px solid rgba(48, 54, 61, 0.4)",
      }}>
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            aria-label={`Go to slide ${i + 1}`}
            style={{
              width: i === currentSlide ? 24 : 8,
              height: 8,
              borderRadius: i === currentSlide ? 4 : "50%",
              background: i === currentSlide ? "#FF9100" : "#30363D",
              boxShadow: i === currentSlide ? "0 0 8px rgba(255,145,0,0.5)" : "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          />
        ))}
        <span style={{
          marginLeft: 8,
          fontSize: 11,
          color: "#484F58",
          fontFamily: "JetBrains Mono, monospace",
        }}>
          {currentSlide + 1} / {slides.length}
        </span>
      </div>

      <style>{`
        .slide-content::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
