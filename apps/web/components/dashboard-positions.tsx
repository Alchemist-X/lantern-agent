"use client";

import type { PublicPosition } from "@lantern/contracts";
import {
  calculatePositionCostBasisUsd,
  calculatePositionUnrealizedPnlPct,
  calculatePositionUnrealizedPnlUsd,
  calculatePositionWeightPct,
  calculatePortfolioMarketValueUsd
} from "../lib/account-metrics";
import { formatPct, formatUsd } from "../lib/format";
import { useLocale } from "../lib/locale-context";
import { usePollingJson } from "../lib/use-polling";

function timeHeld(openedAt: string): string {
  const now = Date.now();
  const opened = new Date(openedAt).getTime();
  const diffMs = now - opened;
  if (diffMs < 0) {
    return "just now";
  }
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) {
    const minutes = Math.floor(diffMs / 60000);
    return minutes < 1 ? "< 1m" : `${minutes}m`;
  }
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

export function DashboardPositions({ initialData, totalEquityUsd }: { initialData: PublicPosition[]; totalEquityUsd: number }) {
  const { t } = useLocale();
  const { data } = usePollingJson("/api/public/positions", initialData);
  const marketValueUsd = calculatePortfolioMarketValueUsd(data);
  const profitableCount = data.filter((p) => calculatePositionUnrealizedPnlUsd(p) >= 0).length;

  return (
    <section className="dash-panel">
      <div className="dash-panel-head">
        <h2>{t.positions_title}</h2>
        <div className="dash-panel-meta">
          <span>{t.positions_open(data.length)}</span>
          <span className="dash-positive">{t.positions_profitable(profitableCount)}</span>
          <span>{formatUsd(marketValueUsd)} {t.market_value}</span>
        </div>
      </div>
      {data.length === 0 ? (
        <p className="dash-empty">{t.no_open_positions}</p>
      ) : (
        <div className="dash-table-wrap">
          <table className="dash-table">
            <thead>
              <tr>
                <th>{t.col_market}</th>
                <th>{t.col_side}</th>
                <th>{t.col_shares}</th>
                <th>{t.col_entry}</th>
                <th>{t.col_current}</th>
                <th>{t.col_cost_basis}</th>
                <th>{t.col_value}</th>
                <th>{t.col_unreal_pnl}</th>
                <th>{t.col_pnl_pct}</th>
                <th>{t.col_weight}</th>
                <th>{t.col_held}</th>
              </tr>
            </thead>
            <tbody>
              {data.map((position) => {
                const pnlUsd = calculatePositionUnrealizedPnlUsd(position);
                const pnlPct = calculatePositionUnrealizedPnlPct(position);
                const costBasis = calculatePositionCostBasisUsd(position);
                const weight = calculatePositionWeightPct(position, totalEquityUsd);
                const isProfit = pnlUsd >= 0;

                return (
                  <tr key={position.id}>
                    <td data-label={t.col_market}>
                      <strong className="dash-cell-title">{position.pair_slug}</strong>
                      <span className="dash-cell-sub">{position.side}</span>
                    </td>
                    <td data-label={t.col_side}>{position.side}</td>
                    <td data-label={t.col_shares}>{position.size.toFixed(2)}</td>
                    <td data-label={t.col_entry}>{position.avg_cost.toFixed(3)}</td>
                    <td data-label={t.col_current}>{position.current_price.toFixed(3)}</td>
                    <td data-label={t.col_cost_basis}>{formatUsd(costBasis)}</td>
                    <td data-label={t.col_value}>{formatUsd(position.current_value_usd)}</td>
                    <td data-label={t.col_unreal_pnl} className={isProfit ? "dash-positive" : "dash-negative"}>
                      {isProfit ? "+" : ""}{formatUsd(pnlUsd)}
                    </td>
                    <td data-label={t.col_pnl_pct} className={isProfit ? "dash-positive" : "dash-negative"}>
                      {isProfit ? "+" : ""}{formatPct(pnlPct)}
                    </td>
                    <td data-label={t.col_weight}>{formatPct(weight)}</td>
                    <td data-label={t.col_held}>{timeHeld(position.opened_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
