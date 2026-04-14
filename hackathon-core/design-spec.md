# Lantern Agent — 黑客松展示页面设计规范

## 这个页面是什么

评委点开链接后看到的**唯一页面**。它不是仪表板，不是文档，是一个**可交互的 Pitch Deck**。

目标：3 分钟内让评委完成以下认知旅程：

```
"这是什么？" → "它怎么工作？" → "它真的能跑？" → "这比别人强在哪？"
```

页面是一个长滚动的单页面 (Single Page)，用户从上往下滚动就是在"听你讲故事"。

---

## 设计哲学

### 灯笼隐喻

灯笼在黑暗中照亮方向——Agent 在混乱的市场中找到方向。

视觉语言：
- 暗色背景 = 黑暗的市场（不确定性）
- 绿色光点/线条 = Agent 发现的信号（确定性）
- 橙色灯笼光晕 = 品牌锚点（温暖、信任）
- 数据从暗到亮的渐变 = 从噪音到信号的转化过程

### 三条设计原则

1. **讲故事，不堆数据** — 每个区块回答一个问题，不是展示一堆图表
2. **展示思考过程** — Agent 的推理步骤比最终结论重要 10 倍
3. **Less is more** — 每屏只说一件事，一件事说透

---

## 色彩系统

```
背景:
  画布       #050505
  区块       #0a0a0a
  卡片       #0f0f0f
  浮层       #151515
  分割线     #1a1a1a

语义:
  信号绿     #00E676    (正面、BUY、Edge、成功)
  灯笼橙     #FF9100    (品牌、🏮、重点标注)
  警告黄     #FFD740    (中等风险)
  危险红     #FF5252    (负面、风险、蜜罐)

文字:
  高亮白     #FFFFFF
  正文       #E0E0E0
  次要       #888888
  微弱       #444444
  禁用       #2a2a2a

光效:
  灯笼光晕   radial-gradient(ellipse, #FF910010 0%, transparent 70%)
  信号脉冲   radial-gradient(circle, #00E67615 0%, transparent 50%)
  卡片辉光   box-shadow: 0 0 30px #00E67608
```

### 字体

```
主字体:     JetBrains Mono (等宽) — 数据、代码、概率
辅助字体:   Inter (无衬线) — 说明文字、标题

Display:  48px / 1.0  weight 700  (首屏大标题)
H1:       32px / 1.1  weight 700  (区块标题)
H2:       20px / 1.2  weight 600  (子标题)
Body:     15px / 1.6  weight 400  (正文)
Data:     14px / 1.4  weight 500  (数据标签)
Caption:  12px / 1.4  weight 400  (脚注)
Tiny:     11px / 1.3  weight 400  (方法论)
```

---

## 页面结构：7 个区块 = 7 个问题

```
┌─────────────────────────────────────────────┐
│  S1 · HERO                                  │  ← "这是什么？"
│  身份认知 + 一句话定位                        │
├─────────────────────────────────────────────┤
│  S2 · PROBLEM                               │  ← "为什么需要它？"
│  市场痛点 + Agent 的价值主张                  │
├─────────────────────────────────────────────┤
│  S3 · HOW IT WORKS                          │  ← "它怎么工作？"
│  4 层架构 + 60s 循环可视化                    │
├─────────────────────────────────────────────┤
│  S4 · OKX INTEGRATION                       │  ← "用了哪些 OKX 能力？"
│  7 个 Skill 的数据流可视化                    │
├─────────────────────────────────────────────┤
│  S5 · LIVE DEMO                             │  ← "它真的能跑？"
│  实时推理瀑布图 + 候选代币 + Edge             │
├─────────────────────────────────────────────┤
│  S6 · RISK CONTROLS                         │  ← "安全吗？"
│  硬风控规则可视化                             │
├─────────────────────────────────────────────┤
│  S7 · FOOTER                                │  ← "在哪看代码？"
│  GitHub + Tech Stack + 团队                  │
└─────────────────────────────────────────────┘
```

每个区块占约一屏（100vh 或接近），滚动自然过渡。

---

## S1 · HERO — "这是什么？"

### 功能
3 秒建立认知：项目名 + 一句话 + 核心数据 + 黑客松标识。

### 布局（100vh 满屏）

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                                                     │
│                  (灯笼橙光晕)                        │
│                      🏮                              │
│                                                     │
│             L A N T E R N                           │
│               A G E N T                             │
│                                                     │
│   Autonomous DEX Trading Intelligence               │
│   on X Layer                                        │
│                                                     │
│                                                     │
│     ┌───────┐    ┌───────┐    ┌───────┐             │
│     │  100  │    │   6   │    │  3 ★  │             │
│     │Tokens │    │Signals│    │ BUY   │             │
│     │Scanned│    │Found  │    │Picks  │             │
│     └───────┘    └───────┘    └───────┘             │
│                                                     │
│     X Layer · OKX Onchain OS · Bayesian Engine      │
│                                                     │
│                    ↓ Scroll                          │
│                                                     │
│  ─── OKX Build X Hackathon · X Layer Arena ───      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 设计要点

**标题处理**:
- "LANTERN" 和 "AGENT" 分两行
- 48px, weight 700, letter-spacing 12px, 全大写
- 颜色: 纯白 #FFFFFF
- 不用渐变色，不用描边，干净的白字在深黑上最有力量

**灯笼**:
- 64px emoji（或 SVG）
- 下方 `radial-gradient(ellipse 200px 150px at center, #FF910012 0%, transparent 100%)`
- 静态光晕，不动画。灯笼是稳定的存在，不是闪烁的广告。

**副标题**:
- "Autonomous DEX Trading Intelligence on X Layer"
- 14px, Inter, weight 400, `#888`, letter-spacing 3px

**三统计卡**:
- 水平排列，居中，gap 20px
- 每个: 130px × 90px, `#0f0f0f`, border `#1a1a1a`, radius 12px
- 数字: 32px, JetBrains Mono, weight 700, 白色
- 标签: 11px, Inter, weight 500, `#666`, 全大写
- BUY 卡片: 数字用 `#00E676`, 边框 `#00E67625`
- **数字入场**: 从 0 滚动到目标值，800ms easeOut（用 requestAnimationFrame）

**↓ Scroll 提示**:
- "↓" 字符，20px, `#333`
- 缓慢上下浮动动画 (translateY 0 → 6px → 0, 2s loop, ease-in-out)
- 这是 Hero 区唯一允许循环的动画

**底部黑客松标识**:
- "OKX Build X Hackathon · X Layer Arena"
- 12px, `#333`, 底部绝对定位
- 左右两侧各一条细线 `────`

**背景**:
```css
background:
  radial-gradient(ellipse 800px 500px at 50% 40%, #0f0f0f 0%, #050505 100%);
```

---

## S2 · PROBLEM — "为什么需要它？"

### 功能
建立紧迫感：市场有什么问题，Agent 怎么解决。

### 布局

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  THE PROBLEM                                        │
│                                                     │
│  "市场上 99% 的交易 Agent 都是聊天机器人——             │
│   它们建议你买什么，然后等你点确认。                    │
│   这不是自主，这是带了 AI 皮肤的按钮。"                │
│                                                     │
│  ┌──────────────┐         ┌──────────────┐          │
│  │  Others       │         │  Lantern     │          │
│  │               │         │              │          │
│  │  Human asks   │         │  Agent scans │          │
│  │  ↓            │         │  ↓           │          │
│  │  AI suggests  │         │  Agent       │          │
│  │  ↓            │         │  decides     │          │
│  │  Human clicks │         │  ↓           │          │
│  │  ↓            │         │  Agent       │          │
│  │  Trade        │         │  executes    │          │
│  │  executes     │         │  ↓           │          │
│  │               │         │  Agent       │          │
│  │  (4 steps,    │         │  monitors    │          │
│  │   human in    │         │              │          │
│  │   the loop)   │         │  (0 human    │          │
│  │               │         │   steps)     │          │
│  └──────────────┘         └──────────────┘          │
│       灰色，暗淡                绿色，发光              │
│                                                     │
│  Agent 不再是辅助，而是构建、交易、竞争的主体。          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 设计要点

**引言**: 
- 用引号包裹，16px, Inter, `#ccc`, italic
- 关键词加粗白色

**对比两列**:
- 左列 "Others": 背景 `#080808`, 边框 `#151515`, 文字 `#555` — 暗淡、无生气
- 右列 "Lantern": 背景 `#0a0f0a`, 边框 `#00E67625`, 文字 `#E0E0E0` — 有能量
- 右列每个步骤之间有绿色竖线连接（代表自动化流程）
- 右列没有 "Human" 字样——这就是区别

**底部 Quote**:
- 黑客松主题原话: "Agent 不再是辅助，而是构建、交易、竞争的主体。"
- 18px, weight 600, 白色, 居中
- 下方小字注明出处: "— OKX Build X Hackathon"

---

## S3 · HOW IT WORKS — "它怎么工作？"

### 功能
展示 4 层架构，但不是静态图片——是有数据流动感的动态展示。

### 布局

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  HOW IT WORKS                                       │
│  Every 60 seconds, Lantern runs a full cycle.       │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │                                             │    │
│  │     SCAN ──→ ANALYZE ──→ DECIDE ──→ EXECUTE │    │
│  │      ↑                                 │    │    │
│  │      └─────────── 60s ─────────────────┘    │    │
│  │                                             │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌── L1 ──┐  ┌── L2 ──┐  ┌── L3 ──┐  ┌── L4 ──┐  │
│  │ Market │  │Decision│  │Execute │  │ State  │  │
│  │Discover│→ │ Engine │→ │  DEX   │→ │  & UI  │  │
│  │        │  │        │  │        │  │        │  │
│  │token   │  │Kelly   │  │swap    │  │Postgres│  │
│  │signal  │  │Review  │  │gateway │  │Next.js │  │
│  │security│  │Guards  │  │wallet  │  │Archive │  │
│  └────────┘  └────────┘  └────────┘  └────────┘  │
│                                                     │
│  ⚡ X Layer · Zero Gas Fees · 500+ DEX Sources      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 设计要点

**循环图**:
- 4 个节点: SCAN / ANALYZE / DECIDE / EXECUTE
- 水平排列，箭头连接
- 底部弧线回到 SCAN，标注 "60s"
- 当前活跃节点高亮绿色，其他灰色
- **动画**: 一个绿色光点沿箭头路径移动，每 4 秒走完一圈（代表 Agent 循环）
- 这是唯一允许持续循环的动画——因为它代表 Agent "一直在运行"

**4 层卡片**:
- 水平排列，等宽，gap 12px
- 每个卡片: 标题 + 3 个 OKX skill 标签
- 标题: 16px, weight 700
- Skill 标签: 小 badge，11px, `#0f0f0f` 底色, `#333` 边框
- 层与层之间: → 箭头连接

**底部标签**:
- "⚡ X Layer · Zero Gas Fees · 500+ DEX Sources"
- 14px, `#00E676`, weight 500
- ⚡ 代替 emoji

---

## S4 · OKX INTEGRATION — "用了哪些 OKX 能力？"

### 功能
明确展示 7 个 OKX Skill 的集成。这是评审的**硬指标**。

### 布局

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  OKX ONCHAIN OS INTEGRATION                        │
│  7 Skills · Full Trading Pipeline                   │
│                                                     │
│  ┌─ Data Flow ──────────────────────────────────┐   │
│  │                                               │   │
│  │  token ─┐                                    │   │
│  │  signal ─┤→ FILTER → SCORE → DECIDE → swap   │   │
│  │  market ─┤    ↑                         ↓    │   │
│  │          │ security              gateway     │   │
│  │          │                         ↓        │   │
│  │          └──────────────────── wallet ──→ ✓  │   │
│  │                                               │   │
│  └───────────────────────────────────────────────┘   │
│                                                     │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │
│  │  dex   │ │  dex   │ │        │ │  dex   │       │
│  │  token │ │ signal │ │security│ │ market │       │
│  │        │ │        │ │        │ │        │       │
│  │13 cmds │ │5 cmds  │ │5 cmds  │ │9 cmds  │       │
│  │热门发现 │ │聪明钱   │ │蜜罐检测│ │价格K线  │       │
│  └────────┘ └────────┘ └────────┘ └────────┘       │
│  ┌────────┐ ┌────────┐ ┌────────┐                   │
│  │  dex   │ │onchain │ │agentic │                   │
│  │  swap  │ │gateway │ │ wallet │                   │
│  │        │ │        │ │        │                   │
│  │6 cmds  │ │6 cmds  │ │16 cmds │                   │
│  │聚合交易 │ │模拟广播 │ │余额签名 │                   │
│  └────────┘ └────────┘ └────────┘                   │
│                                                     │
│  7 / 14 Skills integrated · 60 commands available   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 设计要点

**数据流图**:
- 用 CSS 绘制的流程图（不是 ASCII，是真的线条和节点）
- 每个 skill 名是一个节点（小圆角矩形）
- 节点之间有连线，表示数据流向
- **动画**: 数据点（小绿色圆点）沿连线从左到右流动

**Skill 卡片**:
- 7 个卡片，4+3 排列
- 每个卡片: skill 名 + 命令数量 + 一句话中文用途
- 背景 `#0f0f0f`, hover 时边框变绿
- **已集成的标记**: 左上角一个绿色小圆点（8px）
- 命令数: 大字, 20px, `#00E676`

**底部统计**:
- "7 / 14 Skills integrated · 60 commands available"
- 用一个进度条: 14 格，7 格绿色填充，7 格灰色空心
- 表达"已做了一半，还有扩展空间"

---

## S5 · LIVE DEMO — "它真的能跑？"

### 功能
这是页面的**高潮**——展示 Agent 的真实输出。不是 mock，是 `pnpm agent:demo` 的实际结果。

### 布局

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  LIVE ANALYSIS                                      │
│  Real output from Lantern Agent's last cycle        │
│                                                     │
│  ┌─ Top Recommendation ────────────────────────┐    │
│  │  XDOG  $0.00415  ★ 67.7%  HIGH CONFIDENCE  │    │
│  │  3🐋 $765 · Liquidity $496K · 35K holders   │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─ Bayesian Reasoning ───────────────────────┐     │
│  │                                             │     │
│  │  50%  uninformed prior                      │     │
│  │   ├─ 📈 Price Momentum    +8.5%  → 58.5%  │     │
│  │   ├─ 📈 Buy/Sell Ratio   +4.2%  → 62.7%  │     │
│  │   ├─ 📈 Smart Money      +3.1%  → 65.8%  │     │
│  │   ├─ 📈 Diamond Hands    +1.9%  → 67.7%  │     │
│  │   ▼                                        │     │
│  │  67.7%  → BUY ★                            │     │
│  │                                             │     │
│  └─────────────────────────────────────────────┘     │
│                                                     │
│  ┌─ All Candidates ───────────────────────────┐     │
│  │  [XDOG ★67%] [DOGSH ★67%] [AI ★67%]       │     │
│  │  [NIUMA 56%] [BAOBAO 56%] [TOKEN 56%]     │     │
│  │  [skip] [skip] [skip] [skip] ...           │     │
│  └─────────────────────────────────────────────┘     │
│                                                     │
│  ┌─ Polymarket Edge ──────────────────────────┐     │
│  │    Poly: 58.0%    vs    Lantern: 72.3%     │     │
│  │    Edge: +14.3%   ★ STRONG                 │     │
│  └─────────────────────────────────────────────┘     │
│                                                     │
│  Data refreshes every 30s · Run: pnpm agent:demo    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 设计要点

这个区块复用之前设计的组件，但嵌入到展示页面的叙事中。

**关键**: 上方加一行说明 "Real output from Lantern Agent's last cycle"，强调这不是 mock 数据。

**瀑布图动画**: 和前面设计规范一致——300ms 逐步展开，进度条增长，最终结果闪光。

**候选卡片**: 紧凑版——不需要完整信息，只显示代币名 + 概率 + BUY/SKIP 状态。一行排开。

**Edge 对比**: 两个大数字 (Poly 灰 vs Lantern 绿) + Edge 条形图。

---

## S6 · RISK CONTROLS — "安全吗？"

### 功能
打消评委的顾虑："一个自动交易的 Agent 会不会亏光？"

### 布局

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  RISK CONTROLS                                      │
│  Hard rules. Code-enforced. Agent cannot bypass.    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │                                             │    │
│  │  ■■■■■■■■■■■■■■■■■■■■░░░░░░░░░░  50%       │    │
│  │  Maximum Total Exposure                     │    │
│  │                                             │    │
│  │  ■■■■■■░░░░░░░░░░░░░░░░░░░░░░░░  20%       │    │
│  │  Drawdown Halt Trigger                      │    │
│  │                                             │    │
│  │  ■■■■■■■■■░░░░░░░░░░░░░░░░░░░░░  30%       │    │
│  │  Per-Position Stop Loss                     │    │
│  │                                             │    │
│  │  ■■■■■■■■■■■■■■■■■■░░  10 positions max    │    │
│  │  Position Limit                             │    │
│  │                                             │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  "These are not suggestions to the AI.              │
│   They are service-layer constraints                │
│   enforced at the code level.                       │
│   The Agent cannot override them."                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 设计要点

**风控条**:
- 每条规则是一个水平进度条
- 条的填充量 = 阈值占比（50%、20%、30%）
- 颜色: 已填充部分用**红色渐变**（从 `#FF525230` 到 `#FF5252`）— 表示"这是危险区域的边界"
- 空白部分: `#1a1a1a`

**底部声明**:
- 引号包裹的 4 行声明
- 16px, Inter, `#ccc`
- "service-layer constraints" 和 "enforced at the code level" 加粗白色
- 不用 emoji，不用感叹号——冷静、可信赖的语气

---

## S7 · FOOTER — "在哪看代码？"

### 布局

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │  GitHub   │  │  Live    │  │  Docs    │          │
│  │  ↗       │  │  Dashboard│  │  ↗      │          │
│  └──────────┘  └──────────┘  └──────────┘          │
│                                                     │
│  Tech: TypeScript · Next.js 16 · Fastify 5          │
│        PostgreSQL · BullMQ · ethers.js              │
│                                                     │
│  Built for OKX Build X Hackathon                    │
│  X Layer Arena Track · April 2026                   │
│                                                     │
│         🏮                                           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

三个链接按钮 + 技术栈列表 + 黑客松标识 + 底部灯笼。

---

## 全局动画时间线

```
滚动位置    事件
────────    ────────────────────────
0%          S1 Hero 可见
            - 灯笼 + 标题淡入 (0-500ms)
            - 统计卡数字滚动 (600-1400ms)
            - ↓ 提示浮动开始

~15%        S2 Problem 进入视口
            - 引言淡入
            - 左右对比列依次出现 (左先，右后 300ms)

~30%        S3 How It Works 进入视口
            - 循环图出现
            - 绿色光点开始沿路径移动（持续）
            - 4 层卡片依次淡入 (每个 200ms)

~45%        S4 OKX Integration 进入视口
            - 数据流图出现，数据点开始流动
            - 7 个 Skill 卡片依次弹入

~60%        S5 Live Demo 进入视口
            - Top Recommendation 卡片滑入
            - 瀑布图 300ms 逐步展开（核心动画）
            - 候选卡片网格整体淡入
            - Edge 对比卡片淡入

~80%        S6 Risk Controls 进入视口
            - 风控条从 0% 增长到目标值 (600ms)
            - 声明文字淡入

~95%        S7 Footer 进入视口
            - 链接按钮和标识淡入
```

**实现**: 用 Intersection Observer API，每个区块在首次进入视口时触发一次动画，不重复播放。

---

## 交互细节

### 导航
- **无顶部导航栏** — 这是一个线性叙事，不需要跳转
- **可选**: 右侧放一列小圆点（类似 fullpage.js 的导航点），标注当前区块

### Hover
- Skill 卡片 hover: 边框绿色 + 轻微上浮 2px
- 候选代币卡片 hover: 显示完整信号列表
- 链接按钮 hover: 背景从 `#0f0f0f` 变为 `#1a1a1a`

### 响应式
- Desktop: 最大宽度 1000px 居中
- Tablet: 卡片从 4 列变 2 列
- Mobile: 单列，Hero 统计卡竖排

---

## 技术实现路径

整个展示页面是一个 Next.js 页面: `/app/showcase/page.tsx`

**不需要的**:
- 不需要路由（单页面）
- 不需要状态管理库（useState 足够）
- 不需要动画库（CSS @keyframes + Intersection Observer）
- 不需要图表库（纯 CSS 进度条 + 自绘瀑布图）

**需要的**:
- `"use client"` (Intersection Observer 需要)
- `fetch("/api/demo-trace")` 获取实时数据
- CSS @keyframes 定义在 `<style>` 标签中
- `IntersectionObserver` 触发入场动画

**文件结构**:
```
apps/web/
  app/showcase/page.tsx          ← 展示页面（单文件，所有区块）
  components/
    showcase-hero.tsx            ← S1 Hero
    showcase-problem.tsx         ← S2 Problem
    showcase-architecture.tsx    ← S3 How It Works
    showcase-okx-skills.tsx      ← S4 OKX Integration
    showcase-live-demo.tsx       ← S5 Live Demo (复用 probability-waterfall)
    showcase-risk.tsx            ← S6 Risk Controls
    showcase-footer.tsx          ← S7 Footer
    use-in-view.ts              ← Intersection Observer hook
```

---

## 不做的事

1. **不用 fullpage.js / scroll-snap** — 限制自由滚动会让评委烦躁
2. **不用 video 背景** — 加载慢，分散注意力
3. **不用 3D / WebGL** — 过度设计，增加复杂度
4. **不用 carousel / slider** — 评委没时间点下一页
5. **不用 modal / popup** — 打断阅读流
6. **不自动播放声音** — 没什么好说的
7. **不放团队照片** — 这是 Agent 的展示，不是人的
8. **不在 Hero 区放"开始使用"按钮** — 这不是 SaaS，是展示
9. **不用超过 3 层嵌套的动画** — 一个区块最多 2 层动画（区块入场 + 内部元素动画）
10. **不做 dark/light 切换** — 只有暗色，这是设计决策不是功能缺失
