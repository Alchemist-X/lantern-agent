import type { PreviewDashboardData, PreviewNavPoint } from "../lib/preview-dashboard";
import { formatDate, formatPct, formatUsd } from "../lib/format";

function buildNavPath(points: PreviewNavPoint[], width = 960, height = 320): { d: string; markerX: number; markerY: number } {
  const padX = 24;
  const padY = 28;

  if (points.length <= 1) {
    return {
      d: `M ${padX} ${height / 2} L ${width - padX} ${height / 2}`,
      markerX: width / 2,
      markerY: height / 2
    };
  }

  const values = points.map((point) => point.nav_index);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = (width - padX * 2) / Math.max(points.length - 1, 1);

  let d = "";
  points.forEach((point, index) => {
    const x = padX + index * step;
    const y = height - padY - ((point.nav_index - min) / range) * (height - padY * 2);
    d += `${index === 0 ? "M" : " L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  });

  const markerX = padX + (points.length - 1) * step;
  const markerY = height - padY - ((points[points.length - 1]!.nav_index - min) / range) * (height - padY * 2);

  return { d, markerX, markerY };
}

export function PreviewNav({ data }: { data: PreviewDashboardData }) {
  const navSeries = data.trackedNav;
  const path = buildNavPath(navSeries);
  const currentNav = data.navSummary.current_nav_index.toFixed(4);

  return (
    <div className="preview-root preview-nav-page">
      <section className="preview-nav-hero">
        <div className="preview-nav-copy">
          <p className="preview-eyebrow">NAV / Beacon</p>
          <h1>把单位净值放到第一屏，先看走势，再看成交。</h1>
            <p className="preview-note">
            这版故意把“净值”和“现金”分开。NAV 只看账户净值本身，不把出入金当成收益；如果公开数据只够得到一个快照，也会明确标注为本地归一化展示。
          </p>
          <div className="preview-nav-badges">
            <span>unit NAV</span>
            <span>{data.navSummary.is_approximate ? "快照展示" : "曲线展示"}</span>
            <span>{data.spectatorMode ? "公开钱包围观" : "内部数据"}</span>
            <span>来源：公开活动 + 持仓估算</span>
          </div>
        </div>

        <aside className="preview-nav-panel">
          <div className="preview-nav-score">
            <span>当前 NAV</span>
            <strong>{currentNav}x</strong>
            <p>{data.navSummary.note}</p>
          </div>
          <div className="preview-nav-stats">
            <article>
              <span>账户总额</span>
              <strong>{formatUsd(data.navSummary.current_equity_usd)}</strong>
            </article>
            <article>
              <span>现金</span>
              <strong>{formatUsd(data.overview.cash_balance_usd)}</strong>
            </article>
            <article>
              <span>回撤</span>
              <strong>{formatPct(data.overview.drawdown_pct)}</strong>
            </article>
            <article>
              <span>最近运行</span>
              <strong>{formatDate(data.overview.last_run_at)}</strong>
            </article>
          </div>
        </aside>
      </section>

      <section className="preview-nav-shell">
        <div className="preview-nav-chart-card">
          <div className="preview-nav-chart-header">
            <div>
              <p className="preview-eyebrow">NAV curve</p>
              <h2>单位净值曲线</h2>
            </div>
            <span>{navSeries.length > 1 ? `${navSeries.length} 个快照点` : "当前只有单点快照"}</span>
          </div>

          <div className="preview-nav-chart">
            <svg viewBox="0 0 960 320" role="img" aria-label="单位净值曲线">
              <path className="preview-nav-grid-line" d="M 24 80 H 936 M 24 160 H 936 M 24 240 H 936" />
              <path className="preview-nav-area" d={`${path.d} L 936 284 L 24 284 Z`} />
              <path className="preview-nav-line" d={path.d} />
              <circle cx={path.markerX} cy={path.markerY} r="5.5" className="preview-nav-marker" />
            </svg>
          </div>
        </div>

        <div className="preview-nav-strip">
          <article>
            <span>起点净值</span>
            <strong>{data.navSummary.start_equity_usd.toFixed(2)}</strong>
          </article>
          <article>
            <span>当前净值</span>
            <strong>{data.navSummary.current_equity_usd.toFixed(2)}</strong>
          </article>
          <article>
            <span>收益变化</span>
            <strong>{formatPct(data.navSummary.change_pct)}</strong>
          </article>
          <article>
            <span>峰值 NAV</span>
            <strong>{Math.max(...navSeries.map((point) => point.nav_index), 1).toFixed(4)}x</strong>
          </article>
        </div>
      </section>

      <section className="preview-nav-grid">
        <article className="preview-nav-card">
          <p className="preview-eyebrow">Explainability</p>
          <h2>最近 pulse 在讲什么</h2>
          <p>{data.latestPulse?.pulse_evidence_status === "present" ? "这里用真实 pulse 证据说明为什么模型把注意力放到这些市场上。" : "这里保留了证据缺失样本，明确告诉访客当前只是推荐摘要，不是假装完整研究报告。"}</p>
          <div className="preview-nav-signal">
            <strong>{data.latestPulse?.pulse_title ?? "暂无 pulse 样本"}</strong>
            <span>{data.latestPulse?.decision_reason_md ?? "没有可展示的解释内容。"}</span>
          </div>
        </article>

        <article className="preview-nav-card">
          <p className="preview-eyebrow">Cash boundary</p>
          <h2>现金和 NAV 分开看</h2>
          <p>现金只是账户里还能用的部分，不直接等于收益。这个页面把 NAV 放前面，是为了让访客先理解账户走向，再理解资金结构。</p>
          <div className="preview-nav-signal is-muted">
            <strong>{formatUsd(data.overview.cash_balance_usd)}</strong>
            <span>{data.spectatorMode ? "当前现金来自公开可见余额或链上 USDC。" : "当前现金来自内部组合快照。"}</span>
          </div>
        </article>
      </section>
    </div>
  );
}
