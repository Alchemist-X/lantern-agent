# 黑客松提交 Checklist

> 截止: 2026 年 4 月 15 日 23:59 UTC

---

## 必要项

### 1. X Layer 部署 ✅
| 要求 | 状态 | 证据 |
|------|------|------|
| 项目至少一个部分建设在 X Layer 上 | ✅ | agent-demo.ts 在 X Layer (chain 196) 上扫描代币、获取信号、执行安全检查 |

**补充说明**: 当前 Agent 的市场发现层（L1）完全运行在 X Layer 上——通过 onchainos 调用 `token hot-tokens --chain 196`、`signal list --chain 196`、`security token-scan` 等命令。交易执行也支持 X Layer DEX swap（`swap execute --chain 196`），但因钱包未入金暂未产出链上交易。

**⚠️ 待完成**: 需要在 X Layer 上产出至少一笔链上交易。方案：
- 往 onchainos 钱包 `0xb266dd8d835e3388d0eaf0bf7efff3bb732dfed6` 转入少量 USDC
- 运行 `pnpm agent:demo` 自动在 X Layer 上执行 swap
- 或手动执行 `onchainos swap execute --chain 196` 完成一笔链上记录

### 2. Agentic Wallet ✅
| 要求 | 状态 | 证据 |
|------|------|------|
| 创建 Agentic Wallet 作为项目链上身份 | ✅ | 已登录 hycrpg@gmail.com，钱包地址 `0xb266dd8d835e3388d0eaf0bf7efff3bb732dfed6` |
| 多 Agent 需在 README 说明角色 | ✅ | 单 Agent 架构，无需多 Agent 说明 |

### 3. 调用 Onchain OS Skill ✅
| 要求 | 状态 | 证据 |
|------|------|------|
| 调用至少一个核心模块 | ✅ | 深度集成 7 个 Skill，60+ 条命令 |

已集成的 7 个 Skill:
1. `okx-dex-token` — 热门代币发现（`hot-tokens --chain 196`）
2. `okx-dex-signal` — 聪明钱信号（`signal list --chain 196`）
3. `okx-security` — 安全扫描（`token-scan`）
4. `okx-dex-market` — 价格/K线（`market price`、`market kline`）
5. `okx-dex-swap` — DEX 聚合交易（`swap quote`、`swap execute`）
6. `okx-onchain-gateway` — 交易模拟/广播（`gateway simulate`）
7. `okx-agentic-wallet` — 钱包管理（`wallet balance`、`wallet status`）

### 4. GitHub + README ✅
| 要求 | 状态 | 链接 |
|------|------|------|
| 公开 GitHub 仓库 | ✅ | https://github.com/Alchemist-X/lantern-agent |
| 项目简介 | ✅ | README.md "What is Lantern Agent?" |
| 架构概述 | ✅ | README.md 4 层架构图 |
| 部署地址 | ⚠️ | Vercel: https://lantern-agent-dashboard.vercel.app — 但需补充 X Layer 链上合约/交易地址 |
| Onchain OS Skill 使用情况 | ✅ | README.md "OKX Skill Integration" 完整表格 |
| 运作机制 | ✅ | README.md 60s 循环 + 贝叶斯推理 |
| 团队成员 | ⚠️ | **待补充** — 需要在 README 中加团队信息 |
| X Layer 生态定位 | ⚠️ | **待补充** — 需要明确说明项目如何服务 X Layer 生态 |

### 5. Google Form 提交 ❌
| 要求 | 状态 | 说明 |
|------|------|------|
| 4月15日 23:59 UTC 前提交 | ❌ 未提交 | 需要你手动填写 Google Form |

---

## 加分项

### A. Demo 视频 ❌
| 要求 | 状态 | 说明 |
|------|------|------|
| 1-3 分钟 Demo 视频 | ❌ 未录制 | 上传 YouTube/Google Drive，表单中提供链接 |

**建议脚本** (2.5 分钟):
```
0:00  开场 — "Lantern Agent: 用链上数据在预测市场找 Edge"
0:20  架构 — 4 层设计 + 7 个 Onchainos Skill
0:50  实盘 — 终端运行 agent-demo，观察扫描→推理→下单
1:30  链上 — 展示 Polymarket 交易记录 + X Layer Explorer
1:50  仪表盘 — Showcase 页面展示推理瀑布图
2:20  总结 — 核心价值 + X Layer 原生优势
```

### B. X 推文 ❌
| 要求 | 状态 | 说明 |
|------|------|------|
| 发 X 帖 #XLayerHackathon @XLayerOfficial | ❌ 未发 | 需包含项目名 + 图片/视频 |

**建议推文**:
```
🏮 Lantern Agent — 用 Onchainos 链上数据在预测市场自动发现 Edge

✅ 7 个 OKX Onchain OS Skill 深度集成
✅ 贝叶斯推理引擎 + Kelly 仓位管理
✅ 60 秒自主循环，7×24 不间断
✅ X Layer 零 Gas 高频交易

Demo: https://lantern-agent-dashboard.vercel.app/showcase
GitHub: https://github.com/Alchemist-X/lantern-agent

#XLayerHackathon @XLayerOfficial
```

### C. 多 Skill 集成 ✅
| 要求 | 状态 | 说明 |
|------|------|------|
| 集成更多 Skill 可加分 | ✅ | 已集成 7/14 个 Skill，远超 "至少一个" 的要求 |

---

## README 待补充项

### 团队成员
在 README 底部 Footer 前添加:
```markdown
## 团队

| 成员 | 角色 |
|------|------|
| [你的名字] | 全栈开发 / 量化策略 |
```

### X Layer 生态定位
在 README 中添加一段:
```markdown
## X Layer 生态定位

Lantern Agent 充分利用 X Layer 的两大优势:

1. **零 Gas 费** — Agent 每 60 秒运行一次循环，在其他 L1/L2 上 Gas 成本不可持续，
   但 X Layer 的零 Gas 特性使高频自主交易成为可能。

2. **Onchainos 原生集成** — 作为 OKX 生态链，X Layer 与 Onchainos 数据管线天然打通，
   Agent 可以直接获取链上热门代币、聪明钱信号和安全扫描数据，无需额外的跨链桥接。

项目定位: X Layer 上的**原生自主交易基础设施**——不只是一个 DApp，
而是一个能持续运行、自主决策的链上交易参与者。
```

### 部署地址
补充链上地址:
```markdown
## 部署地址

| 资源 | 地址 |
|------|------|
| 展示页面 | https://lantern-agent-dashboard.vercel.app/showcase |
| 仪表盘 | https://lantern-agent-dashboard.vercel.app |
| Agentic Wallet (X Layer) | `0xb266dd8d835e3388d0eaf0bf7efff3bb732dfed6` |
| Polymarket 交易钱包 | `0xE14E6C10e688Ab2C8aF3e60EdeB1Af71aD7ddFF1` |
| 实盘交易 TxHash | `0x23872647d57ac...` ([查看](https://polygonscan.com/tx/0x23872647d57ac1165a503fd1d954f14d618d895068e3aa339762c30615f3f490)) |
```

---

## 行动优先级

| 优先级 | 事项 | 预计耗时 | 谁做 |
|--------|------|---------|------|
| **P0** | 补充 README（团队/生态定位/部署地址） | 10 min | Claude |
| **P0** | Google Form 提交 | 10 min | 你 |
| **P1** | X Layer 上产出一笔链上交易（入金+swap） | 15 min | 你入金，Claude 执行 |
| **P1** | 录 Demo 视频 | 30-60 min | 你 |
| **P2** | 发 X 推文 | 5 min | 你 |

**最低提交要求**（只做 P0）: README 补充 + Google Form → 可以提交
**完整提交**（P0+P1+P2）: 以上全部 → 最大化得分
