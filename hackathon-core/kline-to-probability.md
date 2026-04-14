# K 线 → 概率：技术分析信号到 Polymarket 定价的转化方法

## 问题定义

Polymarket 市场本质是**二元期权**：

```
"BTC above $76K on Apr 15, 16:00 ET?"
当前 BTC 价格: $74,800
当前 Poly 定价: Yes = 58%
距截止: 26 小时
```

**目标**: 算出一个概率 P（比如 72%），如果 P 显著高于 58% → 买 Yes → 赚差价。

---

## 方法一：波动率模型（基础概率）

### 原理

价格在未来 T 小时内的运动可以用 **对数正态分布** 近似建模。
这和期权定价（Black-Scholes）的底层逻辑一样。

### 公式

```
P(S_T > K) = Φ(d₂)

其中:
  S₀ = 当前价格 = $74,800
  K  = 目标价格 = $76,000
  T  = 剩余时间（年化）= 26h / 8760h = 0.00297
  σ  = 年化波动率（从 K 线计算）
  μ  = 漂移项（可选，或假设 = 0）

  d₂ = [ln(S₀/K) + (μ - σ²/2)·T] / (σ·√T)
  Φ  = 标准正态分布累积函数
```

### 从 K 线计算波动率 σ

```bash
# 获取 24 根 1 小时 K 线
onchainos market kline --address <btc_addr> --chain 1 --bar 1H --limit 24
```

```typescript
// 计算已实现波动率
function realizedVolatility(klines: { o: number; c: number }[]): number {
  const returns = klines.map((k, i) => {
    if (i === 0) return 0;
    return Math.log(k.c / klines[i - 1].c);
  }).slice(1);

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, r) => a + (r - mean) ** 2, 0) / (returns.length - 1);
  const hourlyVol = Math.sqrt(variance);

  // 年化: hourlyVol × √(8760)
  return hourlyVol * Math.sqrt(8760);
}
```

### 计算概率

```typescript
// 标准正态分布 CDF (近似)
function normalCdf(x: number): number {
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const t = 1 / (1 + p * Math.abs(x));
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x / 2);
  return 0.5 * (1 + sign * y);
}

function priceAboveProbability(
  currentPrice: number,   // S₀ = 74800
  strikePrice: number,    // K  = 76000
  hoursToExpiry: number,  // T  = 26
  annualizedVol: number,  // σ  = 从 K 线计算
  drift: number = 0       // μ  = 漂移项
): number {
  const T = hoursToExpiry / 8760;
  const d2 = (Math.log(currentPrice / strikePrice) + (drift - annualizedVol ** 2 / 2) * T)
             / (annualizedVol * Math.sqrt(T));
  return normalCdf(d2);
}

// 示例:
// BTC = $74,800, 目标 = $76,000, 26h 后, 年化波动率 60%
const prob = priceAboveProbability(74800, 76000, 26, 0.60);
// → 约 45%
// 如果 Poly 定价 58%，那 Poly 高估了 → 卖 Yes / 买 No
```

### 波动率的选择窗口

| K 线周期 | 适用场景 | onchainos 命令 |
|----------|---------|---------------|
| 5m × 288 根 (24h) | 日级市场（< 24h 到期） | `--bar 5m --limit 288` |
| 1H × 168 根 (7d) | 周级市场 | `--bar 1H --limit 168` |
| 4H × 180 根 (30d) | 月级市场 | `--bar 4H --limit 180` |
| 1D × 90 根 (3m) | 年级市场 | `--bar 1D --limit 90` |

**重要**: 用最近的波动率，不要用太长历史。市场状态会变。

---

## 方法二：信号调整漂移项 μ（方向性 Edge）

波动率模型假设 μ=0（价格随机游走）。但链上数据告诉我们**方向**。

### 漂移项的来源

| 信号 | onchainos 命令 | 漂移调整 |
|------|---------------|---------|
| 聪明钱净买入 | `signal list --wallet-type 1` | μ > 0（看涨） |
| 聪明钱净卖出 | `tracker activities --trade-type 2` | μ < 0（看跌） |
| 鲸鱼转入交易所 | `tracker activities --tracker-type whale` | μ < 0 |
| 24h 成交量放大 + 价格上升 | `token price-info` volume + priceChange | μ > 0 |
| 24h 成交量放大 + 价格下跌 | 同上 | μ < 0 |
| 多条链聪明钱共识买入 | `signal list` triggerWalletCount ≥ 3 | μ >> 0 |

### 量化漂移

```typescript
interface SignalInput {
  smartMoneyNetBuyUsd: number;    // 聪明钱净买入金额（正=买 负=卖）
  whaleTransferToExchange: boolean; // 鲸鱼转入交易所
  volumeChange24h: number;        // 24h 成交量变化率
  priceChange1h: number;          // 1h 价格变化
  signalCount: number;            // 聚合买入信号数量
}

function estimateDrift(signals: SignalInput): number {
  let drift = 0;

  // 聪明钱方向（最重要）
  // 将净买入金额标准化为年化漂移
  // 假设 $1M 净买入 ≈ 0.05 年化漂移（需要历史校准）
  drift += (signals.smartMoneyNetBuyUsd / 1_000_000) * 0.05;

  // 鲸鱼转入交易所 = 利空
  if (signals.whaleTransferToExchange) {
    drift -= 0.10;
  }

  // 成交量趋势 × 价格方向
  // 放量上涨 = 看涨，放量下跌 = 看跌
  const volumeSignal = signals.volumeChange24h > 0.5 ? 1 : 0; // 放量 >50%
  const priceDirection = Math.sign(signals.priceChange1h);
  drift += volumeSignal * priceDirection * 0.03;

  // 多钱包共识信号
  if (signals.signalCount >= 3) {
    drift += 0.08;
  }

  // 限幅：年化漂移不超过 ±0.30（防止过拟合）
  return Math.max(-0.30, Math.min(0.30, drift));
}
```

### 完整流程

```typescript
async function polymarketProbability(
  tokenAddress: string,
  strikePrice: number,
  hoursToExpiry: number
): Promise<{ probability: number; confidence: string; signals: string[] }> {

  // 1. 获取当前价格
  const priceData = await runOnchainos(["market", "price", "--address", tokenAddress, "--chain", "1"]);
  const currentPrice = priceData.price;

  // 2. 获取 K 线 → 计算波动率
  const barSize = hoursToExpiry < 24 ? "5m" : hoursToExpiry < 168 ? "1H" : "4H";
  const limit = hoursToExpiry < 24 ? 288 : hoursToExpiry < 168 ? 168 : 180;
  const klines = await runOnchainos(["market", "kline", "--address", tokenAddress, "--chain", "1", "--bar", barSize, "--limit", String(limit)]);
  const vol = realizedVolatility(klines);

  // 3. 获取链上信号 → 计算漂移
  const signals = await runOnchainos(["signal", "list", "--chain", "1", "--wallet-type", "1,2,3"]);
  const tracker = await runOnchainos(["tracker", "activities", "--tracker-type", "smart_money", "--min-volume", "50000"]);
  const drift = estimateDrift(parseSignals(signals, tracker));

  // 4. 计算概率
  const prob = priceAboveProbability(currentPrice, strikePrice, hoursToExpiry, vol, drift);

  // 5. 输出
  return {
    probability: prob,
    confidence: Math.abs(drift) > 0.1 ? "HIGH" : Math.abs(drift) > 0.03 ? "MEDIUM" : "LOW",
    signals: describeSignals(signals, tracker)
  };
}

// 使用示例:
// const result = await polymarketProbability(BTC_ADDRESS, 76000, 26);
// → { probability: 0.52, confidence: "MEDIUM", signals: ["2 smart money buys >$100K", "volume +30%"] }
// 对比 Poly 定价 0.58 → Poly 高估 → 卖 Yes
```

---

## 方法三：蒙特卡洛模拟（更精确）

当价格接近边界、或波动率不稳定时，用模拟更准。

```typescript
function monteCarloProb(
  currentPrice: number,
  strikePrice: number,
  hoursToExpiry: number,
  hourlyVol: number,       // 不年化，直接用小时级波动率
  hourlyDrift: number,     // 小时级漂移
  simulations: number = 10000
): number {
  let aboveCount = 0;

  for (let i = 0; i < simulations; i++) {
    let price = currentPrice;

    for (let h = 0; h < hoursToExpiry; h++) {
      // 几何布朗运动
      const z = normalRandom(); // 标准正态随机数
      price *= Math.exp((hourlyDrift - hourlyVol ** 2 / 2) + hourlyVol * z);
    }

    if (price > strikePrice) aboveCount++;
  }

  return aboveCount / simulations;
}
```

**优势**: 可以处理非对称分布、跳跃风险、波动率聚集等复杂情况。
**成本**: 计算量大（但 10K 次模拟在 JS 中 <100ms）。

---

## 方法四：历史频率法（最朴素但有效）

```
问题: BTC 当前 $74,800，26 小时后高于 $76,000 的概率？

回答: 在过去 365 天中，BTC 在相似价格水平（±2%），
     26 小时后涨幅超过 1.6%（=$76K/$74.8K-1）的频率是多少？
```

```typescript
async function historicalFrequency(
  tokenAddress: string,
  targetReturn: number,    // 例: 0.016 (1.6%)
  windowHours: number,     // 例: 26
  lookbackDays: number     // 例: 90
): Promise<number> {
  // 获取历史 K 线
  const klines = await runOnchainos([
    "market", "kline",
    "--address", tokenAddress, "--chain", "1",
    "--bar", "1H", "--limit", String(lookbackDays * 24)
  ]);

  let total = 0;
  let above = 0;

  for (let i = 0; i < klines.length - windowHours; i++) {
    const startPrice = klines[i].c;
    const endPrice = klines[i + windowHours].c;
    const actualReturn = (endPrice - startPrice) / startPrice;

    total++;
    if (actualReturn > targetReturn) above++;
  }

  return above / total;
}
```

**优势**: 不需要假设分布形态，直接用经验频率。
**劣势**: 样本量有限，过去不代表未来。

---

## 综合：三层概率融合

实际使用时，不要只依赖一种方法。用**贝叶斯加权**融合：

```
最终概率 = w₁ × P_volatility + w₂ × P_montecarlo + w₃ × P_historical

其中:
  w₁ = 0.4  (波动率模型 — 理论基础)
  w₂ = 0.35 (蒙特卡洛 — 更精确的尾部)
  w₃ = 0.25 (历史频率 — 经验校正)
```

然后用链上信号调整：

```
调整后概率 = 最终概率 + Δ_signals

Δ_signals 来自:
  - 聪明钱共识方向: ±3-8%
  - 鲸鱼异常转账: ±5-10%
  - 成交量放大+方向确认: ±2-5%
```

---

## 实操流程图

```
                onchainos market kline (K 线数据)
                         │
                         ▼
              ┌─ 计算已实现波动率 σ ─┐
              │                      │
              ▼                      ▼
    Black-Scholes 概率       蒙特卡洛模拟概率
      P_vol = Φ(d₂)         P_mc = count/N
              │                      │
              └──────┬───────────────┘
                     │
    onchainos market kline (历史频率)
                     │
                     ▼
              ┌─ 加权融合 ─┐
              │  基础概率 P  │
              └──────┬──────┘
                     │
    onchainos signal list (聪明钱信号)
    onchainos tracker activities (鲸鱼动向)
    onchainos token price-info (成交量趋势)
                     │
                     ▼
              ┌─ 信号调整 Δ ─┐
              │ P_final = P+Δ │
              └──────┬────────┘
                     │
                     ▼
         ┌─ 对比 Polymarket 定价 ─┐
         │                        │
         ▼                        ▼
   P_final > P_poly          P_final < P_poly
    → 买 Yes                  → 买 No / 卖 Yes
   (市场低估)                 (市场高估)
```

---

## Edge 大小判断

| P_final vs P_poly 差值 | Edge 判断 | 行动 |
|------------------------|----------|------|
| < 3% | 无 Edge | 不交易 |
| 3-8% | 小 Edge | 小仓位 |
| 8-15% | 中等 Edge | 标准仓位（Kelly） |
| > 15% | 强 Edge | 加大仓位（仍受风控限制） |

**Kelly 仓位计算**:
```
f* = (p·b - q) / b

其中:
  p = 你的概率估计 (P_final)
  q = 1 - p
  b = 赔率 = (1 - P_poly) / P_poly   # Poly 定价隐含赔率

实际仓位 = f* / 4   # Quarter Kelly，保守
```

---

## 关键注意事项

1. **校准**: 以上所有参数（漂移系数、信号权重、融合比例）都需要用历史数据回测校准。不要拍脑袋。

2. **波动率不是常数**: 市场恐慌时波动率可能翻倍。考虑用 EWMA（指数加权移动平均）而不是简单标准差。

3. **尾部风险**: 对数正态模型低估了极端事件。蒙特卡洛可以用 fat-tailed 分布（Student-t）替代正态。

4. **时间衰减**: 临近截止时，波动率对概率的影响急剧下降，价格相对目标的距离成为主导因素。类似期权的 Gamma 效应。

5. **Polymarket 本身的效率**: Poly 定价已经聚合了大量参与者的信息。你的 Edge 来自**他们没看到的链上数据**——这个信息差在截止前 2-6 小时最大。

6. **不要只看一个指标**: 单一信号（比如"有个鲸鱼买了"）不足以推翻市场共识。需要**多信号确认**才值得下注。
