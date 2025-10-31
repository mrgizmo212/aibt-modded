# 📊 Trading Strategies Guide

**Date:** 2025-10-31  
**Purpose:** Define different trading styles and how to configure AI agents for each

---

## 🎯 Trading Strategy Definitions

### 1. **SCALPER** ⚡

**Time Horizon:** Seconds to Minutes  
**Typical Hold Time:** 1-15 minutes  
**Session Type:** Intraday (minute-by-minute)  
**Profit Target:** 0.1% - 0.5% per trade  
**Volume:** 50-200+ trades per day

#### **Characteristics:**
- Exploits tiny price movements
- Requires HIGH liquidity stocks (AAPL, TSLA, NVDA)
- Needs VERY tight spreads
- Extreme focus on technical patterns
- High transaction costs (many trades)

#### **Custom Rules for AI:**
```
Only trade high-volume stocks (>1M shares/day)
Enter when spread < $0.05
Exit at 0.3% profit OR 0.15% loss
Maximum hold time: 5 minutes
Minimum 500 shares per minute for liquidity
Trade only 9:30-10:30 AM and 3:00-4:00 PM (highest volume)
Never hold overnight
```

#### **Custom Instructions for AI:**
```
Focus on Level 2 order flow
Watch for large block orders
Exploit bid-ask spread inefficiencies
Scale in/out of positions rapidly
Monitor tick-by-tick price action
Exit immediately if momentum reverses
```

---

### 2. **DAY TRADER** 📈

**Time Horizon:** Minutes to Hours  
**Typical Hold Time:** 30 minutes - 6 hours  
**Session Type:** Intraday (minute-by-minute or 5-minute bars)  
**Profit Target:** 0.5% - 3% per trade  
**Volume:** 5-20 trades per day

#### **Characteristics:**
- Closes all positions by end of day
- Uses technical analysis and intraday patterns
- Monitors news and catalyst events
- Focuses on momentum and volatility
- No overnight risk

#### **Custom Rules for AI:**
```
Close ALL positions by 3:55 PM (avoid after-hours risk)
Maximum 3 open positions simultaneously
Stop loss: -1.5% per trade
Take profit: +2.5% per trade
Minimum $1 price movement to enter
Avoid first 5 minutes (9:30-9:35 AM) - too volatile
Avoid last 5 minutes (3:55-4:00 PM) - closing volatility
Position size: 5-10% of portfolio per trade
```

#### **Custom Instructions for AI:**
```
Identify intraday support/resistance levels
Trade breakouts and pullbacks
Monitor relative strength vs SPY
Watch for volume confirmation
Use 9 EMA and 20 EMA for trend
Exit if pattern invalidates
Respect pre-market gaps
```

---

### 3. **SWING TRADER** 🌊

**Time Horizon:** Days to Weeks  
**Typical Hold Time:** 2-10 days  
**Session Type:** Daily (end-of-day decisions)  
**Profit Target:** 3% - 10% per trade  
**Volume:** 2-10 trades per week

#### **Characteristics:**
- Holds positions overnight and over weekends
- Uses daily charts and patterns
- Focuses on multi-day trends
- Lower transaction costs
- Balances risk/reward over days

#### **Custom Rules for AI:**
```
Minimum hold time: 2 days (avoid day-trading whipsaws)
Maximum hold time: 10 days (avoid becoming investor)
Stop loss: -5% from entry
Take profit: +8% from entry
Trail stop: Lock in profits at +5% with 2% trail
Maximum 5 positions simultaneously
Position size: 10-20% of portfolio per trade
Only enter on daily close confirmation
Exit if thesis invalidates (news, earnings, etc.)
```

#### **Custom Instructions for AI:**
```
Trade with daily trend direction
Look for 2-5 day price patterns
Use daily RSI (oversold < 30, overbought > 70)
Confirm with volume (above 20-day average)
Respect weekly support/resistance
Monitor sector rotation
Check earnings calendar (avoid holding through earnings)
Consider broader market trend (SPY/QQQ direction)
```

---

### 4. **LONG-TERM INVESTOR** 🏦

**Time Horizon:** Months to Years  
**Typical Hold Time:** 3+ months  
**Session Type:** Daily (periodic rebalancing)  
**Profit Target:** 15%+ annually  
**Volume:** 5-20 trades per year

#### **Characteristics:**
- Buy and hold quality companies
- Focuses on fundamentals and valuation
- Lower trading frequency
- Tax-efficient (long-term capital gains)
- Rides out short-term volatility

#### **Custom Rules for AI:**
```
Minimum hold time: 90 days
Only trade on monthly rebalancing (1st of month)
Maximum 15 positions (diversification)
Position size: 5-10% per holding
Sell only if:
  - Fundamental thesis breaks
  - Stock > 50% overvalued
  - Better opportunity exists
Add to winners (pyramiding into strength)
Average down on quality dips (< -15%)
Ignore daily noise and volatility
```

#### **Custom Instructions for AI:**
```
Focus on fundamental analysis:
- Revenue growth > 15% YoY
- Profit margins improving
- Strong balance sheet (low debt)
- Competitive moat
- Management quality

Buy on weakness in strong companies
Sell on strength in deteriorating fundamentals
Reinvest dividends automatically
Maintain sector diversification (max 25% per sector)
Rebalance quarterly to target allocations
Consider macroeconomic trends
Ignore short-term price movements
```

---

## 🔄 **Hybrid Strategies**

### **Position Trader** (Between Swing & Long-Term)
```
Hold time: 2-8 weeks
Profit target: 10-20%
Uses weekly charts
Fewer trades than swing, more than investor
```

### **Momentum Day Trader** (Aggressive Day Trading)
```
Only trades stocks with >5% intraday movement
Holds 1-3 hours maximum
Chases breakouts and momentum
Higher risk, higher reward
```

---

## 📊 **Comparison Table**

| Strategy | Hold Time | Trades/Year | Profit/Trade | Risk Level | Time Commitment |
|----------|-----------|-------------|--------------|------------|-----------------|
| **Scalper** | 1-15 min | 10,000+ | 0.1-0.5% | Very High | Full-time |
| **Day Trader** | 30min-6hr | 1,000+ | 0.5-3% | High | Full-time |
| **Swing Trader** | 2-10 days | 50-200 | 3-10% | Medium | Part-time |
| **Investor** | 3+ months | 5-20 | 15%+ annual | Low-Med | Minimal |

---

## 🎯 **Recommended Strategy by Stock Type**

### **High Volatility / High Volume** (TSLA, NVDA, MSTR)
✅ Best for: Scalping, Day Trading  
⚠️ Risk: Swing Trading (overnight gaps)  
❌ Avoid: Long-term (too volatile)

### **Blue Chip / Stable** (AAPL, MSFT, GOOGL)
✅ Best for: All strategies  
✅ Safe for: Long-term investing  
✅ Good for: Swing trading

### **Low Volume** (Small caps)
❌ Avoid: Scalping (spreads too wide)  
⚠️ Risk: Day Trading (slippage)  
✅ Best for: Swing or Long-term

---

## 💡 **How to Configure in AIBT:**

### **For Scalping:**
```
Session Type: Intraday (minute-by-minute)
Custom Rules: "Exit at 0.3% profit, stop at 0.15% loss, max 10 minute hold"
Custom Instructions: "Trade only high-volume breakouts, watch Level 2"
Symbols: AAPL, TSLA, NVDA (liquid stocks only)
```

### **For Day Trading:**
```
Session Type: Intraday (1-min or 5-min bars)
Custom Rules: "Close all positions by 3:55 PM, max -1.5% stop loss"
Custom Instructions: "Follow trend, use 9/20 EMA, volume confirmation required"
Symbols: Any high-volume stocks
```

### **For Swing Trading:**
```
Session Type: Daily (end-of-day)
Custom Rules: "Hold minimum 2 days, exit at +8% or -5%, trail at +5%"
Custom Instructions: "Trade daily patterns, respect weekly levels, check earnings"
Symbols: Mid-to-large cap stocks
```

### **For Long-Term:**
```
Session Type: Daily (monthly rebalancing)
Custom Rules: "Trade only on 1st of month, hold minimum 90 days"
Custom Instructions: "Focus on fundamentals, ignore daily volatility, diversify"
Symbols: Quality blue chips, dividend stocks
```

---

## 🚨 **Critical Considerations:**

### **For Intraday Trading (Scalper/Day Trader):**
- ⚠️ **NOT all minutes have trades** - this is normal, especially during lunch
- ✅ **AI should HOLD** when no clear signal (not forced to trade every minute)
- ✅ **Custom rules define WHEN to trade** (volume thresholds, time windows)
- ❌ **Don't force trades** - missing bars ≠ missed opportunities

### **For Multi-Day Trading (Swing/Investor):**
- ✅ Uses daily close prices
- ✅ More time for analysis
- ✅ Lower stress, better for AI reasoning
- ✅ Fewer API calls

---

## 🎯 **Recommendation for AIBT:**

**Start with Swing Trading:**
- ✅ Proven strategy
- ✅ Works with daily data (already implemented)
- ✅ Less complex than intraday
- ✅ Better for AI reasoning (more time to think)

**Progress to Day Trading:**
- After swing trading is profitable
- When intraday logic is fully tested
- With proper custom rules defined

**Avoid Scalping:**
- Requires ultra-low latency
- Transaction costs too high
- Hard for AI to execute fast enough
- Better suited for HFT firms

---

## ✅ **Next Steps:**

1. ✅ Define your trading strategy (scalper/day/swing/investor)
2. ✅ Write custom rules for that strategy
3. ✅ Write custom instructions for decision-making
4. ✅ Configure AI agent with these settings
5. ✅ Ensure intraday logic uses them (needs fix - see plan above)

---

**Ready to implement the fix so custom rules actually work for intraday trading?**

