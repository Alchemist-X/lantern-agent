"use client";

import type { PublicPosition } from "@lantern/contracts";
import type { SpectatorClosedPosition } from "../lib/public-wallet";
import {
  calculatePortfolioCostBasisUsd,
  calculatePortfolioMarketValueUsd,
  calculatePortfolioUnrealizedPnlPct,
  calculatePortfolioUnrealizedPnlUsd,
  calculatePositionUnrealizedPnlUsd,
  getTopPositionsByContribution
} from "../lib/account-metrics";
import { formatPct, formatUsd } from "../lib/format";
import { useLocale } from "../lib/locale-context";
import { usePollingJson } from "../lib/use-polling";

export function DashboardPnlSummary({
  initialPositions,
  initialClosedPositions
}: {
  initialPositions: PublicPosition[];
  initialClosedPositions: SpectatorClosedPosition[];
}) {
  const { t } = useLocale();
  const { data: positions } = usePollingJson("/api/public/positions", initialPositions);
  const { data: closedPositions } = usePollingJson<SpectatorClosedPosition[]>(
    "/api/public/closed-positions",
    initialClosedPositions
  );

  const marketValue = calculatePortfolioMarketValueUsd(positions);
  const costBasis = calculatePortfolioCostBasisUsd(positions);
  const unrealizedPnl = calculatePortfolioUnrealizedPnlUsd(positions);
  const unrealizedPnlPct = calculatePortfolioUnrealizedPnlPct(positions);
  const realizedPnl = closedPositions.reduce((sum, p) => sum + p.realized_pnl_usd, 0);
  const netPnl = realizedPnl + unrealizedPnl;
  const topPositions = getTopPositionsByContribution(positions, 5);

  return (
    <section className="dash-panel">
      <div className="dash-panel-head">
        <h2>{t.pnl_summary_title}</h2>
      </div>
      <div className="dash-pnl-grid">
        <div className="dash-pnl-card">
          <span>{t.net_pnl}</span>
          <strong className={netPnl >= 0 ? "dash-positive" : "dash-negative"}>
            {netPnl >= 0 ? "+" : ""}{formatUsd(netPnl)}
          </strong>
        </div>
        <div className="dash-pnl-card">
          <span>{t.unrealized}</span>
          <strong className={unrealizedPnl >= 0 ? "dash-positive" : "dash-negative"}>
            {unrealizedPnl >= 0 ? "+" : ""}{formatUsd(unrealizedPnl)}
          </strong>
          <small>{formatPct(unrealizedPnlPct)}</small>
        </div>
        <div className="dash-pnl-card">
          <span>{t.realized}</span>
          <strong className={realizedPnl >= 0 ? "dash-positive" : "dash-negative"}>
            {realizedPnl >= 0 ? "+" : ""}{formatUsd(realizedPnl)}
          </strong>
          <small>{t.closed_markets(closedPositions.length)}</small>
        </div>
        <div className="dash-pnl-card">
          <span>{t.cost_basis}</span>
          <strong>{formatUsd(costBasis)}</strong>
        </div>
        <div className="dash-pnl-card">
          <span>{t.market_value_label}</span>
          <strong>{formatUsd(marketValue)}</strong>
        </div>
      </div>
      {topPositions.length > 0 ? (
        <div className="dash-top-movers">
          <h3>{t.top_movers}</h3>
          <div className="dash-movers-list">
            {topPositions.map((position) => {
              const pnl = calculatePositionUnrealizedPnlUsd(position);
              const isProfit = pnl >= 0;
              return (
                <div key={position.id} className="dash-mover-row">
                  <div className="dash-mover-info">
                    <strong>{position.pair_slug}</strong>
                    <span>{position.side}</span>
                  </div>
                  <strong className={isProfit ? "dash-positive" : "dash-negative"}>
                    {isProfit ? "+" : ""}{formatUsd(pnl)}
                  </strong>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
