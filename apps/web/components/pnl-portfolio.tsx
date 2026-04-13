"use client";

import type { OverviewResponse, PublicPosition, PublicTrade } from "@lantern/contracts";
import { usePollingJson } from "../lib/use-polling";
import type { SpectatorClosedPosition } from "../lib/public-wallet";
import {
  calculatePortfolioCostBasisUsd,
  calculatePortfolioMarketValueUsd,
  calculatePortfolioUnrealizedPnlPct,
  calculatePortfolioUnrealizedPnlUsd,
  calculatePositionCostBasisUsd,
  calculatePositionUnrealizedPnlPct,
  calculatePositionUnrealizedPnlUsd,
  calculatePositionWeightPct,
  getRecentTrades,
  getTopPositionsByContribution
} from "../lib/account-metrics";
import { formatDate, formatPct, formatUsd } from "../lib/format";

function MetricCard(props: { label: string; value: string; note?: string; accent?: "positive" | "negative" | "neutral" }) {
  return (
    <div className={`metric-card ${props.accent ?? "neutral"}`}>
      <span>{props.label}</span>
      <strong>{props.value}</strong>
      {props.note ? <small>{props.note}</small> : null}
    </div>
  );
}

function PositionRow({ position, totalEquityUsd }: { position: PublicPosition; totalEquityUsd: number }) {
  const pnlUsd = calculatePositionUnrealizedPnlUsd(position);
  const pnlPct = calculatePositionUnrealizedPnlPct(position);
  const costBasisUsd = calculatePositionCostBasisUsd(position);
  const weightPct = calculatePositionWeightPct(position, totalEquityUsd);

  return (
    <tr>
      <td data-label="市场">
        <strong>{position.pair_slug}</strong>
        <div className="table-subline">{position.side}</div>
      </td>
      <td data-label="成本基准">{formatUsd(costBasisUsd)}</td>
      <td data-label="当前价值">{formatUsd(position.current_value_usd)}</td>
      <td data-label="未实现 P&L" className={pnlUsd >= 0 ? "positive" : "negative"}>{formatUsd(pnlUsd)}</td>
      <td data-label="P&L %" className={pnlPct >= 0 ? "positive" : "negative"}>{formatPct(pnlPct)}</td>
      <td data-label="占比">{formatPct(weightPct)}</td>
    </tr>
  );
}

export function PnlPortfolio(props: {
  initialOverview: OverviewResponse;
  initialPositions: PublicPosition[];
  initialTrades: PublicTrade[];
  initialClosedPositions?: SpectatorClosedPosition[];
  spectatorMode?: boolean;
  detailed?: boolean;
}) {
  const { data: overview } = usePollingJson("/api/public/overview", props.initialOverview);
  const { data: positions } = usePollingJson("/api/public/positions", props.initialPositions);
  const { data: trades } = usePollingJson("/api/public/trades", props.initialTrades);
  const { data: closedPositions } = usePollingJson<SpectatorClosedPosition[]>(
    "/api/public/closed-positions",
    props.initialClosedPositions ?? []
  );

  const totalEquityUsd = overview.total_equity_usd;
  const marketValueUsd = calculatePortfolioMarketValueUsd(positions);
  const costBasisUsd = calculatePortfolioCostBasisUsd(positions);
  const unrealizedPnlUsd = calculatePortfolioUnrealizedPnlUsd(positions);
  const unrealizedPnlPct = calculatePortfolioUnrealizedPnlPct(positions);
  const realizedPnlUsd = closedPositions.reduce((sum, position) => sum + position.realized_pnl_usd, 0);
  const netPnlUsd = realizedPnlUsd + unrealizedPnlUsd;
  const profitablePositions = positions.filter((position) => calculatePositionUnrealizedPnlUsd(position) >= 0).length;
  const recentTrades = getRecentTrades(trades, props.detailed ? 6 : 3);
  const topPositions = getTopPositionsByContribution(positions, props.detailed ? 8 : 4);
  const costCoveragePct = marketValueUsd > 0 ? costBasisUsd / marketValueUsd : 0;

  return (
    <section className="panel pnl-panel">
      <div className="panel-header">
        <div>
          <p className="panel-kicker">P&L</p>
          <h2>{props.spectatorMode ? "公开钱包 P&L 快照" : "按市价计的组合快照"}</h2>
        </div>
        <span className="badge">{props.spectatorMode ? "X Layer DEX 公共数据" : "按当前成本口径计算"}</span>
      </div>

      <p className="panel-note">
        {props.spectatorMode
          ? "未实现 P&L 来自当前公开价格，已实现 P&L 来自 closed-position 记录。账户总额会尽量把 cash 也并进来，但 bridge 资金历史仍不是完整公开的。"
          : "未实现 P&L 来自当前价格与平均成本的差值；这个页面暂时不单独展示已实现部分。"}
      </p>

      <div className="metric-grid metric-grid-primary">
        <MetricCard
          label={props.spectatorMode ? "账户总额" : "总净值"}
          value={formatUsd(totalEquityUsd)}
          note={props.spectatorMode ? "持仓市值 + 可见 cash" : "当前组合价值"}
        />
        <MetricCard
          label="净 P&L"
          value={formatUsd(netPnlUsd)}
          note={props.spectatorMode ? "已实现 + 未实现" : `${profitablePositions} 个仓位为正`}
          accent={netPnlUsd >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          label="未实现 P&L"
          value={formatUsd(unrealizedPnlUsd)}
          note={formatPct(unrealizedPnlPct)}
          accent={unrealizedPnlUsd >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          label="已实现 P&L"
          value={formatUsd(realizedPnlUsd)}
          note={`${closedPositions.length} 个已平仓市场`}
          accent={realizedPnlUsd >= 0 ? "positive" : "negative"}
        />
      </div>

      <div className="metric-strip">
        <div className="metric-pill">
          <span>成本基准</span>
          <strong>{formatUsd(costBasisUsd)}</strong>
          <small>未平仓持仓的开仓成本</small>
        </div>
        <div className="metric-pill">
          <span>持仓市值</span>
          <strong>{formatUsd(marketValueUsd)}</strong>
          <small>按当前价格计算的持仓价值</small>
        </div>
        <div className="metric-pill">
          <span>持仓数量</span>
          <strong>{positions.length}</strong>
          <small>{profitablePositions} 个仓位为正</small>
        </div>
        <div className="metric-pill">
          <span>覆盖率</span>
          <strong>{formatPct(costCoveragePct)}</strong>
          <small>成本基准相对持仓市值</small>
        </div>
      </div>

      <div className="split-board">
        <div className="mini-stack">
          <div className="mini-stack-header">
            <div>
              <p className="panel-kicker">贡献来源</p>
              <h3>按 P&L 影响排序的仓位</h3>
            </div>
          </div>
          <div className="mini-list">
            {topPositions.map((position) => {
              const pnlUsd = calculatePositionUnrealizedPnlUsd(position);
              const pnlPct = calculatePositionUnrealizedPnlPct(position);
              return (
                <article key={position.id} className="mini-row">
                  <div>
                    <strong>{position.pair_slug}</strong>
                    <span>{position.side}</span>
                  </div>
                  <div>
                    <strong className={pnlUsd >= 0 ? "positive" : "negative"}>{formatUsd(pnlUsd)}</strong>
                    <span>{formatPct(pnlPct)} · 占账户 {formatPct(calculatePositionWeightPct(position, totalEquityUsd))}</span>
                  </div>
                </article>
              );
            })}
            {topPositions.length === 0 ? <p className="empty-state">当前还没有未平仓持仓。</p> : null}
          </div>
        </div>

        <div className="mini-stack">
          <div className="mini-stack-header">
            <div>
              <p className="panel-kicker">最近成交</p>
              <h3>成交时间带</h3>
            </div>
          </div>
          <div className="mini-list">
            {recentTrades.map((trade) => {
              const fillRatio = trade.requested_notional_usd > 0 ? trade.filled_notional_usd / trade.requested_notional_usd : 0;
              return (
                <article key={trade.id} className="mini-row">
                  <div>
                    <strong>{trade.pair_slug}</strong>
                    <span>{trade.side} · {trade.status}</span>
                  </div>
                  <div>
                    <strong>{formatUsd(trade.filled_notional_usd)}</strong>
                    <span>成交率 {formatPct(fillRatio)} · {formatDate(trade.timestamp_utc)}</span>
                  </div>
                </article>
              );
            })}
            {recentTrades.length === 0 ? <p className="empty-state">当前还没有成交记录。</p> : null}
          </div>
        </div>
      </div>

      {props.detailed ? (
        <div className="table-wrap pnl-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>市场</th>
                <th>成本基准</th>
                <th>当前价值</th>
                <th>未实现 P&L</th>
                <th>P&L %</th>
                <th>占比</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((position) => (
                <PositionRow key={position.id} position={position} totalEquityUsd={totalEquityUsd} />
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
