"use client";

import type { OverviewResponse } from "@lantern/contracts";
import { EquityChart } from "./equity-chart";
import { formatDate, formatPct, formatUsd } from "../lib/format";
import { usePollingJson } from "../lib/use-polling";

function formatStatus(status: OverviewResponse["status"]): string {
  switch (status) {
    case "running":
      return "运行中";
    case "paused":
      return "已暂停";
    case "halted":
      return "已停止";
    default:
      return status;
  }
}

function StatCard(props: { label: string; value: string; note?: string; accent?: string }) {
  return (
    <div className={`stat-card ${props.accent ?? ""}`}>
      <span>{props.label}</span>
      <strong>{props.value}</strong>
      {props.note ? <small>{props.note}</small> : null}
    </div>
  );
}

export function LiveOverview({ initialData }: { initialData: OverviewResponse }) {
  const { data, error } = usePollingJson("/api/public/overview", initialData);
  const spectatorMode = data.latest_risk_event?.includes("公开地址围观模式") ?? false;

  return (
    <>
      <section className="stats-grid">
        <StatCard label="状态" value={formatStatus(data.status)} note="围观轮询正常运行中" accent={`status-${data.status}`} />
        <StatCard
          label={spectatorMode ? "账户总额" : "总净值"}
          value={formatUsd(data.total_equity_usd)}
          note={spectatorMode ? "持仓市值 + 可见 cash" : "现金 + 按市价计的持仓"}
        />
        <StatCard
          label={spectatorMode ? "现金" : "现金余额"}
          value={spectatorMode ? formatUsd(data.cash_balance_usd) : formatUsd(data.cash_balance_usd)}
          note={spectatorMode ? "优先取 on-chain balance，拿不到就退回链上 USDC" : "账户内现金"}
        />
        <StatCard
          label={spectatorMode ? "参考高点" : "历史高点"}
          value={formatUsd(data.high_water_mark_usd)}
          note={spectatorMode ? "当前可见口径下的高点" : "记录里的最高总净值"}
        />
        <StatCard
          label="回撤"
          value={spectatorMode ? "公开口径有限" : formatPct(data.drawdown_pct)}
          note={spectatorMode ? "因为资金历史不完整，这里只做保守展示" : "相对历史高点计算"}
        />
        <StatCard label="当前持仓数" value={String(data.open_positions)} note="当前还没平掉的市场" />
      </section>

      <EquityChart points={data.equity_curve} />

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="panel-kicker">运行上下文</p>
            <h2>最近一次发生了什么</h2>
          </div>
          <span className="badge">5 秒轮询</span>
        </div>
        <dl className="detail-grid">
          <div>
            <dt>最近一次更新</dt>
            <dd>{formatDate(data.last_run_at)}</dd>
          </div>
          <div>
            <dt>最新备注</dt>
            <dd>{data.latest_risk_event ?? "暂无最新备注。"}</dd>
          </div>
          <div>
            <dt>刷新状态</dt>
            <dd>{error ? `轮询异常：${error}` : "正常"}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
