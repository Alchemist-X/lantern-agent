"use client";

import type { PublicTrade } from "@lantern/contracts";
import { formatDate, formatPct, formatUsd } from "../lib/format";
import { usePollingJson } from "../lib/use-polling";

export function LiveTrades({ initialData }: { initialData: PublicTrade[] }) {
  const { data } = usePollingJson("/api/public/trades", initialData);
  const totalRequestedUsd = data.reduce((sum, trade) => sum + trade.requested_notional_usd, 0);
  const totalFilledUsd = data.reduce((sum, trade) => sum + trade.filled_notional_usd, 0);
  const fillRatio = totalRequestedUsd > 0 ? totalFilledUsd / totalRequestedUsd : 0;

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="panel-kicker">成交带</p>
          <h2>执行历史</h2>
        </div>
        <div className="table-meta">
          <span>{data.length} 条事件</span>
          <span>{formatUsd(totalFilledUsd)} 已成交</span>
          <span>{formatPct(fillRatio)} 成交率</span>
        </div>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>市场</th>
              <th>方向</th>
              <th>状态</th>
              <th>请求金额</th>
              <th>成交金额</th>
              <th>成交率</th>
              <th>均价</th>
              <th>订单 ID</th>
            </tr>
          </thead>
          <tbody>
            {data.map((trade) => (
              <tr key={trade.id}>
                <td data-label="时间">{formatDate(trade.timestamp_utc)}</td>
                <td data-label="市场">
                  <strong className="table-title">{trade.pair_slug}</strong>
                  <div className="table-subline table-code">{trade.token_address}</div>
                </td>
                <td data-label="方向">{trade.side}</td>
                <td data-label="状态">{trade.status}</td>
                <td data-label="请求金额">{formatUsd(trade.requested_notional_usd)}</td>
                <td data-label="成交金额">{formatUsd(trade.filled_notional_usd)}</td>
                <td data-label="成交率">{formatPct(trade.requested_notional_usd > 0 ? trade.filled_notional_usd / trade.requested_notional_usd : 0)}</td>
                <td data-label="均价">{trade.avg_price?.toFixed(3) ?? "暂无"}</td>
                <td data-label="订单 ID" className="table-code">{trade.order_id ?? "暂无"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
