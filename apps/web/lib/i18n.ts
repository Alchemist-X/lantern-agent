export type Locale = "en" | "zh";

export const LOCALE_STORAGE_KEY = "lantern_locale";

export const DEFAULT_LOCALE: Locale = "en";

interface Dictionary {
  // Header KPIs
  total_equity: string;
  cash: string;
  hwm: string;
  drawdown: string;
  vs_hwm: string;
  open_positions: string;

  // Status
  status_running: string;
  status_paused: string;
  status_halted: string;
  updated: string;
  just_now: string;
  minutes_ago: (n: number) => string;
  hours_ago: (n: number) => string;
  days_ago: (n: number) => string;
  na: string;

  // Thesis section
  thesis_title: string;
  thesis_intro: string;
  thesis_point_1_title: string;
  thesis_point_1_body: string;
  thesis_point_2_title: string;
  thesis_point_2_body: string;
  thesis_point_3_title: string;
  thesis_point_3_body: string;

  // Equity chart
  cumulative_pnl: string;
  equity_curve: string;
  high: string;
  low: string;
  pnl_label: string;
  no_trade_data: string;
  no_equity_data: string;

  // Positions
  positions_title: string;
  positions_open: (n: number) => string;
  positions_profitable: (n: number) => string;
  market_value: string;
  col_market: string;
  col_side: string;
  col_shares: string;
  col_entry: string;
  col_current: string;
  col_cost_basis: string;
  col_value: string;
  col_unreal_pnl: string;
  col_pnl_pct: string;
  col_weight: string;
  col_held: string;
  no_open_positions: string;

  // PNL Summary
  pnl_summary_title: string;
  net_pnl: string;
  unrealized: string;
  realized: string;
  cost_basis: string;
  market_value_label: string;
  closed_markets: (n: number) => string;
  top_movers: string;

  // Activity
  recent_trades: string;
  total_trades: (n: number) => string;
  no_recent_trades: string;
  filled: string;
  fill_pct: (pct: number) => string;

  // Language toggle
  lang_label: string;
}

const en: Dictionary = {
  total_equity: "Total Equity",
  cash: "Cash",
  hwm: "HWM",
  drawdown: "Drawdown",
  vs_hwm: "vs HWM",
  open_positions: "Open Positions",

  status_running: "Running",
  status_paused: "Paused",
  status_halted: "Halted",
  updated: "Updated",
  just_now: "just now",
  minutes_ago: (n) => `${n}m ago`,
  hours_ago: (n) => `${n}h ago`,
  days_ago: (n) => `${n}d ago`,
  na: "N/A",

  thesis_title: "Why Agents Trade DEX Token Pairs",
  thesis_intro:
    "Built around Market Pulse \u2014 AI autonomously discovers token pairs on X Layer DEX, dynamically gathers on-chain and off-chain evidence, and generates trade signals using Kelly Criterion sizing.",
  thesis_point_1_title: "Complex reasoning approaching human level",
  thesis_point_1_body:
    "Agent reasoning on complex tasks is converging with human ability. Humans still have better information sources \u2014 but that gap can be closed through engineering. The core analytical capability is already there.",
  thesis_point_2_title: "Broader coverage, faster response",
  thesis_point_2_body:
    "Agents monitor hundreds of token pairs 24/7, spotting mispricings no individual can track. When on-chain signals fire, agents react in seconds; humans need 3+ minutes at best.",
  thesis_point_3_title: "Blue ocean in emerging DEX pairs",
  thesis_point_3_body:
    "Most DEX participants lack formal pricing models and fear inventory risk. Emerging token pairs on X Layer remain underserved by systematic strategies \u2014 a rare window for agent-driven alpha.",

  cumulative_pnl: "Cumulative P&L",
  equity_curve: "Equity Curve",
  high: "High",
  low: "Low",
  pnl_label: "P&L",
  no_trade_data: "No trade data available to build P&L chart.",
  no_equity_data: "No equity history available yet.",

  positions_title: "Open Positions",
  positions_open: (n) => `${n} open`,
  positions_profitable: (n) => `${n} profitable`,
  market_value: "market value",
  col_market: "Market",
  col_side: "Side",
  col_shares: "Shares",
  col_entry: "Entry",
  col_current: "Current",
  col_cost_basis: "Cost Basis",
  col_value: "Value",
  col_unreal_pnl: "Unreal. PnL",
  col_pnl_pct: "PnL %",
  col_weight: "Weight",
  col_held: "Held",
  no_open_positions: "No open positions.",

  pnl_summary_title: "P&L Summary",
  net_pnl: "Net P&L",
  unrealized: "Unrealized",
  realized: "Realized",
  cost_basis: "Cost Basis",
  market_value_label: "Market Value",
  closed_markets: (n) => `${n} closed markets`,
  top_movers: "Top Movers",

  recent_trades: "Recent Trades",
  total_trades: (n) => `${n} total trades`,
  no_recent_trades: "No recent trades.",
  filled: "filled",
  fill_pct: (pct) => `(${pct.toFixed(0)}% fill)`,

  lang_label: "EN"
};

const zh: Dictionary = {
  total_equity: "\u603B\u6743\u76CA",
  cash: "\u73B0\u91D1",
  hwm: "\u5386\u53F2\u9AD8\u70B9",
  drawdown: "\u56DE\u64A4",
  vs_hwm: "\u8DDD\u9AD8\u70B9",
  open_positions: "\u5F00\u4ED3\u6570",

  status_running: "\u8FD0\u884C\u4E2D",
  status_paused: "\u5DF2\u6682\u505C",
  status_halted: "\u5DF2\u505C\u673A",
  updated: "\u66F4\u65B0\u4E8E",
  just_now: "\u521A\u521A",
  minutes_ago: (n) => `${n}\u5206\u949F\u524D`,
  hours_ago: (n) => `${n}\u5C0F\u65F6\u524D`,
  days_ago: (n) => `${n}\u5929\u524D`,
  na: "\u65E0",

  thesis_title: "\u4E3A\u4EC0\u4E48\u8BA9 Agent \u4EA4\u6613 DEX \u4EE3\u5E01\u5BF9",
  thesis_intro:
    "\u672C\u7CFB\u7EDF\u57FA\u4E8E Market Pulse \u8FD9\u4E2A\u6838\u5FC3\u7EC4\u4EF6\uFF0C\u8BA9 AI \u81EA\u4E3B\u53D1\u73B0 X Layer DEX \u4E0A\u7684\u4EE3\u5E01\u5BF9\uFF0C\u52A8\u6001\u5730\u4ECE\u94FE\u4E0A\u548C\u94FE\u4E0B\u6536\u96C6\u8BC1\u636E\uFF0C\u7136\u540E\u4F7F\u7528 Kelly Criterion \u751F\u6210\u4EA4\u6613\u4FE1\u53F7\u3002",
  thesis_point_1_title: "\u590D\u6742\u4EFB\u52A1\u63A8\u7406\u80FD\u529B\u8D8B\u8FD1\u4EBA\u7C7B",
  thesis_point_1_body:
    "Agent \u5728\u590D\u6742\u4EFB\u52A1\u4E0A\u7684\u63A8\u7406\u80FD\u529B\u5DF2\u7ECF\u63A5\u8FD1\u4EBA\u7C7B\u6C34\u5E73\u3002\u4EBA\u7C7B\u7684\u4F18\u52BF\u4E3B\u8981\u5728\u4E8E\u66F4\u597D\u7684\u4FE1\u606F\u6E90\uFF0C\u4F46\u8FD9\u4E00\u5DEE\u8DDD\u53EF\u4EE5\u901A\u8FC7\u5DE5\u7A0B\u80FD\u529B\u5F25\u5408\u3002\u6838\u5FC3\u5206\u6790\u80FD\u529B\u5DF2\u7ECF\u5230\u4F4D\u3002",
  thesis_point_2_title: "\u8986\u76D6\u9762\u5E7F\u4E14\u65F6\u6548\u6027\u5F3A",
  thesis_point_2_body:
    "Agent \u80FD 7\u00D724 \u5C0F\u65F6\u540C\u65F6\u76D1\u63A7\u6570\u5343\u4E2A\u5E02\u573A\uFF0C\u53D1\u73B0\u4EFB\u4F55\u4E2A\u4EBA\u65E0\u6CD5\u8DDF\u8E2A\u7684\u5B9A\u4EF7\u5931\u8C03\u3002\u65B0\u95FB\u7206\u53D1\u65F6 Agent \u79D2\u7EA7\u54CD\u5E94\uFF0C\u4EBA\u7C7B\u5219\u81F3\u5C11\u9700\u8981 3 \u5206\u949F\u4EE5\u4E0A\u3002",
  thesis_point_3_title: "\u65B0\u5174 DEX \u4EE3\u5E01\u5BF9\u4ECD\u5904\u4E8E\u84DD\u6D77",
  thesis_point_3_body:
    "X Layer DEX \u4E0A\u7684\u65B0\u5174\u4EE3\u5E01\u5BF9\u4E2D\uFF0C\u591A\u6570\u53C2\u4E0E\u8005\u7F3A\u4E4F\u6E05\u6670\u7684\u5B9A\u4EF7\u6A21\u578B\uFF0C\u4E14\u666E\u904D\u754F\u60E7\u5E93\u5B58\u7BA1\u7406\u548C\u9006\u5411\u9009\u62E9\u98CE\u9669\u3002\u7CFB\u7EDF\u5316\u7684 Agent \u4EA4\u6613\u5728\u8FD9\u4E9B\u9886\u57DF\u9762\u4E34\u7684\u7ADE\u4E89\u6781\u5C11\u3002",

  cumulative_pnl: "\u7D2F\u8BA1\u76C8\u4E8F",
  equity_curve: "\u6743\u76CA\u66F2\u7EBF",
  high: "\u6700\u9AD8",
  low: "\u6700\u4F4E",
  pnl_label: "\u76C8\u4E8F",
  no_trade_data: "\u6CA1\u6709\u8DB3\u591F\u7684\u4EA4\u6613\u6570\u636E\u6765\u751F\u6210\u76C8\u4E8F\u56FE\u3002",
  no_equity_data: "\u6682\u65E0\u6743\u76CA\u5386\u53F2\u6570\u636E\u3002",

  positions_title: "\u5F00\u4ED3\u4ED3\u4F4D",
  positions_open: (n) => `${n} \u4E2A\u5F00\u4ED3`,
  positions_profitable: (n) => `${n} \u4E2A\u76C8\u5229`,
  market_value: "\u5E02\u503C",
  col_market: "\u5E02\u573A",
  col_side: "\u65B9\u5411",
  col_shares: "\u4EFD\u989D",
  col_entry: "\u5165\u573A\u4EF7",
  col_current: "\u5F53\u524D\u4EF7",
  col_cost_basis: "\u6210\u672C",
  col_value: "\u5E02\u503C",
  col_unreal_pnl: "\u672A\u5B9E\u73B0\u76C8\u4E8F",
  col_pnl_pct: "\u76C8\u4E8F%",
  col_weight: "\u6743\u91CD",
  col_held: "\u6301\u4ED3\u65F6\u95F4",
  no_open_positions: "\u6CA1\u6709\u5F00\u4ED3\u4ED3\u4F4D\u3002",

  pnl_summary_title: "\u76C8\u4E8F\u6458\u8981",
  net_pnl: "\u51C0\u76C8\u4E8F",
  unrealized: "\u672A\u5B9E\u73B0",
  realized: "\u5DF2\u5B9E\u73B0",
  cost_basis: "\u6210\u672C\u57FA\u7840",
  market_value_label: "\u5E02\u503C",
  closed_markets: (n) => `${n} \u4E2A\u5DF2\u5E73\u4ED3\u5E02\u573A`,
  top_movers: "\u6D3E\u52A8\u6700\u5927",

  recent_trades: "\u6700\u8FD1\u4EA4\u6613",
  total_trades: (n) => `\u5171 ${n} \u7B14\u4EA4\u6613`,
  no_recent_trades: "\u6CA1\u6709\u6700\u8FD1\u4EA4\u6613\u3002",
  filled: "\u5DF2\u6210\u4EA4",
  fill_pct: (pct) => `(\u6210\u4EA4 ${pct.toFixed(0)}%)`,

  lang_label: "\u4E2D"
};

const dictionaries: Record<Locale, Dictionary> = { en, zh };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

export type { Dictionary };
