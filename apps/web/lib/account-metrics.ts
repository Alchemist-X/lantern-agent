import type { PublicPosition, PublicTrade } from "@lantern/contracts";

function roundCurrency(value: number): number {
  return Number(value.toFixed(2));
}

function roundMetric(value: number): number {
  return Number(value.toFixed(6));
}

export function calculatePositionCostBasisUsd(position: Pick<PublicPosition, "size" | "avg_cost">): number {
  return roundCurrency(position.size * position.avg_cost);
}

export function calculatePositionUnrealizedPnlUsd(position: Pick<PublicPosition, "size" | "avg_cost" | "current_value_usd">): number {
  return roundCurrency(position.current_value_usd - calculatePositionCostBasisUsd(position));
}

export function calculatePositionUnrealizedPnlPct(position: Pick<PublicPosition, "avg_cost" | "current_price">): number {
  if (!(position.avg_cost > 0)) {
    return 0;
  }
  return roundMetric((position.current_price - position.avg_cost) / position.avg_cost);
}

export function calculatePortfolioCostBasisUsd(positions: PublicPosition[]): number {
  return roundCurrency(positions.reduce((sum, position) => sum + calculatePositionCostBasisUsd(position), 0));
}

export function calculatePortfolioMarketValueUsd(positions: PublicPosition[]): number {
  return roundCurrency(positions.reduce((sum, position) => sum + position.current_value_usd, 0));
}

export function calculatePortfolioUnrealizedPnlUsd(positions: PublicPosition[]): number {
  return roundCurrency(calculatePortfolioMarketValueUsd(positions) - calculatePortfolioCostBasisUsd(positions));
}

export function calculatePortfolioUnrealizedPnlPct(positions: PublicPosition[]): number {
  const costBasis = calculatePortfolioCostBasisUsd(positions);
  if (!(costBasis > 0)) {
    return 0;
  }
  return roundMetric(calculatePortfolioUnrealizedPnlUsd(positions) / costBasis);
}

export function calculatePositionWeightPct(position: PublicPosition, totalEquityUsd: number): number {
  if (!(totalEquityUsd > 0)) {
    return 0;
  }
  return roundMetric(position.current_value_usd / totalEquityUsd);
}

export function getRecentTrades(trades: PublicTrade[], limit = 4): PublicTrade[] {
  return trades.slice(0, limit);
}

export function getTopPositionsByContribution(positions: PublicPosition[], limit = 5): PublicPosition[] {
  return [...positions]
    .sort((left, right) => Math.abs(calculatePositionUnrealizedPnlUsd(right)) - Math.abs(calculatePositionUnrealizedPnlUsd(left)))
    .slice(0, limit);
}
