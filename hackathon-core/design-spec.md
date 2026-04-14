# Lantern Agent — 黑客松展示页面设计规范 v2

> 融合 Slay the Spire 视觉语言 + 灯笼隐喻，构建可交互的单页 Pitch

---

## 设计哲学

### 双重隐喻

**灯笼 🏮** — 在黑暗市场中照亮方向（品牌层）
**Slay the Spire 卡牌** — 每个 OKX Skill 是一张"牌"，交易是"出牌"（交互层）

融合方式：
- 暗色背景 = StS 的地牢氛围 + 灯笼照亮的有限视野
- OKX Skill = 手牌（每张有能量值、信号方向、类型标记）
- 风控规则 = 遗物（被动生效，触发时发光）
- 钱包余额 = HP 条（红色，低于阈值闪烁）
- 止损阈值 = 格挡条（蓝色，代表保护层）
- 推理过程 = 回合制战斗流程（信号收集 → 聚合 → 决策 → 出牌）

### 三条原则

1. **叙事驱动** — 页面是一个故事："问题 → 解法 → 推理 → 证明"，不是功能列表
2. **推理透明** — 展示 Agent 的每一步思考，比最终结论重要 10 倍
3. **卡牌即交互** — 每个 OKX Skill 可视化为一张可 hover 查看详情的卡牌

---

## 色彩系统

参考 StS 暗色调 + Hourglass 金色体系，叠加灯笼橙作为 Lantern 品牌色。

```
背景层级 (StS Dungeon):
  L0 · 深渊       #0D1117   (页面底层)
  L1 · 地牢       #161B22   (区块背景)
  L2 · 卡牌背景   #1C2128   (卡片、面板)
  L3 · 边界       #30363D   (分割线、边框)

品牌色:
  灯笼橙          #FF9100   (品牌锚点、标题装饰、hover 高亮)
  灯笼金          #EFC851   (StS 关键词高亮、重点数据)

语义色 (StS 映射):
  信号绿 (Buff)    #2a9d8f   (买入、正面信号、安全、通过)
  危险红 (Energy)  #e63946   (卖出、负面信号、蜜罐、危险)
  警告琥珀         #f4a261   (中等风险、待确认)
  格挡蓝           #5fa8d3   (保护、止损阈值、数据类 Skill)

文字 (StS 奶油色系):
  高亮             #FFF6E2   (标题、关键数字 — StS cream)
  正文             #E0E0E0   (主要内容)
  次要             #8B949E   (说明、标签)
  禁用             #484F58   (SKIP、不可操作)

光效:
  灯笼光晕         radial-gradient(ellipse, #FF910012 0%, transparent 70%)
  金色辉光 (StS)    box-shadow: 0 0 12px rgba(239,200,81,0.3)
  绿色脉冲          box-shadow: 0 0 20px rgba(42,157,143,0.25)
  红色警告          box-shadow: 0 0 20px rgba(230,57,70,0.25)
```

### 字体

```
标题字体:   Cinzel (衬线, 400/600/700/800) — 奇幻/策略感, StS 风格
正文字体:   Inter (无衬线) — 清晰可读
数据字体:   JetBrains Mono (等宽, 700) — 精确对齐

Display:  56px / 1.0  Cinzel 700  letter-spacing 8px  (Hero 标题)
H1:       36px / 1.1  Cinzel 700  (区块标题)
H2:       22px / 1.2  Cinzel 600  (子标题)
Body:     15px / 1.6  Inter 400   (正文)
Data:     14px / 1.4  JetBrains Mono 700  (数据值)
Label:    12px / 1.3  Inter 500   uppercase  letter-spacing 2px  (标签)
Tiny:     11px / 1.3  Inter 400   (脚注)
```

### 纹理

```css
/* StS 参考: 所有背景叠加微弱噪点纹理 */
.textured {
  background-image: url("data:image/svg+xml,..."); /* 2x2 noise pattern */
  background-blend-mode: overlay;
  opacity: 0.03;
}
```

---

## 核心视觉组件

### 组件 1: OKX Skill Card（StS 卡牌）

每个 OKX Skill 渲染为一张 StS 风格的卡牌。

```
┌──── 金色边框 2px, radius 12px ────┐
│                                    │
│  [能量球]  SKILL NAME              │
│  ● +0.73   okx-dex-token          │
│                                    │
│  ┌──────────────────────────────┐  │
│  │                              │  │
│  │     (Skill 功能图示区)        │  │
│  │     40% 高度                  │  │
│  │                              │  │
│  └──────────────────────────────┘  │
│                                    │
│  [Signal] 类型标签                  │
│                                    │
│  Fetches hot tokens on X Layer     │
│  and ranks by momentum +           │
│  smart money activity.             │
│                                    │
│  ═══════════════▲═══════════════   │
│  -1.0    0.0    +0.73    +1.0     │
│  (信号条: 红←灰→绿)                │
│                                    │
└────────────────────────────────────┘
```

**能量球** (左上角):
- 40×40px 圆形
- 颜色由信号方向决定: 绿色(bullish) / 红色(bearish) / 灰色(neutral)
- `radial-gradient` + `box-shadow` 模拟发光
- 数字: ±X.XX, JetBrains Mono 700, 14px

**类型标签** (StS 卡牌类型):
- **Signal** (红色底) — 直接产出交易信号的 Skill (token, signal, swap)
- **Data** (绿色底) — 提供防御性/参考数据的 Skill (market, security, wallet)
- **Power** (蓝色底) — 持续运行的监控 Skill (gateway)

**信号条** (底部):
- 水平条, 100% 宽, 8px 高
- 左端红(-1.0) → 中间灰(0.0) → 右端绿(+1.0)
- 三角形标记当前信号值
- 填充色根据值渐变

**卡牌 Hover 效果**:
- `transform: translateY(-8px)`
- `box-shadow` 增强
- 边框从 `#EFC85140` 变为 `#EFC851`
- 信号条动画填充

**卡牌数据映射**:

| Skill | 类型 | 能量球含义 |
|-------|------|-----------|
| okx-dex-token | Signal | 热门代币动量分 |
| okx-dex-signal | Signal | 聪明钱共识强度 |
| okx-security | Data | 安全通过率 (1.0=全部安全) |
| okx-dex-market | Data | 价格趋势方向 |
| okx-dex-swap | Signal | 最近执行成功率 |
| okx-onchain-gateway | Power | 网关响应状态 |
| okx-agentic-wallet | Data | 余额充足度 |

### 组件 2: Portfolio HP 条

```
❤️ Portfolio Value
██████████████████░░░░░░░░░░  $85.20 / $100.00  (85.2%)
                              ▲ 止损线 @ 70%

🛡️ Drawdown Protection
████████░░░░░░░░░░░░░░░░░░░░  当前回撤 8% / 阈值 20%
```

**HP 条** (红底):
- 背景 `#e6394620`, 填充 `#2a9d8f`
- 低于 70%: 填充变黄 `#f4a261`
- 低于 50%: 填充变红 `#e63946` + 闪烁动画

**格挡条** (蓝底):
- 背景 `#5fa8d320`, 填充 `#5fa8d3`
- 表示止损保护的"缓冲区"

### 组件 3: Relic 图标（风控规则）

```
[🛡️20%] [🛡️30%] [🛡️50%] [🛡️30%] [🛡️10] [🛡️$5]
 DD      SL     Exp    Token   Pos   Min
 ✅       ✅      ✅      ✅      ✅     ⚠️
```

- 每个 Relic: 48×48px 盾牌图标
- 通过: 绿色辉光 `box-shadow: 0 0 8px #2a9d8f`
- 触发: 红色辉光 + shake 动画
- Hover: 显示完整规则名 + 当前值

### 组件 4: 贝叶斯瀑布图（推理过程）

这是页面的**核心视觉**——不变，但用 StS 色彩和字体重新风格化。

每步是一个"回合"：
```
Round 1 · Price Momentum                    +8.5%
  24h change: +14.0% (LR 1.30×)
  ══════════════════════░░░░░░░░░░ 58.5%    ← 绿色条

Round 2 · Buy/Sell Ratio                    +4.2%
  42 buys / 9 sells = 82% buy pressure
  ════════════════════════░░░░░░░░ 62.7%

Round 3 · Smart Money Consensus             +3.1%
  3 wallets buying $765 total
  ══════════════════════════░░░░░░ 65.8%

Round 4 · Diamond Hands                     +1.9%
  Only 30% sold (conviction holding)
  ════════════════════════════░░░░ 67.7%

══════════════════════════════════════════
FINAL · 67.7% → BUY ★
```

- "Round N" 用 Cinzel 600, `#EFC851` (金色)
- Signal 名用 Inter 600, 白色
- Delta 用 JetBrains Mono 700, 绿/红
- 描述用 Inter 400, `#8B949E`
- 进度条: 6px 高, 底色 `#30363D`, 填充 `#2a9d8f`(绿) 或 `#e63946`(红)
- FINAL 行: 加金色边框, 数字用 `#EFC851`, "BUY ★" 用 `#2a9d8f`

---

## 页面结构: 7 个 Section

### S1 · HERO

```
┌─────────────────────────────────────────────────────┐
│                    #0D1117 深渊背景                   │
│              + 微弱星点粒子 (CSS only)                │
│                                                     │
│                  (灯笼橙光晕)                        │
│                     🏮                               │
│                                                     │
│              L A N T E R N                          │
│                A G E N T                            │
│                                                     │
│     链上信号驱动的自主 DEX 交易 Agent                  │
│                                                     │
│     ┌─────────┐  ┌─────────┐  ┌─────────┐          │
│     │  100    │  │    6    │  │   3 ★   │          │
│     │ Tokens  │  │ Signals │  │  BUY    │          │
│     │ Scanned │  │  Found  │  │  Picks  │          │
│     └─────────┘  └─────────┘  └─────────┘          │
│                                                     │
│    X Layer · OKX Onchain OS · Bayesian Engine       │
│                                                     │
│    ────── OKX Build X Hackathon · X Layer Arena ──  │
│                                                     │
│                      ↓                              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- 标题: Cinzel 56px, weight 700, `#FFF6E2`, letter-spacing 8px
- 副标题: Inter 14px, `#8B949E`, letter-spacing 3px
- 三统计卡: 背景 `#1C2128`, 边框 `#30363D`, 数字 JetBrains Mono 32px
- BUY 卡片: 数字 `#2a9d8f`, 边框 `#2a9d8f40`
- 数字入场: 从 0 计数滚动到目标值, 800ms easeOut
- 背景: 微弱星点（CSS `radial-gradient` 散点, 不是 canvas 粒子）

### S2 · PROBLEM（羊皮纸区块）

参考 Hourglass 的 parchment 对比设计。

```
┌─────────────────────────────────────────────────────┐
│                  #1C2128 暗卡牌色背景                 │
│                                                     │
│  THE PROBLEM                                        │
│                                                     │
│  "99% 的交易 Agent 是带了 AI 皮肤的按钮"              │
│                                                     │
│  ┌── 灰边框，暗淡 ──┐    ┌── 金边框，发光 ──┐       │
│  │                  │    │                  │       │
│  │  其他 Agent       │    │  Lantern Agent   │       │
│  │                  │    │                  │       │
│  │  人问 AI         │    │  Agent 扫描       │       │
│  │  ↓              │    │  ↓               │       │
│  │  AI 建议        │    │  Agent 分析       │       │
│  │  ↓              │    │  ↓               │       │
│  │  人确认         │    │  Agent 决策       │       │
│  │  ↓              │    │  ↓               │       │
│  │  执行           │    │  Agent 执行       │       │
│  │                  │    │  ↓               │       │
│  │  (4 步,          │    │  Agent 监控       │       │
│  │   人在回路)      │    │                  │       │
│  │                  │    │  (0 人工步骤)     │       │
│  └──────────────────┘    └──────────────────┘       │
│       #484F58 文字            #E0E0E0 文字           │
│       #30363D 边框            #EFC85140 边框          │
│                                                     │
│  "Agent 不再是辅助，而是构建、交易、竞争的主体。"       │
│                        — OKX Build X Hackathon       │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- 左卡: 灰色系, opacity 0.6, 每步之间灰色虚线
- 右卡: 金色边框, 每步之间**绿色实线**（自动化流程）
- 底部引言: Cinzel 20px, `#FFF6E2`, 居中, 下方 Inter 12px 来源

### S3 · HOW IT WORKS（循环图 + 4 层架构）

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  HOW IT WORKS                                       │
│  Every 60 seconds, one full cycle.                  │
│                                                     │
│     [SCAN] ──→ [ANALYZE] ──→ [DECIDE] ──→ [EXECUTE]│
│       ↑                                        │    │
│       └──────────── 60s ───────────────────────┘    │
│                                                     │
│     ● 绿色光点沿路径移动（4s 一圈）                   │
│                                                     │
│  ┌─── L1 ───┐ ┌─── L2 ───┐ ┌─── L3 ───┐ ┌── L4 ──┐│
│  │  Market  │ │ Decision │ │ Execute  │ │ State  ││
│  │ Discover │→│  Engine  │→│   DEX    │→│  & UI  ││
│  │          │ │          │ │          │ │        ││
│  │ ◈token  │ │ ◈Kelly   │ │ ◈swap   │ │◈Postgres││
│  │ ◈signal │ │ ◈Review  │ │ ◈gateway│ │◈Next.js ││
│  │ ◈security│ │ ◈Guards  │ │ ◈wallet │ │◈Archive ││
│  └──────────┘ └──────────┘ └──────────┘ └────────┘│
│                                                     │
│  ⚡ X Layer · Zero Gas · 500+ DEX · 60s Loop        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- 4 节点: 圆角矩形, 当前活跃节点 `#2a9d8f` 边框 + 辉光
- 绿色光点: 8px 圆, `#2a9d8f`, 沿 SVG path 移动, 4s 一圈
- 4 层卡片: 背景 `#1C2128`, Skill 名用小 badge (`#161B22` 底, `#30363D` 边)
- 箭头: `#30363D`, → 符号

### S4 · OKX SKILL CARDS（核心展示）

7 张 StS 风格卡牌, 手牌式展开。

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  OKX ONCHAIN OS · YOUR HAND                        │
│  7 Skills · 60 Commands · Full Trading Pipeline     │
│                                                     │
│       ┌────┐ ┌────┐ ┌────┐ ┌────┐                  │
│       │dex │ │dex │ │    │ │dex │                  │
│       │token│ │signal│ │sec │ │market│               │
│       │    │ │    │ │urity│ │    │                  │
│       │ ●  │ │ ●  │ │ ●  │ │ ●  │                  │
│       │+0.7│ │+0.4│ │+1.0│ │+0.3│                  │
│       └────┘ └────┘ └────┘ └────┘                  │
│         ┌────┐ ┌────┐ ┌────┐                        │
│         │dex │ │gate│ │wall│                        │
│         │swap│ │way │ │et  │                        │
│         │    │ │    │ │    │                        │
│         │ ●  │ │ ●  │ │ ●  │                        │
│         │+0.8│ │+1.0│ │OK │                        │
│         └────┘ └────┘ └────┘                        │
│                                                     │
│  ════════════════════════════════  7/14 integrated   │
│  ███████░░░░░░░                   50% Skill coverage│
│                                                     │
│  + 5 expansion pipelines available                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- 卡牌: 180×260px, 上方 4 张 + 下方 3 张, 手牌式微弧排列
- Hover 一张: 该卡片放大 120%, translateY(-20px), 其他卡片略微分开
- 底部进度条: 14 格, 7 格填充 `#2a9d8f`, 7 格空 `#30363D`
- 入场动画: 卡牌从下方"抽出" (translateY 40px → 0), 每张间隔 150ms

### S5 · LIVE DEMO（实时推理）

从 `/api/demo-trace` 拉取真实数据, 展示 Agent 最后一次循环的完整输出。

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  LIVE ANALYSIS · BATTLE LOG                         │
│  Real output from last agent cycle                  │
│                                                     │
│  ┌─ Encounter (代币推荐卡) ────────────────────┐    │
│  │  [XDOG]                          ★ 67.7%   │    │
│  │  $0.00415 · +14.0% · $496K liq             │    │
│  │  3🐋 $765 · 35K holders · Risk 1/5          │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─ Combat Log (推理瀑布) ─────────────────────┐    │
│  │  Round 1 · Price Momentum        +8.5%     │    │
│  │  Round 2 · Buy/Sell Ratio        +4.2%     │    │
│  │  Round 3 · Smart Money           +3.1%     │    │
│  │  Round 4 · Diamond Hands         +1.9%     │    │
│  │  ──────────────────────────────────────     │    │
│  │  VICTORY · 67.7% → BUY ★                   │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─ Candidates (候选代币) ─────────────────────┐    │
│  │  [XDOG★67] [DOGSH★67] [AI★67]              │    │
│  │  [NIUMA 56] [BAO 56] ░░░░░░░░ ×9 skipped   │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─ Relic Check (风控验证) ────────────────────┐    │
│  │  [🛡️✅] [🛡️✅] [🛡️✅] [🛡️✅] [🛡️✅] [🛡️⚠️]   │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─ HP & Block ───────────────────────────────┐    │
│  │  ❤️ ██████████████████░░░░  $85 / $100      │    │
│  │  🛡️ ████████░░░░░░░░░░░░  DD 8% / 20%      │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  Data refreshes every 30s                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- Encounter Card: StS Boss 遭遇卡样式, 金色边框
- Combat Log: 瀑布图，每步 300ms 展开动画
- Candidates: mini 卡牌式，BUY 绿框 SKIP 灰暗
- Relic Check: 6 个盾牌图标，通过=绿光 触发=红光+shake
- HP/Block: 红/蓝进度条

### S6 · POLYMARKET EDGE（预测市场对比）

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  POLYMARKET EDGE SCANNER                            │
│  On-chain data vs market consensus                  │
│                                                     │
│  ┌─ Edge Card ─────────────────────────────────┐    │
│  │                                             │    │
│  │  BTC > $76K on Apr 15?                      │    │
│  │                                             │    │
│  │     Polymarket          Lantern             │    │
│  │       58.0%              72.3%              │    │
│  │     (灰, 32px)         (绿, 32px)           │    │
│  │                                             │    │
│  │  ═══════════════════▲═══════════════════    │    │
│  │  0%     Poly──┤  Edge  ├──Lantern    100%  │    │
│  │                                             │    │
│  │  Edge: +14.3%  ★ STRONG                     │    │
│  │  (金色, 28px, JetBrains Mono)               │    │
│  │                                             │    │
│  │  📈 BTC at $74,800 (1.6% from strike)       │    │
│  │  📈 3 smart money wallets accumulating       │    │
│  │  📈 Volume +65% with price increase          │    │
│  │                                             │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- 双数字对比: Poly `#8B949E` 灰 vs Lantern `#2a9d8f` 绿
- Edge 条: 水平渐变, 两个竖线标记, 中间区域高亮
- Edge 值: `#EFC851` 金色, 28px, JetBrains Mono 700
- 信号列表: emoji + 描述, Inter 14px

### S7 · FOOTER

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│     [GitHub ↗]    [Dashboard ↗]    [Docs ↗]         │
│                                                     │
│     TypeScript · Next.js 16 · Fastify 5             │
│     PostgreSQL · BullMQ · ethers.js                 │
│                                                     │
│     Built for OKX Build X Hackathon                 │
│     X Layer Arena · April 2026                      │
│                                                     │
│                    🏮                                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 动画规范

### 入场动画 (Intersection Observer)

| 区块 | 动画 | 时长 |
|------|------|------|
| S1 Hero | 灯笼+标题 fadeIn → 统计卡 fadeIn+数字计数 → 标签 fadeIn | 0-1.5s |
| S2 Problem | 引言 fadeIn → 左卡 slideRight → 右卡 slideLeft (300ms delay) | 0.3-1s |
| S3 Architecture | 循环图 fadeIn → 光点开始移动 → 4层卡片依次 fadeIn | 0.3-1.5s |
| S4 OKX Cards | 7张卡牌从底部"抽出" (stagger 150ms) | 0.3-1.4s |
| S5 Live Demo | Encounter fadeIn → 瀑布图 300ms/步展开 → 候选 fadeIn → Relics fadeIn | 0.3-3s |
| S6 Edge | Edge Card fadeIn → 数字计数 → 条形图增长 | 0.3-1.5s |
| S7 Footer | 整体 fadeIn | 0.3s |

### 持续动画 (仅允许 2 个)

1. **循环光点** (S3): 绿色圆点沿 SCAN→ANALYZE→DECIDE→EXECUTE 路径移动, 4s/圈
2. **滚动提示** (S1): ↓ 字符上下浮动, 2s/圈, 用户滚动后消失

### 不允许的动画

- 粒子系统（性能）
- 3D 变换（兼容性）
- 无限循环的脉冲/闪烁（焦虑感）
- 自动播放 video/audio
- Parallax 滚动（眩晕）

---

## 技术实现

### 文件结构

```
apps/web/
  app/showcase/page.tsx           ← 主页面，组合所有 Section
  components/showcase/
    hero.tsx                      ← S1
    problem.tsx                   ← S2
    architecture.tsx              ← S3
    skill-cards.tsx               ← S4 (7 张 OKX Skill 卡牌)
    skill-card.tsx                ← 单张卡牌组件
    live-demo.tsx                 ← S5 (复用 probability-waterfall)
    polymarket-edge.tsx           ← S6
    footer.tsx                    ← S7
    hp-bar.tsx                    ← HP + Block 条
    relic-check.tsx               ← 风控遗物图标
    use-in-view.ts               ← Intersection Observer hook
    use-count-up.ts              ← 数字计数动画 hook
    showcase.css                  ← 所有 @keyframes + 全局样式
```

### 依赖

- **零外部依赖**: 不用 framer-motion, 不用 chart.js, 不用 fullpage.js
- CSS @keyframes + Intersection Observer + requestAnimationFrame
- Google Fonts: Cinzel + Inter + JetBrains Mono

### 数据源

- S1 统计数据: 来自 `/api/demo-trace` (实时)
- S5 推理数据: 来自 `/api/demo-trace` (实时)
- S6 Edge 数据: 来自 `/api/demo-trace` (实时)
- 其他区块: 静态内容

---

## 不做的事

1. 不用 fullpage.js / scroll-snap
2. 不用 video 背景
3. 不用 3D / WebGL / Canvas 粒子
4. 不用 carousel / slider / tabs 切换
5. 不用 modal / popup
6. 不做 dark/light 切换
7. emoji 限制: 🏮 📈 📉 🛡️ ❤️ ⚡ ★，不超过这 7 种
8. 不用 gradient 文字
9. 不用 border-radius > 16px
10. 不放团队照片
