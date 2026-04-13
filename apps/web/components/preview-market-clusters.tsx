import type { PreviewDashboardData, PreviewMarketCluster } from "../lib/preview-dashboard";
import { buildMarketUrl, formatMarketLabel } from "../lib/preview-dashboard";
import { formatDate, formatUsd } from "../lib/format";

function clusterBadgeLabel(cluster: PreviewMarketCluster): string {
  return `${cluster.item_count} 个市场 · ${formatUsd(cluster.total_value_usd)}`;
}

export function PreviewMarketClusters({ data }: { data: PreviewDashboardData }) {
  return (
    <div className="preview-root preview-clusters-page">
      <section className="preview-clusters-hero">
        <div>
          <p className="preview-eyebrow">Clusters / Market Map</p>
          <h1>把市场按主题聚类，政治和体育先被分开看。</h1>
          <p className="preview-note">
            这里的聚类是本地派生的展示层，不是后端新增字段。它只是把公开市场按规则分组，方便围观者先扫主题，再点进单个市场。
          </p>
        </div>

        <aside className="preview-clusters-rail">
          <article>
            <span>聚类数</span>
            <strong>{data.clusters.length}</strong>
          </article>
          <article>
            <span>持仓市场</span>
            <strong>{data.positions.length}</strong>
          </article>
          <article>
            <span>最近成交</span>
            <strong>{data.recentTrades.length}</strong>
          </article>
          <article>
            <span>pulse 样本</span>
            <strong>{data.pulseExamples.length}</strong>
          </article>
        </aside>
      </section>

      <section className="preview-clusters-grid">
        {data.marketClusters.map((cluster) => (
          <article key={cluster.key} className="preview-cluster-card">
            <div className="preview-cluster-head">
              <div>
                <p className="preview-eyebrow">{cluster.label}</p>
                <h2>{cluster.description}</h2>
              </div>
              <span>{clusterBadgeLabel(cluster)}</span>
            </div>

            <div className="preview-cluster-list">
              {cluster.items.map((item) => (
                <article key={`${cluster.key}-${item.id}`}>
                  <div>
                    <strong>{formatMarketLabel(item.pair_slug)}</strong>
                    <p>{item.source_tags.join(" / ")}</p>
                  </div>
                  <div className="preview-cluster-meta">
                    <span>{formatUsd(item.value_usd)}</span>
                    <span>{item.last_seen_at_utc ? formatDate(item.last_seen_at_utc) : "暂无"}</span>
                    <a href={buildMarketUrl(item.token_symbol, item.pair_slug)} target="_blank" rel="noreferrer">
                      View on X Layer
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="preview-clusters-grid">
        <article className="preview-cluster-card">
          <div className="preview-cluster-head">
            <div>
              <p className="preview-eyebrow">Position analysis</p>
              <h2>更细的持仓分析</h2>
            </div>
            <span>{data.positionInsights.length} 条</span>
          </div>
          <div className="preview-cluster-list">
            {data.positionInsights.slice(0, 6).map((insight) => (
              <article key={insight.id}>
                <div>
                  <strong>{insight.title}</strong>
                  <p>{insight.analysis_md}</p>
                </div>
                <div className="preview-cluster-meta">
                  <span>{insight.cluster_label}</span>
                  <span>{formatUsd(insight.current_value_usd)}</span>
                  <a href={insight.market_url} target="_blank" rel="noreferrer">
                    View on X Layer
                  </a>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
