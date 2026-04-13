"use client";

import type { PublicArtifactListItem } from "@lantern/contracts";
import { usePollingJson } from "../lib/use-polling";
import { formatDate } from "../lib/format";

function formatArtifactKind(kind: PublicArtifactListItem["kind"]): string {
  switch (kind) {
    case "pulse-report":
      return "脉冲报告";
    case "review-report":
      return "复盘报告";
    case "monitor-report":
      return "组合监控";
    case "rebalance-report":
      return "再平衡报告";
    case "resolution-report":
      return "结算跟踪";
    case "backtest-report":
      return "回测报告";
    case "runtime-log":
      return "运行日志";
  }
}

export function ReportsList(props: { initialData: PublicArtifactListItem[]; endpoint: string; title: string; kicker: string }) {
  const { data } = usePollingJson(props.endpoint, props.initialData);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="panel-kicker">{props.kicker}</p>
          <h2>{props.title}</h2>
        </div>
        <div className="table-meta">
          <span>{data.length} artifacts</span>
        </div>
      </div>
      <div className="report-list">
        {data.map((report) => (
          <article key={report.id} className="report-card">
            <span className="badge">{formatArtifactKind(report.kind)}</span>
            <h3>{report.title}</h3>
            <p>{report.path}</p>
            <small>{formatDate(String(report.published_at_utc))}</small>
          </article>
        ))}
        {data.length === 0 ? <p className="empty-state">No artifacts published yet.</p> : null}
      </div>
    </section>
  );
}
