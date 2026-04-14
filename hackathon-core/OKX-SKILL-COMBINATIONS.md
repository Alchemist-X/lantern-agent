# OKX Onchain OS — 全技能清单与组合策略

## 14 个 Skill 完整能力清单

### 1. okx-dex-swap — DEX 聚合交易
| 命令 | 功能 | 关键参数 |
|------|------|---------|
| `swap chains` | 支持链列表 | — |
| `swap liquidity --chain` | 链上 DEX 源 | chainId |
| `swap approve --token --amount --chain` | ERC-20 授权 | token, amount |
| `swap quote --from --to --readable-amount --chain` | 报价（只读） | from, to, amount |
| `swap execute --from --to --readable-amount --chain --wallet` | 一键交易（授权+签名+广播） | slippage, gas-level, mev-protection |
| `swap swap --from --to --readable-amount --chain --wallet` | 返回 calldata（不广播） | slippage |

**能力**: 聚合 500+ DEX 源，自动滑点，MEV 保护，蜜罐检测，税率检测

### 2. okx-dex-token — 代币搜索与元数据
| 命令 | 功能 |
|------|------|
| `token search --query` | 按名称/符号/地址搜索 |
| `token info --address` | 基本代币信息 |
| `token price-info --address` | 价格+市值+流动性+成交量+24h变化 |
| `token holders --address` | Top 100 持有者分布 |
| `token liquidity --address` | Top 5 流动性池 |
| `token hot-tokens` | 热门/趋势代币（最多100个） |
| `token advanced-info --address` | 风险等级、开发者统计、鲸鱼/狙击手持仓占比 |
| `token top-trader --address` | 顶级盈利地址 |
| `token trades --address` | DEX 交易历史 |
| `token cluster-overview --address` | 持有者聚类分析 |
| `token cluster-top-holders --address` | Top 10/50/100 持有者概览 |
| `token cluster-list --address` | 持有者聚类列表 |
| `token cluster-supported-chains` | 支持聚类分析的链 |

**能力**: 代币发现、风险评估、持有者画像、开发者跑路检测、社区认证标记

### 3. okx-dex-signal — 智能钱包信号
| 命令 | 功能 |
|------|------|
| `tracker activities --tracker-type <smart_money\|kol\|multi_address>` | 智能钱包/KOL/自定义地址交易流 |
| `signal chains` | 支持链列表 |
| `signal list --chain --wallet-type 1,2,3` | 聚合买入信号（Smart Money/KOL/鲸鱼） |
| `leaderboard supported-chains` | 排行榜支持链 |
| `leaderboard list --chain --time-frame --sort-by` | Top 20 交易者排行（PnL/胜率/交易量） |

**能力**: 实时跟踪聪明钱、KOL、鲸鱼，聚合买入共识信号，交易者排行

### 4. okx-dex-market — 链上市场数据
| 命令 | 功能 |
|------|------|
| `market price --address` | 单代币实时价格 |
| `market prices --tokens` | 批量价格（最多20个） |
| `market kline --address --bar --limit` | K线数据（1s到1W，最多299根） |
| `market index --address` | 跨交易所聚合指数价格 |
| `market portfolio-supported-chains` | PnL 支持链 |
| `market portfolio-overview --address --chain` | 钱包 PnL 总览（胜率/盈亏/Top3） |
| `market portfolio-dex-history --address --chain` | DEX 交易历史（分页） |
| `market portfolio-recent-pnl --address --chain` | 近期按代币 PnL |
| `market portfolio-token-pnl --address --chain --token` | 单代币 PnL 快照 |

**能力**: 实时定价、多时间周期 K 线、钱包盈亏分析、交易历史回溯

### 5. okx-dex-trenches — Meme/Alpha 代币研究
| 命令 | 功能 |
|------|------|
| `trenches chains` | 支持链（Solana、BSC、X Layer、TRON） |
| `trenches tokens --stage NEW\|MIGRATING\|MIGRATED` | 新代币扫描 |
| `trenches token-details --address` | 代币详情（bonding curve 进度） |
| `trenches token-dev-info --address` | 开发者声誉（跑路历史、bundle 检测） |
| `trenches similar-tokens --address` | 同类代币 |
| `trenches token-bundle-info --address` | Bundle/狙击手检测 |
| `trenches aped-wallet --address` | 跟投钱包 |

**能力**: pump.fun 新币扫描、开发者跑路检测、捆绑交易识别、bonding curve 进度

### 6. okx-dex-ws — WebSocket 实时推送
| 命令 | 功能 |
|------|------|
| `ws start --channels` | 启动 WebSocket 会话 |
| `ws poll --session-id` | 拉取缓冲消息 |
| `ws stop --session-id` | 停止会话 |
| `ws channels` | 可用频道列表 |
| `ws channel-info --channel-name` | 频道详情 |

**9 个频道**: price, candle{1s/1m/5m/1H/1D}, trades, price-info, signals, tracker, meme-scanning

**能力**: 实时价格/K线/信号推送，替代轮询，降低延迟

### 7. okx-agentic-wallet — 钱包管理
| 命令 | 功能 |
|------|------|
| `wallet login/verify/logout` | 邮箱OTP或AK登录 |
| `wallet add/switch/status` | 多账户管理 |
| `wallet addresses` | 查看地址（EVM/Solana） |
| `wallet balance [--chain] [--token-address] [--all]` | 余额查询 |
| `wallet send` | 转账（原生/ERC-20/SPL） |
| `wallet contract-call` | 智能合约交互 |
| `wallet history` | 交易历史 |
| `wallet sign-message` | 消息签名（EIP-191/EIP-712） |

**能力**: TEE 安全签名、多链多账户、策略限额、白名单

### 8. okx-onchain-gateway — 链上网关
| 命令 | 功能 |
|------|------|
| `gateway chains` | 支持链 |
| `gateway gas --chain` | 当前 Gas 价格（EIP-1559） |
| `gateway gas-limit --from --to --chain` | Gas Limit 估算 |
| `gateway simulate --from --to --data --chain` | 交易模拟（dry-run） |
| `gateway broadcast --signed-tx --address --chain` | 广播已签名交易 |
| `gateway orders --address --chain` | 追踪广播状态 |

**能力**: 交易预执行模拟、Gas 优化、MEV 保护广播、订单状态追踪

### 9. okx-security — 安全扫描
| 命令 | 功能 |
|------|------|
| `security token-scan --tokens` | 代币风险扫描（蜜罐/税率，最多50个批量） |
| `security dapp-scan --url` | DApp/URL 钓鱼检测 |
| `security tx-scan --chain --from --data` | 交易预执行安全检查 |
| `security sig-scan --chain --from --message` | 消息签名安全检查 |
| `security approvals --address` | Token 授权审查（ERC-20/Permit2） |

**能力**: 蜜罐检测、黑名单检查、钓鱼识别、交易模拟、无限授权预警

### 10. okx-wallet-portfolio — 公开钱包查询
| 命令 | 功能 |
|------|------|
| `portfolio chains` | 支持链 |
| `portfolio total-value --address --chains` | 钱包总资产 |
| `portfolio all-balances --address --chains` | 所有代币持仓 |
| `portfolio token-balances --address --tokens` | 指定代币余额 |

**能力**: 无需认证的公开钱包查询，支持 20+ 链

### 11. okx-defi-invest — DeFi 投资
| 命令 | 功能 |
|------|------|
| `defi support-chains/support-platforms` | 支持的链和平台 |
| `defi list/search` | 搜索 DeFi 产品 |
| `defi detail --investment-id` | 产品详情 |
| `defi invest --investment-id --amount` | 存入 DeFi |
| `defi withdraw/collect` | 赎回/领取奖励 |
| `defi positions/position-detail` | 查看 DeFi 持仓 |
| `defi rate-chart/tvl-chart/depth-price-chart` | 收益率/TVL/深度图 |

**能力**: Aave/Lido/Uniswap LP 等 DeFi 一站式管理

### 12. okx-defi-portfolio — DeFi 持仓查询
| 命令 | 功能 |
|------|------|
| `defi-portfolio positions --address --chain` | 跨协议 DeFi 持仓 |
| `defi-portfolio position-detail` | 单个持仓详情 |

**能力**: 15+ 链跨协议 DeFi 持仓聚合查看

### 13. okx-audit-log — 审计日志
| 命令 | 功能 |
|------|------|
| 读取 `~/.onchainos/audit.jsonl` | 所有 CLI 调用记录 |

**能力**: 完整操作回溯、调试排查

### 14. okx-x402-payment — x402 支付协议
| 命令 | 功能 |
|------|------|
| `x402-pay` | TEE 签名支付（推荐） |
| `eip3009-sign` | 本地私钥签名（备选） |

**能力**: 为付费 API/资源签名授权

---

## 组合策略：7 大 Pipeline

### 🔥 组合 1: Alpha 猎手 Pipeline
**目标**: 比市场更早发现有价值的代币

```
token hot-tokens (发现趋势)
  → signal list (验证聪明钱是否在买)
  → tracker activities --tracker-type smart_money (看具体哪些大户在动)
  → token advanced-info (检查风险等级、开发者历史)
  → security token-scan (蜜罐/税率检测)
  → token holders (鲸鱼持仓占比)
  → token cluster-overview (持有者集中度)
  → [通过所有检查] → 进入决策引擎
```

**Lantern Agent 对接**: L1 Pulse 层，每 60 秒执行一次
**价值**: 多维交叉验证——不是光看热门，而是热门 + 聪明钱确认 + 安全通过 + 持仓健康

### ⚡ 组合 2: 安全执行 Pipeline
**目标**: 每笔交易都经过预检，不踩坑

```
swap quote (获取报价、检查滑点)
  → security tx-scan (预执行安全扫描)
  → gateway simulate (交易模拟，检查 revert)
  → security token-scan (目标代币二次安全检查)
  → [全部 safe] → swap execute (执行交易)
  → gateway orders (追踪上链状态)
  → market portfolio-token-pnl (确认持仓更新)
```

**Lantern Agent 对接**: L3 Execution 层
**价值**: 三重安全门——安全扫描 + 交易模拟 + 蜜罐检测，资金损失风险降到最低

### 📊 组合 3: 全景监控 Pipeline
**目标**: 实时掌握投资组合状态

```
wallet balance --chain 196 (实时余额)
  → market prices --tokens (批量价格更新)
  → market portfolio-overview (PnL 总览、胜率)
  → market portfolio-recent-pnl (按代币盈亏)
  → defi-portfolio positions (DeFi 持仓，如有)
  → security approvals (检查授权风险)
```

**Lantern Agent 对接**: L4 Dashboard 层 + L3 Sync 循环（每 30 秒）
**价值**: 不只看余额，还看 PnL 趋势、胜率、授权安全

### 🎯 组合 4: Meme 狙击 Pipeline
**目标**: 在 pump.fun/X Layer 上安全地参与新币

```
trenches tokens --stage NEW (扫描新上线代币)
  → trenches token-dev-info (开发者跑路历史？)
  → trenches token-bundle-info (有 bundle/狙击手？)
  → token advanced-info (风险等级、持仓集中度)
  → security token-scan (蜜罐检测)
  → [开发者干净 + 无 bundle + 安全] → swap execute (小额试探)
  → trenches token-details (监控 bonding curve 进度)
  → [bonding curve 到位] → 加仓或退出
```

**Lantern Agent 对接**: L1 Pulse 层（可选 Meme 模式）
**价值**: 不是盲目冲 meme，而是有数据支撑的早期参与——过滤掉 90% 的 rug pull

### 💰 组合 5: 闲置资金生息 Pipeline
**目标**: Agent 不交易时，闲置 USDC 自动赚利息

```
wallet balance (检查闲置 USDC)
  → defi search --chain 196 --token USDC (搜索 X Layer 上的 USDC 收益产品)
  → defi detail (查看 APY、TVL)
  → defi invest (存入最优产品)
  → [Agent 需要资金交易时]
  → defi withdraw (赎回)
  → swap execute (用赎回资金交易)
```

**Lantern Agent 对接**: L3 资金管理模块（新增）
**价值**: 资金永远在生息——交易间隙也在赚钱

### 🌊 组合 6: 实时信号响应 Pipeline
**目标**: 用 WebSocket 替代轮询，毫秒级响应

```
ws start --channels "signals,tracker,price" (订阅实时信号)
  → [收到 smart money 买入信号]
  → token price-info (确认当前价格)
  → security token-scan (快速安全检查)
  → swap execute (立即跟单)
  → ws poll (继续监听)
```

**Lantern Agent 对接**: L1 升级版——从 60 秒轮询变为实时推送
**价值**: 聪明钱买入后几秒内跟进，而不是等 60 秒后的下一个轮询周期

### 🔍 组合 7: 跟单大户 Pipeline
**目标**: 复制顶级交易者的策略

```
leaderboard list --sort-by 1 (按 PnL 排名 Top 20)
  → [选择目标交易者]
  → tracker activities --tracker-type multi_address --wallet-address <addrs>
  → [大户买入某代币]
  → token price-info + security token-scan (验证)
  → swap execute (跟单)
  → market portfolio-token-pnl (追踪跟单效果)
```

**Lantern Agent 对接**: L2 Decision 层（跟单策略模式）
**价值**: 站在巨人肩膀上——不自己找 alpha，跟着有验证胜率的大户走

---

## Lantern Agent 当前集成 vs 可扩展

| Pipeline | 当前状态 | 使用的 Skill 数量 | 扩展难度 |
|----------|---------|-------------------|---------|
| Alpha 猎手 | ✅ 已集成 | 4 (token + signal + security + market) | — |
| 安全执行 | ✅ 已集成 | 3 (swap + gateway + wallet) | — |
| 全景监控 | ⚡ 部分集成 | 2→6 可扩展 | 低 |
| Meme 狙击 | 🔲 可扩展 | +1 (trenches) | 中 |
| 闲置生息 | 🔲 可扩展 | +2 (defi-invest + defi-portfolio) | 中 |
| 实时信号 | 🔲 可扩展 | +1 (dex-ws) | 中 |
| 跟单大户 | 🔲 可扩展 | +0 (已有 signal) | 低 |

**当前已深度集成 7/14 个 Skill，覆盖核心交易闭环。**
**可通过 4 个扩展 Pipeline 升级到 12/14 个 Skill。**

---

## Skill 交叉使用热力图

```
                swap  token  signal  market  trenches  ws  wallet  gateway  security  portfolio  defi-i  defi-p  audit  x402
swap             —     ●      ●       ●        ○      ○     ●       ●        ●         ○         ○       ○       ○      ○
token            ●     —      ●       ●        ●      ○     ○       ○        ●         ○         ○       ○       ○      ○
signal           ●     ●      —       ●        ○      ●     ○       ○        ○         ○         ○       ○       ○      ○
market           ●     ●      ●       —        ○      ●     ●       ○        ○         ●         ○       ○       ○      ○
trenches         ○     ●      ○       ○        —      ○     ○       ○        ●         ○         ○       ○       ○      ○
ws               ○     ○      ●       ●        ○      —     ○       ○        ○         ○         ○       ○       ○      ○
wallet           ●     ○      ○       ●        ○      ○     —       ●        ●         ●         ●       ●       ●      ●
gateway          ●     ○      ○       ○        ○      ○     ●       —        ●         ○         ○       ○       ○      ○
security         ●     ●      ○       ○        ●      ○     ●       ●        —         ○         ○       ○       ○      ○
portfolio        ○     ○      ○       ●        ○      ○     ●       ○        ○         —         ○       ●       ○      ○
defi-invest      ○     ○      ○       ○        ○      ○     ●       ○        ○         ○         —       ●       ○      ○
defi-portfolio   ○     ○      ○       ○        ○      ○     ●       ○        ○         ●         ●       —       ○      ○
audit            ○     ○      ○       ○        ○      ○     ●       ○        ○         ○         ○       ○       —      ○
x402             ○     ○      ○       ○        ○      ○     ●       ○        ○         ○         ○       ○       ○      —

● = 强关联（同一 pipeline 中协作）  ○ = 弱关联或无关联
```

---

## 给评委的一句话

> Lantern Agent 不是简单调用一两个 API——它将 7 个 OKX Onchain OS Skill 编织成一个从信号发现到交易结算的**完整自主闭环**，并预留了向 12 个 Skill 扩展的清晰路径。
