/**
 * Cash-flow based PNL calculator.
 *
 * Formula:  total_pnl = cash_in - cash_out + current_value
 *
 * Cash-out (money leaving the wallet):
 *   - TRADE BUY
 *   - SPLIT
 *
 * Cash-in (money entering the wallet):
 *   - TRADE SELL
 *   - MERGE
 *   - REDEEM
 *   - CONVERSION (only multi-token conversions with on-chain USDC flow)
 *
 * Current value:
 *   - sum of open position values (share_size × current_price)
 *
 * Note: single negrisk-no-token CONVERSIONs have no cash flow and do not
 * affect PNL. Multi-token conversions may produce cash flow that should be
 * resolved via on-chain transaction data — for now we treat CONVERSION USDC
 * amounts at face value from the activity feed.
 */

export interface ActivityItem {
  type: string;
  side: string | null;
  direction: string | null;
  usdc_size: number;
  share_size: number;
  price: number;
  market_slug: string;
  event_slug: string;
  timestamp?: string;
  transaction_hash?: string;
}

export interface PositionItem {
  current_value_usd: number;
  event_slug: string;
}

const CASH_OUT_TYPES: ReadonlySet<string> = new Set(["TRADE_BUY", "SPLIT"]);
const CASH_IN_TYPES: ReadonlySet<string> = new Set([
  "TRADE_SELL",
  "MERGE",
  "REDEEM",
  "CONVERSION"
]);

function classifyActivity(item: ActivityItem): "cash_in" | "cash_out" | "neutral" {
  const type = item.type.toUpperCase();

  if (type === "TRADE") {
    const side = (item.side ?? "").toUpperCase();
    if (side === "BUY") {
      return "cash_out";
    }
    if (side === "SELL") {
      return "cash_in";
    }
    return "neutral";
  }

  if (type === "SPLIT") {
    return "cash_out";
  }

  if (type === "MERGE" || type === "REDEEM") {
    return "cash_in";
  }

  if (type === "CONVERSION") {
    // Multi-token conversions with non-zero USDC are cash-in.
    // Single negrisk-no-token conversions have usdc_size=0 → neutral.
    return item.usdc_size > 0 ? "cash_in" : "neutral";
  }

  return "neutral";
}

export interface PnlBreakdown {
  cashOut: number;
  cashIn: number;
  currentValue: number;
  totalPnl: number;
}

export function calculatePnl(input: {
  activities: readonly ActivityItem[];
  positions: readonly PositionItem[];
}): PnlBreakdown {
  let cashOut = 0;
  let cashIn = 0;

  for (const item of input.activities) {
    const classification = classifyActivity(item);
    const usdc = Math.abs(item.usdc_size ?? 0);

    if (classification === "cash_out") {
      cashOut += usdc;
    } else if (classification === "cash_in") {
      cashIn += usdc;
    }
  }

  const currentValue = input.positions.reduce(
    (sum, p) => sum + (p.current_value_usd ?? 0),
    0
  );

  return {
    cashOut: Number(cashOut.toFixed(4)),
    cashIn: Number(cashIn.toFixed(4)),
    currentValue: Number(currentValue.toFixed(4)),
    totalPnl: Number((cashIn - cashOut + currentValue).toFixed(2))
  };
}

/**
 * Build cumulative PNL timeline from activities (sorted oldest to newest).
 * Each point represents the running PNL at that trade's timestamp.
 * The final point includes current_value (unrealized).
 */
export function buildPnlTimeline(input: {
  activities: readonly ActivityItem[];
  currentValue: number;
}): Array<{ timestamp: string; pnl: number }> {
  const sorted = [...input.activities]
    .filter((a) => a.timestamp)
    .sort((a, b) => new Date(a.timestamp!).getTime() - new Date(b.timestamp!).getTime());

  if (sorted.length === 0) {
    return [];
  }

  const points: Array<{ timestamp: string; pnl: number }> = [];
  let runningCashIn = 0;
  let runningCashOut = 0;

  for (const item of sorted) {
    const classification = classifyActivity(item);
    const usdc = Math.abs(item.usdc_size ?? 0);

    if (classification === "cash_out") {
      runningCashOut += usdc;
    } else if (classification === "cash_in") {
      runningCashIn += usdc;
    }

    // Realized PNL at this point (excluding unrealized)
    const realizedPnl = runningCashIn - runningCashOut;
    points.push({
      timestamp: item.timestamp!,
      pnl: Number(realizedPnl.toFixed(2))
    });
  }

  // Add final point with unrealized value included
  if (points.length > 0) {
    const lastPoint = points[points.length - 1]!;
    points.push({
      timestamp: new Date().toISOString(),
      pnl: Number((runningCashIn - runningCashOut + input.currentValue).toFixed(2))
    });
  }

  return points;
}
