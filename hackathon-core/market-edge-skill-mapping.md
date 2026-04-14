# Onchainos 全能力 Edge 映射 — 市场发现 × 交易优势

> 把 onchainos 的每一条命令翻译成交易语言：它能给你什么**信息优势 (Edge)**？

---

## Edge 分层：从信号到成交

```
Tier 1 · 最早信号（别人还没看到）
  ├─ hot-tokens          趋势代币（X/社区热度）
  ├─ memepump tokens     bonding curve 新币
  ├─ tracker activities  聪明钱实时交易流
  ├─ signal list         多钱包共识买入信号
  └─ ws channels         WebSocket 零延迟推送

Tier 2 · 验证与过滤（确认不是坑）
  ├─ advanced-info       风险等级 + 开发者跑路历史
  ├─ holders             鲸鱼/狙击手/Bundle 占比
  ├─ cluster-overview    持有者聚类 + rug pull 概率
  ├─ token-dev-info      开发者声誉评分
  └─ security token-scan 蜜罐/税率/黑名单

Tier 3 · 执行与管理（入场时机 + 仓位追踪）
  ├─ kline               K 线技术分析
  ├─ price-info          多时间周期动量
  ├─ liquidity           流动性深度 / 滑点评估
  ├─ portfolio-overview  钱包 PnL / 胜率
  └─ security tx-scan    交易预执行安全检查
```

---

## 一、代币发现 Edge（早于市场发现标的）

### 1. 热门代币发现
```bash
onchainos token hot-tokens \
  --chain 196 \
  --ranking-type 4 \           # 4=趋势算法 5=X/Twitter提及
  --rank-by 5 \                # 5=交易量 3=交易笔数 4=独立交易者 15=综合评分
  --time-frame 1h \
  --min-liquidity 10000 \
  --max-top10-hold-percent 30  # 排除高集中度
```

| Edge 字段 | 交易含义 |
|-----------|---------|
| `priceChange5M/1H/4H/24H` | 多时间周期动量方向 |
| `volume5M/1H/4H/24H` | 资金流入速度 |
| `txs5M/1H/4H/24H` | 交易频率（采用速度） |
| `inflowUsd` | 净流入方向（正=买压 负=卖压） |
| `mentionsCount` | 社交媒体热度（零售 FOMO 前兆） |
| `holders` | 持有者增长速度 |

**策略**: 高交易量 + 低集中度 + 正净流入 + 社交热度上升 = 有机增长信号

### 2. Meme 新币扫描（Bonding Curve）
```bash
onchainos memepump tokens \
  --chain 196 \
  --stage NEW \                    # NEW/MIGRATING/MIGRATED
  --min-holders 50 \
  --max-bundlers-percent 5 \       # 排除 bundle 操纵
  --max-dev-holdings-percent 10 \  # 排除开发者高持仓
  --max-fresh-wallets-percent 30   # 排除虚假持有者
```

| Edge 字段 | 交易含义 |
|-----------|---------|
| `bondingPercent` | Bonding curve 进度，>90% = 即将迁移（关键时间窗口） |
| `tags.bundlersPercent` | 捆绑交易占比（高 = 内部人操纵） |
| `tags.devHoldingsPercent` | 开发者持仓（高 = 跑路风险） |
| `tags.freshWalletsPercent` | 新钱包占比（高 = 虚假采用） |
| `tags.suspectedPhishingWalletPercent` | 可疑钱包（蜜罐指标） |
| `buyTxCount1h / sellTxCount1h` | 买卖压力比 |
| `aped` | 跟投钱包数（聪明钱参与度） |

**支持链**: Solana (501), BSC (56), X Layer (196), TRON (195)

### 3. 代币搜索 + 价格快照
```bash
onchainos token search --query "OKB" --chains 196
onchainos token price-info --address <addr> --chain 196
```

| Edge 字段 | 交易含义 |
|-----------|---------|
| `priceChange5M` + `volume1H` | 5 分钟回调 + 1 小时放量 = 健康回踩入场点 |
| `marketCap` vs `liquidity` | MC/流动性比 > 100 = 流动性薄，滑点风险大 |
| `circSupply` | 流通量（稀释风险评估） |
| `communityRecognized` | 社区认证 = 已上 CEX 或知名项目（降低 rug 风险） |

---

## 二、聪明钱 Edge（跟着赢家走）

### 4. 聪明钱实时交易流
```bash
onchainos tracker activities \
  --tracker-type smart_money \   # smart_money / kol / multi_address
  --trade-type 1 \               # 1=买入 2=卖出 0=全部
  --chain 196 \
  --min-volume 10000 \
  --min-market-cap 100000
```

| Edge 字段 | 交易含义 |
|-----------|---------|
| `tradeType` | 买(1)/卖(2)——方向信号 |
| `quoteTokenAmount` | 入场/出场规模（大单 = 高确信度） |
| `tokenPrice` | 精确入场价（跟单参考价） |
| `realizedPnlUsd` | 该地址在这个代币上的历史盈亏（赢家还是输家） |
| `walletAddress` | 标记赢家地址，后续用 multi_address 持续跟踪 |

**策略**: 过滤 `min-volume 10000` + `min-market-cap 100000` + `trade-type 1` = 只看有实力的聪明钱买入

### 5. 聚合买入信号（多钱包共识）
```bash
onchainos signal list \
  --chain 196 \
  --wallet-type 1,2,3 \          # 1=Smart Money 2=KOL 3=鲸鱼
  --min-amount-usd 50000 \
  --min-address-count 3           # 至少 3 个钱包同时买入
```

| Edge 字段 | 交易含义 |
|-----------|---------|
| `triggerWalletCount` | 触发钱包数（越多 = 信号越强） |
| `amountUsd` | 聚合买入金额 |
| `soldRatioPercent` | 当前持有者卖出比例（低 = 钻石手持有 = 信念强） |
| `token.top10HolderPercent` | 头部集中度（高 = 少数人控盘） |

**策略**: ≥3 个聪明钱钱包 + ≥$50K 聚合买入 + soldRatio <30% = 高确信共识信号

### 6. 交易者排行榜
```bash
onchainos leaderboard list \
  --chain 196 \
  --time-frame 5 \       # 1=1天 2=3天 3=7天 4=1月 5=3月
  --sort-by 2 \          # 1=PnL 2=胜率 3=笔数 4=交易量 5=ROI
  --wallet-type smartMoney \
  --min-win-rate-percent 60
```

| Edge 字段 | 交易含义 |
|-----------|---------|
| `realizedPnlUsd` | 绝对盈利（实力证明） |
| `winRatePercent` | 胜率（策略一致性） |
| `topPnlTokenList` | 他们最赚钱的 3 个代币（信念持仓） |
| `avgBuyValueUsd` | 平均入场规模（仓位纪律） |
| `lastActiveTimestamp` | 最近活跃时间（活跃 vs 休眠） |

**策略**: 3 月胜率 >60% 的聪明钱地址 → 提取 topPnlTokenList → 交叉验证当前信号

---

## 三、持仓者分析 Edge（检测内部人风险）

### 7. 持有者分布
```bash
onchainos token holders --address <addr> --chain 196
onchainos token holders --address <addr> --chain 196 --tag-filter 3  # 只看 Smart Money
```

| tag-filter | 含义 | Edge |
|-----------|------|------|
| `1` KOL | 网红持仓 | 营销驱动 vs 有机增长 |
| `2` Developer | 开发者持仓 | 高持仓 = 退出风险 |
| `3` Smart Money | 机构持仓 | 验证信号——机构认可 |
| `4` Whale | 鲸鱼持仓 | 水下鲸鱼 = 抛压 |
| `5` Fresh Wallet | 新钱包 | 高占比 = 虚假采用 |
| `7` Sniper | 狙击手 | 大浮盈 = 随时可砸 |
| `9` Bundler | 捆绑交易 | 内部人协调 = rug 信号 |

**关键指标**: Top 10 合计 `holdPercent` < 30% + Smart Money 持仓 >5% = 健康分布

### 8. 持有者聚类分析
```bash
onchainos token cluster-overview --address <addr> --chain 196
onchainos token cluster-top-holders --address <addr> --range-filter 2 --chain 196  # top 50
onchainos token cluster-list --address <addr> --chain 196
```

| Edge 字段 | 交易含义 |
|-----------|---------|
| `clusterConcentration` | Low/Medium/High——高 = 协调控盘风险 |
| `rugPullPercent` | Rug pull 概率估算 |
| `holderNewAddressPercent` | 近 3 天新地址占比（高 = 人工刷量） |
| `holderSameFundSourcePercent` | 同一资金来源占比（高 = 同一人多钱包） |
| `clusterTrendType` | buy/sell/neutral——判断当前阶段 |
| `averagePnlUsd` | Top 持有者平均盈亏（水下 = 抛压） |

**安全阈值**: `rugPullPercent < 5%` + `clusterConcentration = Low` + `holderNewAddressPercent < 20%`

### 9. 开发者声誉分析
```bash
onchainos memepump token-dev-info --address <addr> --chain 196
onchainos memepump similar-tokens --address <addr> --chain 196
onchainos memepump token-bundle-info --address <addr> --chain 196
```

| Edge 字段 | 交易含义 |
|-----------|---------|
| `rugPullCount` | 历史跑路次数（>0 = 红旗） |
| `migratedCount` | 成功迁移次数（轨迹记录） |
| `goldenGemCount` | 爆款代币数（成功率） |
| `devHoldingPercent` | 当前持仓（>20% = 退出风险） |
| `totalBundlers` | Bundle 钱包数 |
| `bundlerAthPercent` | Bundle 钱包最高浮盈%（>90% = 即将抛售） |

**绿旗**: `rugPullCount = 0` + `migratedCount ≥ 3` + `devHoldingPercent < 10%`

---

## 四、风险等级 + 安全扫描 Edge（避坑）

### 10. 代币高级信息（风险元数据）
```bash
onchainos token advanced-info --address <addr> --chain 196
```

| Edge 字段 | 含义 | 安全阈值 |
|-----------|------|---------|
| `riskControlLevel` | 0-5 风险等级 | ≤ 2 可交易 |
| `honeypot` tag | 蜜罐（买得进卖不出） | 必须无此 tag |
| `lowLiquidity` tag | 流动性不足 | 避免 |
| `communityRecognized` tag | 社区认证 | 优选 |
| `smartMoneyBuy` tag | 聪明钱买入标记 | 正面信号 |
| `devBurnToken` tag | 开发者销毁代币 | 承诺信号 |
| `lpBurnedPercent` | LP 销毁比例 | 100% = 无法撤池 |
| `devRugPullTokenCount` | 开发者跑路代币数 | 0 = 安全 |
| `top10HoldPercent` | Top 10 持仓占比 | < 30% 健康 |
| `bundleHoldingPercent` | Bundle 持仓 | < 5% 安全 |
| `sniperHoldingPercent` | 狙击手持仓 | < 10% 可接受 |

### 11. 安全扫描三件套
```bash
# 代币风险扫描（批量，最多 50 个）
onchainos security token-scan --tokens "196:<addr1>,196:<addr2>,..."

# 交易预执行扫描
onchainos security tx-scan --chain 196 --from <wallet> --data <calldata>

# 授权审查
onchainos security approvals --address <wallet> --chain 196
```

| 命令 | Edge | action 含义 |
|------|------|------------|
| `token-scan` | 蜜罐/税率/黑名单检测 | `block`=高危 `warn`=中危 空=安全 |
| `tx-scan` | 交易模拟，检测 revert/钓鱼 | 同上 |
| `approvals` | 无限授权审查 | 发现危险授权及时撤销 |

---

## 五、价格 + K 线 Edge（入场时机）

### 12. K 线技术分析
```bash
onchainos market kline \
  --address <addr> \
  --chain 196 \
  --bar 1H \      # 1s/1m/5m/15m/1H/4H/1D/1W
  --limit 24      # 最多 299 根
```

| Edge | 用法 |
|------|------|
| 4H 突破前高 | 趋势确认入场 |
| 1H 缩量回踩支撑 | 低风险入场点 |
| 1D 长下影线 | 底部信号 |
| 连续放量阳线 | 主升浪确认 |

### 13. 批量价格查询
```bash
onchainos market prices --tokens "196:<addr1>,196:<addr2>,..."  # 最多 20 个
```

**Edge**: 一次查 20 个代币价格，用于组合再平衡和套利检测

### 14. 钱包 PnL 分析
```bash
onchainos market portfolio-overview --address <addr> --chain 196
onchainos market portfolio-recent-pnl --address <addr> --chain 196
onchainos market portfolio-token-pnl --address <addr> --chain 196 --token <token_addr>
```

| Edge 字段 | 用途 |
|-----------|------|
| `winRate` | 自己的策略胜率——低于 50% 需调整 |
| `realizedPnlUsd` | 已实现盈亏 |
| `topPnlTokenList` | 盈利最多的代币——复盘成功模式 |

---

## 六、实时 WebSocket Edge（零延迟）

### 15. 全部可用频道

| 频道 | 命令 | Edge |
|------|------|------|
| 聪明钱交易流 | `ws start --channel kol_smartmoney-tracker-activity` | 实时看到大户买卖 |
| 自定义地址追踪 | `ws start --channel address-tracker-activity --wallet-addresses 0xA,0xB` | 跟踪特定赢家 |
| 聚合买入信号 | `ws start --channel dex-market-new-signal-openapi --chain-index 196` | 多钱包共识实时推送 |
| 代币价格 | `ws start --channel price --token-pair 196:<addr>` | 实时价格 tick |
| K 线流 | `ws start --channel dex-token-candle1m --token-pair 196:<addr>` | 实时 1 分钟 K 线 |
| 代币详情流 | `ws start --channel price-info --token-pair 196:<addr>` | 市值/交易量/持有者实时变化 |
| 逐笔交易 | `ws start --channel trades --token-pair 196:<addr>` | 每笔买卖实时推送 |
| Meme 新币上线 | `ws start --channel dex-market-memepump-new-token-openapi --chain-index 196` | 第一时间发现新币 |
| Meme 指标更新 | `ws start --channel dex-market-memepump-update-metrics-openapi --chain-index 196` | Bonding curve 实时进度 |

**vs 轮询**: 60 秒轮询 = 平均 30 秒延迟。WebSocket = 毫秒级。在 meme 市场，30 秒可能是 50% 价差。

---

## 七、流动性 Edge（执行质量）

### 16. 流动性池分析
```bash
onchainos token liquidity --address <addr> --chain 196
```

| Edge 字段 | 交易含义 |
|-----------|---------|
| `liquidityUsd` | 总流动性（< $50K = 滑点风险大） |
| `liquidityProviderFeePercent` | 交易手续费（影响净利润） |
| `poolCreator` | 创建者（匿名 = 风险） |
| `protocolName` | 哪个 DEX（路由优化参考） |

---

## 八、完整交易工作流示例

### 工作流 A: 热门代币 Alpha（X Layer）
```bash
# 1. 发现
onchainos token hot-tokens --chain 196 --ranking-type 4 --min-liquidity 10000

# 2. 验证（并行）
onchainos signal list --chain 196 --wallet-type 1,2,3
onchainos token advanced-info --address <addr> --chain 196
onchainos security token-scan --tokens "196:<addr>"

# 3. 深度研究
onchainos token holders --address <addr> --chain 196 --tag-filter 3
onchainos token cluster-overview --address <addr> --chain 196
onchainos market kline --address <addr> --chain 196 --bar 1H --limit 24

# 4. 决策
# hot-tokens 上榜 + 聪明钱买入信号 + 风险等级 ≤2 + 无蜜罐
# + Smart Money 持仓 + 低集群风险 + K 线突破
# → Kelly Criterion 计算仓位 → 执行 swap
```

### 工作流 B: Meme 狙击（安全版）
```bash
# 1. 扫描新币
onchainos memepump tokens --chain 196 --stage NEW --min-holders 50

# 2. 开发者背调
onchainos memepump token-dev-info --address <addr> --chain 196
# rugPullCount = 0? migratedCount ≥ 3? → 通过

# 3. Bundle 检测
onchainos memepump token-bundle-info --address <addr> --chain 196
# bundlersPercent < 5%? → 通过

# 4. 安全扫描
onchainos security token-scan --tokens "196:<addr>"
# action ≠ block? → 通过

# 5. 小额试探入场
# 全部检查通过 → 用 1-2% 仓位入场
```

### 工作流 C: 跟单大户
```bash
# 1. 找到赢家
onchainos leaderboard list --chain 196 --time-frame 5 --sort-by 2 --min-win-rate-percent 60

# 2. 实时追踪
onchainos ws start --channel address-tracker-activity --wallet-addresses <winners>

# 3. 买入时跟单
# 赢家买入 → token price-info 确认价格 → security token-scan 安全检查 → swap execute
```

---

## 链支持矩阵

| 能力 | ETH | SOL | BSC | Base | X Layer | Arb | OP | Polygon |
|------|:---:|:---:|:---:|:----:|:-------:|:---:|:--:|:-------:|
| hot-tokens | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| memepump | ✗ | ✓ | ✓ | ✗ | ✓ | ✗ | ✗ | ✗ |
| signal list | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| leaderboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| tracker | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| cluster | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| security | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| kline | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| WebSocket | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## 一句话总结

> onchainos 提供了 **45+ 条命令** 覆盖从代币发现、聪明钱追踪、持仓者画像、开发者背调、安全扫描到实时推送的**完整 Edge 链条**。组合使用时，每一层过滤都在降低风险、提高胜率——这不是单点优势，是**系统性 Edge**。
