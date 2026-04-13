import type { PublicPulseRecommendationExample } from "./public-run-pulse";

export const STATIC_PUBLIC_PULSE_RECOMMENDATION_EXAMPLES: PublicPulseRecommendationExample[] = [
  {
    run_id: "7504bda8-c58e-4492-b43a-7c6d64315bcf",
    runtime: "pulse-direct-runtime",
    generated_at_utc: "2026-03-23T14:49:34.215Z",
    pair_slug: "us-x-iran-ceasefire-by-march-31",
    token_symbol: "us-x-iran-ceasefire-by",
    recommended_notional_usd: 2,
    decision_reason_md:
      "full pulse provider 在当前 live 路径下超时，因此这里退化为 deterministic fallback。为了保持链路可执行，这里只对一个最高优先级、流动性合格且点差可接受的二元市场给出 provisional 开仓候选。\n这个 provisional 候选并不是完整研究结论，而是保守的共识跟随启发式：沿用当前市场主方向、把 AI 概率只上调一个受限的固定增量，并把仓位限制在小额范围内。",
    pulse_evidence_status: "missing",
    pulse_missing_reason: "execution-summary 里没有找到 executed trade",
    pulse_title: "市场脉冲 2026-03-23 14:49 UTC [codex]",
    pulse_published_at_utc: "2026-03-23T14:49:34.215Z",
    pulse_excerpt_md: null,
    pulse_markdown_path: "runtime-artifacts/reports/pulse/2026/03/23/pulse-20260323T144934Z-codex-full-7504bda8-c58e-4492-b43a-7c6d64315bcf.md",
    pulse_json_path: "runtime-artifacts/reports/pulse/2026/03/23/pulse-20260323T144934Z-codex-full-7504bda8-c58e-4492-b43a-7c6d64315bcf.json",
    run_summary_path: "runtime-artifacts/pulse-live/2026-03-23T144924Z-7504bda8-c58e-4492-b43a-7c6d64315bcf/run-summary.md",
    execution_summary_path: "runtime-artifacts/pulse-live/2026-03-23T144924Z-7504bda8-c58e-4492-b43a-7c6d64315bcf/execution-summary.json",
    executed_trade_count: 0,
    executed_trades: []
  },
  {
    run_id: "2911461a-1dcb-4186-aab0-7aecc6ad012c",
    runtime: "pulse-direct-runtime",
    generated_at_utc: "2026-03-24T01:23:36.702Z",
    pair_slug: "us-x-iran-ceasefire-by-march-31",
    token_symbol: "us-x-iran-ceasefire-by",
    recommended_notional_usd: 2,
    decision_reason_md:
      "full pulse provider 在当前 live 路径下超时，因此这里退化为 deterministic fallback。为了保持链路可执行，这里只对一个最高优先级、流动性合格且点差可接受的二元市场给出 provisional 开仓候选。\n这个 provisional 候选并不是完整研究结论，而是保守的共识跟随启发式：沿用当前市场主方向、把 AI 概率只上调一个受限的固定增量，并把仓位限制在小额范围内。",
    pulse_evidence_status: "missing",
    pulse_missing_reason: "execution-summary 里没有找到 executed trade",
    pulse_title: "市场脉冲 2026-03-24 01:23 UTC [codex]",
    pulse_published_at_utc: "2026-03-24T01:23:36.702Z",
    pulse_excerpt_md: null,
    pulse_markdown_path: "runtime-artifacts/reports/pulse/2026/03/24/pulse-20260324T012336Z-codex-full-2911461a-1dcb-4186-aab0-7aecc6ad012c.md",
    pulse_json_path: "runtime-artifacts/reports/pulse/2026/03/24/pulse-20260324T012336Z-codex-full-2911461a-1dcb-4186-aab0-7aecc6ad012c.json",
    run_summary_path: "runtime-artifacts/pulse-live/2026-03-24T012317Z-2911461a-1dcb-4186-aab0-7aecc6ad012c/run-summary.md",
    execution_summary_path: "runtime-artifacts/pulse-live/2026-03-24T012317Z-2911461a-1dcb-4186-aab0-7aecc6ad012c/execution-summary.json",
    executed_trade_count: 0,
    executed_trades: []
  },
  {
    run_id: "6ca9b9ec-67a2-4eed-985a-ac7fe9c13f7f",
    runtime: "pulse-direct-runtime",
    generated_at_utc: "2026-03-17T02:17:55.554Z",
    pair_slug: "will-gavin-newsom-win-the-2028-us-presidential-election",
    token_symbol: "presidential-election-winner-2028",
    recommended_notional_usd: 2.16,
    decision_reason_md:
      "该市场核心不是“Newsom 是否强”，而是“单一候选在超长期多结果竞争中被高估的概率”。在外部证据不足时，采用保守 longshot 折价与规则清晰度加权，得到 Yes 10%、No 90%。该估计相对市场 No 82.35% 仍有中等正 edge，但因信息增量有限，置信度仅中。",
    pulse_evidence_status: "missing",
    pulse_missing_reason: "run-summary 里没有 success (completed)；execution-summary 里没有找到 executed trade",
    pulse_title: "市场脉冲 2026-03-17 02:17 UTC [codex]",
    pulse_published_at_utc: "2026-03-17T02:17:55.554Z",
    pulse_excerpt_md: null,
    pulse_markdown_path: "runtime-artifacts/reports/pulse/2026/03/17/pulse-20260317T021755Z-codex-full-6ca9b9ec-67a2-4eed-985a-ac7fe9c13f7f.md",
    pulse_json_path: "runtime-artifacts/reports/pulse/2026/03/17/pulse-20260317T021755Z-codex-full-6ca9b9ec-67a2-4eed-985a-ac7fe9c13f7f.json",
    run_summary_path: null,
    execution_summary_path: null,
    executed_trade_count: 0,
    executed_trades: []
  },
  {
    run_id: "a2420cbb-f0d2-46ca-8931-77b4ee3cfd67",
    runtime: "pulse-direct-runtime",
    generated_at_utc: "2026-03-24T03:06:57.762Z",
    pair_slug: "us-forces-enter-iran-by-march-31-222-191-243-517-878-439-519",
    token_symbol: "us-forces-enter-iran-by",
    recommended_notional_usd: 54.4161,
    decision_reason_md:
      "如果只看标题，19.5% 的 Yes 似乎是在押注“局势升级”。但规则实际上要求的是相当具体、相当重的结果：现役美军陆地进入伊朗本土。这个门槛远高于越境空袭、海上动作、代理人冲突甚至特定类型的秘密行动，因此 No 侧更有结构优势。唯一需要折价的是评论区已经暴露出规则解释争议，所以虽然 edge 大于第 1 名，置信度不能抬得太高。",
    pulse_evidence_status: "present",
    pulse_missing_reason: null,
    pulse_title: "市场脉冲 2026-03-24 03:06 UTC [codex]",
    pulse_published_at_utc: "2026-03-24T03:06:57.762Z",
    pulse_excerpt_md:
      `# X Layer DEX Daily Market Pulse\n**Report generated:** 2026-03-24 03:06:57 (UTC)  \n**On-chain data fetched:** 2026-03-24 03:06:57 (UTC)\n> This cycle focused on token pairs with high liquidity and clear trading signals on X Layer DEX. Candidates were selected based on liquidity depth, volume trends, and on-chain activity.\n## Candidate Pool\n**Sources:**\n- Scanned 200+ token pairs, filtered to 83 eligible, final research candidates: 12.\n- Candidates came from three categories:\n  - High-liquidity stablecoin pairs\n  - Trending tokens with volume spikes\n  - Cross-chain bridge tokens with arbitrage opportunity\n**Selection criteria:**`,
    pulse_markdown_path: "runtime-artifacts/reports/pulse/2026/03/24/pulse-20260324T030657Z-codex-full-a2420cbb-f0d2-46ca-8931-77b4ee3cfd67.md",
    pulse_json_path: "runtime-artifacts/reports/pulse/2026/03/24/pulse-20260324T030657Z-codex-full-a2420cbb-f0d2-46ca-8931-77b4ee3cfd67.json",
    run_summary_path: "runtime-artifacts/pulse-live/2026-03-24T030643Z-a2420cbb-f0d2-46ca-8931-77b4ee3cfd67/run-summary.md",
    execution_summary_path: "runtime-artifacts/pulse-live/2026-03-24T030643Z-a2420cbb-f0d2-46ca-8931-77b4ee3cfd67/execution-summary.json",
    executed_trade_count: 2,
    executed_trades: [
      {
        pair_slug: "us-forces-enter-iran-by-march-31-222-191-243-517-878-439-519",
        token_symbol: "us-forces-enter-iran-by",
        side: "BUY",
        order_id: "0x1da3c51f646ce130b755d341219280fb01a60a891a119866ff538e722a39c568",
        filled_notional_usd: 7.4885,
        avg_price: 0.5,
        timestamp_utc: "2026-03-24T03:11:13.000Z"
      },
      {
        pair_slug: "will-england-win-the-2026-fifa-world-cup-937",
        token_symbol: "2026-fifa-world-cup-winner-595",
        side: "BUY",
        order_id: "0x5389b0eba43e0adbaa4f16fcd7e9897717743fb9d76b7b989b2e430bba105726",
        filled_notional_usd: 7.4885,
        avg_price: 0.5,
        timestamp_utc: "2026-03-24T03:11:29.000Z"
      }
    ]
  }
];
