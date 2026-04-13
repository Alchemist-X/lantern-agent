"use client";

import Link from "next/link";
import type { PublicRunSummary } from "@lantern/contracts";
import { formatDate, formatUsd } from "../lib/format";
import { usePollingJson } from "../lib/use-polling";

function formatRunStatus(status: PublicRunSummary["status"]): string {
  switch (status) {
    case "awaiting-approval":
      return "Awaiting approval";
    default:
      return status;
  }
}

export function LiveRuns({ initialData }: { initialData: PublicRunSummary[] }) {
  const { data } = usePollingJson("/api/public/runs", initialData);
  const awaitingCount = data.filter((run) => run.status === "awaiting-approval").length;

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="panel-kicker">Runs</p>
          <h2>Decision cycles</h2>
        </div>
        <div className="table-meta">
          <span>{data.length} runs</span>
          <span>{awaitingCount} awaiting approval</span>
        </div>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Generated</th>
              <th>Runtime</th>
              <th>Mode</th>
              <th>Status</th>
              <th>Bankroll</th>
              <th>Decisions</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {data.map((run) => (
              <tr key={run.id}>
                <td data-label="Generated">{formatDate(run.generated_at_utc)}</td>
                <td data-label="Runtime">{run.runtime}</td>
                <td data-label="Mode">{run.mode}</td>
                <td data-label="Status">{formatRunStatus(run.status)}</td>
                <td data-label="Bankroll">{formatUsd(run.bankroll_usd)}</td>
                <td data-label="Decisions">{run.decision_count}</td>
                <td data-label="Detail">
                  <Link href={`/runs/${run.id}`} className="action-link">
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
