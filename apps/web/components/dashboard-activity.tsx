"use client";

import type { PublicTrade } from "@lantern/contracts";
import { formatUsd } from "../lib/format";
import { useLocale } from "../lib/locale-context";
import { usePollingJson } from "../lib/use-polling";

function relativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  if (diffMs < 0) {
    return "just now";
  }
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function DashboardActivity({ initialData }: { initialData: PublicTrade[] }) {
  const { t } = useLocale();
  const { data } = usePollingJson("/api/public/trades", initialData);
  const recent = data.slice(0, 8);

  return (
    <section className="dash-panel">
      <div className="dash-panel-head">
        <h2>{t.recent_trades}</h2>
        <div className="dash-panel-meta">
          <span>{t.total_trades(data.length)}</span>
        </div>
      </div>
      {recent.length === 0 ? (
        <p className="dash-empty">{t.no_recent_trades}</p>
      ) : (
        <div className="dash-activity-list">
          {recent.map((trade) => {
            const isBuy = trade.side === "BUY";
            const fillRatio = trade.requested_notional_usd > 0
              ? trade.filled_notional_usd / trade.requested_notional_usd
              : 0;

            return (
              <article key={trade.id} className="dash-activity-row">
                <div className="dash-activity-main">
                  <span className={`dash-side-tag ${isBuy ? "dash-side-buy" : "dash-side-sell"}`}>
                    {trade.side}
                  </span>
                  <div className="dash-activity-info">
                    <strong>{trade.pair_slug}</strong>
                    <span className="dash-activity-detail">
                      {formatUsd(trade.filled_notional_usd)} {t.filled}
                      {trade.avg_price != null ? ` @ ${trade.avg_price.toFixed(3)}` : ""}
                      {fillRatio < 1 ? ` ${t.fill_pct(fillRatio * 100)}` : ""}
                    </span>
                  </div>
                </div>
                <span className="dash-activity-time">{relativeTime(trade.timestamp_utc)}</span>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
