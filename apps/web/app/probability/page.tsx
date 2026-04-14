import type { Metadata } from "next";
import { ProbabilityWaterfall } from "../../components/probability-waterfall";

export const metadata: Metadata = {
  title: "Probability Engine \u2014 Lantern Agent",
};

// Mock data demonstrating a BTC prediction market analysis.
// In production this would come from an API route backed by the orchestrator.
const MOCK_RESULT = {
  target: {
    tokenSymbol: "BTC",
    currentPrice: 74800,
    strikePrice: 76000,
    hoursToExpiry: 26,
    direction: "above" as const,
  },
  prior: 0.34,
  posterior: 0.68,
  confidence: "HIGH" as const,
  steps: [
    {
      label: "\u6CE2\u52A8\u7387\u6A21\u578B",
      description:
        "Black-Scholes \u57FA\u7840\u6982\u7387 (\u5E74\u5316\u6CE2\u52A8\u7387 \u03C3=62%, EWMA\u52A0\u6743)",
      probabilityBefore: 0.5,
      probabilityAfter: 0.34,
      delta: -0.16,
      type: "prior" as const,
    },
    {
      label: "\u5386\u53F2\u9891\u7387\u6821\u9A8C",
      description:
        "\u8FC7\u53BB 720 \u68391H K\u7EBF\u4E2D\uFF0C\u7C7B\u4F3C\u6DA8\u5E45\u51FA\u73B0 38.2% \u7684\u65F6\u95F4",
      probabilityBefore: 0.34,
      probabilityAfter: 0.36,
      delta: 0.02,
      type: "prior" as const,
    },
    {
      label: "\uD83D\uDCC8 \u806A\u660E\u94B1\u51C0\u4E70\u5165",
      description: "$340K net buy (\u4F3C\u7136\u6BD4 1.65\u00D7)",
      probabilityBefore: 0.36,
      probabilityAfter: 0.48,
      delta: 0.12,
      type: "signal" as const,
      signal: {
        name: "smart_money_net_buy",
        displayName: "\u806A\u660E\u94B1\u51C0\u4E70\u5165",
        category: "smart_money" as const,
        direction: "bullish" as const,
        likelihoodRatio: 1.65,
        magnitude: "$340K net buy",
        source: "onchainos signal list",
        timestamp: Date.now(),
      },
    },
    {
      label: "\uD83D\uDCC8 3 \u4E2A\u806A\u660E\u94B1\u94B1\u5305\u5171\u8BC6\u4E70\u5165",
      description:
        "3 wallets buying simultaneously (\u4F3C\u7136\u6BD4 1.90\u00D7)",
      probabilityBefore: 0.48,
      probabilityAfter: 0.59,
      delta: 0.11,
      type: "signal" as const,
      signal: {
        name: "consensus_buy",
        displayName:
          "3 \u4E2A\u806A\u660E\u94B1\u94B1\u5305\u5171\u8BC6\u4E70\u5165",
        category: "smart_money" as const,
        direction: "bullish" as const,
        likelihoodRatio: 1.9,
        magnitude: "3 wallets buying simultaneously",
        source: "onchainos signal list --min-address-count",
        timestamp: Date.now(),
      },
    },
    {
      label: "\uD83D\uDCC8 \u653E\u91CF\u4E0A\u6DA8",
      description:
        "\u4EA4\u6613\u91CF +65%, \u4EF7\u683C +1.2% (\u4F3C\u7136\u6BD4 1.40\u00D7)",
      probabilityBefore: 0.59,
      probabilityAfter: 0.65,
      delta: 0.06,
      type: "signal" as const,
      signal: {
        name: "volume_spike_up",
        displayName: "\u653E\u91CF\u4E0A\u6DA8",
        category: "volume" as const,
        direction: "bullish" as const,
        likelihoodRatio: 1.4,
        magnitude: "\u4EA4\u6613\u91CF +65%, \u4EF7\u683C +1.2%",
        source: "onchainos token price-info",
        timestamp: Date.now(),
      },
    },
    {
      label: "\uD83D\uDCC8 4\u5C0F\u65F6\u52A8\u91CF\u4E0A\u5347",
      description: "+2.3% in 4h (\u4F3C\u7136\u6BD4 1.20\u00D7)",
      probabilityBefore: 0.65,
      probabilityAfter: 0.68,
      delta: 0.03,
      type: "signal" as const,
      signal: {
        name: "momentum_4h_up",
        displayName: "4\u5C0F\u65F6\u52A8\u91CF\u4E0A\u5347",
        category: "momentum" as const,
        direction: "bullish" as const,
        likelihoodRatio: 1.2,
        magnitude: "+2.3% in 4h",
        source: "onchainos market kline --bar 4H",
        timestamp: Date.now(),
      },
    },
  ],
  signals: [],
  volatility: {
    hourly: 0.0066,
    annualized: 0.62,
    method: "ewma" as const,
  },
  metadata: {
    klinesUsed: 720,
    timeframeBar: "1H",
    calculatedAt: new Date().toISOString(),
  },
} as const;

const MOCK_POLYMARKET_PRICE = 0.58;

export default function ProbabilityPage() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 16px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
        Probability Engine
      </h1>
      <p style={{ color: "#888", fontSize: 14, marginBottom: 32 }}>
        Bayesian probability estimation with on-chain signal fusion
      </p>
      <ProbabilityWaterfall
        result={MOCK_RESULT}
        polymarketPrice={MOCK_POLYMARKET_PRICE}
      />
    </div>
  );
}
