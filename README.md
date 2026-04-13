<div align="center">

# 🏮 Lantern Agent

**Autonomous DEX Trading Agent on X Layer**

[![X Layer](https://img.shields.io/badge/Chain-X%20Layer%20(196)-000000?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiPjxyZWN0IHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==)](https://www.okx.com/xlayer)
[![OKX Skills](https://img.shields.io/badge/OKX%20Skills-7%20Integrated-00C853?style=for-the-badge)](https://web3.okx.com/zh-hans/xlayer/build-x-hackathon)
[![TypeScript](https://img.shields.io/badge/TypeScript-Monorepo-3178C6?style=for-the-badge&logo=typescript&logoColor=white)]()
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)]()

*OKX Build X Hackathon · X Layer Arena Track*

> **"Agent 不再是辅助，而是构建、交易、竞争的主体。"**

[GitHub](https://github.com/Alchemist-X/lantern-agent) · [Architecture](#architecture) · [OKX Integration](#okx-skill-integration) · [Quick Start](#quick-start)

</div>

---

## What is Lantern Agent?

Lantern Agent 是一个**全自主 DEX 交易代理**——不是聊天机器人，不是交易助手，它**本身就是交易员**。

```
每 60 秒自动执行:  SYNC → PULSE → RESEARCH → DECISION → EXECUTION
                    同步    脉冲     研究       决策       执行
```

| 能力 | 说明 |
|------|------|
| 🔍 趋势发现 | OKX 热门代币 + 聪明钱信号 + KOL 追踪 |
| 🛡️ 风险过滤 | 蜜罐检测 + 持仓者分析 + 合约安全扫描 |
| 📐 智能定价 | Kelly Criterion 仓位管理，信号驱动 |
| ⚡ 高效执行 | OKX DEX 聚合器，500+ 流动性源 |
| 🔒 硬性风控 | 代码级强制：回撤熔断 / 止损 / 敞口上限 |
| 📊 全链透明 | Next.js 实时仪表盘，每笔交易可追溯 |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    🏮 Lantern Agent                      │
│                                                         │
│  ┌─ L1: Market Discovery ────────────────────────────┐  │
│  │  okx-dex-token   → 热门代币发现                     │  │
│  │  okx-dex-signal  → 聪明钱/KOL/鲸鱼信号             │  │
│  │  okx-security    → 蜜罐检测 + 风险筛查              │  │
│  └───────────────────────┬───────────────────────────┘  │
│                          ▼                              │
│  ┌─ L2: Decision Engine ─────────────────────────────┐  │
│  │  Signal Analysis  → Kelly Criterion Sizing        │  │
│  │  Position Review  → Hold / Reduce / Close         │  │
│  │  Risk Guards      → Clip / Reject / Halt          │  │
│  │  okx-dex-market   → 实时价格 + K线趋势             │  │
│  └───────────────────────┬───────────────────────────┘  │
│                          ▼                              │
│  ┌─ L3: Execution ───────────────────────────────────┐  │
│  │  okx-dex-swap     → 500+ DEX 源聚合交易            │  │
│  │  okx-gateway      → 交易模拟 + 广播追踪             │  │
│  │  okx-wallet       → 余额查询 + 组合追踪             │  │
│  │  Hard Risk: 20% DD | 30% SL | 50% Exposure       │  │
│  └───────────────────────┬───────────────────────────┘  │
│                          ▼                              │
│  ┌─ L4: State & Dashboard ───────────────────────────┐  │
│  │  PostgreSQL + Drizzle ORM                         │  │
│  │  Next.js 16 实时仪表盘                              │  │
│  │  全量归档（每轮决策 + 每笔交易）                      │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ⚡ 60s 循环 · X Layer 零 Gas · Heartbeat Swap 持续活跃  │
└─────────────────────────────────────────────────────────┘
```

---

## Risk Controls

不靠提示词，靠**代码硬规则**：

| 规则 | 阈值 | 触发动作 |
|------|------|---------|
| 组合回撤熔断 | 净值回撤 ≥ **20%** | 停止所有新开仓 |
| 单仓止损 | 浮亏 ≥ **30%** | 自动平仓 |
| 最大总敞口 | 占资金 ≤ **50%** | 拒绝新开仓 |
| 单代币敞口 | 占资金 ≤ **30%** | 裁剪订单 |
| 最大持仓数 | ≤ **10** 个 | 拒绝新开仓 |
| 最小交易额 | ≥ **$5** | 丢弃小额 |

---

## OKX Skill Integration

深度集成 **7 个 OKX Onchain OS Skills**，覆盖从信号发现到链上结算的完整闭环：

```
信号发现 ──→ 风险过滤 ──→ 报价获取 ──→ 安全预检 ──→ 交易执行 ──→ 状态追踪
  token       security      swap         gateway       swap        wallet
  signal                    quote        simulate      execute     balance
  market                                 tx-scan                   portfolio
```

| Layer | Skill | 用途 |
|-------|-------|------|
| L1 发现 | `okx-dex-token` | hot-tokens 趋势发现 · price-info 估值 · advanced-info 风险元数据 · holders 鲸鱼检测 |
| L1 信号 | `okx-dex-signal` | signal list 聚合买入信号 · tracker 鲸鱼/KOL 实时追踪 |
| L1 安全 | `okx-security` | token-scan 蜜罐检测 · tx-scan 交易预执行安全检查 |
| L2 数据 | `okx-dex-market` | 实时价格 · K 线趋势分析 · 组合 PnL 追踪 |
| L3 交易 | `okx-dex-swap` | swap execute 聚合交易 · quote 报价 |
| L3 网关 | `okx-onchain-gateway` | 交易模拟 · Gas 估算 · 广播追踪 |
| L3 钱包 | `okx-agentic-wallet` | 余额查询 · 组合追踪 |

**集成方式**: 全部通过 `onchainos` CLI 子进程调用，返回结构化 JSON 直接注入决策管线。

### 可扩展路径

当前 7/14 Skill 已集成。预留 5 个扩展 Pipeline：

| Pipeline | 新增 Skill | 价值 |
|----------|-----------|------|
| Meme 狙击 | `okx-dex-trenches` | pump.fun 新币 + 开发者跑路检测 |
| 实时信号 | `okx-dex-ws` | WebSocket 替代轮询，毫秒级响应 |
| 闲置生息 | `okx-defi-invest` + `okx-defi-portfolio` | 不交易时 USDC 自动赚利息 |
| 跟单大户 | `okx-dex-signal` (leaderboard) | 复制 Top 20 交易者策略 |
| 跨链套利 | 多链 `okx-dex-swap` | 利用跨链价差 |

---

## Live Trading Results

> 🔄 *实盘交易数据将在 Agent 运行后更新到此处*

<!-- 
运行实盘后取消注释并填入数据：

| 指标 | 数值 |
|------|------|
| 总交易笔数 | XX |
| 链上交易哈希 | [查看 Explorer](https://www.okx.com/web3/explorer/xlayer/address/0xb266dd8d835e3388d0eaf0bf7efff3bb732dfed6) |
| 累计盈亏 | +$XX.XX |
| 胜率 | XX% |
| 运行时长 | XX 小时 |

### 交易截图

![Dashboard](./docs/dashboard.png)
![Trades](./docs/trades.png)
-->

---

## Tech Stack

| 类别 | 技术 |
|------|------|
| 语言 | TypeScript monorepo (pnpm workspaces) |
| 前端 | Next.js 16 · React 19 |
| 后端 | Fastify 5 |
| 数据库 | PostgreSQL 17 · Drizzle ORM |
| 队列 | BullMQ · Redis 8 |
| 链交互 | onchainos CLI · ethers.js |
| 部署 | Vercel (Dashboard) · Docker Compose (Services) |

---

## Project Structure

```
lantern-agent/
├── apps/web/                  # Next.js 16 实时仪表盘
├── services/
│   ├── orchestrator/          # L1+L2: 市场发现 + 决策引擎
│   └── executor/              # L3: 交易执行 + 仓位同步
├── packages/
│   ├── contracts/             # Zod 共享类型
│   ├── db/                    # Drizzle 数据库层
│   └── terminal-ui/           # 终端输出
├── scripts/                   # CLI 入口
└── docker-compose.yml         # 本地 Postgres + Redis
```

---

## Quick Start

```bash
# 克隆 & 安装
git clone https://github.com/Alchemist-X/lantern-agent.git
cd lantern-agent
pnpm install

# 构建
pnpm build

# 配置
cp .env.example .env
# 编辑 .env 填入 OKX API 凭据

# 本地基础设施
docker compose up -d

# Paper 模式测试
pnpm agent:paper

# 实盘交易
pnpm agent:live

# 启动仪表盘
pnpm dev  # → http://localhost:3000
```

---

## Documents

| 文档 | 说明 |
|------|------|
| [OKX Skill 融合分析](./OKX-SKILL-INTEGRATION.md) | 技术层面的替换映射和 API 调用流 |
| [全 Skill 组合策略](./OKX-SKILL-COMBINATIONS.md) | 14 个 Skill 完整能力 + 7 大组合 Pipeline |
| [上线行动计划](./LAUNCH.md) | 实盘交易 + 部署 + 展示步骤 |

---

<div align="center">

**Built for OKX Build X Hackathon · X Layer Arena**

*Agent 不再是辅助，而是构建、交易、竞争的主体。*

</div>
