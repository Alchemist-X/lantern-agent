import { formatDate, formatUsd } from "../lib/format";
import type { PublicPulseRecommendationExample } from "../lib/public-run-pulse";

function compactId(value: string): string {
  if (!value) {
    return "未提供";
  }
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function formatExampleLabel(example: PublicPulseRecommendationExample, index: number): string {
  if (example.recommended_notional_usd >= 1.75 && example.recommended_notional_usd <= 2.25) {
    return `历史约 2 美元示例 ${index + 1}`;
  }
  return `真实成交样本 ${index + 1}`;
}

export function PulseRecommendationExamples({ initialData }: { initialData: PublicPulseRecommendationExample[] }) {
  if (initialData.length === 0) {
    return null;
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="panel-kicker">Pulse 推荐过程</p>
          <h2>模型为什么会推荐，先看这几个例子</h2>
        </div>
      </div>
      <p className="panel-note">
        这里优先放历史上的两个约 2 美元开仓样本。如果没有找到对应的真实成交证据，就明确显示“缺失”，不会把它包装成已成交。只有完成且确实有 executed trade 的样本，才会展开完整脉冲说明。
      </p>
      <div className="report-list">
        {initialData.map((example, index) => (
          <article key={example.run_id} className="report-card">
            <span className="badge">{example.pulse_evidence_status === "present" ? "已完成且有成交" : "缺失"}</span>
            <h3>{formatExampleLabel(example, index)}</h3>
            <p>
              {example.pair_slug || example.token_symbol || "市场信息未提供"} · {formatUsd(example.recommended_notional_usd)} · {formatDate(example.generated_at_utc)}
            </p>
            <p className="table-code">Run {compactId(example.run_id)}</p>
            <p className="table-code">{example.pulse_markdown_path ?? "pulse markdown: 缺失"}</p>
            <p className="panel-note">脉冲时间：{example.pulse_published_at_utc ? formatDate(example.pulse_published_at_utc) : "未找到"}</p>

            {example.pulse_evidence_status === "present" ? (
              <>
                <p className="panel-note">
                  脉冲发布时间：{example.pulse_published_at_utc ? formatDate(example.pulse_published_at_utc) : "未提供"} · 成交笔数：{example.executed_trade_count}
                </p>
                {example.pulse_title ? <p className="panel-note">{example.pulse_title}</p> : null}
                <pre>{example.pulse_excerpt_md ?? example.decision_reason_md}</pre>
                <div className="report-list" style={{ marginTop: 0 }}>
                  {example.executed_trades.map((trade) => (
                    <article key={`${example.run_id}-${trade.order_id ?? trade.timestamp_utc}`} className="report-card">
                      <span className="badge">{trade.side}</span>
                      <h3>{trade.pair_slug}</h3>
                      <p>
                        成交金额 {formatUsd(trade.filled_notional_usd)}
                        {trade.avg_price == null ? "" : ` · 均价 ${trade.avg_price.toFixed(3)}`}
                      </p>
                      <p className="table-code">{trade.token_symbol}</p>
                      <p className="table-code">{trade.order_id ?? "order id 缺失"}</p>
                      <small>{formatDate(trade.timestamp_utc)}</small>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="empty-state">{example.pulse_missing_reason ?? "没有找到可确认的 pulse 证据。"}</p>
                <p className="panel-note">推荐理由：{example.decision_reason_md}</p>
                <p className="table-code">{example.pulse_json_path ?? "pulse json: 缺失"}</p>
                <p className="table-code">{example.run_summary_path ?? "run-summary: 缺失"}</p>
                <p className="table-code">{example.execution_summary_path ?? "execution-summary: 缺失"}</p>
              </>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
