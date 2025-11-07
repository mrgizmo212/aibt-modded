# AI Trading Bot - Live Demo Script

## Overview

**Duration:** 15-20 minutes  
**Goal:** Show the complete workflow from strategy creation to AI conversation  
**Audience:** Can be adapted for technical or business stakeholders

---

## Pre-Demo Checklist

**Before starting the demo:**
- [ ] Application is running and accessible
- [ ] Browser window clean (close extra tabs)
- [ ] Demo account logged in
- [ ] Sample data loaded (NASDAQ 100 price data)
- [ ] Any previous demo models cleaned up or organized
- [ ] Screen recording started (if recording)
- [ ] Audience can see screen clearly

**Have ready:**
- This script printed or on secondary screen
- Date range for backtest (e.g., Jan 1 - Mar 31, 2024)
- Example questions to ask the AI
- Backup plan if internet fails

---

## Demo Script - Full Version (20 minutes)

### PART 1: Introduction (2 minutes)

**[Start on login/dashboard page]**

**Say:**
> "Welcome! Today I'm going to show you the AI Trading Bot - a platform where you can create trading strategies that think, adapt, and explain themselves. Unlike traditional backtesting where you code fixed rules, here you describe your goals in plain English and let AI interpret them."

**[Navigate to main dashboard if not already there]**

**Say:**
> "This is the main interface. On the left, you see conversations - just like ChatGPT. You can have multiple chat threads for different discussions. Below that are your AI trading models. Each model is a different trading personality with its own strategy and configuration."

**[Point to navigation sidebar]**

---

### PART 2: Creating a New AI Model (5 minutes)

**[Click "+" or "Create New Model" button]**

**Say:**
> "Let's create a new AI trading model from scratch. I'll call this one 'Tech Momentum Pro' - a day trading strategy focused on momentum plays in technology stocks."

**[Fill out the form as you speak]**

**Model Name:** `Tech Momentum Pro`

**Say:**
> "First, the basics - name and description. The description helps us remember what this model is for."

**Description:** `Day trading momentum strategy for high-volume tech stocks`

**Say:**
> "Now the interesting part - we choose our AI model. This is like choosing the brain that will make trading decisions."

**AI Model:** Select `GPT-5` (or whatever's available)

**Say:**
> "I'll choose GPT-5 for this demo. Each AI model has a different personality - GPT-5 tends to be balanced, Claude is more analytical, Gemini is conservative. You can test the same strategy with different AI models and compare results."

**Trading Style:** Select `Day Trading`

**Say:**
> "Trading style determines execution mode. Day trading means we'll trade throughout the day but close everything by market close - no overnight risk."

**Allowed Order Types:** Select `Market, Limit`

**Say:**
> "Now we set constraints - these are hard rules the AI must follow. I'm allowing only market and limit orders. If the AI tries a stop order, it'll be automatically rejected."

**Allow Shorting:** Leave unchecked

**Say:**
> "I'm disabling shorting for this model - it can only go long. This is a hard constraint that's strictly enforced."

**Margin Account:** Leave unchecked

**Say:**
> "Cash account only - no leverage. The AI will have 1x buying power, making it more conservative."

**Custom Instructions (Strategy):**

```
Focus on momentum breakouts in high-volume technology stocks (AAPL, MSFT, NVDA, GOOGL, TSLA).

Entry criteria:
- Strong volume surge (>50% above average)
- Price breaking recent resistance
- Positive market sentiment

Exit criteria:
- Take profit at +3-5% gains
- Stop loss at -1.5%
- Exit immediately if volume dries up

Risk management:
- Maximum 3 positions simultaneously
- No more than 30% of capital per position
- Be aggressive on entries, strict on exits
```

**Say (as you type/paste):**
> "This is where the magic happens. Instead of coding rigid rules, I describe my strategy in natural language. The AI will interpret these guidelines while making decisions. Notice these are soft constraints - the AI considers them but can adapt based on market conditions."

**[Click "Create Model"]**

**Say:**
> "And just like that, we've created an AI trading model. The AI now understands its constraints and strategic goals."

---

### PART 3: Starting a Backtest (3 minutes)

**[Navigate to the newly created model, click "Start Trading" or similar]**

**Say:**
> "Now let's put this strategy to the test. I'll run a backtest on historical data to see how the AI would have traded."

**[Select date range]**

**Start Date:** `2024-01-01`  
**End Date:** `2024-03-31`

**Say:**
> "I'm selecting Q1 2024 - three months of trading. The AI will process every trading day, make decisions, and execute trades based on the strategy we defined."

**Max Steps per Day:** `30` (default)

**Say:**
> "Max steps per day limits how many decisions the AI can make each day. This prevents runaway behavior."

**[Click "Start Daily Backtest"]**

**Say:**
> "Starting the backtest... and here we go! You can see the progress bar showing which day we're on. The AI is analyzing market data, making decisions, and logging its reasoning for every trade."

**[Let it run for 15-30 seconds to show progress, or skip to completed results if demo time is limited]**

**Say (while it runs):**
> "In the background, our system is running a Celery worker that processes this asynchronously. The AI agent has access to tools - it can fetch prices, calculate indicators, and execute trades. Every decision it makes is logged with full reasoning."

---

### PART 4: Viewing Results (4 minutes)

**[Once backtest completes, navigate to results/performance view]**

**Say:**
> "Great! The backtest completed. Let's see how our AI performed."

**[Point to performance chart]**

**Say:**
> "Here's the equity curve - you can see the portfolio value over time. This model achieved..."

**[Read the metrics displayed]**

**Example metrics to highlight:**
- Cumulative Return: `+18.7%`
- Sharpe Ratio: `1.65`
- Max Drawdown: `-7.2%`
- Win Rate: `62.4%`
- Total Trades: `37`

**Say:**
> "These are solid results - 18.7% return over three months with a Sharpe ratio of 1.65 shows good risk-adjusted performance. The max drawdown of 7.2% means the AI was careful with risk management."

**[Scroll down to position history or trade log]**

**Say:**
> "Here you can see every trade the AI made - entry, exit, profit/loss, and most importantly, the reasoning behind each decision. Let's look at one..."

**[Click on a trade to expand/view details]**

**Say:**
> "This trade in AAPL - the AI entered on January 15th because it detected a volume surge and price breakout. It exited two days later with a 4.2% gain when it noticed volume declining. This is what makes it different from traditional backtesting - we can see why every decision was made."

---

### PART 5: Conversational AI (5 minutes) - THE HIGHLIGHT

**[Navigate to chat interface for this model]**

**Say:**
> "Now for my favorite part - let's have a conversation with the AI about its trading decisions."

**[Type in chat:]** `Why did you exit AAPL on January 17th?`

**[Send and wait for streaming response]**

**Say (as AI responds):**
> "Watch this - the AI is streaming its response in real-time, pulling data from the trading history and explaining its reasoning."

**Expected AI Response (example):**
```
I exited AAPL on January 17th, 2024 at $185.42 for several key reasons:

1. **Volume Decline**: Trading volume dropped 38% from the previous day,
   falling below the 10-day average. This suggested weakening buyer interest.

2. **Profit Target Hit**: The position had gained 4.2% since entry at $178.15,
   meeting my take-profit criteria of 3-5% gains.

3. **Momentum Weakening**: RSI dropped from 68 to 54, indicating the momentum
   that drove our entry was fading.

My risk management rules prioritize preserving gains over hoping for extended
runs, so I exited to lock in the profit before potential reversal.
```

**Say:**
> "See that? The AI explained exactly why it made that decision, citing specific data points. This is powerful for learning - you can understand what works and what doesn't."

**[Type another question:]** `Show me your worst trade in this period`

**[Wait for response]**

**Expected AI Response:**
```
My worst trade was TSLA, entered on February 8th at $192.50:

- Entry: February 8th at $192.50
- Exit: February 9th at $189.80
- Loss: -$2.70 per share (-1.4%)

What went wrong:
- I detected a volume surge and entered aggressively
- However, I missed that the broader market was turning negative
- The volume surge was actually institutional selling, not buying
- I exited quickly with my -1.5% stop loss to prevent larger loss

**Lesson learned**: Cross-reference stock momentum with overall market conditions
before entering during volatile periods.
```

**Say:**
> "And there's the beauty - the AI doesn't just show failures, it analyzes them and learns. This helps you refine your strategy."

**[Type third question:]** `Compare your tech stock performance vs non-tech stocks`

**Say:**
> "Let's ask something more analytical..."

**[Let AI respond with comparative analysis]**

**Say:**
> "The AI can pull data, analyze patterns, and give you insights that would take hours to calculate manually. This is the conversational analysis that makes strategy development so much faster."

---

### PART 6: Multiple Conversations (2 minutes)

**[Navigate to sidebar, show conversation list]**

**Say:**
> "One more thing I want to highlight - you can have multiple conversation threads, just like ChatGPT. For example..."

**[Click "New Chat" button]**

**[Type:]** `Analyze the drawdown period in February`

**[Let it respond]**

**Say:**
> "This creates a new conversation focused on drawdown analysis. You can switch between threads, go back to old conversations, and maintain context. Super useful when you're exploring different aspects of your strategy's performance."

**[Show the conversation list with auto-generated titles]**

**Say:**
> "Notice the conversations get auto-titled based on content - 'AAPL Exit Analysis,' 'Worst Trade Review,' 'February Drawdown Analysis' - makes it easy to find what you discussed before."

---

### PART 7: Multiple Models Comparison (2 minutes)

**[Navigate back to dashboard/model list]**

**Say:**
> "Now imagine doing this with multiple AI models. Let's say you run this exact same strategy with GPT-5, Claude 4.5, and Gemini 2.5 - three different AI 'brains' interpreting the same instructions."

**[Show multiple models in sidebar, or create a quick second model if time permits]**

**Say:**
> "Each AI will trade differently. Claude might be more aggressive, Gemini more conservative. You'd get three different equity curves, and you can compare them side-by-side to see which AI personality works best for your strategy."

**Example comparison (use hypothetical if not set up):**
- **GPT-5**: +18.7% return, Sharpe 1.65
- **Claude 4.5**: +24.3% return, Sharpe 1.42 (higher risk)
- **Gemini 2.5**: +14.2% return, Sharpe 1.89 (more conservative)

**Say:**
> "Same strategy, different results. This opens up completely new ways to develop and optimize trading strategies."

---

### PART 8: Closing (1 minute)

**Say:**
> "So that's AI Trading Bot in action. To recap what you just saw:
> 
> 1. We created an AI trading model using natural language
> 2. We ran a backtest and saw real performance results
> 3. We chatted with the AI to understand every decision it made
> 4. We saw how conversations are preserved for future reference
> 
> This isn't just backtesting - it's AI-powered strategy experimentation with full explainability. You're not just testing if something worked, you're learning WHY it worked or didn't work."

**[Pause for questions]**

---

## Demo Script - Quick Version (10 minutes)

**For time-constrained presentations:**

1. **Intro (1 min)** - Show dashboard, explain concept
2. **Create Model (3 min)** - Fill form quickly, emphasize custom instructions
3. **Start Backtest (1 min)** - Start and show progress bar
4. **View Results (2 min)** - Quick metrics overview
5. **Chat with AI (3 min)** - ONE good question showing reasoning
6. **Close (30 sec)** - Recap value proposition

**Skip:**
- Multiple conversations demo
- Multiple models comparison
- Deep dive into individual trades

---

## Handling Common Demo Issues

### Issue: Backtest taking too long
**Solution:** 
- Use pre-run results: "I ran this earlier, let me show you the results"
- Or use a shorter date range (1 month instead of 3)
- Have a completed run ready to show before demo starts

### Issue: AI response is slow
**Solution:**
- "The AI is processing all the trading data to give a detailed answer..."
- Have backup questions ready that you know generate fast responses
- Use the "loading" time to explain what's happening in the background

### Issue: Internet connection drops
**Solution:**
- Have screenshots of key screens ready as backup
- Switch to "let me show you screenshots of what this looks like"
- Have a video recording of the demo as ultimate fallback

### Issue: Unexpected error appears
**Solution:**
- Stay calm: "This is a live demo, so you get to see real development!"
- Refresh and try again
- If persistent, switch to screenshot/video backup
- Joke: "Even AI has bad trading days sometimes"

---

## Questions to Anticipate

**Q: "Can this connect to my brokerage for real trading?"**

A: "Currently, this is focused on backtesting and simulation for strategy development and learning. The AI helps you understand what works, and you can then apply those insights to your live trading. Real brokerage integration is on the roadmap."

**Q: "How accurate is the backtesting?"**

A: "We use historical price data from reliable sources (specify your data source). The backtesting includes realistic constraints like order execution, but doesn't include slippage or commission yet - those are being added. The goal is to learn from AI decision-making patterns rather than predict exact returns."

**Q: "What stops the AI from making crazy trades?"**

A: "That's what the constraints are for. You set hard rules - allowed order types, shorting enabled/disabled, margin limits. Invalid trades are rejected before execution. You also set initial capital limits and the AI can't exceed buying power."

**Q: "Can I use my own data?"**

A: "Currently we use NASDAQ 100 data included in the platform. Custom data import is on the roadmap."

**Q: "How much does this cost?"**

A: "That depends on our pricing model - I can send you detailed pricing after the demo." (Or state pricing if established)

**Q: "Can it trade crypto/forex/options?"**

A: "Right now it's focused on equities (stocks). The architecture supports other instruments - that's what the 'instrument' field is for - but we're focusing on stocks first to perfect the AI decision-making. Other asset classes will follow."

---

## Post-Demo Follow-Up

**After the demo:**

1. **Ask for feedback:** "What did you think? Any questions?"

2. **Offer trial/access:** "Would you like to try this yourself? I can set up a demo account."

3. **Share resources:**
   - Elevator pitch document
   - Architecture overview (if technical)
   - Comparison table

4. **Schedule follow-up:** "Can we schedule 30 minutes next week to discuss your specific use case?"

5. **Send thank you email** with:
   - Demo recording link (if recorded)
   - Documentation links
   - Your contact info
   - Next steps

---

## Demo Variations by Audience

### For Traders:
- Emphasize: Strategy flexibility, AI explanations, learning from decisions
- Show: Chat interface extensively, reasoning for trades
- Skip: Technical architecture

### For Developers:
- Emphasize: Architecture, AI models, extensibility
- Show: How AI interprets instructions, MCP tools, LangChain integration
- Include: Technical slides on stack

### For Investors/Business:
- Emphasize: Market opportunity, user value, scalability
- Show: Multiple models comparison, performance metrics
- Include: Roadmap, monetization strategy

### For Academics/Researchers:
- Emphasize: AI decision-making, comparing model personalities, data insights
- Show: How different AIs interpret same strategy, reasoning differences
- Include: Methodology, data sources, validation approach

---

## Pro Tips for Great Demos

1. **Practice 3+ times** before live audience
2. **Time yourself** to ensure you fit in allotted slot
3. **Have backup plan** for every technical failure point
4. **Engage audience** - ask "Does this make sense?" periodically
5. **Tell stories** - "Imagine you're testing a breakout strategy and want to know..."
6. **Show enthusiasm** - if you're not excited, they won't be
7. **Pause for questions** - don't rush through without checking understanding
8. **End with clear call to action** - what do you want them to do next?

---

## Success Criteria

**A successful demo should result in audience:**
- Understanding what makes this different from traditional backtesting
- Seeing the value of conversational AI analysis
- Wanting to try it themselves
- Asking follow-up questions about their specific use cases
- Requesting access or next meeting

**Red flags during demo:**
- Audience looks confused
- No questions asked
- People checking phones
- "Interesting" without enthusiasm

**If you see red flags:**
- Stop and ask: "Is this making sense? What would you want to use this for?"
- Adapt the demo to their interests
- Skip ahead to the most relevant part for them

---

## Checklist Before Demo

**Technical:**
- [ ] Application loads successfully
- [ ] Can create a model
- [ ] Can start a backtest
- [ ] Chat interface works
- [ ] Sample data is available

**Presentation:**
- [ ] Script reviewed and practiced
- [ ] Backup screenshots ready
- [ ] Questions anticipated
- [ ] Follow-up materials prepared
- [ ] Contact info ready to share

**Environment:**
- [ ] Screen sharing works
- [ ] Audio is clear
- [ ] Lighting is good (if on camera)
- [ ] Background is professional
- [ ] Notifications turned off

---

**Remember: This is not just showing features. You're demonstrating a new way of thinking about algorithmic trading - from coding rules to conversing with AI.**

**Good luck with your demo! 🚀**

