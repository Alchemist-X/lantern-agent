export interface DrawdownSnapshot {
  totalEquityUsd: number;
  highWaterMarkUsd: number;
}

export function calculateDrawdownPct(snapshot: DrawdownSnapshot): number {
  if (snapshot.highWaterMarkUsd <= 0) {
    return 0;
  }
  const drop = snapshot.highWaterMarkUsd - snapshot.totalEquityUsd;
  return Math.max(0, drop / snapshot.highWaterMarkUsd);
}

export function shouldHaltForDrawdown(snapshot: DrawdownSnapshot, thresholdPct: number): boolean {
  return calculateDrawdownPct(snapshot) >= thresholdPct;
}

export interface KellyInput {
  aiProb: number;
  marketProb: number;
  bankrollUsd: number;
}

export interface KellyOutput {
  fullKellyPct: number;
  quarterKellyPct: number;
  quarterKellyUsd: number;
}

export function calculateQuarterKelly(input: KellyInput): KellyOutput {
  if (input.marketProb <= 0 || input.marketProb >= 1 || input.aiProb <= input.marketProb) {
    return {
      fullKellyPct: 0,
      quarterKellyPct: 0,
      quarterKellyUsd: 0
    };
  }

  const fullKellyPct = Math.max(0, (input.aiProb - input.marketProb) / (1 - input.marketProb));
  const quarterKellyPct = fullKellyPct / 4;
  return {
    fullKellyPct,
    quarterKellyPct,
    quarterKellyUsd: input.bankrollUsd * quarterKellyPct
  };
}

export interface TradeGuardInput {
  requestedUsd: number;
  bankrollUsd: number;
  minTradeUsd?: number;
  maxTradePct: number;
  liquidityCapUsd: number;
  totalExposureUsd: number;
  maxTotalExposurePct: number;
  eventExposureUsd?: number;
  maxEventExposurePct?: number;
  openPositions: number;
  maxPositions: number;
}

export type TradeGuardConstraint =
  | "max_trade_pct"
  | "total_exposure"
  | "event_exposure"
  | "max_positions"
  | "liquidity_cap"
  | "min_trade"
  | "requested"
  | "none";

export interface TradeGuardConstraintDetail {
  readonly label: TradeGuardConstraint;
  readonly limit: number;
  readonly headroom: number;
}

export interface TradeGuardResult {
  readonly amount: number;
  readonly bindingConstraint: TradeGuardConstraint;
  readonly constraints: readonly TradeGuardConstraintDetail[];
}

function buildConstraintDetail(
  label: TradeGuardConstraint,
  limit: number,
  headroom: number
): TradeGuardConstraintDetail {
  return { label, limit, headroom };
}

function findBindingConstraint(
  constraints: readonly TradeGuardConstraintDetail[]
): TradeGuardConstraint {
  let minHeadroom = Number.POSITIVE_INFINITY;
  let binding: TradeGuardConstraint = "none";
  for (const c of constraints) {
    if (c.headroom < minHeadroom) {
      minHeadroom = c.headroom;
      binding = c.label;
    }
  }
  return binding;
}

export function applyTradeGuardsDetailed(input: TradeGuardInput): TradeGuardResult {
  const maxTradeLimit = input.bankrollUsd * input.maxTradePct;
  const totalExposureLimit = input.bankrollUsd * input.maxTotalExposurePct;
  const exposureHeadroom = Math.max(0, totalExposureLimit - input.totalExposureUsd);
  const hasEventCap = typeof input.maxEventExposurePct === "number";
  const eventExposureLimit = hasEventCap
    ? input.bankrollUsd * (input.maxEventExposurePct as number)
    : Number.POSITIVE_INFINITY;
  const eventExposureHeadroom = hasEventCap
    ? Math.max(0, eventExposureLimit - (input.eventExposureUsd ?? 0))
    : Number.POSITIVE_INFINITY;
  const minTradeUsd = input.minTradeUsd ?? 10;

  // USD-denominated constraints participate in binding-constraint comparison
  const usdConstraints: TradeGuardConstraintDetail[] = [
    buildConstraintDetail("requested", input.requestedUsd, input.requestedUsd),
    buildConstraintDetail("max_trade_pct", maxTradeLimit, maxTradeLimit),
    buildConstraintDetail("liquidity_cap", input.liquidityCapUsd, input.liquidityCapUsd),
    buildConstraintDetail("total_exposure", totalExposureLimit, exposureHeadroom),
    buildConstraintDetail("event_exposure", eventExposureLimit, eventExposureHeadroom)
  ];

  // max_positions is a count-based gate, tracked separately
  const positionsDetail = buildConstraintDetail(
    "max_positions",
    input.maxPositions,
    input.maxPositions - input.openPositions
  );
  const constraints: TradeGuardConstraintDetail[] = [...usdConstraints, positionsDetail];

  if (input.openPositions >= input.maxPositions) {
    return {
      amount: 0,
      bindingConstraint: "max_positions",
      constraints
    };
  }

  const hardCap = Math.min(input.requestedUsd, maxTradeLimit, input.liquidityCapUsd);
  const amount = Math.min(hardCap, exposureHeadroom, eventExposureHeadroom);

  if (amount < minTradeUsd) {
    const belowMinConstraints: TradeGuardConstraintDetail[] = [
      ...constraints,
      buildConstraintDetail("min_trade", minTradeUsd, amount >= minTradeUsd ? amount : 0)
    ];
    const preMinBinding = findBindingConstraint(usdConstraints);
    return {
      amount: 0,
      bindingConstraint: amount <= 0 ? preMinBinding : "min_trade",
      constraints: belowMinConstraints
    };
  }

  return {
    amount,
    bindingConstraint: findBindingConstraint(usdConstraints),
    constraints
  };
}

/** Backward-compatible wrapper that returns only the final amount. */
export function applyTradeGuards(input: TradeGuardInput): number {
  return applyTradeGuardsDetailed(input).amount;
}
