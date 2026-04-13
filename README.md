# Lantern Agent

> Autonomous DEX Trading Agent on X Layer | OKX Build X Hackathon -- X Layer Arena

---

## 1. What We Built

Lantern Agent 是一个运行在 **X Layer（Chain ID 196）** 上的**全自主 DEX 交易代理**。它不是一个聊天机器人，也不是一个需要人类确认的交易助手 -- 它**本身就是交易员**。

从信号发现到链上成交结算，**零人工干预**。

### 核心能力

- **趋势发现** -- 通过 OKX Onchain OS 实时抓取热门代币与聪明钱信号
- **风险评估** -- 蜜罐检测、持仓者分析、安全扫描，过滤高风险标的
- **智能决策** -- 基于 Kelly Criterion 的仓位管理，信号驱动的自动开仓/平仓
- **高效执行** -- 通过 OKX DEX 聚合器接入 500+ 流动性源，最优路径成交
- **硬性风控** -- 服务层代码级强制：回撤熔断、止损、敞口上限，不靠提示词
- **全链透明** -- Next.js 实时仪表盘，每一笔决策、每一次交易、每一个风控事件均可追溯

### 自主循环

Agent 以 **60 秒为一个循环**，持续运行以下五阶段：

```
SYNC --> PULSE --> RESEARCH --> DECISION --> EXECUTION
 同步       脉冲      研究         决策         执行
```

每一轮循环覆盖完整链路：从市场数据同步到链上交易执行，无需人工介入。

### 四层架构

```
+-----------------------------------------------------+
|                   Lantern Agent                      |
|              Autonomous DEX Trader                   |
+-----------------------------------------------------+
|                                                     |
|  +--- L1: Market Discovery ----------------------+  |
|  |  okx-dex-token: hot-tokens, price-info        |  |
|  |  okx-dex-signal: smart money, KOL tracker     |  |
|  |  okx-security: honeypot scan, risk check      |  |
|  +------------------------+----------------------+  |
|                           v                         |
|  +--- L2: Decision Engine ------------------------+  |
|  |  Signal Analysis -> Kelly Criterion Sizing    |  |
|  |  Position Review -> Hold/Reduce/Close         |  |
|  |  Risk Guards -> Clip/Reject/Halt              |  |
|  |  okx-dex-market: prices, klines, PnL         |  |
|  +------------------------+----------------------+  |
|                           v                         |
|  +--- L3: Execution -----------------------------+  |
|  |  okx-dex-swap: execute via 500+ DEX sources   |  |
|  |  okx-onchain-gateway: simulate, broadcast     |  |
|  |  okx-agentic-wallet: balance, portfolio       |  |
|  |  Hard Risk: 20% DD halt, 30% SL, 50% cap     |  |
|  +------------------------+----------------------+  |
|                           v                         |
|  +--- L4: State & Dashboard ---------------------+  |
|  |  PostgreSQL + Drizzle ORM                     |  |
|  |  Next.js 16 Real-time Dashboard               |  |
|  |  Artifact Archive (every run)                 |  |
|  +-----------------------------------------------+  |
|                                                     |
|  60s Loop on X Layer (Zero Gas Fees)                |
+-----------------------------------------------------+
```

### 技术栈

| 类别 | 技术选型 |
| --- | --- |
| 语言 & 构建 | TypeScript monorepo（pnpm workspaces） |
| 前端 | Next.js 16, React 19 |
| 后端 | Fastify 5 |
| 数据库 | PostgreSQL + Drizzle ORM |
| 任务队列 | BullMQ + Redis |
| 链交互 | ethers.js |
| 链环境 | X Layer（Chain ID 196） |

---

## 2. Value Proposition

> 黑客松主题：**Agent 不再是辅助，而是构建、交易、竞争的主体**

### 真正的自主性

Lantern Agent **不是**一个建议你买什么的聊天机器人。它**就是**交易员本身。从市场扫描、信号分析、风险评估到交易执行，全链路零人工干预。这不是 "Agent 辅助交易"，这是 "Agent 即交易者"。

### 生产级风控

风控不靠提示词建议，靠**服务层代码硬规则**：

| 风控规则 | 阈值 | 说明 |
| --- | --- | --- |
| 组合回撤熔断 | **20%** | 净值相对高水位回撤达到阈值，立即停止所有新开仓 |
| 单仓止损 | **30%** | 浮亏达到阈值自动平仓 |
| 最大总敞口 | **50%** | 总资金暴露上限 |
| 最大持仓数 | **10** | 分散风险，避免过度集中 |

这些规则在代码层强制执行，Agent 无法绕过。

### 全链透明

每一次决策过程、每一笔链上交易、每一个风控触发事件都被归档并展示在公开仪表盘上。任何人都可以实时查看 Agent 的运行状态、持仓详情和历史表现。

### X Layer 原生优势

X Layer 的**零 Gas 费**特性使得高频交易循环成为可能。60 秒一轮的循环在其他 L1/L2 上成本会非常高，但在 X Layer 上可以持续、高频地运行。

### 聪明钱 Alpha

组合利用 OKX 聪明钱信号 + KOL 追踪 + 巨鲸检测，在市场共识形成之前发现 alpha。不是追涨杀跌，而是跟踪真正有信息优势的地址。

---

## 3. OKX Skill Integration

Lantern Agent 深度集成了 **7 个 OKX Onchain OS Skills**，覆盖全部四层架构。

### L1 Market Discovery -- 市场发现层

**`okx-dex-token`**
- `hot-tokens`：获取 X Layer 热门代币排行，发现趋势标的
- `price-info`：实时代币估值数据
- `advanced-info`：代币风险元数据（合约审计状态、开发者信息等）
- `holders`：持仓者分布分析，识别巨鲸集中度

**`okx-dex-signal`**
- `signal list`：聚合聪明钱买入信号，多维度交叉验证
- `tracker activities`：巨鲸/KOL 链上交易实时追踪

**`okx-security`**
- `token-scan`：蜜罐检测、合约风险筛查，在交易前过滤高风险代币

### L2 Decision Engine -- 决策引擎层

**`okx-dex-market`**
- 实时价格数据：用于持仓估值和 PnL 计算
- K 线数据：趋势分析，辅助 Kelly Criterion 参数校准
- 组合 PnL 追踪：实时监控整体收益表现

### L3 Execution -- 执行层

**`okx-dex-swap`**
- `swap execute`：通过 500+ DEX 流动性源执行交易，自动最优路径
- `quote`：交易前获取报价，评估滑点和成交价格

**`okx-onchain-gateway`**
- Gas 估算：优化交易成本
- 交易模拟：执行前安全验证（pre-execution safety check）
- 广播追踪：交易上链状态监控

**`okx-agentic-wallet`**
- 钱包余额查询：实时资产状态
- 组合追踪：跨代币持仓总览

### 集成方式

所有 OKX Skills 通过 `onchainos` CLI 以子进程方式调用，遵循项目原有的 CLI Bridge 架构。每次 CLI 调用返回结构化 JSON，直接注入 Agent 的决策管线：

```
Agent Loop -> onchainos CLI call -> JSON response -> Decision Pipeline
```

这种设计确保了：
- **统一接口**：所有 OKX 数据源走同一调用路径
- **结构化数据**：JSON 输出直接可解析，无需额外处理
- **故障隔离**：单个 Skill 调用失败不影响整体循环

### 链上活跃度

Agent 以 60 秒为周期持续运行，每轮循环执行交易 + 心跳 swap，最大化链上活动量（目标："Most Active Agent" 特别奖）。

---

## Architecture Overview

### 数据流

```
Market Data (OKX Onchain OS)
         |
         v
  +-- SYNC Phase ---+
  |  Balance check   |
  |  Position sync   |
  +---------+--------+
            |
            v
  +-- PULSE Phase --+
  |  Hot tokens      |
  |  Smart money     |
  |  Security scan   |
  +---------+--------+
            |
            v
  +-- RESEARCH -----+
  |  Price analysis  |
  |  Trend signals   |
  |  Risk scoring    |
  +---------+--------+
            |
            v
  +-- DECISION -----+
  |  Kelly Criterion |
  |  Position review |
  |  Risk guards     |
  +---------+--------+
            |
            v
  +-- EXECUTION ----+
  |  OKX DEX Swap   |
  |  Simulate first  |
  |  Broadcast tx    |
  |  Archive result  |
  +------------------+
            |
            v
     60s later, repeat
```

### Monorepo 结构

```
lantern-agent/
+-- apps/
|   +-- web/                    # Next.js 16 实时仪表盘
+-- services/
|   +-- orchestrator/           # 调度、Pulse、决策运行时、风控
|   +-- executor/               # DEX 交易执行、仓位同步、队列 Worker
+-- packages/
|   +-- contracts/              # Zod schema: 共享数据契约
|   +-- db/                     # Drizzle schema、迁移、查询
|   +-- terminal-ui/            # 终端输出工具
+-- scripts/                    # CLI 入口脚本
+-- docker-compose.yml          # 本地 Postgres + Redis
+-- package.json                # 根 scripts + workspace 配置
```

---

## Quick Start

### 构建验证

```bash
git clone <repo-url>
cd lantern-agent
pnpm install
pnpm build
```

### 完整本地运行

```bash
cp .env.example .env
# 配置必要的环境变量（OKX API 凭据、钱包私钥等）
pnpm install
docker compose up -d postgres redis
pnpm db:migrate
pnpm dev
```

默认端口：Web `3000` / Orchestrator `4001` / Executor `4002`

---

## Team

**Lantern Agent** -- Built for OKX Build X Hackathon, X Layer Arena Track.

> "Agent 不再是辅助，而是构建、交易、竞争的主体。"
