# OKX Skill × Lantern Agent 融合分析

## 核心结论：只需替换 3 个文件

原项目 90% 的代码（决策引擎、风控、队列、仪表板）不需要改动。
只需要替换 **执行层** 和 **市场发现层** 中直接调用 Polymarket API 的 3 个文件。

---

## 替换映射

| 原文件 | 行数 | 替换为 | 对接的 OKX Skill |
|--------|------|--------|-----------------|
| `executor/src/lib/polymarket.ts` | 277 | `executor/src/lib/okx-dex.ts` | **okx-dex-swap** + **okx-onchain-gateway** + **okx-agentic-wallet** |
| `orchestrator/src/pulse/market-pulse.ts` | 502 | 改写内部 fetch 逻辑 | **okx-dex-token** + **okx-dex-signal** + **okx-security** |
| `orchestrator/src/pulse/full-pulse.ts` | 1339 | 大幅简化（去掉 Python/AI 渲染） | **okx-dex-market** + **okx-dex-token** |

## 不需要改动的文件

| 文件 | 原因 |
|------|------|
| `orchestrator/src/lib/risk.ts` | 纯数学（Kelly、风控） |
| `executor/src/lib/risk.ts` | 纯数学（PnL、止损） |
| `executor/src/workers/queue-worker.ts` | 只调用 polymarket.ts 的接口，换接口即可 |
| `orchestrator/src/runtime/pulse-direct-runtime.ts` | 纯决策逻辑 |
| `orchestrator/src/runtime/pulse-entry-planner.ts` | 解析 Markdown + Kelly 定价 |
| `orchestrator/src/runtime/decision-composer.ts` | 合并决策 |
| `orchestrator/src/review/position-review.ts` | 持仓审查 |
| `orchestrator/src/jobs/agent-cycle.ts` | 编排层，不碰 API |
| `orchestrator/src/jobs/daily-pulse-core.ts` | 编排层 |
| `apps/web/*` | 仪表板，只读数据库 |
| `packages/contracts/*` | Zod schema（字段可能需微调） |
| `packages/db/*` | Drizzle schema（字段可能需微调） |

---

## 详细替换方案

### 1. `polymarket.ts` → `okx-dex.ts`

原函数签名 → 新实现：

```
executeMarketOrder(config, signal)
  → onchainos swap execute --from USDC --to <token> --readable-amount <amt> --chain 196 --wallet <addr>
  → 返回 { swapTxHash, fromAmount, toAmount, gasUsed }

fetchRemotePositions(config)
  → onchainos wallet balance --chain 196
  → 或 onchainos portfolio all-balances --address <addr> --chains 196
  → 返回 [{ tokenAddress, symbol, balance, valueUsd }]

readBook(config, tokenId)
  → onchainos swap quote --from <token> --to USDC --readable-amount 1 --chain 196
  → 返回价格和流动性深度

computeAvgCost(config, tokenId)
  → onchainos market portfolio-token-pnl --address <addr> --chain 196 --token <addr>
  → 返回 avgBuyPrice

getCollateralBalanceAllowance(config)
  → onchainos wallet balance --chain 196 --token-address <USDC_ADDRESS>
  → 返回 USDC 余额
```

**onchainos CLI 调用方式（TypeScript）：**
```typescript
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execFile);

async function swapExecute(from: string, to: string, amount: string) {
  const { stdout } = await exec("onchainos", [
    "swap", "execute",
    "--from", from,
    "--to", to,
    "--readable-amount", amount,
    "--chain", "196",
    "--wallet", process.env.WALLET_ADDRESS!,
    "--slippage", "0.5",
    "--force"
  ]);
  return JSON.parse(stdout);
}
```

### 2. `market-pulse.ts` 改写

原逻辑：Python 脚本 fetch Polymarket 市场列表 → 过滤  
新逻辑：OKX API 获取热门代币 + 智能钱包信号 → 过滤

```
generatePulseSnapshot()
  步骤1: onchainos token hot-tokens --chain 196 --ranking-type 4
         → 获取 X Layer 热门代币（按交易量排序）
  
  步骤2: onchainos signal list --chain 196 --wallet-type 1,2,3
         → 获取智能钱包/KOL/鲸鱼聚合买入信号
  
  步骤3: onchainos security token-scan --tokens "196:<addr1>,196:<addr2>,..."
         → 批量安全扫描（蜜罐检测），过滤高风险代币
  
  步骤4: 合并 hot-tokens + signals，去重，按信号强度排名
         → 输出 PulseCandidate[]
```

### 3. `full-pulse.ts` 大幅简化

原逻辑：AI 渲染 + 外部研究收集（1339 行）  
新逻辑：结构化 API 数据直接组装 Markdown（~200 行）

```
generateFullPulse(candidates)
  对每个候选代币:
    onchainos token price-info --address <addr> --chain 196
      → price, volume24H, priceChange24H, liquidity, holders
    
    onchainos token advanced-info --address <addr> --chain 196
      → riskControlLevel, tokenTags, devRugPullTokenCount, bundleHoldingPercent
    
    onchainos token holders --address <addr> --chain 196
      → top holder 分布，鲸鱼占比
    
    onchainos market kline --address <addr> --chain 196 --bar 1H --limit 24
      → 24小时 K线趋势
  
  → 组装成 Markdown 表格（和原 pulse-entry-planner 兼容的格式）
```

---

## OKX Skill 完整能力清单 × 项目用途

### 直接使用（核心交易路径）

| Skill | 命令 | 项目用途 | 调用频率 |
|-------|------|---------|---------|
| **okx-dex-swap** | `swap execute` | 执行买入/卖出交易 | 每次交易 |
| **okx-dex-swap** | `swap quote` | 获取报价（读取价格） | 每次决策 |
| **okx-dex-swap** | `swap approve` | ERC-20 授权 | 首次交易新代币 |
| **okx-agentic-wallet** | `wallet balance` | 查询钱包余额 | 每个循环 |
| **okx-agentic-wallet** | `wallet send` | 转账（如需） | 偶尔 |
| **okx-onchain-gateway** | `gateway gas` | 获取 Gas 价格 | 每次交易前 |
| **okx-onchain-gateway** | `gateway simulate` | 交易模拟（预检） | 每次交易前 |

### 直接使用（市场发现路径）

| Skill | 命令 | 项目用途 | 调用频率 |
|-------|------|---------|---------|
| **okx-dex-token** | `token hot-tokens` | 热门代币发现 | 每个 Pulse 周期 |
| **okx-dex-token** | `token price-info` | 代币详细价格数据 | 每个候选代币 |
| **okx-dex-token** | `token advanced-info` | 风险等级 + 开发者信息 | 每个候选代币 |
| **okx-dex-token** | `token holders` | 持有者分布 | 每个候选代币 |
| **okx-dex-token** | `token search` | 代币搜索 | 按需 |
| **okx-dex-signal** | `signal list` | 智能钱包聚合买入信号 | 每个 Pulse 周期 |
| **okx-dex-signal** | `tracker activities` | 鲸鱼/KOL 交易流 | 每个 Pulse 周期 |
| **okx-dex-market** | `market kline` | K线数据（趋势分析） | 每个候选代币 |
| **okx-dex-market** | `market price` | 实时价格 | 持仓审查时 |
| **okx-security** | `security token-scan` | 蜜罐/风险检测 | 每个候选代币 |
| **okx-security** | `security tx-scan` | 交易预执行安全检查 | 每次交易前 |

### 可选使用（增强功能）

| Skill | 命令 | 项目用途 | 优先级 |
|-------|------|---------|--------|
| **okx-dex-market** | `portfolio-overview` | 钱包 PnL 总览 | P2（仪表板） |
| **okx-dex-market** | `portfolio-dex-history` | DEX 交易历史 | P2（仪表板） |
| **okx-dex-signal** | `leaderboard list` | 顶级交易者排行 | P3（策略参考） |
| **okx-dex-token** | `token cluster-overview` | 持有者聚类分析 | P3（深度研究） |
| **okx-dex-trenches** | `trenches tokens` | Meme 代币发现 | P3（X Layer 有限） |
| **okx-dex-ws** | WebSocket 订阅 | 实时价格推送 | P2（实时监控） |
| **okx-defi-invest** | DeFi 产品 | 闲置资金生息 | P3（后续） |
| **okx-wallet-portfolio** | 公开钱包查询 | 监控其他钱包 | P3 |
| **okx-audit-log** | 审计日志 | 调试/回溯 | P3 |

### 不使用

| Skill | 原因 |
|-------|------|
| **okx-x402-payment** | 项目不涉及付费 API 访问 |
| **okx-defi-portfolio** | 项目不做 DeFi 持仓管理 |

---

## Agent 循环中的 OKX Skill 调用流

```
每 60 秒一个周期:

┌─ SYNC（30秒间隔）─────────────────────────────┐
│  okx-agentic-wallet: wallet balance --chain 196│
│  okx-dex-market: market price (持仓代币)        │
│  → 更新持仓估值、检测止损                        │
└───────────────────────────────────────────────┘
          │
          ▼
┌─ PULSE（市场发现）────────────────────────────┐
│  okx-dex-token: token hot-tokens --chain 196  │
│  okx-dex-signal: signal list --chain 196      │
│  okx-dex-signal: tracker activities           │
│  → 合并为候选代币列表                           │
└───────────────────────────────────────────────┘
          │
          ▼
┌─ RESEARCH（候选研究）─────────────────────────┐
│  对每个候选:                                   │
│    okx-dex-token: token price-info            │
│    okx-dex-token: token advanced-info         │
│    okx-security: security token-scan          │
│    okx-dex-market: market kline (1H, 24根)    │
│  → 生成 Pulse Markdown                        │
└───────────────────────────────────────────────┘
          │
          ▼
┌─ DECISION（决策引擎，不碰 OKX）──────────────┐
│  pulse-entry-planner: 解析 Markdown → Kelly   │
│  position-review: 审查持仓                     │
│  decision-composer: 合并决策                   │
│  risk.ts: 风控裁剪                            │
│  → TradeDecisionSet                          │
└───────────────────────────────────────────────┘
          │
          ▼
┌─ EXECUTION（执行交易）────────────────────────┐
│  对每个 BUY 决策:                              │
│    okx-security: tx-scan (预检)               │
│    okx-onchain-gateway: simulate (模拟)       │
│    okx-dex-swap: swap execute (执行)          │
│  对每个 SELL 决策:                             │
│    okx-dex-swap: swap execute (卖出)          │
│  → 记录 txHash, 更新持仓                      │
└───────────────────────────────────────────────┘
```

---

## 实施优先级

### P0 — 最小可行（必须完成）
1. **`okx-dex.ts`** 替换 `polymarket.ts`（swap execute + wallet balance）
2. **`market-pulse.ts`** 改写 fetch 逻辑（hot-tokens + signal list + token-scan）
3. **`full-pulse.ts`** 简化为结构化数据组装（price-info + advanced-info + kline）
4. **`queue-worker.ts`** 中的 import 路径从 polymarket → okx-dex

### P1 — 增强（应该完成）
5. 交易前安全预检（security tx-scan + gateway simulate）
6. heartbeat swap（冲 Most Active Agent 奖）
7. 仪表板适配（portfolio-overview 数据源）

### P2 — 锦上添花
8. WebSocket 实时价格推送
9. 智能钱包信号追踪深度集成
10. DeFi 闲置资金管理

---

## 关键问题

### Q: onchainos CLI 是 subprocess 调用还是 SDK？
**A:** Subprocess 调用。项目原来就有 `poly-cli.ts` 用 `execFile` 调 Polymarket CLI 的模式，
`onchainos` CLI 也是同样方式：`execFile("onchainos", ["swap", "execute", ...])` → 解析 stdout JSON。
模式完全一致，甚至更简单（onchainos 输出标准 JSON）。

### Q: X Layer 上有足够的代币可交易吗？
**A:** X Layer 生态较新，代币种类可能有限。备选方案：
- `--chain 196` 优先
- 如果候选不足，扩展到 `--chain 137`（Polygon）或 `--chain 56`（BSC）
- onchainos CLI 支持 20+ 链，切换只需改 `--chain` 参数

### Q: API 限频？
**A:** onchainos CLI 内部已有缓存机制。额外缓解：
- token-scan 支持批量（最多 50 个代币一次）
- 价格数据缓存 30-60 秒
- 用 BullMQ 队列化执行，避免并发爆破
