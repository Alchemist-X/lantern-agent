"use client";

import type { PublicPosition } from "@lantern/contracts";
import {
  calculatePositionCostBasisUsd,
  calculatePositionUnrealizedPnlUsd,
  calculatePositionWeightPct,
  calculatePortfolioMarketValueUsd
} from "../lib/account-metrics";
import { formatDate, formatPct, formatUsd } from "../lib/format";
import { usePollingJson } from "../lib/use-polling";

export function LivePositions({ initialData }: { initialData: PublicPosition[] }) {
  const { data } = usePollingJson("/api/public/positions", initialData);
  const marketValueUsd = calculatePortfolioMarketValueUsd(data);
  const profitablePositions = data.filter((position) => calculatePositionUnrealizedPnlUsd(position) >= 0).length;

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="panel-kicker">持仓</p>
          <h2>当前实盘库存</h2>
        </div>
        <div className="table-meta">
          <span>{data.length} 个未平仓</span>
          <span>{profitablePositions} 个盈利</span>
          <span>{formatUsd(marketValueUsd)} 持仓市值</span>
        </div>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>市场</th>
              <th>结果</th>
              <th>数量</th>
              <th>平均成本</th>
              <th>当前价格</th>
              <th>成本基准</th>
              <th>当前价值</th>
              <th>未实现 P&amp;L</th>
              <th>占比</th>
              <th>止损</th>
              <th>开仓时间</th>
            </tr>
          </thead>
          <tbody>
            {data.map((position) => (
              <tr key={position.id}>
                <td data-label="市场">
                  <strong className="table-title">{position.pair_slug}</strong>
                  <div className="table-subline table-code">{position.token_symbol}</div>
                </td>
                <td data-label="结果">{position.side}</td>
                <td data-label="数量">{position.size.toFixed(2)}</td>
                <td data-label="平均成本">{position.avg_cost.toFixed(3)}</td>
                <td data-label="当前价格">{position.current_price.toFixed(3)}</td>
                <td data-label="成本基准">{formatUsd(calculatePositionCostBasisUsd(position))}</td>
                <td data-label="当前价值">{formatUsd(position.current_value_usd)}</td>
                <td data-label="未实现 P&L" className={calculatePositionUnrealizedPnlUsd(position) >= 0 ? "positive" : "negative"}>
                  {formatUsd(calculatePositionUnrealizedPnlUsd(position))}
                </td>
                <td data-label="占比">
                  {formatPct(calculatePositionWeightPct(position, marketValueUsd))}
                </td>
                <td data-label="止损">{formatPct(position.stop_loss_pct)}</td>
                <td data-label="开仓时间">{formatDate(position.opened_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
