import type { ReactNode } from "react";
import { formatDate, formatPct, formatUsd } from "../lib/format";
import { buildMarketUrl, formatMarketLabel } from "../lib/preview-dashboard";
import type { PreviewAgentFeedEntry, PreviewDashboardData, PreviewNavPoint } from "../lib/preview-dashboard";

const EXPLORER_URL = "https://www.okx.com/web3/explorer/xlayer";

function navCoordinates(points: PreviewNavPoint[], width = 720, height = 220): Array<{ x: number; y: number }> {
  if (points.length === 0) {
    return [];
  }

  if (points.length === 1) {
    const y = height * 0.56;
    return [
      { x: 0, y },
      { x: width, y }
    ];
  }

  const values = points.map((point) => point.unit_nav);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return points.map((point, index) => {
    const x = (index / Math.max(points.length - 1, 1)) * width;
    const y = height - ((point.unit_nav - min) / range) * height;
    return { x, y };
  });
}

function navPath(points: PreviewNavPoint[], width = 720, height = 220): string {
  return navCoordinates(points, width, height)
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
}

function toneClass(tone: PreviewAgentFeedEntry["tone"]): string {
  if (tone === "positive") {
    return "is-positive";
  }
  if (tone === "warning") {
    return "is-warning";
  }
  return "";
}

function phaseLabel(phase: PreviewAgentFeedEntry["phase"]): string {
  switch (phase) {
    case "search":
      return "侦查";
    case "score":
      return "估算";
    case "decision":
      return "定路";
    case "execution":
      return "出手";
    default:
      return "行动";
  }
}

function phaseInstruction(entry: PreviewAgentFeedEntry): string {
  const target = formatMarketLabel(entry.pair_slug ?? "portfolio");

  switch (entry.phase) {
    case "search":
      return `搜索 ${target} 的盘口、新闻和主题标签`;
    case "score":
      return `重估 ${target} 的赔率、边际和仓位优先级`;
    case "decision":
      return `决定 ${target} 是继续持有、加仓还是撤退`;
    case "execution":
      return `按服务层风控规则执行 ${target} 的调仓动作`;
    default:
      return `更新 ${target} 的当前状态`;
  }
}

function actionLabel(unrealizedPnlPct: number): string {
  if (unrealizedPnlPct >= 0.18) {
    return "偏向锁盈或继续拿住";
  }
  if (unrealizedPnlPct >= 0) {
    return "继续观察，等 thesis 失效再动";
  }
  if (unrealizedPnlPct <= -0.12) {
    return "需要重点解释为什么还不减仓";
  }
  return "小幅回撤，继续观察 thesis";
}

function LatestPulseCard({ data }: { data: PreviewDashboardData }) {
  const example = data.latestPulse;
  if (!example) {
    return (
      <article className="bal-side-card">
        <span>最近 pulse</span>
        <strong>暂无归档</strong>
        <p className="bal-note">当前没有可公开展示的 pulse 样本。</p>
      </article>
    );
  }

  return (
    <article className="bal-side-card">
      <span>最近 pulse</span>
      <strong>{formatUsd(example.recommended_notional_usd)}</strong>
      <p className="bal-note">{clipForCard(example.decision_reason_md)}</p>
      <a className="bal-inline-link" href={example.market_url ?? `${EXPLORER_URL}/token/${example.token_symbol}`} target="_blank" rel="noreferrer">
        View on X Layer
      </a>
    </article>
  );
}

function clipForCard(value: string | null | undefined, maxLength = 120): string {
  if (!value) {
    return "这条 pulse 当前只有结果，没有完整的公开说明。";
  }
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength).trim()}...`;
}

function isFlatSeries(points: PreviewNavPoint[]): boolean {
  if (points.length <= 1) {
    return true;
  }
  const first = points[0]?.unit_nav ?? 0;
  return points.every((point) => Math.abs(point.unit_nav - first) < 0.0001);
}

function FlowStatusRail({ data }: { data: PreviewDashboardData }) {
  const recentTrade = data.recentTrades[0];
  const pulseSummary = clipForCard(data.latestPulse?.decision_reason_md, 120);
  return (
    <aside className="bal-signal-rail">
      <div className="bal-signal-head">
        <span>探险日志</span>
        <strong>公开围观中</strong>
      </div>
      <article className="bal-side-panel bal-camp-panel">
        <header className="bal-card-header">
          <p className="bal-card-kicker">当日行军日志</p>
          <h3>从营地状态到战利品</h3>
        </header>
        <div className="bal-camp-log">
          <article className="bal-camp-entry">
            <span className="bal-camp-time">{formatDate(data.overview.last_run_at)}</span>
            <strong>营地结算</strong>
            <p>当前现金 {formatUsd(data.overview.cash_balance_usd)}，总资产 {formatUsd(data.overview.total_equity_usd)}，相对高水位回撤 {formatPct(data.overview.drawdown_pct)}。</p>
          </article>

          <article className="bal-camp-entry">
            <span className="bal-camp-time">线索更新</span>
            <strong>最近 pulse {formatUsd(data.latestPulse?.recommended_notional_usd ?? 0)}</strong>
            <p>{pulseSummary}</p>
            {data.latestPulse ? (
              <a className="bal-inline-link" href={data.latestPulse.market_url ?? `${EXPLORER_URL}/token/${data.latestPulse.token_symbol}`} target="_blank" rel="noreferrer">
                View on X Layer
              </a>
            ) : null}
          </article>

          <article className="bal-camp-entry">
            <span className="bal-camp-time">战利品记录</span>
            {recentTrade ? (
              <>
                <strong>{recentTrade.side} · {formatUsd(recentTrade.filled_notional_usd || recentTrade.requested_notional_usd)}</strong>
                <p>{formatMarketLabel(recentTrade.pair_slug)} 已进入公开围观记录，用户可以继续在 X Layer 浏览器查看。</p>
                <a className="bal-inline-link" href={buildMarketUrl(recentTrade.pair_slug, recentTrade.pair_slug)} target="_blank" rel="noreferrer">
                  View on X Layer
                </a>
              </>
            ) : (
              <>
                <strong>暂无新增战利品</strong>
                <p>这一回合还没有新的真实成交，所以这里只保留最新营地状态和线索记录。</p>
              </>
            )}
          </article>
        </div>
      </article>
    </aside>
  );
}

function NavHero({
  data,
  title,
  note,
  aside
}: {
  data: PreviewDashboardData;
  title: string;
  note: string;
  aside: ReactNode;
}) {
  const path = navPath(data.trackedNav);
  const coordinates = navCoordinates(data.trackedNav);
  const currentNav = data.trackedNav[data.trackedNav.length - 1]?.unit_nav ?? 1;
  const firstNav = data.trackedNav[0]?.unit_nav ?? 1;
  const change = currentNav - firstNav;
  const latestPoint = data.trackedNav[data.trackedNav.length - 1];
  const recentPoints = data.trackedNav.slice(-6);
  const flatSeries = isFlatSeries(data.trackedNav);
  const firstCoordinate = coordinates[0];
  const lastCoordinate = coordinates[coordinates.length - 1];
  const routeMarkers = coordinates.filter((_, index) => index === 0 || index === coordinates.length - 1 || index % 2 === 0);

  return (
    <section className="bal-nav-hero">
      <div className="bal-nav-chart-card">
        <div className="bal-nav-topline">
          <p className="bal-eyebrow">单位净值 / 自主交易探险</p>
          <span className="bal-status-pill">任务地图 · 公共围观</span>
        </div>
        <h1>{title}</h1>
        <p className="bal-note">{note}</p>
        <div className="bal-quest-banner">
          <span>单真钱包实例</span>
          <span>服务层硬风控</span>
          <span>公开只读围观</span>
        </div>
        <div className="bal-nav-inline-stats">
          <span>区间变化 {formatPct(change)}</span>
          <span>账户总额 {formatUsd(data.overview.total_equity_usd)}</span>
          <span>{flatSeries ? "当前是单点基线" : "当前是估算轨迹"}</span>
        </div>
        <div className="bal-nav-primary">
          <div className="is-nav">
            <span>单位净值</span>
            <strong>{currentNav.toFixed(4)}</strong>
          </div>
          <div className="is-timestamp">
            <span>最近时间</span>
            <strong>{formatDate(latestPoint?.timestamp_utc ?? data.overview.last_run_at)}</strong>
          </div>
        </div>
        <div className="bal-nav-plot">
          <div className="bal-chart-chrome">
            <span>营地 NAV 记录板</span>
            <span>{flatSeries ? "模式：单点营地快照" : "模式：公开轨迹回放"}</span>
          </div>
          <svg viewBox="0 0 720 240" aria-label="单位净值曲线">
            <defs>
              <linearGradient id="bal-nav-line" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#f2d5a2" />
                <stop offset="55%" stopColor="#c79b58" />
                <stop offset="100%" stopColor="#8f6230" />
              </linearGradient>
            </defs>
            {flatSeries ? null : <path d={`${path} L 720 240 L 0 240 Z`} className="bal-nav-area" />}
            {flatSeries ? <path d={path} className="bal-nav-guide" /> : null}
            <path d={path} className="bal-nav-line" />
            {routeMarkers.map((point, index) => (
              <rect
                key={`${point.x}-${point.y}-${index}`}
                x={point.x - 6}
                y={point.y - 6}
                width="12"
                height="12"
                rx="2"
                className={`bal-nav-room${index === routeMarkers.length - 1 ? " is-end" : ""}`}
              />
            ))}
            {firstCoordinate ? <circle cx={firstCoordinate.x} cy={firstCoordinate.y} r="5" className="bal-nav-dot" /> : null}
            {lastCoordinate ? <circle cx={lastCoordinate.x} cy={lastCoordinate.y} r="6" className="bal-nav-dot is-end" /> : null}
          </svg>
          <div className="bal-chart-axis">
            <span>早期可见点</span>
            <strong>{firstNav.toFixed(4)}</strong>
            <span>当前</span>
            <strong>{currentNav.toFixed(4)}</strong>
          </div>
          <div className="bal-nav-story">
            <article>
              <span>今日路径</span>
              <strong>{flatSeries ? "只看到一个可公开锚点" : "沿着公开活动推算当天轨迹"}</strong>
            </article>
            <article>
              <span>关键拐点</span>
              <strong>{flatSeries ? "暂无可见拐点" : `${routeMarkers.length} 个公开阶段节点`}</strong>
            </article>
            <article>
              <span>当前状态</span>
              <strong>{flatSeries ? "营地驻留" : "仍在移动，但受风控限制"}</strong>
            </article>
          </div>
          <div className="bal-chart-status">
            <strong>{flatSeries ? "当前显示的是单点 NAV 基线" : "这是一张根据公开活动估算的路线图"}</strong>
            <span>{flatSeries ? "公开活动不足时，记录板会显示平线，不会伪造波动。" : "路线会标出阶段节点，但它仍然不等于完整内部账本。你看到的是公开可见的一段旅程。"}</span>
          </div>
        </div>
        <div className="bal-nav-ticks">
          {recentPoints.map((point) => (
            <article key={`${point.timestamp_utc}-${point.label}`}>
              <span>{formatDate(point.timestamp_utc)}</span>
              <strong>{point.unit_nav.toFixed(4)}</strong>
            </article>
          ))}
        </div>
        <span className="bal-footnote">{data.trackedNavNote}</span>
      </div>
      <aside className="bal-nav-aside">{aside}</aside>
    </section>
  );
}

function TerminalFeed({ data }: { data: PreviewDashboardData }) {
  const replayEntries = [...data.agentFeed, ...data.agentFeed.slice(0, 4)];
  const replayPhases = ["侦查", "估算", "定路", "出手"];
  const currentPhase = phaseLabel(replayEntries[0]?.phase ?? "search");
  const currentPhaseIndex = Math.max(replayPhases.indexOf(currentPhase), 0);
  const currentEntry = replayEntries[0];
  const replayQueue = replayEntries.slice(1, 5);
  return (
    <div className="bal-terminal">
      <div className="bal-terminal-head">
        <span>Agent 实时指令流</span>
        <strong>缓慢回放中</strong>
      </div>
      <div className="bal-terminal-progress">
        {replayPhases.map((phase, index) => (
          <div
            key={phase}
            className={`bal-terminal-phase${index < currentPhaseIndex ? " is-done" : ""}${index === currentPhaseIndex ? " is-active" : ""}`}
          >
            <span>{phase}</span>
          </div>
        ))}
      </div>
      <div className="bal-terminal-summary">
        这一回合按“侦查 到 估算，再到 定路 和 出手”的顺序慢速推进。
      </div>
      {currentEntry ? (
        <div className="bal-terminal-current">
          <div className="bal-terminal-current-head">
            <span>当前步骤</span>
            <strong>{phaseLabel(currentEntry.phase)}</strong>
          </div>
          <h3>正在{phaseLabel(currentEntry.phase)} · {currentEntry.label}</h3>
          <div className="bal-terminal-command">
            <span>指令</span>
            <code>{phaseInstruction(currentEntry)}</code>
          </div>
          <p>{currentEntry.detail}</p>
          <div className="bal-terminal-current-meta">
            <span>{formatDate(currentEntry.timestamp_utc)}</span>
            {currentEntry.market_url ? (
              <a href={currentEntry.market_url} target="_blank" rel="noreferrer">View on X Layer</a>
            ) : null}
          </div>
        </div>
      ) : null}
      <div className="bal-terminal-body">
        <div className="bal-terminal-stream">
          {replayQueue.map((entry, index) => (
            <article key={`${entry.id}-${index}`} className="bal-terminal-line">
              <div className="bal-terminal-step">{(index + 2).toString().padStart(2, "0")}</div>
              <div className="bal-terminal-entry">
                <div className="bal-terminal-time">
                  <span>{index === 0 ? "刚完成" : index === 1 ? "下一步" : "稍后"}</span>
                  <div className="bal-terminal-tags">
                    <em>{phaseLabel(entry.phase)}</em>
                    <strong className={toneClass(entry.tone)}>{entry.label}</strong>
                  </div>
                </div>
                <p>{entry.detail}</p>
                <div className="bal-terminal-queue-meta">
                  <span>{formatDate(entry.timestamp_utc)}</span>
                  <span>{entry.pair_slug ? formatMarketLabel(entry.pair_slug) : "portfolio"}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="bal-terminal-todo">TODO: 接入 Manus 风格工作流逐步回放。</div>
    </div>
  );
}

function ClusterGrid({ data }: { data: PreviewDashboardData }) {
  return (
    <div className="bal-cluster-grid">
      {data.marketClusters.map((cluster, index) => (
        <article key={cluster.key} className="bal-cluster-card">
          <span className="bal-cluster-room">room {(index + 1).toString().padStart(2, "0")}</span>
          <header className="bal-card-header">
            <p className="bal-card-kicker">主题分类</p>
            <h3>{cluster.label}</h3>
          </header>
          <strong className="bal-cluster-value">{formatUsd(cluster.total_value_usd)}</strong>
          <span className="bal-cluster-summary">{cluster.item_count} 个市场</span>
          <p className="bal-cluster-description">{cluster.description}</p>
          <ul className="bal-cluster-links">
            {cluster.items.slice(0, 2).map((item) => (
              <li key={item.id}>
                <a href={item.url} target="_blank" rel="noreferrer">{formatMarketLabel(item.pair_slug)}</a>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}

function PositionInsightGrid({ data, compact = false }: { data: PreviewDashboardData; compact?: boolean }) {
  const items = compact ? data.positionInsights.slice(0, 4) : data.positionInsights.slice(0, 6);
  return (
    <div className={`bal-position-grid${compact ? " is-compact" : ""}`}>
      {items.map((item) => (
        <article key={item.id} className="bal-position-card">
          <div className="bal-position-head">
            <div>
              <p className="bal-card-kicker">{item.cluster_label}</p>
              <h3>{formatMarketLabel(item.pair_slug)}</h3>
            </div>
            <a href={item.market_url} target="_blank" rel="noreferrer">X Layer</a>
          </div>
          <div className="bal-position-metrics">
            <div>
              <span>仓位市值</span>
              <strong>{formatUsd(item.current_value_usd)}</strong>
            </div>
            <div>
              <span>浮动 P&L</span>
              <strong className={item.unrealized_pnl_pct >= 0 ? "is-positive" : "is-warning"}>{formatPct(item.unrealized_pnl_pct)}</strong>
            </div>
            <div>
              <span>持仓逻辑</span>
              <strong>{item.side}</strong>
            </div>
          </div>
          <div className="bal-position-rationale">
            <span>操作建议</span>
            <strong>{actionLabel(item.unrealized_pnl_pct)}</strong>
          </div>
          <p className="bal-position-analysis">{item.analysis_md}</p>
        </article>
      ))}
    </div>
  );
}

export function BalancerCorePreview({ data }: { data: PreviewDashboardData }) {
  return (
    <div className="bal-preview-root bal-preview-core">
      <NavHero
        data={data}
        title="先看单位净值，再看 AI 的动作。"
        note="This view shows unit NAV first, then search, decision, and execution details."
        aside={
          <div className="bal-side-stack">
            <LatestPulseCard data={data} />
            <TerminalFeed data={data} />
          </div>
        }
      />

      <section className="bal-bento-grid">
        <article className="bal-panel is-wide">
          <div className="bal-panel-head">
            <p className="bal-eyebrow">Token Clusters</p>
            <h2>这不是一堆散单，而是一组组主题暴露</h2>
          </div>
          <ClusterGrid data={data} />
        </article>

        <article className="bal-panel">
          <div className="bal-panel-head">
            <p className="bal-eyebrow">AI Control</p>
            <h2>模型解释与 pulse 证据</h2>
          </div>
          <PositionInsightGrid data={data} compact />
        </article>
      </section>
    </div>
  );
}

export function BalancerResearchPreview({ data }: { data: PreviewDashboardData }) {
  return (
    <div className="bal-preview-root bal-preview-research">
      <NavHero
        data={data}
        title="把净值、研究过程和调仓理由放到一页里。"
        note="这版更像研究页，重点不是大数字，而是把为什么动这个仓位讲清楚。"
        aside={
          <div className="bal-side-stack">
            <article className="bal-side-card">
              <span>当前 NAV</span>
              <strong>{(data.trackedNav[data.trackedNav.length - 1]?.unit_nav ?? 1).toFixed(4)}</strong>
            </article>
            <article className="bal-side-card">
              <span>现金</span>
              <strong>{formatUsd(data.overview.cash_balance_usd)}</strong>
            </article>
            <article className="bal-side-card">
              <span>持仓数</span>
              <strong>{data.overview.open_positions}</strong>
            </article>
            <LatestPulseCard data={data} />
          </div>
        }
      />

      <section className="bal-split-grid">
        <article className="bal-panel">
          <div className="bal-panel-head">
            <p className="bal-eyebrow">Position Analysis</p>
            <h2>更细的持仓信息和操作理由</h2>
          </div>
          <PositionInsightGrid data={data} />
        </article>

        <article className="bal-panel">
          <div className="bal-panel-head">
            <p className="bal-eyebrow">Agent Log</p>
            <h2>搜索记录与指令流</h2>
          </div>
          <TerminalFeed data={data} />
        </article>
      </section>
    </div>
  );
}

export function BalancerFlowPreview({ data }: { data: PreviewDashboardData }) {
  return (
    <div className="bal-preview-root bal-preview-flow">
      <NavHero
        data={data}
        title="先看单位净值，再看 AI 怎么调仓。"
        note="This is a live, publicly observable, service-layer risk-controlled DEX trading system on X Layer. The page shows unit NAV first, then replays how the Agent searches, decides, and rebalances."
        aside={<FlowStatusRail data={data} />}
      />

      <section className="bal-bento-grid">
        <article className="bal-panel">
          <div className="bal-panel-head">
            <p className="bal-eyebrow">旅程回放</p>
            <h2>Agent 实时指令流</h2>
            <span className="bal-section-note">这里不是终端快闪，而是一条慢速滚动的工作流回放。TODO: 后面会接真正的 Manus 式回放。</span>
          </div>
          <TerminalFeed data={data} />
        </article>

        <article className="bal-panel">
          <div className="bal-panel-head">
            <p className="bal-eyebrow">主题分类</p>
            <h2>按事件主题聚类</h2>
            <span className="bal-section-note">把市场先分成几类房间，再看这支探险队主要在哪几层停留。</span>
          </div>
          <ClusterGrid data={data} />
        </article>

        <article className="bal-panel is-wide">
          <div className="bal-panel-head">
            <p className="bal-eyebrow">持仓注记</p>
            <h2>持仓分析直接连到 X Layer DEX</h2>
            <span className="bal-section-note">每个段落先讲主题分类，再讲为什么继续前进、停留、减仓，还是撤退。</span>
          </div>
          <PositionInsightGrid data={data} compact />
        </article>
      </section>
    </div>
  );
}
