# Polymarket × Onchainos Edge 映射

> 扫描当前 Polymarket 活跃市场，标注 onchainos 链上数据能提供信息优势的具体市场

---

## 核心思路

Polymarket 上的价格 = 市场共识概率。如果你有**比市场更准确的数据**，你就有 Edge。
Onchainos 提供的是**实时链上数据**——价格、资金流向、聪明钱动态、代币发行指标。
以下是每个市场类别中，onchainos 能给你什么别人没有的。

---

## Tier 1: 最强 Edge（链上数据直接决定市场结果）

### BTC 日级价格市场

| 市场 | 当前概率 | 交易量 | 截止 |
|------|---------|--------|------|
| Bitcoin above $74K on Apr 14? | 58% | $2.36M | Apr 14 |
| Bitcoin above $74K on Apr 15? | 54% | $631K | Apr 15 |
| Bitcoin price range Apr 14? | $74K-76K @ 58% | $414K | Apr 14 |
| Bitcoin weekly Apr 13-19? | Up $78K @ 34% | $247K | Apr 19 |

**onchainos Edge 来源:**

```bash
# 1. 实时价格——比 Polymarket 预言机更快
onchainos market price --address 0xbtc_address --chain 1

# 2. 聪明钱 BTC 仓位方向
onchainos tracker activities --tracker-type smart_money --trade-type 0 --min-volume 50000
# 大户在买还是在卖？Polymarket 参与者未必看链上数据

# 3. 鲸鱼转入交易所 = 卖压信号
onchainos signal list --chain 1 --wallet-type 3  # 鲸鱼信号
# 大量 BTC 转入交易所 = 即将抛售 → 价格下跌概率上升

# 4. DEX 交易量趋势
onchainos token price-info --address <wbtc_addr> --chain 1
# volume24H 突然放大 + priceChange1H 负 = 短期下行压力
```

**交易策略**: 
- 临近截止前 2-4 小时，用实时价格 + 聪明钱方向判断边界概率
- 如果 BTC 在 $74.5K 附近震荡，而 Poly 给 "above $74K" 定价 58%，但链上聪明钱正在买入 → 实际概率可能 >70% → 买 Yes

### ETH 日级价格市场

| 市场 | 当前概率 | 交易量 | 截止 |
|------|---------|--------|------|
| ETH above $2,300 on Apr 14? | 89% | $818K | Apr 14 |
| ETH above $2,400 on Apr 14? | 15% | $818K | Apr 14 |
| ETH price range Apr 14? | $2,300-$2,400 @ 74% | $141K | Apr 14 |
| ETH weekly Apr 13-19? | Up $2,500 @ 47% | $84K | Apr 19 |

**onchainos Edge 来源:**

```bash
# ETH 特有——DeFi TVL 变化预示 ETH 需求
onchainos token price-info --address <eth_addr> --chain 1
# volume + txs 趋势

# Gas 费趋势 = 网络活跃度 = ETH 需求
onchainos gateway gas --chain 1
# Gas 上涨 = 链上活跃 = ETH 需求增加 = 利好价格

# L2 活跃度（Arbitrum/Base/X Layer 上的交易量）
onchainos token hot-tokens --chain 42161  # Arbitrum
onchainos token hot-tokens --chain 8453   # Base
# L2 繁荣 → ETH 作为 Gas 代币需求增加
```

### 代币 FDV 发行市场 ⭐ 最高 Edge

| 市场 | 当前概率 | 交易量 | 截止 |
|------|---------|--------|------|
| Genius FDV above $500M 1 day after launch? | 40% | $2M | TBD |
| Genius FDV above $300M? | 95% | $2M | TBD |
| Predict.fun FDV above $50M? | 95% | $4M | TBD |

**onchainos Edge 来源（最强——直接可观测）:**

```bash
# 1. 代币上线第一时间监控（WebSocket 零延迟）
onchainos ws start --channel dex-market-memepump-new-token-openapi --chain-index 1,501

# 2. 上线后立即获取链上 FDV 数据
onchainos token price-info --address <genius_token> --chain <chain>
# marketCap 字段 = 实时 FDV（完全稀释估值）

# 3. 聪明钱是否在买
onchainos signal list --chain <chain> --wallet-type 1,2,3
onchainos tracker activities --tracker-type smart_money --min-volume 10000

# 4. 持有者分布——健康分布 = 持续上涨潜力
onchainos token holders --address <addr> --chain <chain>
onchainos token advanced-info --address <addr> --chain <chain>

# 5. 流动性深度——决定 FDV 是否可持续
onchainos token liquidity --address <addr> --chain <chain>
```

**交易策略**:
- 代币上线前：根据同类项目 FDV 数据估算范围
- 代币上线时：WebSocket 实时监控 marketCap → 对比 Polymarket 定价
- 上线后 1 小时：如果链上 FDV 已稳定在 $400M+，而 Poly 给 "$500M" 只有 40% → 买 Yes
- **这是 onchainos 最强的 Edge——Polymarket 参与者看的是预测，你看的是实时链上数据**

---

## Tier 2: 强 Edge（链上趋势提供方向性信号）

### BTC/ETH 月度价格市场

| 市场 | 当前概率 | 交易量 |
|------|---------|--------|
| BTC hits $80K in April? | 31% | $22M |
| BTC hits $75K in April? | 88% | $22M |
| ETH hits $2,600 in April? | 44% | $5M |
| SOL hits $100 in April? | 22% | $2M |
| XRP hits $1.40 in April? | 78% | $585K |
| BTC hits $80K in 2026? | 79% | $31M |

**onchainos Edge 来源:**

```bash
# 聪明钱资金流向——月度趋势判断
onchainos tracker activities --tracker-type smart_money --min-volume 100000
# 如果过去一周 smart money 持续净买入 → 月内上涨概率增加

# 聪明钱排行榜——跟踪赢家持仓
onchainos leaderboard list --chain 1 --time-frame 3 --sort-by 1
# 7 天 PnL 排名 Top 20 的持仓方向

# 链上交易量趋势
onchainos token price-info --address <wbtc_addr> --chain 1
# volume24H 连续 7 天增长 = 趋势延续概率高

# K 线技术分析
onchainos market kline --address <addr> --chain 1 --bar 1D --limit 30
# 日线级别支撑/阻力/趋势判断
```

**交易策略**:
- 月初：用 30 日 K 线判断大方向，结合聪明钱月度趋势
- 月中：如果链上显示持续净买入 + 交易量放大 → 上方目标概率被低估
- 关键：Polymarket 定价滞后于链上资金流变化 1-3 天

### MicroStrategy BTC 持仓市场

| 市场 | 当前概率 | 交易量 |
|------|---------|--------|
| MSTR sells BTC by Jun 30? | 3.35% Yes | $929K |
| MSTR sells BTC by Dec 31? | 11.5% Yes | $553K |

**onchainos Edge 来源:**

```bash
# 追踪 MicroStrategy 已知钱包地址
onchainos tracker activities \
  --tracker-type multi_address \
  --wallet-address <mstr_wallet_1>,<mstr_wallet_2> \
  --trade-type 2  # 只看卖出

# 实时 WebSocket 监控
onchainos ws start \
  --channel address-tracker-activity \
  --wallet-addresses <mstr_wallets>

# 任何转出到交易所 = 可能卖出的前兆
```

**交易策略**:
- 设置 MSTR 钱包地址的 WebSocket 追踪
- 任何大额 BTC 转出 → 第一时间在 Polymarket 买 Yes
- 当前 Yes 只有 3.35%，信息优势带来的回报率极高

---

## Tier 3: 中等 Edge（间接链上信号辅助判断）

### SOL 月度价格市场

| 市场 | 当前概率 | 交易量 |
|------|---------|--------|
| SOL hits $90 in April? | 70% | $2M |
| SOL hits $100 in April? | 22% | $2M |

**onchainos Edge 来源:**

```bash
# Solana meme 生态活跃度 = SOL 需求代理指标
onchainos memepump tokens --chain 501 --stage NEW
# 新币数量激增 = Solana 生态繁荣 = SOL 需求上升

onchainos token hot-tokens --chain 501 --ranking-type 4
# Solana 上热门代币数量和交易量

# Solana DEX 总交易量
onchainos market portfolio-dex-history --address <sol_whale> --chain 501 --begin <7d_ago> --end <now>
```

**逻辑**: Solana meme 生态繁荣 → 更多用户需要 SOL 做 Gas → SOL 需求上升 → 价格上涨

### AI 模型市场（间接链上信号）

| 市场 | 当前概率 | 交易量 |
|------|---------|--------|
| Best AI model end of April? | Anthropic 91% | $7M |
| Claude 5 by Jun 30? | 50% | $3M |
| Largest company end of Jun? | NVIDIA 89% | $5M |

**onchainos Edge**: 有限但非零
```bash
# AI 代币价格 = 市场对 AI 板块的情绪代理
onchainos token search --query "AI" --chains 1
onchainos token hot-tokens --chain 1 --ranking-type 4
# AI 相关代币（FET, RNDR, TAO 等）集体上涨 = AI 板块热度
# 热度 ↔ 模型发布事件可能有相关性
```

---

## 缺失但有机会的市场类型

Polymarket 目前**没有**但 onchainos 有**完美数据覆盖**的市场类型：

| 潜在市场 | onchainos 数据源 | Edge 强度 |
|----------|-----------------|----------|
| "ETH DeFi TVL 超过 $XXB?" | `defi-portfolio` + `token price-info` | ⭐⭐⭐ 直接可观测 |
| "Solana 日活地址超过 XM?" | `token hot-tokens` 交易者数 | ⭐⭐⭐ |
| "某协议被黑客攻击?" | `security token-scan` + `security tx-scan` | ⭐⭐⭐ |
| "Meme 代币 X 市值破 $YM?" | `token price-info` marketCap | ⭐⭐⭐ 直接可观测 |
| "USDT 脱锚低于 $0.99?" | `market price` 实时价格 | ⭐⭐⭐ 直接可观测 |
| "X Layer 日交易量超过 $YM?" | `token hot-tokens --chain 196` | ⭐⭐⭐ |
| "某代币 LP 被撤走（rug pull）?" | `token liquidity` + `token advanced-info` | ⭐⭐ |
| "某鲸鱼地址卖出超过 $XM?" | `tracker activities` | ⭐⭐⭐ |

---

## 实操工作流：用 onchainos 打 Polymarket

### 日常流程（每日）

```bash
# 1. 晨间扫描——聪明钱隔夜动态
onchainos tracker activities --tracker-type smart_money --trade-type 0 --min-volume 50000
onchainos signal list --chain 1 --wallet-type 1,2,3

# 2. 对照 Polymarket 日级市场定价
#    BTC/ETH 的关键价位概率 vs 链上信号方向

# 3. 判断是否有 mispricing
#    例：链上显示 3 个鲸鱼买入 BTC，但 Poly "BTC above $76K" 只有 65%
#    → 链上信号暗示实际概率可能 >75% → 买 Yes

# 4. 临近截止前 2 小时——实时价格监控
onchainos market price --address <btc_addr> --chain 1
# 对比 Polymarket 边界价格，如果价格已接近/超过阈值但 Poly 定价滞后 → 套利
```

### 代币发行事件（不定期，高 Edge）

```bash
# 1. 监听新代币发行
onchainos ws start --channel dex-market-memepump-new-token-openapi --chain-index 1,501,196

# 2. 发现目标代币上线 → 立即获取 FDV
onchainos token price-info --address <new_token> --chain <chain>

# 3. 对照 Polymarket "FDV above $X" 市场
#    链上 FDV 已达 $400M，Poly "$500M" 定价 40%
#    → 当前轨迹（交易量 + 买压）是否支撑 $500M？
onchainos signal list --chain <chain>  # 聪明钱还在买吗
onchainos token holders --address <addr>  # 分布健康吗

# 4. 执行 Polymarket 交易
```

### 鲸鱼事件追踪（持续）

```bash
# 设置关键地址 WebSocket 监控
onchainos ws start \
  --channel address-tracker-activity \
  --wallet-addresses <mstr_wallet>,<eth_foundation>,<whale_1>,<whale_2>

# 任何大额异动 → 检查是否有对应的 Polymarket 市场
# 例：MSTR 钱包向交易所转 BTC → "MSTR sells BTC" 市场 → 买 Yes
```

---

## 总结

| 市场类型 | 活跃市场数 | 总交易量 | onchainos Edge 等级 |
|----------|-----------|---------|-------------------|
| BTC 日级价格 | ~10 | $5M+ | ⭐⭐⭐ 实时价格 + 聪明钱 |
| ETH 日级价格 | ~8 | $1.5M+ | ⭐⭐⭐ 实时价格 + DeFi/Gas |
| BTC/ETH 月度 | ~4 | $27M+ | ⭐⭐ 趋势信号 |
| 代币 FDV 发行 | ~3 | $6M+ | ⭐⭐⭐⭐ 直接观测链上 FDV |
| 企业链上行为 | ~2 | $1.5M | ⭐⭐⭐ 钱包追踪 |
| SOL/XRP 价格 | ~3 | $2.5M | ⭐⭐ 生态活跃度 |
| AI/Tech | ~15 | $15M+ | ⭐ 间接信号 |

**最高 ROI 策略**: 代币 FDV 发行市场——链上数据直接可观测结果，信息不对称最大。
