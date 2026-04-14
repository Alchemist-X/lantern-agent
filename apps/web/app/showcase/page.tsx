"use client";

import { useEffect, useState } from "react";
import { ShowcaseHero } from "../../components/showcase/hero";
import { ShowcaseProblem } from "../../components/showcase/problem";
import { ShowcaseExplainer } from "../../components/showcase/explainer";
import { ShowcaseArchitecture } from "../../components/showcase/architecture";
import { ShowcaseSkillCards } from "../../components/showcase/skill-cards";
import { ShowcaseLiveDemo } from "../../components/showcase/live-demo";
import { ShowcaseEdge } from "../../components/showcase/edge";
import { ShowcaseFooter } from "../../components/showcase/footer";
import "./showcase.css";

export default function ShowcasePage() {
  const [trace, setTrace] = useState<Record<string, unknown> | null>(null);

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

  return (
    <div className="showcase">
      <ShowcaseHero trace={trace} />
      <ShowcaseExplainer />
      <ShowcaseProblem />
      <ShowcaseArchitecture />
      <ShowcaseSkillCards />
      <ShowcaseLiveDemo trace={trace} />
      <ShowcaseEdge trace={trace} />
      <ShowcaseFooter />
    </div>
  );
}
