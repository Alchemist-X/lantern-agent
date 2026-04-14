/**
 * Bayesian Probability Engine
 *
 * Converts K-line data + on-chain signals into calibrated probabilities
 * for prediction market trading (e.g., "BTC above $76K in 26 hours?").
 *
 * Output includes a step-by-step trace for waterfall visualization.
 */

// ─── Types ───

export interface PriceTarget {
  readonly tokenSymbol: string;
  readonly currentPrice: number;
  readonly strikePrice: number;
  readonly hoursToExpiry: number;
  readonly direction: "above" | "below";
}

export interface Kline {
  readonly ts: number;
  readonly o: number;
  readonly h: number;
  readonly l: number;
  readonly c: number;
  readonly vol: number;
  readonly volUsd: number;
}

export interface SignalEvent {
  readonly name: string;
  readonly displayName: string;
  readonly category:
    | "smart_money"
    | "whale"
    | "volume"
    | "momentum"
    | "security";
  readonly direction: "bullish" | "bearish" | "neutral";
  readonly likelihoodRatio: number; // >1 = bullish, <1 = bearish, =1 = no info
  readonly magnitude: string; // human-readable: "$2.3M net buy", "+65% volume"
  readonly source: string; // onchainos command that produced this
  readonly timestamp: number;
}

export interface ProbabilityStep {
  readonly label: string;
  readonly description: string;
  readonly probabilityBefore: number;
  readonly probabilityAfter: number;
  readonly delta: number; // probabilityAfter - probabilityBefore
  readonly type: "prior" | "signal" | "adjustment";
  readonly signal?: SignalEvent;
}

export interface ProbabilityResult {
  readonly target: PriceTarget;
  readonly prior: number; // Base probability from volatility model
  readonly posterior: number; // Final probability after all signals
  readonly confidence: "HIGH" | "MEDIUM" | "LOW";
  readonly steps: ProbabilityStep[]; // Waterfall trace
  readonly signals: SignalEvent[]; // All detected signals
  readonly volatility: {
    readonly hourly: number;
    readonly annualized: number;
    readonly method: "ewma" | "simple";
  };
  readonly metadata: {
    readonly klinesUsed: number;
    readonly timeframeBar: string;
    readonly calculatedAt: string;
  };
}

// ─── Normal Distribution CDF (Abramowitz & Stegun approximation) ───

function normalCdf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const t = 1 / (1 + p * Math.abs(x));
  const y =
    1 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) *
      t *
      Math.exp((-x * x) / 2);
  return 0.5 * (1 + sign * y);
}

// ─── Volatility Calculation ───

function computeReturns(klines: readonly Kline[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < klines.length; i++) {
    const prev = klines[i - 1]!.c;
    const curr = klines[i]!.c;
    if (prev > 0 && curr > 0) {
      returns.push(Math.log(curr / prev));
    }
  }
  return returns;
}

function simpleVolatility(returns: readonly number[]): number {
  if (returns.length < 2) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((a, r) => a + (r - mean) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(variance);
}

function ewmaVolatility(
  returns: readonly number[],
  lambda = 0.94,
): number {
  if (returns.length < 2) return 0;
  let variance = returns[0]! ** 2;
  for (let i = 1; i < returns.length; i++) {
    variance = lambda * variance + (1 - lambda) * returns[i]! ** 2;
  }
  return Math.sqrt(variance);
}

// ─── Black-Scholes Prior ───

function blackScholesProbability(
  currentPrice: number,
  strikePrice: number,
  hoursToExpiry: number,
  annualizedVol: number,
  direction: "above" | "below",
): number {
  if (hoursToExpiry <= 0) {
    return direction === "above"
      ? currentPrice > strikePrice
        ? 1
        : 0
      : currentPrice < strikePrice
        ? 1
        : 0;
  }

  const T = hoursToExpiry / 8760;
  const sqrtT = Math.sqrt(T);

  if (annualizedVol * sqrtT < 1e-10) {
    return direction === "above"
      ? currentPrice > strikePrice
        ? 1
        : 0
      : currentPrice < strikePrice
        ? 1
        : 0;
  }

  const d2 =
    (Math.log(currentPrice / strikePrice) + (-(annualizedVol ** 2) / 2) * T) /
    (annualizedVol * sqrtT);

  const probAbove = normalCdf(d2);
  return direction === "above" ? probAbove : 1 - probAbove;
}

// ─── Empirical Frequency (non-parametric cross-check) ───

function empiricalFrequency(
  klines: readonly Kline[],
  targetReturn: number,
  windowBars: number,
): number | null {
  if (klines.length < windowBars + 10) return null;

  let total = 0;
  let hits = 0;

  for (let i = 0; i <= klines.length - windowBars - 1; i++) {
    const start = klines[i]!.c;
    const end = klines[i + windowBars]!.c;
    if (start <= 0) continue;
    const ret = (end - start) / start;
    total++;
    if (ret > targetReturn) hits++;
  }

  return total > 0 ? hits / total : null;
}

// ─── Bayesian Update ───

function bayesianUpdate(prior: number, likelihoodRatio: number): number {
  // Clamp to avoid 0 or 1 (log-odds explosion)
  const p = Math.max(0.01, Math.min(0.99, prior));
  const posterior = (p * likelihoodRatio) / (p * likelihoodRatio + (1 - p));
  return Math.max(0.01, Math.min(0.99, posterior));
}

// ─── Main: Compute Probability with Trace ───

export function computeProbability(
  target: PriceTarget,
  klines: readonly Kline[],
  signals: readonly SignalEvent[],
): ProbabilityResult {
  const steps: ProbabilityStep[] = [];
  const returns = computeReturns(klines);

  // Step 1: Compute volatility
  const hourlyVolSimple = simpleVolatility(returns);
  const hourlyVolEwma = ewmaVolatility(returns);
  const hourlyVol = hourlyVolEwma > 0 ? hourlyVolEwma : hourlyVolSimple;
  const annualizedVol = hourlyVol * Math.sqrt(8760);
  const volMethod: "ewma" | "simple" =
    hourlyVolEwma > 0 ? "ewma" : "simple";

  // Step 2: Black-Scholes prior
  const bsPrior = blackScholesProbability(
    target.currentPrice,
    target.strikePrice,
    target.hoursToExpiry,
    annualizedVol,
    target.direction,
  );

  // Step 3: Empirical cross-check
  const targetReturn =
    (target.strikePrice - target.currentPrice) / target.currentPrice;
  const empirical = empiricalFrequency(
    klines,
    targetReturn,
    Math.round(target.hoursToExpiry),
  );

  // Blend prior: if empirical data available, 50/50 blend; otherwise pure BS
  let blendedPrior: number;
  if (empirical !== null && klines.length > 200) {
    blendedPrior = 0.5 * bsPrior + 0.5 * empirical;
    steps.push({
      label: "波动率模型",
      description: `Black-Scholes: ${(bsPrior * 100).toFixed(1)}% (σ=${(annualizedVol * 100).toFixed(0)}%)`,
      probabilityBefore: 0.5,
      probabilityAfter: bsPrior,
      delta: bsPrior - 0.5,
      type: "prior",
    });
    steps.push({
      label: "历史频率校验",
      description: `过去 ${klines.length} 根K线中，类似涨幅出现 ${(empirical * 100).toFixed(1)}% 的时间`,
      probabilityBefore: bsPrior,
      probabilityAfter: blendedPrior,
      delta: blendedPrior - bsPrior,
      type: "prior",
    });
  } else {
    blendedPrior = bsPrior;
    steps.push({
      label: "波动率模型",
      description: `Black-Scholes 基础概率 (年化波动率 σ=${(annualizedVol * 100).toFixed(0)}%, EWMA加权)`,
      probabilityBefore: 0.5,
      probabilityAfter: bsPrior,
      delta: bsPrior - 0.5,
      type: "prior",
    });
  }

  // Step 4: Bayesian signal updates
  let currentProb = blendedPrior;

  // Sort signals: strongest likelihood ratio deviation first
  const sortedSignals = [...signals].sort(
    (a, b) =>
      Math.abs(Math.log(b.likelihoodRatio)) -
      Math.abs(Math.log(a.likelihoodRatio)),
  );

  for (const signal of sortedSignals) {
    if (Math.abs(signal.likelihoodRatio - 1) < 0.01) continue; // skip no-info signals

    const before = currentProb;
    currentProb = bayesianUpdate(currentProb, signal.likelihoodRatio);

    const directionEmoji =
      signal.direction === "bullish"
        ? "\u{1F4C8}"
        : signal.direction === "bearish"
          ? "\u{1F4C9}"
          : "\u27A1\uFE0F";

    steps.push({
      label: `${directionEmoji} ${signal.displayName}`,
      description: `${signal.magnitude} (似然比 ${signal.likelihoodRatio.toFixed(2)}\u00D7)`,
      probabilityBefore: before,
      probabilityAfter: currentProb,
      delta: currentProb - before,
      type: "signal",
      signal,
    });
  }

  // Determine confidence
  const signalCount = signals.filter(
    (s) => Math.abs(s.likelihoodRatio - 1) >= 0.1,
  ).length;
  const totalShift = Math.abs(currentProb - blendedPrior);
  const confidence: "HIGH" | "MEDIUM" | "LOW" =
    signalCount >= 3 && totalShift > 0.1
      ? "HIGH"
      : signalCount >= 1 && totalShift > 0.03
        ? "MEDIUM"
        : "LOW";

  return {
    target,
    prior: blendedPrior,
    posterior: currentProb,
    confidence,
    steps,
    signals: sortedSignals,
    volatility: {
      hourly: hourlyVol,
      annualized: annualizedVol,
      method: volMethod,
    },
    metadata: {
      klinesUsed: klines.length,
      timeframeBar:
        klines.length > 500 ? "5m" : klines.length > 100 ? "1H" : "4H",
      calculatedAt: new Date().toISOString(),
    },
  };
}

// ─── Helper: Build signals from onchainos data ───

export interface RawOnchainData {
  readonly smartMoneyBuys?: { count: number; totalUsd: number };
  readonly smartMoneySells?: { count: number; totalUsd: number };
  readonly whaleExchangeInflow?: boolean;
  readonly signalConsensusCount?: number;
  readonly volume24hChange?: number; // e.g., 0.65 = +65%
  readonly priceChange1h?: number; // e.g., 0.012 = +1.2%
  readonly priceChange4h?: number;
  readonly topHolderConcentration?: number; // 0-1
  readonly isHoneypot?: boolean;
}

export function buildSignalsFromOnchainData(
  data: RawOnchainData,
): SignalEvent[] {
  const now = Date.now();
  const signals: SignalEvent[] = [];

  // Smart money net flow
  const netBuyUsd =
    (data.smartMoneyBuys?.totalUsd ?? 0) -
    (data.smartMoneySells?.totalUsd ?? 0);
  if (Math.abs(netBuyUsd) > 10_000) {
    const isBuy = netBuyUsd > 0;
    const magnitude = `$${(Math.abs(netBuyUsd) / 1000).toFixed(0)}K net ${isBuy ? "buy" : "sell"}`;

    // Scale likelihood ratio by size: $10K = 1.2x, $100K = 1.5x, $1M = 2.0x
    const sizeLog = Math.log10(Math.abs(netBuyUsd) / 10_000); // 0 at $10K, 2 at $1M
    const baseLR = 1 + 0.4 * Math.min(sizeLog, 2); // 1.0 to 1.8

    signals.push({
      name: isBuy ? "smart_money_net_buy" : "smart_money_net_sell",
      displayName: isBuy ? "聪明钱净买入" : "聪明钱净卖出",
      category: "smart_money",
      direction: isBuy ? "bullish" : "bearish",
      likelihoodRatio: isBuy ? baseLR : 1 / baseLR,
      magnitude,
      source: "onchainos signal list",
      timestamp: now,
    });
  }

  // Multi-wallet consensus
  if (
    data.signalConsensusCount !== undefined &&
    data.signalConsensusCount >= 2
  ) {
    const count = data.signalConsensusCount;
    // 2 wallets = 1.3x, 3 = 1.6x, 5+ = 2.2x
    const lr = 1 + 0.3 * Math.min(count, 5);
    signals.push({
      name: "consensus_buy",
      displayName: `${count} 个聪明钱钱包共识买入`,
      category: "smart_money",
      direction: "bullish",
      likelihoodRatio: lr,
      magnitude: `${count} wallets buying simultaneously`,
      source: "onchainos signal list --min-address-count",
      timestamp: now,
    });
  }

  // Whale exchange inflow
  if (data.whaleExchangeInflow) {
    signals.push({
      name: "whale_exchange_inflow",
      displayName: "鲸鱼转入交易所",
      category: "whale",
      direction: "bearish",
      likelihoodRatio: 0.65,
      magnitude: "Large transfer to exchange detected",
      source: "onchainos tracker activities --tracker-type whale",
      timestamp: now,
    });
  }

  // Volume spike + direction
  if (
    data.volume24hChange !== undefined &&
    Math.abs(data.volume24hChange) > 0.3
  ) {
    const volUp = data.volume24hChange > 0;
    const priceUp = (data.priceChange1h ?? 0) > 0.001;
    const priceDown = (data.priceChange1h ?? 0) < -0.001;

    if (volUp && priceUp) {
      signals.push({
        name: "volume_spike_up",
        displayName: "放量上涨",
        category: "volume",
        direction: "bullish",
        likelihoodRatio:
          1.3 + Math.min(data.volume24hChange, 2) * 0.15,
        magnitude: `交易量 +${(data.volume24hChange * 100).toFixed(0)}%, 价格 +${((data.priceChange1h ?? 0) * 100).toFixed(1)}%`,
        source: "onchainos token price-info",
        timestamp: now,
      });
    } else if (volUp && priceDown) {
      signals.push({
        name: "volume_spike_down",
        displayName: "放量下跌",
        category: "volume",
        direction: "bearish",
        likelihoodRatio:
          1 / (1.3 + Math.min(data.volume24hChange, 2) * 0.15),
        magnitude: `交易量 +${(data.volume24hChange * 100).toFixed(0)}%, 价格 ${((data.priceChange1h ?? 0) * 100).toFixed(1)}%`,
        source: "onchainos token price-info",
        timestamp: now,
      });
    }
  }

  // 4h momentum
  if (
    data.priceChange4h !== undefined &&
    Math.abs(data.priceChange4h) > 0.02
  ) {
    const isUp = data.priceChange4h > 0;
    signals.push({
      name: isUp ? "momentum_4h_up" : "momentum_4h_down",
      displayName: isUp ? "4小时动量上升" : "4小时动量下降",
      category: "momentum",
      direction: isUp ? "bullish" : "bearish",
      likelihoodRatio: isUp ? 1.2 : 0.85,
      magnitude: `${(data.priceChange4h * 100).toFixed(1)}% in 4h`,
      source: "onchainos market kline --bar 4H",
      timestamp: now,
    });
  }

  // High holder concentration (risk signal)
  if (
    data.topHolderConcentration !== undefined &&
    data.topHolderConcentration > 0.5
  ) {
    signals.push({
      name: "high_concentration",
      displayName: "Top 10 持仓集中度过高",
      category: "security",
      direction: "bearish",
      likelihoodRatio: 0.75,
      magnitude: `Top 10 持有 ${(data.topHolderConcentration * 100).toFixed(0)}% 供应量`,
      source: "onchainos token holders",
      timestamp: now,
    });
  }

  return signals;
}
