# 概率估算模型 · 现状与升级路线图

> **状态**: 当前黑客松版本使用 Black-Scholes + 信号漂移, 够用且可解释。
> **标记**: 🚧 以下所有升级项为 **后续实现** (post-hackathon)。

---

## 当前实现 (Black-Scholes + 信号漂移)

### 核心公式

```
P(price > strike at expiry) = Φ(d₂)

d₂ = [ln(S / K) − ½σ²T] / (σ√T)

S = 当前价格 (onchainos market price 实时抓取)
K = strike 价
T = 剩余时间 (hours / 8760 年化)
σ = 65% (BTC 年化波动率硬编码)
Φ = 标准正态累积分布函数
```

### 三种市场类型处理

| 市场模式 | 计算方式 |
|---------|---------|
| "reach X" / "hit X" / "above $X" | `Φ(d₂)` |
| "dip to X" / "below $X" | `1 − Φ(d₂)` |
| "between X and Y" | `Φ(d₂_low) − Φ(d₂_high)` |

### 信号驱动漂移 (±5% 上限)

在 BS 基础概率上叠加 onchainos 信号:

```typescript
function computeDriftAdjustment(signals) {
  let shift = 0;
  
  // 聪明钱净流 (±3%)
  if (|smartMoneyNetBuyUsd| > 1000) {
    const sizeFactor = log10(|amount| / 1000) / 4;
    shift += sign(amount) * min(sizeFactor, 1) * 0.03;
  }
  
  // 量价配合 (±2%)
  if (volumeChange > 0.3 && priceChange > 0.01) shift += 0.02;
  if (volumeChange > 0.3 && priceChange < -0.01) shift -= 0.02;
  
  return clamp(shift, -0.05, +0.05);
}
```

方向约定:
- `reach X` 市场: 正漂移 → ourProb 增加
- `dip to X` 市场: 正漂移 → ourProb 减少
- `between X and Y` 市场: 中性漂移无效

---

## 已知缺陷

| 缺陷 | 影响 | 严重度 |
|------|------|--------|
| **假设对数正态分布** | 加密肥尾严重, 极端行情概率被低估 | 🔴 高 |
| **σ = 65% 硬编码** | 忽略波动率聚类 (GARCH 效应) | 🟡 中 |
| **零漂移基础 (μ = 0)** | 忽略趋势性市场 (牛市持续漂移) | 🟡 中 |
| **无跳跃项** | ETF 通过/监管黑天鹅无法建模 | 🔴 高 |
| **σ 不随到期变化** | 临近到期波动率微笑 (smile) 未捕捉 | 🟢 低 |
| **信号漂移拍脑袋** | ±3% / ±2% 的系数没有历史校准 | 🟡 中 |

---

# 🚧 升级路线图 (后续实现)

## Phase 1: 动态波动率估计 (最小可行升级)

**工具**: `onchainos market kline --address WBTC --bar 1D --limit 60`

### GARCH(1,1) 在线拟合
```
σ²_t = ω + α·ε²_{t-1} + β·σ²_{t-1}
```

**预期收益**: 波动率估计从静态 65% 变为动态，反映当前市场状态。ETF 通过前 σ 上升，概率分布胖尾更合理。

**实现复杂度**: ⭐⭐ (2 天)

---

## Phase 2: 历史经验 CDF (非参数校验)

**工具**: onchainos K 线 60-90 天

**思路**: 不假设任何分布，用历史频率:
```
P(BTC 16 天内涨 $7k+) = 过去 X 年, BTC 从 $73k ± 2% 起涨 $7k+/16天 的频次
```

用作 BS 的 **交叉验证**: 如果 BS 说 20% 但历史频率 5%，说明当前波动率估计偏高。

**预期收益**: 非参数法不受分布假设影响，当 BS 和经验 CDF 差距大时，发出警告或降低置信度。

**实现复杂度**: ⭐⭐⭐ (3-5 天)

---

## Phase 3: Jump-Diffusion (Merton 模型)

**问题**: BS 的对数正态分布尾部太薄，处理不了:
- "$1M before GTA VI" 这种极端 tail 市场
- ETF / 监管 / CEX 破产类事件驱动跳跃

### Merton 公式
```
dS = μS dt + σS dW + S·dJ

其中:
  dJ ~ Poisson(λ)  (跳跃频率)
  跳跃幅度 ~ LogNormal(μ_J, σ_J)
```

**参数校准**: 历史数据拟合 λ、μ_J、σ_J 三个跳跃参数。

**预期收益**: 极端 tail 市场的概率更准，不再出现 "1% 概率" 严重低估真实可能性。

**实现复杂度**: ⭐⭐⭐⭐ (1-2 周)

---

## Phase 4: 蒙特卡洛 + 多因子 (推荐的长期目标)

模拟 N = 10,000 条价格路径:

```python
for i in range(N):
    path = [S_0]
    for t in range(T_steps):
        # 基础 GBM
        dW = normal(0, 1) * sqrt(dt)
        dS = drift * dt + volatility(t) * dW
        
        # 跳跃项
        if random() < jump_probability * dt:
            dS += jump_size(t)
        
        # 外部因子调整 (可选)
        dS += macro_factor_adjustment(t)
        
        path.append(path[-1] * exp(dS))
    
    if strike_condition_met(path):
        successful += 1

P = successful / N
```

**外部因子** (通过 API 接入):
- 美债收益率 (US Treasury API)
- 美元指数 DXY (Alpha Vantage)
- 加密恐慌指数 (Fear & Greed Index API)
- Onchainos 聪明钱信号
- ETF 资金流 (CoinGlass)

**预期收益**: 概率估计最接近真实分布，可对任意复杂市场 (多 strike、路径依赖) 建模。

**实现复杂度**: ⭐⭐⭐⭐⭐ (2-4 周)

---

## Phase 5: LLM 语义推理 + 结构化先验 (前沿方案)

把 BS / MC 作为 **数学先验**，再用 LLM 处理非结构化信息:

```
最终概率 = 数学模型 × LLM 调整因子

LLM 输入:
  - 最近 7 天新闻 (CoinDesk, The Block)
  - Twitter / 社交媒体情绪
  - 宏观事件日历 (美联储会议、财报季)
  - 类似历史事件
  - 当前市场 position (未平仓合约、资金费率)

LLM 输出:
  {
    "adjustment": -0.05,
    "reasoning": "美联储下周会议预期鹰派, 历史上 FOMC 前 BTC 回调概率 65%, 调降 reach 概率",
    "confidence": "medium"
  }
```

**预期收益**: 能捕捉数学模型无法表达的信息——新闻情绪、事件催化、链上行为模式。

**实现复杂度**: ⭐⭐⭐⭐ (1-2 周 + 持续调优)

**依赖**: Claude/GPT API + prompt engineering + 历史数据回测集

---

## 信号漂移系数的历史校准

**当前问题**: ±3% / ±2% 是拍脑袋定的，没有统计依据。

### 校准方法

1. **数据收集** (需 3 个月以上运行):
   - 每次信号触发时记录 signal 值 + strike + 结果 (是否达到)
   - 构建 (signal, outcome) 数据集

2. **Logistic Regression**:
   ```
   P(达到 strike) = σ(β₀ + β₁·smartMoney + β₂·volumeChange + β₃·priceChange + ...)
   ```
   
   拟合得到每个信号的真实边际影响系数。

3. **与当前硬编码对比**:
   - 如果数据显示 smartMoney 的真实系数是 ±1.2% (非 ±3%)，调低
   - 如果 volumePrice 在 24 小时级别效果强，但在周级别弱，加入时间维度

**交付物**: 一份 `coefficients-calibration-report.md` + 自动更新的系数表。

---

## 优先级建议

| Phase | 性价比 | 推荐时机 |
|-------|-------|---------|
| 1 (动态波动率 GARCH) | ⭐⭐⭐⭐⭐ | **第一个要做**, 收益明显, 实现简单 |
| 2 (历史经验 CDF) | ⭐⭐⭐⭐ | 和 Phase 1 同时做, 互为验证 |
| 3 (Jump-Diffusion) | ⭐⭐⭐ | 当处理大量 tail 市场时做 |
| 4 (蒙特卡洛 + 多因子) | ⭐⭐⭐⭐⭐ | 产品化阶段的终极目标 |
| 5 (LLM 语义推理) | ⭐⭐⭐⭐ | 和 Phase 4 结合, 处理非结构化信息 |
| 信号系数校准 | ⭐⭐⭐⭐⭐ | 一旦有 3 个月数据就必做 |

---

## 决策记录

- **2026-04-15**: 黑客松版本决定使用 BS + ±5% 信号漂移, 暂不升级。理由: 可解释性强, 实现成本低, 够用于演示。以上 5 个 Phase 全部标记为 **后续实现**。
