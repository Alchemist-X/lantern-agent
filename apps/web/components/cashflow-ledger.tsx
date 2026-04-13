"use client";

import { formatDate, formatUsd } from "../lib/format";
import type { SpectatorActivityEvent } from "../lib/public-wallet";
import { usePollingJson } from "../lib/use-polling";

function formatCashDirection(event: SpectatorActivityEvent): string {
  if (event.direction === "IN") {
    return "流入";
  }
  if (event.direction === "OUT") {
    return "流出";
  }
  return "信息";
}

function signedUsdValue(event: SpectatorActivityEvent): number {
  if (event.direction === "IN") {
    return event.usdc_size;
  }
  if (event.direction === "OUT") {
    return -event.usdc_size;
  }
  return 0;
}

export function CashflowLedger({ initialData }: { initialData: SpectatorActivityEvent[] }) {
  const { data } = usePollingJson("/api/public/activity", initialData);
  const totalCashIn = data.filter((event) => event.direction === "IN").reduce((sum, event) => sum + event.usdc_size, 0);
  const totalCashOut = data.filter((event) => event.direction === "OUT").reduce((sum, event) => sum + event.usdc_size, 0);

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="panel-kicker">现金流</p>
          <h2>公开钱包 feed 里的成交和 redeem</h2>
        </div>
        <div className="table-meta">
          <span>{data.length} 条事件</span>
          <span>{formatUsd(totalCashIn)} 流入</span>
          <span>{formatUsd(totalCashOut)} 流出</span>
        </div>
      </div>

      <p className="panel-note">
        这本流水账来自 X Layer DEX 的公共 activity。它比较可靠地展示成交和 redeem，但不会完整展示 bridge 的出入金。
      </p>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>类型</th>
              <th>市场</th>
              <th>方向</th>
              <th>USDC</th>
              <th>份额</th>
              <th>价格</th>
              <th>Tx</th>
            </tr>
          </thead>
          <tbody>
            {data.map((event) => {
                const signedUsd = signedUsdValue(event);
                return (
                  <tr key={event.id}>
                    <td data-label="时间">{formatDate(event.timestamp_utc)}</td>
                    <td data-label="类型">{event.type}</td>
                    <td data-label="市场">
                      <strong className="table-title">{event.pair_slug}</strong>
                      <div className="table-subline">{event.side}</div>
                    </td>
                    <td data-label="方向">{formatCashDirection(event)}</td>
                    <td data-label="USDC" className={signedUsd >= 0 ? "positive" : "negative"}>
                    {formatUsd(signedUsd)}
                    </td>
                    <td data-label="份额">{event.share_size.toFixed(3)}</td>
                    <td data-label="价格">{event.price == null ? "暂无" : event.price.toFixed(3)}</td>
                    <td data-label="交易哈希" className="table-code">{event.transaction_hash ?? "暂无"}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {data.length === 0 ? <p className="empty-state">当前还没有公开钱包活动记录。</p> : null}
    </section>
  );
}
