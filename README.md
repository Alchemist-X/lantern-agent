<div align="center">

<img src="https://raw.githubusercontent.com/Alchemist-X/lantern-agent/main/apps/web/public/lantern.svg" alt="Lantern" width="120" onerror="this.onerror=null;this.src='https://em-content.zobj.net/source/apple/391/red-paper-lantern_1f3ee.png';" />

# 🏮 Lantern Agent

### 链上信号驱动的预测市场自主交易 Agent

**用 Onchain OS 链上数据, 在 Polymarket 预测市场自主发现 Edge**

[![X Layer](https://img.shields.io/badge/X%20Layer-196-orange?style=for-the-badge)](https://www.okx.com/web3/explorer/xlayer)
[![Onchain OS](https://img.shields.io/badge/Onchain%20OS-7%20Skills-gold?style=for-the-badge)](https://web3.okx.com/onchainos)
[![Status](https://img.shields.io/badge/Status-Live-green?style=for-the-badge)](https://lantern-agent-dashboard.vercel.app/showcase)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

**[🎬 Showcase Demo](https://lantern-agent-dashboard.vercel.app/showcase)** · **[📜 GitHub](https://github.com/Alchemist-X/lantern-agent)** · **[🏆 OKX Build X Hackathon](https://web3.okx.com/xlayer/build-x-hackathon)**

</div>

---

## 📖 项目简介

**Lantern Agent** 是一个运行在 **X Layer** 上的**全自主 AI 交易 Agent**, 专注在 **Polymarket 预测市场**中发现定价偏差 (Edge)。

> 🏮 **灯笼隐喻**: 灯笼在黑暗中照亮方向——我们用 Onchain OS 链上数据照亮 Polymarket 上被低估/高估的市场, 让 Agent 自主决策交易。

### 核心能力

- 🔍 **扫描**: 245+ Polymarket 价格预测市场 (BTC/ETH/SOL)
- 📊 **分析**: Black-Scholes 概率模型 + 链上信号漂移
- 🎯 **Edge 识别**: 对比市场定价 vs 模型概率, 找 >3% 差异
- ⚡ **决策**: 贝叶斯推理, Kelly 定仓, 服务层硬风控
- 📜 **上链**: 每次决策以 JSON 写入 X Layer (零 Gas)
- 💱 **执行**: 已在 Polymarket CLOB 实盘成交 (真实 TxHash 可验证)

### 与传统 Agent 的区别

| 维度 | 传统 AI 助手 | Lantern Agent |
|------|-------------|---------------|
| 自主性 | 建议, 等人确认 | 完全自主, 0 人工步骤 |
| 响应 | 人需读新闻+分析 (3 min+) | 秒级 |
| 覆盖 | 人只能跟 1-2 个市场 | 同时监控 245+ 市场 |
| 可信度 | 黑盒推理 | 贝叶斯过程链上可验证 |
| 成本 | CEX 手续费 / 人工成本 | X Layer 零 Gas |

---

## 🏗️ 架构概述

```
┌─────────────────────────────────────────────────────────┐
│                Lantern Agent 四层架构                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   L1 · 市场发现 (Market Discovery)                      │
│   ├─ Polymarket Gamma API → 245 价格预测市场            │
│   ├─ onchainos token hot-tokens → 100+ X Layer 代币     │
│   ├─ onchainos signal list → 聪明钱 / KOL / 鲸鱼信号    │
│   └─ onchainos security token-scan → 蜜罐过滤           │
│                    ↓                                    │
│   L2 · 决策引擎 (Decision Engine)                       │
│   ├─ Black-Scholes 概率模型 (年化波动率 65%)            │
│   ├─ 贝叶斯推理 (信号逐步更新先验)                       │
│   ├─ 聪明钱漂移叠加 (±5%)                               │
│   └─ Kelly 定仓 + 硬风控 (回撤/止损/敞口)                │
│                    ↓                                    │
│   L3 · 执行 (Execution)                                 │
│   ├─ Polymarket CLOB (FOK 订单, 真实成交)               │
│   ├─ onchainos swap execute (X Layer DEX)               │
│   ├─ onchainos gateway simulate (预执行安全扫描)         │
│   └─ Agentic Wallet (TEE 签名, 多账户管理)              │
│                    ↓                                    │
│   L4 · 归档与可视化 (Archive & Dashboard)               │
│   ├─ X Layer 链上记录 (每次决策 JSON 写入)              │
│   ├─ PostgreSQL 本地状态                                │
│   └─ Next.js 16 展示页 (10 slides 完整故事)              │
│                                                         │
└─────────────────────────────────────────────────────────┘

          每 5 分钟一个完整循环 · 7×24 无间断
```

### Monorepo 结构

```
lantern-agent/
├── apps/
│   └── web/                    # Next.js 16 展示页 (/showcase)
├── services/
│   ├── orchestrator/           # L1+L2 调度 + 决策引擎
│   └── executor/               # L3 交易执行
├── packages/
│   ├── contracts/              # Zod 数据契约
│   ├── db/                     # Drizzle ORM Schema
│   └── terminal-ui/            # 终端输出
├── scripts/
│   ├── agent-demo.ts           # 一次完整循环 (扫描 → 分析 → 决策)
│   ├── agent-onchain.ts        # 将决策 JSON 写入 X Layer
│   └── poly-trade.ts           # Polymarket CLOB 实盘下单
└── hackathon-core/             # 黑客松交付文档
    ├── polymarket-onchainos-edge.md
    ├── kline-to-probability.md
    ├── probability-model-roadmap.md
    ├── OKX-SKILL-COMBINATIONS.md
    └── submission-checklist.md
```

---

## 🌐 部署地址

### 在线 Demo
| 资源 | 地址 |
|------|------|
| **Showcase 展示页** | [lantern-agent-dashboard.vercel.app/showcase](https://lantern-agent-dashboard.vercel.app/showcase) |
| **GitHub 仓库** | [github.com/Alchemist-X/lantern-agent](https://github.com/Alchemist-X/lantern-agent) |

### 链上身份
| 角色 | 地址 | 浏览器 |
|------|------|--------|
| **Agentic Wallet (EVM)** | `0xb266dd8d835e3388d0eaf0bf7efff3bb732dfed6` | [X Layer Explorer](https://www.okx.com/web3/explorer/xlayer/address/0xb266dd8d835e3388d0eaf0bf7efff3bb732dfed6) |
| **Agentic Wallet (Solana)** | `3wZnfToKUrJBWXDJD2aeg4mXbee2CHiKiJhxkrgcxGqV` | - |
| **Polymarket Trading Wallet** | `0xE14E6C10e688Ab2C8aF3e60EdeB1Af71aD7ddFF1` | [Polygonscan](https://polygonscan.com/address/0xE14E6C10e688Ab2C8aF3e60EdeB1Af71aD7ddFF1) |

### 真实交易记录
| 交易 | TxHash | 链 |
|------|--------|-----|
| **X Layer 决策日志上链** | [`0x3787e3c8...`](https://www.okx.com/web3/explorer/xlayer/tx/0x3787e3c8b68263cf0e834d99883912d8b20ec5aeea18d131afd5c9e0ef5974ee) | X Layer (196) |
| **Polymarket 实盘买入 YES** | [`0x23872647...`](https://polygonscan.com/tx/0x23872647d57ac1165a503fd1d954f14d618d895068e3aa339762c30615f3f490) | Polygon (137) |

---

## 🛠️ Onchain OS Skill 使用情况

**深度集成 7 个 Skill, 60+ 条命令**, 覆盖 Lantern Agent 的全部 4 层架构:

### 🔍 L1 市场发现层 (3 个 Skill)

| Skill | 命令 | 用途 | 调用频率 |
|-------|------|------|---------|
| **okx-dex-token** | `token hot-tokens --chain 196` | X Layer 热门代币发现 | 每循环 |
| **okx-dex-token** | `token price-info --address <addr>` | 代币价格+成交量+持有者 | 每循环 x N |
| **okx-dex-signal** | `signal list --chain 196 --wallet-type 1,2,3` | 聪明钱/KOL/鲸鱼聚合买入信号 | 每循环 |
| **okx-security** | `security token-scan --tokens <batch>` | 蜜罐批量扫描 | 每循环 |

### 📊 L2 决策引擎层 (1 个 Skill)

| Skill | 命令 | 用途 |
|-------|------|------|
| **okx-dex-market** | `market price --address WBTC --chain 1` | 实时 BTC 现货价 (驱动 BS 模型) |
| **okx-dex-market** | `market kline --address --bar 1H` | K 线趋势 (波动率估计) |

### ⚡ L3 执行层 (2 个 Skill)

| Skill | 命令 | 用途 |
|-------|------|------|
| **okx-dex-swap** | `swap execute --from X --to Y --chain 196` | X Layer DEX 聚合交易 |
| **okx-onchain-gateway** | `gateway simulate` | 交易预执行安全模拟 |
| **okx-onchain-gateway** | `gateway broadcast` | 决策 JSON 零 Gas 写入 X Layer |

### 💰 L4 钱包与归档层 (1 个 Skill)

| Skill | 命令 | 用途 |
|-------|------|------|
| **okx-agentic-wallet** | `wallet login + verify` | 邮箱 OTP 创建 Agentic Wallet |
| **okx-agentic-wallet** | `wallet balance --chain 196` | 余额查询 (风控前置) |
| **okx-agentic-wallet** | `wallet contract-call --chain 196 --input-data <hex>` | **核心**: 决策 JSON 上链 (零 Gas) |

### 调用证据
运行 `pnpm agent:demo` 一次, 会产生 **19 次成功的 Onchain OS API 调用**, 完整日志保存在 `runtime-artifacts/demo/latest.json` 的 `onchainosCallLog` 字段。

---

## ⚙️ 运作机制

### 一次完整循环 (约 30-45 秒)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│   ① 扫描市场 (0-10s)                                    │
│     ├─ Polymarket: 245 价格预测市场                      │
│     └─ Onchainos: 100 X Layer 代币 + 聪明钱信号          │
│                                                         │
│   ② 数据聚合 (10-20s)                                   │
│     ├─ 对每个 Polymarket 市场: 取对应链上价格            │
│     ├─ 对每个 X Layer 代币: 取 price-info + security    │
│     └─ 聪明钱共识 + 持有者分布                          │
│                                                         │
│   ③ 贝叶斯推理 (20-30s)                                 │
│     ├─ 先验 = Polymarket 隐含概率                       │
│     ├─ 信号 1: Black-Scholes 基础概率更新               │
│     ├─ 信号 2: 聪明钱方向漂移 (±3%)                     │
│     ├─ 信号 3: 量价配合 (±2%)                           │
│     └─ 后验 = Lantern 最终概率                          │
│                                                         │
│   ④ Edge 计算 + 决策 (30-35s)                           │
│     ├─ Edge = 后验 − 市场定价                           │
│     ├─ Edge > +3% → BUY Yes                             │
│     ├─ Edge < -3% → AVOID / SELL                        │
│     └─ 通过 Kelly 公式定仓位                            │
│                                                         │
│   ⑤ 链上归档 + 执行 (35-45s)                            │
│     ├─ 决策 JSON 写入 X Layer (contract-call, 零 Gas)   │
│     ├─ 如 BUY: Polymarket CLOB 下单 (FOK)               │
│     └─ 更新仪表板                                       │
│                                                         │
└─────────────────────────────────────────────────────────┘

每 5 分钟重复一次, 7×24 持续运行
```

### 概率模型 (Black-Scholes + 信号漂移)

```
P(price > strike at expiry) = Φ(d₂) + Δ_signals

d₂ = [ln(S / K) − ½σ²T] / (σ√T)

S = 当前价格 (onchainos 实时)
K = strike 价格
T = 剩余时间 (年化)
σ = 65% (BTC 年化波动率)
Φ = 标准正态累积分布函数
Δ_signals = 链上信号漂移 (±5% 上限)
```

**支持 3 种市场类型**:
- "reach X" / "hit X" / "above $X": `Φ(d₂)`
- "dip to X" / "below $X": `1 − Φ(d₂)`
- "between X and Y": `Φ(d₂_low) − Φ(d₂_high)`

详见 [hackathon-core/probability-model-roadmap.md](./hackathon-core/probability-model-roadmap.md) (升级路线图已制定, 后续实现)。

### 硬风控规则 (服务层代码级强制, 非 prompt 建议)

| 规则 | 阈值 |
|------|------|
| 组合回撤熔断 | 20% |
| 单仓止损 | 30% |
| 最大总敞口 | 50% |
| 最大单代币敞口 | 30% |
| 最大持仓数 | 10 |
| 最小交易额 | $5 |

---

## 🎯 X Layer 生态定位

Lantern Agent 展示了 X Layer **零 Gas 费**的**杀手级应用场景**: **链上 AI 决策审计**。

### 为什么是 X Layer, 不是其他链?

| 场景 | 其他链 (ETH/Arb/Base) | X Layer |
|------|----------------------|---------|
| Agent 每 5 分钟写一条决策日志 | 每笔 $0.5-$5 Gas, 一年 $50k+ | **零 Gas, 永久可持续** |
| 多账户 Agent 协同 | 多钱包 Gas 叠加, 成本爆炸 | 零成本扩展 |
| 高频决策透明化 | 只能批量上链, 延迟高 | 实时上链, 无成本顾虑 |
| 链上 AI 审计基础设施 | **不可行** | ✅ **可行** |

### Lantern 在 X Layer 生态中的角色

1. **AI Agent 可信度基础设施**: 为其他 X Layer 上的 AI Agent 提供"决策可验证"的参考实现
2. **OKX Onchain OS 深度消费者**: 集成 7/14 个 Skill, 每循环 19+ 次 API 调用, 是 Onchain OS "Most Active Agent" 的候选
3. **跨链桥接示范**: X Layer (分析+归档) + Polygon (Polymarket 执行), 展示 X Layer 作为"AI 大脑"的价值

### 未来规划

- **Phase 1**: 升级概率模型 (GARCH + 蒙特卡洛, 见 [roadmap](./hackathon-core/probability-model-roadmap.md))
- **Phase 2**: 多 Agent 协同 (不同策略 Agent 互相验证)
- **Phase 3**: 开放 API, 让其他开发者接入 Lantern 的 Edge 信号源

---

## 🎨 Showcase 展示页

[**在线体验 · 10 slides 完整故事**](https://lantern-agent-dashboard.vercel.app/showcase)

| # | Slide | 内容 |
|---|-------|------|
| 1 | Hero | 🏮 灯笼动画 + 项目标题 + 3 个统计数字 |
| 2 | 项目说明 | Edge 概念可视化 + 4 步推理管线 |
| 3 | 资金路径 | OnchainOS Wallet → Polymarket → Agent → 链上归档 |
| 4 | 为什么需要 Agent | 人类 vs Agent 对比 (火柴人插画) |
| 5 | 工作原理 | 60s 循环图 + 4 层架构 |
| 6 | Onchainos 技能卡牌 | 7 张 StS2 风格卡牌 |
| 7 | 焦点市场 + 市场流 | BTC 价格市场 + 连续滚动 watchlist |
| 8 | **Pulse 详情** | 市场筛选漏斗 + Onchainos 调用 + 贝叶斯轨迹 |
| 9 | 实时分析管线 | 真实推理过程 + 决策输出 |
| 10 | 链上可验证 | X Layer 决策证据 + Polymarket 交易证据 |

---

## 🚀 Quick Start

```bash
# 克隆
git clone https://github.com/Alchemist-X/lantern-agent.git
cd lantern-agent
pnpm install

# 配置
cp .env.example .env
# 填入 OKX API 凭据 + Polymarket 私钥

# 一次完整 Agent 循环 (扫描 → 分析 → 决策)
pnpm agent:demo

# 将决策 JSON 上链到 X Layer (零 Gas)
pnpm agent:onchain

# Polymarket 实盘下单 (需 USDC.e 余额)
pnpm poly:trade

# 本地预览 Showcase
pnpm dev
open http://localhost:3000/showcase
```

---

## 👥 团队成员

| 成员 | 角色 |
|------|------|
| **Alchemist-X** | 全栈开发 · 量化策略 · 产品设计 |

---

## 📚 黑客松交付文档

全部在 [`hackathon-core/`](./hackathon-core/) 目录:

- [设计规范](./hackathon-core/design-spec.md) — 视觉与交互规范
- [Onchain OS Skill 组合](./hackathon-core/OKX-SKILL-COMBINATIONS.md) — 14 个 Skill 完整能力 + 7 大组合
- [Polymarket Edge 分析](./hackathon-core/polymarket-onchainos-edge.md) — 市场筛选策略
- [K 线到概率](./hackathon-core/kline-to-probability.md) — 5 种概率模型对比
- [概率模型路线图](./hackathon-core/probability-model-roadmap.md) — BS 升级到 GARCH / Monte Carlo 的路径
- [市场 Edge 映射](./hackathon-core/market-edge-skill-mapping.md) — 每个 Skill 能发挥 edge 的场景
- [上线行动计划](./hackathon-core/LAUNCH.md) — 实盘部署步骤
- [提交清单](./hackathon-core/submission-checklist.md) — 黑客松提交要求对照

---

## 📄 License

MIT

---

<div align="center">

**🏮 灯笼在黑暗的市场中照亮方向**

**Built for OKX Build X Hackathon · X Layer Arena · April 2026**

*Agent 不再是辅助, 而是构建、交易、竞争的主体。*

</div>
