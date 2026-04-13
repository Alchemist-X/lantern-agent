import type { CSSProperties } from "react";
import type { PreviewDashboardData, PreviewTerminalEntry } from "../lib/preview-dashboard";
import { formatDate, formatUsd } from "../lib/format";

function toneLabel(level: PreviewTerminalEntry["level"]): string {
  switch (level) {
    case "success":
      return "OK";
    case "warning":
      return "WARN";
    case "muted":
      return "LOG";
    default:
      return "INFO";
  }
}

export function PreviewTerminal({ data }: { data: PreviewDashboardData }) {
  return (
    <div className="preview-root preview-terminal-page">
      <section className="preview-terminal-hero">
        <div className="preview-terminal-copy">
          <p className="preview-eyebrow">Terminal / Autopilot</p>
          <h1>让访客看到模型不是“自动一下”，而是每一步都在做什么。</h1>
          <p className="preview-note">
            这版把公开数据翻成一列持续输出的命令流：预检、搜索、判断、成交、缺失证据都直接摆出来，尽量接近一个真正的 AI 交易终端。
          </p>
        </div>

        <aside className="preview-terminal-side">
          <article>
            <span>最近运行</span>
            <strong>{formatDate(data.overview.last_run_at)}</strong>
          </article>
          <article>
            <span>最近成交</span>
            <strong>{data.recentTrades.length} 笔</strong>
          </article>
          <article>
            <span>pulse 样本</span>
            <strong>{data.pulseExamples.length} 条</strong>
          </article>
          <article>
            <span>净值</span>
            <strong>{formatUsd(data.overview.total_equity_usd)}</strong>
          </article>
        </aside>
      </section>

      <section className="preview-terminal-shell">
        <div className="preview-terminal-screen">
          <div className="preview-terminal-bar">
            <span>lantern@pulse-direct</span>
            <span>live · public preview</span>
          </div>
          <ul className="preview-terminal-feed">
            {data.terminalFeed.map((entry, index) => (
              <li key={entry.id} className={`preview-terminal-line is-${entry.level}`} style={{ ["--index" as string]: index } as CSSProperties}>
                <span className="preview-terminal-time">{formatDate(entry.timestamp_utc)}</span>
                <span className="preview-terminal-tone">{toneLabel(entry.level)}</span>
                <div className="preview-terminal-body">
                  <strong>{entry.label}</strong>
                  <p>{entry.detail}</p>
                  {entry.market_url ? (
                    <a href={entry.market_url} target="_blank" rel="noreferrer">
                      View on X Layer
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="preview-terminal-grid">
          <article className="preview-terminal-card">
            <p className="preview-eyebrow">Search records</p>
            <h2>搜索和筛选记录</h2>
            <p>这些条目来自实际 pulse / 成交 / 活动数据的本地解释层，不是伪造的后端日志。</p>
            <div className="preview-terminal-stack">
              {data.pulseExamples.map((example) => (
                <div key={example.run_id}>
                  <strong>{example.pulse_title ?? example.pair_slug}</strong>
                  <span>{example.pulse_evidence_status === "present" ? "证据完整" : "证据缺失"} · {formatUsd(example.recommended_notional_usd)}</span>
                  <p>{example.pulse_evidence_status === "present" ? example.decision_reason_md : `缺失：${example.pulse_missing_reason ?? "没有找到对应 pulse 证据"}`}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="preview-terminal-card">
            <p className="preview-eyebrow">Agent commands</p>
            <h2>指令层</h2>
            <p>如果数据源只给了结果，这里就把结果翻成可读的指令轨迹，让人知道 AI 在做什么。</p>
            <div className="preview-terminal-command-list">
              <div>
                <span>$</span>
                <code>pnpm daily:pulse -- --no-stay-open</code>
              </div>
              <div>
                <span>$</span>
                <code>scan markets -- filter liquidity -- rank edge</code>
              </div>
              <div>
                <span>$</span>
                <code>compose decisions -- merge review + entry planner</code>
              </div>
              <div>
                <span>$</span>
                <code>execute market orders -- only if guardrails pass</code>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
