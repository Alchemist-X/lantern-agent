# K 线 → 概率：候选方法评审

> 5 种方法从简到严，附优劣分析。请 review 后选择方向。

---

## 方法 1: 已实现波动率 + Black-Scholes（当前方案）

### 做法
从 K 线算标准差 σ，代入 `P = Φ(d₂)` 算概率。链上信号手动加减漂移项 μ。

### 示例
```
BTC = $74,800, 目标 $76,000, 26h 后
σ_hourly = 0.008 (从 24 根 1H K 线)
σ_annual = 0.008 × √8760 = 0.748

d₂ = [ln(74800/76000) + (0 - 0.748²/2) × 26/8760] / (0.748 × √(26/8760))
   = [-0.0160 + (-0.00083)] / (0.0408)
   = -0.413
P = Φ(-0.413) = 34%
```

### 优点
- 简单，10 行代码
- 有金融理论基础（期权定价同源）

### 缺点
- **假设正态分布**：crypto 不是正态的，BTC 日收益率偏度约 -0.3，峰度约 8（正态=3）。翻译：低估了暴跌概率，高估了温和波动概率
- **波动率是常数假设**：实际波动率随时间聚集（高波动后跟高波动），用过去 24h 的 σ 预测未来 26h 不准
- **漂移项 μ 完全主观**：没有统计方法确定"聪明钱买 $1M 等于多少 μ"

### 评分: ⭐⭐（能用，但不严谨）

---

## 方法 2: GARCH 波动率模型

### 做法
用 GARCH(1,1) 模型估计**时变波动率**，而不是假设 σ 是常数。GARCH 捕捉"波动率聚集"——昨天波动大，今天大概率也大。

### 原理
```
收益率: r_t = μ + ε_t,  ε_t = σ_t × z_t,  z_t ~ N(0,1)

波动率方程:
σ²_t = ω + α × ε²_{t-1} + β × σ²_{t-1}

其中:
  ω = 长期波动率基线
  α = 昨日冲击的权重（"如果昨天跳了一下，今天波动率提多少"）
  β = 昨日波动率的惯性（"波动率的记忆有多长"）
  α + β < 1 保证稳定性
```

### 实现思路
```typescript
// 1. 从 K 线算小时收益率序列
const returns = klines.map((k, i) => i > 0 ? Math.log(k.c / klines[i-1].c) : 0).slice(1);

// 2. 拟合 GARCH(1,1) 参数 (ω, α, β)
//    用极大似然估计 (MLE) — 需要数值优化
//    或者用简化的 EWMA 替代（见下）

// 3. 预测未来 T 步的条件波动率
//    σ²_{t+1} = ω + α × ε²_t + β × σ²_t
//    σ²_{t+2} = ω + (α + β) × σ²_{t+1}
//    ...
//    σ²_{t+T} 会逐步收敛到长期均值 ω/(1-α-β)

// 4. 用预测的波动率路径做蒙特卡洛模拟
```

### 简化版: EWMA (Exponentially Weighted Moving Average)
```typescript
// RiskMetrics 方法，λ=0.94（业界标准）
function ewmaVolatility(returns: number[], lambda = 0.94): number {
  let variance = returns[0] ** 2;
  for (let i = 1; i < returns.length; i++) {
    variance = lambda * variance + (1 - lambda) * returns[i] ** 2;
  }
  return Math.sqrt(variance);
}
// 比简单标准差好：给近期数据更高权重，对波动率变化反应更快
```

### 优点
- **波动率聚集**：GARCH 天然处理"昨天暴跌今天继续抖"的现象
- **业界标准**：所有量化基金做波动率预测的基础方法
- **可用 EWMA 简化**：不需要完整的 MLE 拟合，EWMA 是 GARCH 的特例

### 缺点
- 仍假设条件分布是正态（可改用 Student-t GARCH）
- 参数拟合需要较长数据序列（至少 100+ 根 K 线）
- 不直接处理方向性（只预测波动大小，不预测涨跌）

### 评分: ⭐⭐⭐（波动率预测显著提升，但仍需要方向性模型补充）

---

## 方法 3: 经验分位数回归（非参数）

### 做法
完全放弃分布假设。直接从历史数据中统计：**在类似条件下，价格 T 小时后超过目标的频率是多少？**

### 原理
```
问: BTC 当前 $74,800，26h 后 > $76,000 的概率？
等价于: 需要 26h 内涨 ≥ 1.6%

步骤:
1. 收集过去 N 天所有 "26 小时收益率" 样本
2. 计算超过 1.6% 的频率 → 这就是概率

进阶: 不是无条件频率，而是条件频率
  — 条件于当前波动率水平
  — 条件于当前动量方向
  — 条件于聪明钱信号状态
```

### 实现思路
```typescript
interface MarketCondition {
  recentVolatility: "low" | "medium" | "high";   // 过去 24h 波动率分位
  momentum1h: "up" | "flat" | "down";             // 1h 价格方向
  smartMoneySignal: "buy" | "neutral" | "sell";   // 聪明钱方向
}

async function conditionalFrequency(
  klines: Kline[],           // 至少 90 天 1H K 线
  targetReturn: number,       // 0.016 (1.6%)
  windowHours: number,        // 26
  currentCondition: MarketCondition
): Promise<number> {
  
  const samples: { return: number; condition: MarketCondition }[] = [];
  
  // 滑动窗口，每个历史时刻都生成一个样本
  for (let i = 24; i < klines.length - windowHours; i++) {
    const futureReturn = (klines[i + windowHours].c - klines[i].c) / klines[i].c;
    
    // 计算该时刻的市场条件
    const recentReturns = klines.slice(i - 24, i).map((k, j) => 
      j > 0 ? Math.abs(Math.log(k.c / klines[i - 24 + j - 1].c)) : 0
    ).slice(1);
    const vol = recentReturns.reduce((a, b) => a + b, 0) / recentReturns.length;
    
    const condition: MarketCondition = {
      recentVolatility: vol < 0.005 ? "low" : vol < 0.015 ? "medium" : "high",
      momentum1h: klines[i].c > klines[i-1].c * 1.001 ? "up" 
                 : klines[i].c < klines[i-1].c * 0.999 ? "down" : "flat",
      smartMoneySignal: "neutral" // 历史无法回测（除非有存档的信号数据）
    };
    
    samples.push({ return: futureReturn, condition });
  }
  
  // 筛选与当前条件匹配的样本
  const matched = samples.filter(s => 
    s.condition.recentVolatility === currentCondition.recentVolatility &&
    s.condition.momentum1h === currentCondition.momentum1h
  );
  
  if (matched.length < 30) {
    // 样本不够 → 放松条件（只匹配波动率）
    const relaxed = samples.filter(s => 
      s.condition.recentVolatility === currentCondition.recentVolatility
    );
    return relaxed.filter(s => s.return > targetReturn).length / relaxed.length;
  }
  
  return matched.filter(s => s.return > targetReturn).length / matched.length;
}
```

### 优点
- **零分布假设**：不管是正态、肥尾、偏斜都无所谓——用实际频率
- **条件概率**：能回答"在高波动 + 上涨趋势中，26h 涨 1.6% 的概率"这种问题
- **直觉清晰**：历史上类似情况发生了 72 次，其中 48 次涨超目标 → 概率 67%

### 缺点
- **样本量问题**：条件越多，匹配的样本越少。3 个条件可能只剩 30-50 个样本
- **聪明钱信号无法回测**：没有历史信号数据存档，这个维度只能用实时的
- **过去不代表未来**：市场结构变化（如 ETF 通过）会让历史频率失效
- **需要大量历史 K 线**：至少 90 天（2160 根 1H K 线）

### 评分: ⭐⭐⭐⭐（最诚实的方法——不编故事，让数据说话）

---

## 方法 4: 逻辑回归分类器（ML 方法）

### 做法
训练一个模型：输入 = 当前市场特征，输出 = "T 小时后价格 > 目标" 的概率。

### 原理
```
y = 1 if price_T > strike, else 0  (二分类标签)

X = 特征向量:
  x₁ = (current_price - strike) / strike          # 距离目标的相对距离
  x₂ = realized_volatility_24h                     # 近期波动率
  x₃ = return_1h                                   # 1h 动量
  x₄ = return_4h                                   # 4h 动量
  x₅ = volume_change_24h                           # 成交量变化
  x₆ = hours_to_expiry                             # 剩余时间
  x₇ = smart_money_net_buy (如有历史数据)           # 聪明钱方向
  x₈ = whale_exchange_inflow (如有)                 # 鲸鱼转入交易所

P(y=1|X) = sigmoid(β₀ + β₁x₁ + β₂x₂ + ... + β₈x₈)
```

### 实现思路
```typescript
// 训练阶段（离线）
// 1. 收集 90+ 天历史 K 线
// 2. 对每个时刻构建特征向量 X 和标签 y
// 3. 拟合逻辑回归（或用 sklearn/TensorFlow）
// 4. 交叉验证评估 AUC/Brier Score

// 推理阶段（实时）
function predictProbability(features: number[], weights: number[], bias: number): number {
  const z = bias + features.reduce((sum, f, i) => sum + f * weights[i], 0);
  return 1 / (1 + Math.exp(-z));  // sigmoid
}

// 特征构建
async function buildFeatures(tokenAddr: string, strike: number, hoursToExpiry: number) {
  const price = await getTokenPrice(tokenAddr);
  const klines = await getKlines(tokenAddr, "1H", 168);
  const signals = await getSignals();
  
  return [
    (price - strike) / strike,              // x₁: 距离
    realizedVolatility(klines.slice(-24)),   // x₂: 24h vol
    (klines.at(-1).c - klines.at(-2).c) / klines.at(-2).c,  // x₃: 1h return
    (klines.at(-1).c - klines.at(-5).c) / klines.at(-5).c,  // x₄: 4h return
    volumeChange(klines),                    // x₅: volume trend
    hoursToExpiry,                           // x₆: time
    signals.netBuyUsd / 1_000_000,          // x₇: smart money
  ];
}
```

### 优点
- **多信号自动融合**：不需要手动设定权重，模型从数据中学习每个信号的预测力
- **概率输出已校准**：逻辑回归天然输出概率（如果训练正确）
- **可扩展**：加入新特征（如 Gas 费、DeFi TVL）只需加一列，不改模型结构
- **Brier Score 可量化精度**：有明确的评估指标

### 缺点
- **需要训练数据**：至少几百个带标签的样本。对于 BTC 日级市场，90 天 ≈ 2000+ 样本（够用）
- **过拟合风险**：特征太多 + 样本太少 → 模型记住噪音。需要正则化 + 交叉验证
- **链上信号缺乏历史**：onchainos 的聪明钱数据只有实时的，没有 90 天回测数据。要么不用这个特征，要么从现在开始存档
- **市场状态变化**：牛市训练的模型到熊市可能失效。需要滚动再训练

### 评分: ⭐⭐⭐⭐（如果有足够数据，这是最好的方法。但冷启动问题需要解决）

---

## 方法 5: 贝叶斯在线更新（最严谨）

### 做法
从一个先验概率开始，每收到一条新信息就用贝叶斯公式更新。最终概率是所有信息累积的结果。

### 原理
```
P(above | 所有信息) ∝ P(above) × L(数据 | above)

具体:
  先验: P₀ = Black-Scholes 概率（纯波动率，无方向性）

  更新 1: 收到聪明钱买入信号
    P₁ = P₀ × L(smart_money_buy | above) / 归一化常数
    
    L 怎么算？
    "历史上，当聪明钱买入时，价格后来涨超目标的概率是多少？"
    如果历史上 70% 的时候涨了 → L(signal | above) = 0.70
    如果没涨的时候也有 30% 出现信号 → L(signal | below) = 0.30
    
    似然比 = 0.70 / 0.30 = 2.33
    P₁ = P₀ × 2.33 / (P₀ × 2.33 + (1-P₀) × 1)

  更新 2: 收到鲸鱼转入交易所
    用同样方法计算似然比，再更新 P₁ → P₂

  更新 3: 收到新 K 线（价格变动）
    重新计算 Black-Scholes 概率（因为 S₀ 和 T 都变了）
    这相当于用新的先验重置

  ... 持续更新直到截止
```

### 实现思路
```typescript
interface SignalLikelihood {
  name: string;
  likelihoodRatio: number;  // L(signal|above) / L(signal|below)
  // > 1 = 利好, < 1 = 利空, = 1 = 无信息
}

// 预先校准的似然比（需要从历史数据估计）
const SIGNAL_LIKELIHOODS: Record<string, SignalLikelihood> = {
  smart_money_buy_large: {
    name: "聪明钱大额买入 (>$100K)",
    likelihoodRatio: 1.8,    // 需要校准！
    // 含义: 出现这个信号时，价格上涨的概率是下跌的 1.8 倍
  },
  smart_money_consensus: {
    name: "3+ 聪明钱钱包同时买入",
    likelihoodRatio: 2.5,
  },
  whale_exchange_inflow: {
    name: "鲸鱼转入交易所",
    likelihoodRatio: 0.6,    // < 1 = 利空
  },
  volume_spike_up: {
    name: "放量上涨 (vol +50%, price +1%)",
    likelihoodRatio: 1.4,
  },
  volume_spike_down: {
    name: "放量下跌 (vol +50%, price -1%)",
    likelihoodRatio: 0.7,
  },
};

function bayesianUpdate(
  priorProb: number,
  signals: string[]    // 触发的信号名列表
): number {
  let prob = priorProb;
  
  for (const signalName of signals) {
    const signal = SIGNAL_LIKELIHOODS[signalName];
    if (!signal) continue;
    
    const lr = signal.likelihoodRatio;
    // 贝叶斯更新: P_new = P_old × LR / (P_old × LR + (1-P_old))
    prob = (prob * lr) / (prob * lr + (1 - prob));
  }
  
  return prob;
}

// 完整流程
async function fullBayesianProbability(
  tokenAddr: string,
  strike: number,
  hoursToExpiry: number
): Promise<number> {
  // 1. 先验: GARCH 波动率 + Black-Scholes
  const vol = await garchForecast(tokenAddr, hoursToExpiry);
  const price = await getTokenPrice(tokenAddr);
  const prior = blackScholesProbability(price, strike, hoursToExpiry, vol);
  
  // 2. 收集当前活跃信号
  const activeSignals: string[] = [];
  
  const smartMoney = await getSmartMoneySignals();
  if (smartMoney.netBuyUsd > 100_000) activeSignals.push("smart_money_buy_large");
  if (smartMoney.walletCount >= 3) activeSignals.push("smart_money_consensus");
  
  const whaleActivity = await getWhaleActivity();
  if (whaleActivity.exchangeInflow) activeSignals.push("whale_exchange_inflow");
  
  const volumeData = await getVolumeData(tokenAddr);
  if (volumeData.change > 0.5 && volumeData.priceDirection > 0) {
    activeSignals.push("volume_spike_up");
  }
  if (volumeData.change > 0.5 && volumeData.priceDirection < 0) {
    activeSignals.push("volume_spike_down");
  }
  
  // 3. 贝叶斯更新
  const posterior = bayesianUpdate(prior, activeSignals);
  
  return posterior;
}
```

### 关键: 似然比怎么校准？

这是整个方法的核心难点。有两种途径：

**途径 A: 从历史数据统计**
```
收集过去 90 天的数据:
  - 每次出现"聪明钱大额买入"信号时，标记
  - 统计: 出现信号后 26h 内价格涨超目标的比例 = P(above|signal)
  - 统计: 没出现信号时涨超目标的比例 = P(above|no_signal)
  - 似然比 = P(signal|above) / P(signal|below)
           = [P(above|signal) × P(signal)] / [P(above) × P(signal)]
           简化后 ≈ P(above|signal) / P(above|no_signal)  (在信号频率稳定时)
```

**途径 B: 从 onchainos leaderboard 间接估计**
```
如果 leaderboard 上聪明钱 7 天胜率 = 65%
那么 "聪明钱买入" 的似然比 ≈ 0.65 / 0.35 = 1.86
```

### 优点
- **理论最优**：贝叶斯更新是在给定信息下计算后验概率的**唯一一致方法**
- **增量更新**：每条新信息自然融入，不需要重新计算全部
- **信号独立**：每个信号有独立的似然比，新信号加入不影响旧的
- **透明可解释**：可以追溯"概率从 34% 涨到 52% 是因为聪明钱买入(×1.8) + 放量(×1.4)"

### 缺点
- **似然比校准是瓶颈**：如果似然比不准，整个系统不准。"垃圾进垃圾出"
- **信号独立性假设**：贝叶斯假设信号之间条件独立。但"聪明钱买入"和"放量上涨"可能是同一件事的两个表现，重复计算会过度自信
- **冷启动**：没有历史信号数据就无法校准
- **概率漂移**：多个弱信号累积可能把概率推到极端值（0.01 或 0.99），需要限幅

### 评分: ⭐⭐⭐⭐⭐（最严谨，但对数据质量要求最高）

---

## 方法对比总结

| 维度 | BS 波动率 | GARCH | 经验分位数 | 逻辑回归 | 贝叶斯更新 |
|------|----------|-------|-----------|---------|-----------|
| 理论严谨度 | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 实现难度 | 低 | 中 | 中 | 高 | 中高 |
| 数据需求 | 24h K线 | 100+ K线 | 90天+ K线 | 90天+ K线+标签 | K线+信号历史 |
| 处理链上信号 | 手动 | 不直接 | 条件匹配 | 自动学习权重 | 似然比融合 |
| 处理肥尾 | ✗ | 可选 t-GARCH | ✓ 天然 | ✓ 如果训练数据够 | 取决于先验 |
| 实时更新 | 需重算 | 增量 | 需重查 | 需重算 | 天然增量 |
| 冷启动可行性 | ✓ 立刻可用 | ✓ 100根K线 | △ 需要90天 | ✗ 需要训练 | △ 似然比需校准 |
| 可解释性 | 高 | 高 | 最高 | 中 | 最高 |

---

## 推荐方案

### 短期（黑客松期间）: 方法 1 + 方法 3 组合

```
基础概率 = Black-Scholes（快，立刻可用）
校验概率 = 经验频率（90天 K 线数据 onchainos 直接可取）
最终概率 = 0.5 × BS + 0.5 × 经验频率
信号调整 = 手动 ±3-8%（聪明钱/鲸鱼/放量，基于直觉）
```

**理由**: 两天内可实现，不需要训练数据，onchainos K 线 + 信号足够

### 中期（赛后迭代）: 方法 2 + 方法 5

```
先验 = GARCH 波动率 → Black-Scholes 概率
更新 = 贝叶斯（每条链上信号用校准的似然比更新）
校准 = 从现在开始存档 onchainos 信号，3 个月后有足够数据校准似然比
```

**理由**: GARCH 解决波动率预测问题，贝叶斯解决信号融合问题

### 长期（产品化）: 方法 4

```
训练集 = 6 个月 K 线 + 存档的 onchainos 信号 + Polymarket 历史结果
模型 = 逻辑回归 → 梯度提升树 → 神经网络（逐步升级）
评估 = Brier Score + 滚动回测 + 实盘 P&L
```

**理由**: 数据够了之后，ML 方法在多信号融合上天然优于手动规则

---

## 关键行动项

不管选哪个方法，**现在就应该开始做**的事：

1. **存档信号数据**: 每次 onchainos 调用的信号结果（聪明钱买卖、鲸鱼动向）写入 DB，供未来校准
2. **存档 K 线快照**: 每次决策时的 K 线数据存入 runtime-artifacts，供回测
3. **存档 Polymarket 定价**: 每次交易时记录 Poly 当时的 Yes 价格，供计算实际 Edge
4. **定义 Brier Score 评估**: `BS = (1/N) Σ(P_predicted - outcome)²`，越低越好。随机猜 = 0.25，完美 = 0
