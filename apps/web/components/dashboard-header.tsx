"use client";

import type { OverviewResponse } from "@lantern/contracts";
import { formatPct, formatUsd } from "../lib/format";
import { useLocale } from "../lib/locale-context";
import { usePollingJson } from "../lib/use-polling";

function statusColor(status: OverviewResponse["status"]): string {
  switch (status) {
    case "running":
      return "dash-status-running";
    case "paused":
      return "dash-status-paused";
    case "halted":
      return "dash-status-halted";
    default:
      return "";
  }
}

export function DashboardHeader({ initialData }: { initialData: OverviewResponse }) {
  const { t } = useLocale();
  const { data, error } = usePollingJson("/api/public/overview", initialData);

  const pnlUsd = data.total_equity_usd - data.high_water_mark_usd;
  const pnlIsPositive = pnlUsd >= 0;

  function statusLabel(status: OverviewResponse["status"]): string {
    switch (status) {
      case "running":
        return t.status_running;
      case "paused":
        return t.status_paused;
      case "halted":
        return t.status_halted;
      default:
        return status;
    }
  }

  function relativeTime(isoString: string | null): string {
    if (!isoString) {
      return t.na;
    }
    const now = Date.now();
    const then = new Date(isoString).getTime();
    const diffMs = now - then;
    if (diffMs < 0) {
      return t.just_now;
    }
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) {
      return t.just_now;
    }
    if (minutes < 60) {
      return t.minutes_ago(minutes);
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return t.hours_ago(hours);
    }
    const days = Math.floor(hours / 24);
    return t.days_ago(days);
  }

  return (
    <header className="dash-header">
      <div className="dash-header-row">
        <div className="dash-kpi">
          <div className="dash-kpi-item dash-kpi-equity">
            <span className="dash-kpi-label">{t.total_equity}</span>
            <strong className="dash-kpi-value">{formatUsd(data.total_equity_usd)}</strong>
          </div>
          <div className="dash-kpi-item">
            <span className="dash-kpi-label">{t.cash}</span>
            <strong className="dash-kpi-value">{formatUsd(data.cash_balance_usd)}</strong>
          </div>
          <div className="dash-kpi-item">
            <span className="dash-kpi-label">{t.hwm}</span>
            <strong className="dash-kpi-value">{formatUsd(data.high_water_mark_usd)}</strong>
          </div>
          <div className="dash-kpi-item">
            <span className="dash-kpi-label">{t.drawdown}</span>
            <strong className={`dash-kpi-value ${data.drawdown_pct > 0 ? "dash-negative" : ""}`}>
              {formatPct(data.drawdown_pct)}
            </strong>
          </div>
          <div className="dash-kpi-item">
            <span className="dash-kpi-label">{t.vs_hwm}</span>
            <strong className={`dash-kpi-value ${pnlIsPositive ? "dash-positive" : "dash-negative"}`}>
              {pnlIsPositive ? "+" : ""}{formatUsd(pnlUsd)}
            </strong>
          </div>
          <div className="dash-kpi-item">
            <span className="dash-kpi-label">{t.open_positions}</span>
            <strong className="dash-kpi-value">{data.open_positions}</strong>
          </div>
        </div>
        <div className="dash-status-group">
          <div className={`dash-status-badge ${statusColor(data.status)}`}>
            <span className="dash-status-dot" />
            {statusLabel(data.status)}
          </div>
          <span className="dash-last-update">
            {error ? `Error: ${error}` : `${t.updated} ${relativeTime(data.last_run_at)}`}
          </span>
        </div>
      </div>
    </header>
  );
}
