"use client";

import type { PublicRunDetailWithPulse } from "../lib/public-run-pulse";
import { formatDate, formatPct, formatUsd } from "../lib/format";
import { usePollingJson } from "../lib/use-polling";

function formatRunMode(mode: PublicRunDetailWithPulse["mode"]): string {
  switch (mode) {
    case "full":
      return "全量";
    case "review":
      return "复盘";
    case "scan":
      return "扫描";
  }
}

function formatRunStatus(status: string): string {
  switch (status) {
    case "completed":
      return "已完成";
    case "running":
      return "运行中";
    case "failed":
      return "失败";
    case "queued":
      return "排队中";
    case "awaiting-approval":
      return "等待批准";
    default:
      return status;
  }
}

function formatDecisionAction(action: PublicRunDetailWithPulse["decisions"][number]["action"]): string {
  switch (action) {
    case "open":
      return "开仓";
    case "close":
      return "平仓";
    case "reduce":
      return "减仓";
    case "hold":
      return "持有";
    case "skip":
      return "跳过";
  }
}

function formatDecisionSide(side: PublicRunDetailWithPulse["decisions"][number]["side"]): string {
  return side === "BUY" ? "买入" : "卖出";
}

function formatConfidence(confidence: PublicRunDetailWithPulse["decisions"][number]["confidence"]): string {
  switch (confidence) {
    case "low":
      return "低";
    case "medium":
      return "中";
    case "medium-high":
      return "中高";
    case "high":
      return "高";
  }
}

function formatTrackingStatus(status: string): string {
  switch (status) {
    case "captured":
      return "已记录";
    case "watching":
      return "观察中";
    case "changed":
      return "已变化";
    case "manual-review":
      return "人工复核";
    case "untrackable":
      return "不可追踪";
    case "error":
      return "抓取失败";
    default:
      return status;
  }
}

export function RunDetail({ runId, initialData }: { runId: string; initialData: PublicRunDetailWithPulse }) {
  const { data } = usePollingJson<PublicRunDetailWithPulse>(`/api/public/runs/${runId}`, initialData);

  return (
    <>
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="panel-kicker">运行详情</p>
            <h2>{data.runtime}</h2>
          </div>
          <span className="badge">{formatRunMode(data.mode)}</span>
        </div>
        <dl className="detail-grid">
          <div>
            <dt>生成时间</dt>
            <dd>{formatDate(data.generated_at_utc)}</dd>
          </div>
          <div>
            <dt>状态</dt>
            <dd>{formatRunStatus(data.status)}</dd>
          </div>
          <div>
            <dt>资金规模</dt>
            <dd>{formatUsd(data.bankroll_usd)}</dd>
          </div>
          <div>
            <dt>运行摘要</dt>
            <dd data-testid="run-detail-prompt-summary">{data.prompt_summary}</dd>
          </div>
        </dl>
      </section>

      <section className="panel prose-panel">
        <div className="panel-header">
          <div>
            <p className="panel-kicker">推理</p>
            <h2>决策日志</h2>
          </div>
        </div>
        <pre>{data.reasoning_md}</pre>
        <pre>{data.logs_md}</pre>
      </section>

      {data.pulse_explainer ? (
        <section className="panel prose-panel">
          <div className="panel-header">
            <div>
              <p className="panel-kicker">脉冲</p>
              <h2>这次推荐为什么会出现</h2>
            </div>
            <span className="badge">仅在已完成且有真实成交时显示</span>
          </div>
          <dl className="detail-grid">
            <div>
              <dt>脉冲发布时间</dt>
              <dd>{formatDate(data.pulse_explainer.pulse_published_at_utc)}</dd>
            </div>
            <div>
              <dt>脉冲文件</dt>
              <dd className="table-code">{data.pulse_explainer.pulse_path}</dd>
            </div>
            <div>
              <dt>首次成交时间</dt>
              <dd>{formatDate(data.pulse_explainer.first_executed_trade_at_utc)}</dd>
            </div>
            <div>
              <dt>最近成交时间</dt>
              <dd>{formatDate(data.pulse_explainer.last_executed_trade_at_utc)}</dd>
            </div>
            <div>
              <dt>成交笔数</dt>
              <dd>{data.pulse_explainer.executed_trade_count}</dd>
            </div>
          </dl>
          <p className="panel-note">
            {data.pulse_explainer.pulse_title}。这段内容只展示本轮已完成、且确实有成交的 pulse 摘要。它用来说明模型当时为什么会把注意力放到这些市场上。
          </p>
          <pre>{data.pulse_explainer.pulse_excerpt_md}</pre>
          <div className="report-list">
            {data.pulse_explainer.executed_trades.map((trade) => (
              <article key={trade.id} className="report-card">
                <span className="badge">{trade.side}</span>
                <h3>{trade.market_slug}</h3>
                <p>
                  成交金额 {formatUsd(trade.filled_notional_usd)}
                  {trade.avg_price == null ? "" : ` · 均价 ${trade.avg_price.toFixed(3)}`}
                </p>
                <p className="table-code">{trade.token_id}</p>
                <small>{formatDate(trade.timestamp_utc)}</small>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="panel-kicker">决策</p>
            <h2>交易集合</h2>
          </div>
        </div>
        <div className="decision-grid">
          {data.decisions.map((decision, index) => (
            <article key={`${decision.pair_slug}-${index}`} className="decision-card">
              <span className="badge">{formatDecisionAction(decision.action)}</span>
              <h3>{decision.pair_slug}</h3>
              <p>{decision.thesis_md}</p>
              <dl>
                <div>
                  <dt>方向</dt>
                  <dd>{formatDecisionSide(decision.side)}</dd>
                </div>
                <div>
                  <dt>金额</dt>
                  <dd>{formatUsd(decision.notional_usd)}</dd>
                </div>
                <div>
                  <dt>仓位占比</dt>
                  <dd>{formatPct(data.bankroll_usd > 0 ? decision.notional_usd / data.bankroll_usd : 0)}</dd>
                </div>
                <div>
                  <dt>市场概率</dt>
                  <dd>{formatPct(decision.momentum_score)}</dd>
                </div>
                <div>
                  <dt>AI 概率</dt>
                  <dd>{formatPct(decision.signal_strength)}</dd>
                </div>
                <div>
                  <dt>优势</dt>
                  <dd>{formatPct(decision.edge)}</dd>
                </div>
                <div>
                  <dt>置信度</dt>
                  <dd>{formatConfidence(decision.confidence)}</dd>
                </div>
              </dl>
              <div className="decision-sources">
                <strong>信息源</strong>
                <ul>
                  {decision.sources.map((source) => (
                    <li key={`${source.url}-${source.retrieved_at_utc}`}>
                      <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
                      <span> · {formatDate(source.retrieved_at_utc)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="panel-kicker">跟踪</p>
            <h2>信息源跟踪</h2>
          </div>
        </div>
        <div className="report-list">
          {data.tracked_sources.map((source) => (
            <article key={source.id} className="report-card">
              <span className="badge">{formatTrackingStatus(source.status)}</span>
              <h3>{source.title}</h3>
              <p>{source.pair_slug}</p>
              <p>
                <a href={source.url} target="_blank" rel="noreferrer">{source.url}</a>
              </p>
              <small>{formatDate(source.retrieved_at_utc)}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="panel-kicker">跟踪</p>
            <h2>结算检查</h2>
          </div>
        </div>
        <div className="report-list">
          {data.resolution_checks.map((check) => (
            <article key={check.id} className="report-card">
              <span className="badge">{formatTrackingStatus(check.track_status)}</span>
              <h3>{check.pair_slug}</h3>
              <p>{check.summary}</p>
              <p>等级：{check.trackability ?? "未获取"} · 类型：{check.source_type ?? "未获取"}</p>
              <p>{check.source_url ?? "未检测到结算源 URL"}</p>
              <small>{check.last_checked_at ? formatDate(check.last_checked_at) : "尚未检查"}</small>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
