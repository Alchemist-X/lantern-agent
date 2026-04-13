# Lantern Agent — 上线行动计划

> 三大目标：实盘交易 | 部署网页仪表盘 | 精美展示设计和结果

---

## 一、实盘交易

### 前置条件

- [x] onchainos CLI 已安装（路径 `/Users/Aincrad/.local/bin/onchainos`）
- [x] 钱包已登录 (hycrpg@gmail.com)
- [ ] X Layer 钱包有资金（USDC）
- [ ] OKX API 凭据已准备（Project ID / API Key / Secret Key / Passphrase）
- [ ] PostgreSQL + Redis 已启动

### Step 1: 启动基础设施（PostgreSQL + Redis）

```bash
cd /Users/Aincrad/Desktop/Cook_Proj/hackathon-united/OKX-hackathon-external
docker compose up -d postgres redis
```

验证服务状态：

```bash
docker compose ps
# 确认 postgres (5432) 和 redis (6379) 均为 running
```

如果本地已有 Postgres/Redis 跑在对应端口，可跳过 docker，直接复用。

### Step 2: 充值 USDC 到 X Layer

当前钱包地址：`0xb266dd8d835e3388d0eaf0bf7efff3bb732dfed6`

充值方式（任选一种）：

1. **从 OKX 交易所提币**（推荐，速度最快）
   - 登录 OKX 交易所 → 资产 → 提币
   - 选择币种 USDC，网络选 **X Layer**
   - 粘贴地址 `0xb266dd8d835e3388d0eaf0bf7efff3bb732dfed6`
   - X Layer 网络提币 **零手续费**
   - 到账时间：通常 1-3 分钟

2. **跨链桥**
   - 从 Ethereum/Polygon/Arbitrum 通过 OKX Bridge 转入
   - 访问 https://www.okx.com/web3/bridge

3. **最低建议金额**：$50-100 USDC（测试期间足够跑多轮循环）

验证到账：

```bash
onchainos portfolio all-balances \
  --address 0xb266dd8d835e3388d0eaf0bf7efff3bb732dfed6 \
  --chains 196 \
  --output json
```

或查看 X Layer Explorer：
https://www.okx.com/web3/explorer/xlayer/address/0xb266dd8d835e3388d0eaf0bf7efff3bb732dfed6

### Step 3: 配置 .env

```bash
cd /Users/Aincrad/Desktop/Cook_Proj/hackathon-united/OKX-hackathon-external
cp .env.example .env
```

编辑 `.env`，填入以下必填项：

```bash
# ═══════════════════════════════════════════════
# 必填 — OKX API 凭据（从 OKX 开发者平台获取）
# ═══════════════════════════════════════════════
OKX_PROJECT_ID=你的项目ID
OKX_API_KEY=你的API_Key
OKX_SECRET_KEY=你的Secret_Key
OKX_PASSPHRASE=你的Passphrase

# ═══════════════════════════════════════════════
# 必填 — 钱包
# ═══════════════════════════════════════════════
PRIVATE_KEY=0x你的私钥
OKX_WALLET_ADDRESS=0xb266dd8d835e3388d0eaf0bf7efff3bb732dfed6

# Executor 读取的钱包地址变量名（兼容）
WALLET_ADDRESS=0xb266dd8d835e3388d0eaf0bf7efff3bb732dfed6

# ═══════════════════════════════════════════════
# 建议修改 — 小额实盘参数
# ═══════════════════════════════════════════════
INITIAL_BANKROLL_USD=100
MIN_TRADE_USD=1
MAX_TRADE_PCT=0.05
MAX_TOTAL_EXPOSURE_PCT=0.5
MAX_POSITIONS=10

# ═══════════════════════════════════════════════
# 运行模式（live = 真实交易 / paper = 模拟）
# ═══════════════════════════════════════════════
LANTERN_EXECUTION_MODE=paper

# ═══════════════════════════════════════════════
# 数据库 & Redis（docker compose 默认值）
# ═══════════════════════════════════════════════
DATABASE_URL=postgres://postgres:postgres@localhost:5432/lantern
REDIS_URL=redis://localhost:6379

# ═══════════════════════════════════════════════
# X Layer 链配置（默认值即可）
# ═══════════════════════════════════════════════
OKX_CHAIN_ID=196
RPC_URL=https://xlayerrpc.okx.com

# ═══════════════════════════════════════════════
# Agent 循环参数
# ═══════════════════════════════════════════════
AGENT_POLL_INTERVAL_SECONDS=60
SYNC_INTERVAL_SECONDS=30
AGENT_DECISION_STRATEGY=pulse-direct

# ═══════════════════════════════════════════════
# Pulse 参数
# ═══════════════════════════════════════════════
PULSE_MIN_LIQUIDITY_USD=5000
PULSE_MAX_CANDIDATES=12
PULSE_MIN_FETCHED_MARKETS=50
PULSE_MIN_TRADEABLE_CANDIDATES=3

# ═══════════════════════════════════════════════
# 仪表盘
# ═══════════════════════════════════════════════
ADMIN_PASSWORD=change-me
ORCHESTRATOR_INTERNAL_TOKEN=replace-me
APP_URL=http://localhost:3000
```

### Step 4: 初始化数据库

```bash
cd /Users/Aincrad/Desktop/Cook_Proj/hackathon-united/OKX-hackathon-external

# 构建依赖包（contracts + db 是先决依赖）
pnpm build

# 运行数据库迁移
pnpm db:migrate
```

如果需要 seed 示例数据（可选）：

```bash
pnpm db:seed
```

### Step 5: Paper 模式测试（强烈建议先跑一轮）

确保 `.env` 中设置：
```
LANTERN_EXECUTION_MODE=paper
```

运行单轮 Pulse 测试：

```bash
cd /Users/Aincrad/Desktop/Cook_Proj/hackathon-united/OKX-hackathon-external
pnpm pulse:recommend
```

观察输出：
- Pulse 阶段是否成功获取 X Layer 热门代币
- 聪明钱信号是否正常加载
- 安全扫描是否过滤蜜罐代币
- 候选代币排名是否合理

运行完整 Paper 循环（包含决策 + 模拟交易）：

```bash
pnpm pulse:live
```

如果需要跑完整的 live-test 流程（包含 BullMQ 任务队列）：

```bash
pnpm live:test
```

**排查清单**：
- 如果 onchainos CLI 报错 → 检查 `onchainos --version`，确认登录状态 `onchainos auth status`
- 如果 DB 连接失败 → 确认 `docker compose ps` 中 postgres 正常
- 如果 Redis 连接失败 → 确认 `docker compose ps` 中 redis 正常
- 如果 Pulse 返回 0 候选 → 降低 `PULSE_MIN_LIQUIDITY_USD` 到 1000

### Step 6: 切换实盘模式

Paper 测试通过后，修改 `.env`：

```
LANTERN_EXECUTION_MODE=live
```

启动实盘交易：

```bash
cd /Users/Aincrad/Desktop/Cook_Proj/hackathon-united/OKX-hackathon-external
pnpm build
pnpm pulse:live
```

Agent 将以 60 秒为周期自动运行：
1. **SYNC** — 同步钱包余额和持仓状态
2. **PULSE** — 通过 `onchainos token hot-tokens` 和 `onchainos signal list` 抓取热门代币 + 聪明钱信号
3. **RESEARCH** — 通过 `onchainos security token-scan` 进行安全扫描，获取价格数据
4. **DECISION** — Kelly Criterion 仓位定价，风控裁剪
5. **EXECUTION** — 通过 `onchainos swap execute` 在 OKX DEX 聚合器上成交（500+ 流动性源）

无交易信号时执行 **heartbeat swap**（USDC 小额自交易），保持链上活跃度。

### Step 7: 实时监控

**方式 A：全栈 dev 模式**（仪表盘 + orchestrator + executor 同时启动）

```bash
cd /Users/Aincrad/Desktop/Cook_Proj/hackathon-united/OKX-hackathon-external
pnpm dev
```

服务端口：
- Web 仪表盘：http://localhost:3000
- Orchestrator API：http://localhost:4001
- Executor API：http://localhost:4002

**方式 B：仅运行 Agent 循环**（终端观察输出）

```bash
pnpm pulse:live
```

**链上交易验证**：

X Layer Explorer 查看交易记录：
https://www.okx.com/web3/explorer/xlayer/address/0xb266dd8d835e3388d0eaf0bf7efff3bb732dfed6

### Step 8: 紧急操作

**手动平仓所有持仓**（卖出所有非 USDC 代币回 USDC）：

通过代码中已实现的 `flattenAllPositions` 函数（`services/executor/src/lib/okx-dex.ts`），可以编写一个快速脚本调用。

**停止 Agent**：直接 `Ctrl+C` 终止进程。Agent 无后台常驻守护进程，终止即停。

**查看运行产出物**：

```bash
ls runtime-artifacts/
# 每轮循环的 Pulse 报告、决策记录、交易结果都归档在此
```

---

## 二、部署网页仪表盘

### 方案 A: Vercel 部署（推荐，最快）

#### Step 1: 初始化 Git 仓库并推送到 GitHub

```bash
cd /Users/Aincrad/Desktop/Cook_Proj/hackathon-united/OKX-hackathon-external

# 初始化 git（如果还没有）
git init
git add -A
git commit -m "feat: lantern-agent hackathon submission"

# 创建 GitHub 仓库并推送
gh repo create lantern-agent --public --source=. --push
```

如果仓库已存在：

```bash
git remote add origin https://github.com/你的用户名/lantern-agent.git
git push -u origin main
```

#### Step 2: 安装 Vercel CLI 并部署

```bash
# 安装 Vercel CLI
pnpm add -g vercel

# 登录 Vercel
vercel login

# 部署 Web 仪表盘
cd /Users/Aincrad/Desktop/Cook_Proj/hackathon-united/OKX-hackathon-external/apps/web
vercel --prod
```

部署时的交互式提示：
- **Set up and deploy?** → Yes
- **Which scope?** → 选择你的账户
- **Link to existing project?** → No
- **What's your project's name?** → `lantern-agent`
- **In which directory is your code located?** → `./`（当前已在 apps/web 目录）
- **Want to modify these settings?** → No（vercel.json 已配置 framework: nextjs）

或者通过 Vercel 网站操作：
1. 访问 https://vercel.com/new
2. Import GitHub repo `lantern-agent`
3. **Root Directory** 设置为 `apps/web`
4. **Framework Preset**: Next.js（自动检测）
5. **Build Command**: 保持默认（`next build`，会自动触发 prebuild 脚本）
6. 点击 Deploy

#### Step 3: 配置 Vercel 环境变量

在 Vercel Dashboard → 你的项目 → Settings → Environment Variables，添加：

| 变量名 | 值 | 说明 |
|--------|---|------|
| `DATABASE_URL` | `postgres://...` | 远程 PostgreSQL 连接串（见下方） |
| `APP_URL` | `https://lantern-agent.vercel.app` | 你的 Vercel 域名 |
| `ADMIN_PASSWORD` | 自定义强密码 | 仪表盘管理密码 |
| `ORCHESTRATOR_INTERNAL_URL` | `http://你的服务器IP:4001` | 如果需要实时数据 |
| `ORCHESTRATOR_INTERNAL_TOKEN` | 自定义 token | API 鉴权 |

#### Step 4: 远程数据库（仪表盘需要）

**选项 A: Vercel Postgres（最方便）**

```bash
# 在 Vercel Dashboard 创建 Postgres 数据库
# Settings → Storage → Create Database → Postgres
# 自动注入 DATABASE_URL 环境变量
```

**选项 B: Supabase（免费额度更大）**

1. 访问 https://supabase.com → New Project
2. 创建数据库，复制 Connection String
3. 在 Vercel 环境变量中设置 `DATABASE_URL`

**选项 C: Neon（免费 Serverless Postgres）**

1. 访问 https://neon.tech → New Project
2. 复制连接串，设置到 Vercel 环境变量

数据库创建后，运行迁移：

```bash
# 临时设置远程 DATABASE_URL
DATABASE_URL="postgres://你的远程连接串" pnpm db:migrate
```

#### Step 5: 验证部署

```bash
# 检查部署状态
vercel ls

# 打开仪表盘
open https://lantern-agent.vercel.app
```

仪表盘页面清单（`apps/web/app/` 下已实现的路由）：
- `/` — 首页概览
- `/positions` — 当前持仓
- `/trades` — 交易记录
- `/runs` — Agent 运行历史
- `/pnl` — 盈亏曲线
- `/reports` — 运行报告
- `/cashflow` — 资金流水
- `/backtests` — 回测结果
- `/admin` — 管理面板

### 方案 B: 纯静态展示（无需后端和远程数据库）

如果只想展示仪表盘 UI 设计，不需要实时数据：

#### Step 1: 使用本地状态文件模式

在 `.env` 中设置：

```bash
LANTERN_LOCAL_STATE_FILE=runtime-artifacts/state.json
```

Agent 运行时会把状态写入本地 JSON 文件，仪表盘可以读取展示。

#### Step 2: Seed 示例数据

```bash
cd /Users/Aincrad/Desktop/Cook_Proj/hackathon-united/OKX-hackathon-external
pnpm db:seed
```

#### Step 3: 部署到 Vercel

同方案 A 的步骤部署，仪表盘将展示 seed 数据。

### 方案 C: Docker Compose 全栈部署（自有服务器）

如果有 VPS/云服务器，可以用 docker-compose 一键启动全部服务：

```bash
scp -r . your-server:/opt/lantern-agent/
ssh your-server

cd /opt/lantern-agent
cp .env.example .env
# 编辑 .env 填入凭据

docker compose up -d
```

所有服务（postgres + redis + orchestrator + executor）均有 Dockerfile，端口：
- Web: 3000
- Orchestrator: 4001
- Executor: 4002
- Postgres: 5432
- Redis: 6379

配置反向代理（Nginx/Caddy）暴露 3000 端口即可公网访问。

---

## 三、精美展示设计和结果

### 3.1 需要准备的素材清单

#### A. 架构图（用 Excalidraw 或 Figma 重绘）

将 README 中的 ASCII 架构图重绘为精美版本：

```
需要表达的核心内容：
┌─────────────────────────────────────────────────┐
│               Lantern Agent                      │
│         Autonomous DEX Trader on X Layer         │
├─────────────────────────────────────────────────┤
│  L1: Market Discovery                            │
│  ├─ okx-dex-token (hot-tokens, price-info)       │
│  ├─ okx-dex-signal (smart money, KOL tracker)    │
│  └─ okx-security (honeypot scan)                 │
│                    ↓                              │
│  L2: Decision Engine                              │
│  ├─ Signal Analysis → Kelly Criterion             │
│  ├─ Position Review → Hold/Reduce/Close           │
│  └─ okx-dex-market (prices, klines, PnL)         │
│                    ↓                              │
│  L3: Execution                                    │
│  ├─ okx-dex-swap (500+ DEX sources)              │
│  ├─ okx-onchain-gateway (simulate, broadcast)     │
│  └─ okx-agentic-wallet (balance, portfolio)       │
│                    ↓                              │
│  L4: State & Dashboard                            │
│  ├─ PostgreSQL + Drizzle ORM                      │
│  └─ Next.js 16 Real-time Dashboard                │
└─────────────────────────────────────────────────┘
          60s Loop · X Layer · Zero Gas
```

设计建议：
- 颜色方案：OKX 黑色 (#000000) + 绿色 (#00F0A8) 主题
- 每层标注具体使用的 OKX Skill 名称
- 用箭头展示 60 秒循环数据流
- 工具推荐：https://excalidraw.com 或 Figma

#### B. 实盘运行截图（运行 Agent 后截取）

- [ ] **终端输出截图**：Pulse 发现 → Decision 决策 → Execution 成交的完整一轮
- [ ] **仪表盘首页截图**：持仓面板 + 权益概览
- [ ] **持仓页截图**：`/positions` 页面
- [ ] **交易记录截图**：`/trades` 页面
- [ ] **PnL 曲线截图**：`/pnl` 页面
- [ ] **X Layer Explorer 截图**：真实链上交易记录
- [ ] **OKX 钱包余额截图**：资产变化

#### C. Demo 视频（1-3 分钟，强烈推荐）

**录屏工具**：macOS 自带 QuickTime Player 或 OBS Studio

**脚本建议**：

```
0:00-0:15  开场介绍
           "Lantern Agent 是一个运行在 X Layer 上的全自主 DEX 交易代理。
            从信号发现到链上成交，零人工干预。"

0:15-0:40  架构概览
           展示精美架构图，逐层讲解：
           - L1: 通过 OKX Onchain OS 实时发现热门代币和聪明钱信号
           - L2: Kelly Criterion 量化决策 + 服务层硬风控
           - L3: OKX DEX 聚合器 500+ 流动性源执行交易
           - L4: Next.js 实时仪表盘全链透明

0:40-1:10  实盘演示
           终端启动 Agent：pnpm pulse:live
           观察一轮完整循环：
           - Pulse 扫描到热门代币
           - Security scan 过滤蜜罐
           - Kelly Criterion 计算仓位
           - DEX swap 成交
           - 展示 txHash

1:10-1:40  链上验证
           打开 X Layer Explorer
           展示真实交易记录
           点进一笔交易查看详情

1:40-2:10  仪表盘
           打开 http://localhost:3000
           展示各页面：
           - 首页概览（总资产、PnL）
           - 持仓详情
           - 交易历史
           - 运行记录

2:10-2:40  风控演示（可选）
           展示风控规则：
           - 20% 回撤熔断
           - 30% 单仓止损
           - 50% 总敞口上限
           说明这些是代码层强制，Agent 无法绕过

2:40-3:00  总结
           核心价值：真正的自主 Agent，不是聊天机器人
           技术亮点：7 个 OKX Skills 深度集成
           X Layer 原生：零 Gas 费高频循环
```

### 3.2 README 优化

#### A. 顶部加 Badge

在 README.md 标题下方添加：

```markdown
![X Layer](https://img.shields.io/badge/Chain-X%20Layer%20(196)-black?style=flat-square)
![OKX Skills](https://img.shields.io/badge/OKX%20Skills-7%20Integrated-00F0A8?style=flat-square)
![Status](https://img.shields.io/badge/Status-Live%20Trading-brightgreen?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-Monorepo-blue?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square)
```

#### B. 加实盘数据板块

在 README 中 "What We Built" 之后添加：

```markdown
## Live Trading Results

> 以下数据来自 Agent 在 X Layer 上的真实交易记录

| 指标 | 数值 |
|------|------|
| 运行时长 | XX 小时 |
| 总交易笔数 | XX 笔 |
| 总交易量 | $XX |
| 最终 PnL | +$XX (XX%) |
| 最大回撤 | XX% |
| 链上交易哈希 | [查看 Explorer](链接) |

**仪表盘在线地址**: [https://lantern-agent.vercel.app](链接)

### 交易记录截图

![Dashboard](截图链接)

### 链上交易证明

| 时间 | 操作 | 代币 | 金额 | TxHash |
|------|------|------|------|--------|
| ... | BUY | XXX | $XX | [0xabc...](链接) |
| ... | SELL | XXX | $XX | [0xdef...](链接) |
```

#### C. 加 Demo 视频链接

```markdown
## Demo

[![Demo Video](视频缩略图链接)](视频链接)

> 3 分钟了解 Lantern Agent 的完整工作流程
```

#### D. 加仪表盘在线链接

```markdown
## Live Dashboard

访问 [https://lantern-agent.vercel.app](链接) 查看 Agent 实时运行状态。
```

### 3.3 项目 Logo / Banner

建议使用 AI 图片生成工具制作：

**Prompt 参考**：

```
Minimalist tech banner for "Lantern Agent" - an autonomous DEX trading AI.
Dark background (#0a0a0a), accent color green (#00F0A8).
Feature a stylized Chinese lantern emitting data streams/signal waves.
Modern, clean, crypto/DeFi aesthetic. 1200x400px banner format.
```

生成后放置在 `apps/web/public/banner.png`，README 中引用：

```markdown
![Lantern Agent Banner](apps/web/public/banner.png)
```

---

## 四、完整时间线

| 阶段 | 步骤 | 预计耗时 | 前置条件 |
|------|------|---------|---------|
| **准备** | 启动 Docker (postgres + redis) | 2 分钟 | Docker Desktop 运行中 |
| **准备** | 充值 USDC 到 X Layer | 5-10 分钟 | OKX 交易所有 USDC |
| **准备** | 配置 .env | 5 分钟 | OKX API 凭据 |
| **准备** | 构建 + 数据库迁移 | 3-5 分钟 | Docker 服务就绪 |
| **测试** | Paper 模式测试 (pulse:recommend) | 5-10 分钟 | .env 配置完成 |
| **测试** | Paper 完整循环 (pulse:live) | 10-20 分钟 | Paper 单轮通过 |
| **实盘** | 切换 live 模式运行 | 持续运行 | 充值完成 + Paper 通过 |
| **部署** | GitHub 推送 | 5 分钟 | 代码就绪 |
| **部署** | Vercel 部署 + 环境变量 | 10-15 分钟 | GitHub repo 就绪 |
| **部署** | 远程数据库 + 迁移 | 10-15 分钟 | Vercel 部署完成 |
| **展示** | 截图收集（终端 + 仪表盘 + Explorer） | 30 分钟 | 实盘运行一段时间后 |
| **展示** | 架构图重绘 (Excalidraw) | 30-60 分钟 | 随时可做 |
| **展示** | README 最终优化 | 30 分钟 | 素材收集完 |
| **展示** | Demo 视频录制 + 剪辑（可选） | 1-2 小时 | 全部就绪 |

### 最快路径（约 2 小时到上线）

```
Docker 启动 → 充值 USDC → 配置 .env → 构建+迁移
    → Paper 测试 → 切换 Live → 截图
    → GitHub 推送 → Vercel 部署 → README 更新
```

### 并行执行建议

以下步骤可以同时进行：
- **充值 USDC** 和 **配置 .env** 同时进行
- **Agent 实盘运行**（后台持续）和 **Vercel 部署** 同时进行
- **架构图绘制** 和 **等待实盘数据积累** 同时进行
- **Demo 视频录制** 在所有其他步骤完成后最后进行

---

## 五、故障排查速查

| 症状 | 原因 | 解决 |
|------|------|------|
| `onchainos: command not found` | CLI 未在 PATH 中 | 确认 `/Users/Aincrad/.local/bin/onchainos` 存在 |
| `onchainos returned empty stdout` | CLI 调用超时或网络问题 | 检查网络，重试；增大 `TIMEOUT_MS` |
| Pulse 返回 0 候选 | X Layer 代币流动性不足 | 降低 `PULSE_MIN_LIQUIDITY_USD` 到 1000 |
| `ECONNREFUSED :5432` | PostgreSQL 未启动 | `docker compose up -d postgres` |
| `ECONNREFUSED :6379` | Redis 未启动 | `docker compose up -d redis` |
| `swap execute` 失败 | 余额不足或滑点过高 | 检查余额；增大 `OKX_SLIPPAGE_PCT` |
| 仪表盘空白 | 无数据库数据 | 运行 `pnpm db:seed` 或等待 Agent 产出数据 |
| Vercel 构建失败 | 缺少依赖或环境变量 | 检查 Root Directory 是否设为 `apps/web` |
| `PRIVATE_KEY` 读取失败 | .env 格式错误 | 确保私钥以 `0x` 开头，无多余空格 |
| 风控拦截所有交易 | 参数过于保守 | 适当放宽 `MAX_TRADE_PCT` 和 `MAX_TOTAL_EXPOSURE_PCT` |

---

## 六、关键文件索引

| 文件 | 作用 |
|------|------|
| `services/executor/src/lib/okx-dex.ts` | OKX DEX 交易执行桥（swap/quote/balance） |
| `services/orchestrator/src/pulse/market-pulse.ts` | 市场发现层（热门代币 + 信号 + 安全扫描） |
| `services/orchestrator/src/jobs/agent-cycle.ts` | Agent 主循环逻辑 |
| `services/orchestrator/src/jobs/heartbeat-swap.ts` | 心跳 swap（保持链上活跃） |
| `services/orchestrator/src/lib/risk.ts` | 风控规则（回撤/止损/敞口） |
| `services/orchestrator/src/config.ts` | Orchestrator 配置（所有 .env 变量映射） |
| `services/executor/src/config.ts` | Executor 配置 |
| `packages/db/src/schema.ts` | 数据库 Schema（Drizzle ORM） |
| `packages/db/src/queries.ts` | 数据库查询 |
| `apps/web/app/page.tsx` | 仪表盘首页 |
| `scripts/pulse-live.ts` | Pulse Live 入口脚本 |
| `scripts/live-test.ts` | Live Test 入口脚本（含 BullMQ） |
| `.env.example` | 环境变量模板 |
| `docker-compose.yml` | 本地基础设施定义 |
