"use client";

import { useLocale } from "../lib/locale-context";

export function DashboardThesis() {
  const { t } = useLocale();

  return (
    <section className="dash-panel dash-thesis">
      <h2>{t.thesis_title}</h2>
      <p>{t.thesis_intro}</p>
      <div className="dash-thesis-points">
        <div className="dash-thesis-point">
          <strong>{t.thesis_point_1_title}</strong>
          <span>{t.thesis_point_1_body}</span>
        </div>
        <div className="dash-thesis-point">
          <strong>{t.thesis_point_2_title}</strong>
          <span>{t.thesis_point_2_body}</span>
        </div>
        <div className="dash-thesis-point">
          <strong>{t.thesis_point_3_title}</strong>
          <span>{t.thesis_point_3_body}</span>
        </div>
      </div>
    </section>
  );
}
