import os
from dotenv import load_dotenv
load_dotenv()
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional
import sys
import os
# Add project root directory to Python path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)
from utils.price_tools import get_yesterday_date, get_open_prices, get_yesterday_open_and_close_price, get_today_init_position, get_yesterday_profit
from utils.general_tools import get_config_value

all_nasdaq_100_symbols = [
    "NVDA", "MSFT", "AAPL", "GOOG", "GOOGL", "AMZN", "META", "AVGO", "TSLA",
    "NFLX", "PLTR", "COST", "ASML", "AMD", "CSCO", "AZN", "TMUS", "MU", "LIN",
    "PEP", "SHOP", "APP", "INTU", "AMAT", "LRCX", "PDD", "QCOM", "ARM", "INTC",
    "BKNG", "AMGN", "TXN", "ISRG", "GILD", "KLAC", "PANW", "ADBE", "HON",
    "CRWD", "CEG", "ADI", "ADP", "DASH", "CMCSA", "VRTX", "MELI", "SBUX",
    "CDNS", "ORLY", "SNPS", "MSTR", "MDLZ", "ABNB", "MRVL", "CTAS", "TRI",
    "MAR", "MNST", "CSX", "ADSK", "PYPL", "FTNT", "AEP", "WDAY", "REGN", "ROP",
    "NXPI", "DDOG", "AXON", "ROST", "IDXX", "EA", "PCAR", "FAST", "EXC", "TTWO",
    "XEL", "ZS", "PAYX", "WBD", "BKR", "CPRT", "CCEP", "FANG", "TEAM", "CHTR",
    "KDP", "MCHP", "GEHC", "VRSK", "CTSH", "CSGP", "KHC", "ODFL", "DXCM", "TTD",
    "ON", "BIIB", "LULU", "CDW", "GFS"
]

STOP_SIGNAL = "<FINISH_SIGNAL>"

agent_system_prompt = """
You are an AUTONOMOUS stock trading AI operating completely independently.

🚨 CRITICAL RULES - READ CAREFULLY:

1. **YOU ARE ALONE** - There is NO user to ask questions to. You are running autonomously.
2. **NEVER ASK RHETORICAL QUESTIONS** - Don't ask "Would you like me to..." or "Should I..." - DECIDE and ACT.
3. **MAKE DECISIONS YOURSELF** - Analyze data, make trading decisions, execute trades, then output FINISH_SIGNAL.
4. **NO WAITING FOR INPUT** - You will NOT receive any user responses. Any questions you ask will be ignored.
5. **COMPLETE YOUR TASK AUTONOMOUSLY** - Analyze → Decide → Execute → Signal completion.

YOUR TRADING WORKFLOW (Execute this EXACTLY):

STEP 1: Analyze Yesterday's Performance
- Review yesterday's profit/loss
- Calculate current portfolio value
- Identify winning/losing positions

STEP 2: Gather Market Intelligence (OPTIONAL - only if needed)
- Search for relevant news using get_information() tool
- Focus on stocks you're considering trading
- Keep searches focused and relevant

STEP 3: Make Trading Decisions AUTONOMOUSLY
- Decide which stocks to buy/sell based on:
  * Yesterday's performance
  * Today's prices
  * Market news (if gathered)
  * Portfolio diversification
  * Risk management
- DO NOT ask for permission - EXECUTE your decisions

STEP 4: Execute Trades
- Use buy(symbol, amount) for purchases
- Use sell(symbol, amount) for sales
- You can make multiple trades per day

STEP 5: Complete the Session
- After executing your trades (or deciding to hold), immediately output: {STOP_SIGNAL}
- DO NOT ask follow-up questions
- DO NOT wait for user input
- JUST OUTPUT THE FINISH SIGNAL

🎯 YOUR GOAL: Maximize portfolio returns through autonomous decision-making.

📊 TODAY'S MARKET DATA:

Date: {date}

Yesterday's Portfolio:
{positions}

Yesterday's Closing Prices:
{yesterday_close_price}

Today's Opening Prices (for buying):
{today_buy_price}

Yesterday's Profit/Loss by Stock:
{yesterday_profit}

⚡ REMEMBER: 
- You are AUTONOMOUS - make decisions yourself
- NEVER ask rhetorical questions to a non-existent user
- Execute your strategy, then output {STOP_SIGNAL}
- If you have nothing to do today, just output {STOP_SIGNAL}

BEGIN YOUR AUTONOMOUS TRADING SESSION NOW.
"""

def get_agent_system_prompt(
    today_date: str, 
    signature: str, 
    custom_rules: Optional[str] = None,
    custom_instructions: Optional[str] = None,
    # NEW CONFIGURATION PARAMETERS:
    trading_style: str = "day-trading",
    instrument: str = "stocks",
    allow_shorting: bool = False,
    margin_account: bool = False,
    allow_options_strategies: bool = False,
    allow_hedging: bool = False,
    allowed_order_types: Optional[List[str]] = None
) -> str:
    """
    Generate system prompt with optional custom rules/instructions
    
    Args:
        today_date: Trading date
        signature: Model signature
        custom_rules: Optional custom trading rules (overrides default behavior)
        custom_instructions: Optional strategy instructions (guides AI behavior)
        trading_style: Trading style (scalping, day-trading, swing-trading, investing)
        instrument: Allowed instrument (stocks, options, futures, etc.)
        allow_shorting: Whether shorting is allowed
        margin_account: Whether model has margin account
        allow_options_strategies: Whether multi-leg options allowed
        allow_hedging: Whether hedging allowed
        allowed_order_types: List of allowed order types
    
    Returns:
        Complete system prompt
    """
    print(f"signature: {signature}")
    print(f"today_date: {today_date}")
    
    # Get yesterday's buy and sell prices
    yesterday_buy_prices, yesterday_sell_prices = get_yesterday_open_and_close_price(today_date, all_nasdaq_100_symbols)
    today_buy_price = get_open_prices(today_date, all_nasdaq_100_symbols)
    today_init_position = get_today_init_position(today_date, signature)
    yesterday_profit = get_yesterday_profit(today_date, yesterday_buy_prices, yesterday_sell_prices, today_init_position)
    
    # Build base prompt
    base_prompt = agent_system_prompt.format(
        date=today_date, 
        positions=today_init_position, 
        STOP_SIGNAL=STOP_SIGNAL,
        yesterday_close_price=yesterday_sell_prices,
        today_buy_price=today_buy_price,
        yesterday_profit=yesterday_profit
    )
    
    # Add configuration section (BEFORE custom rules/instructions)
    style_descriptions = {
        "scalping": "⏱️ SCALPING (1-5 minute holds)\n- EXIT all positions within 5 minutes maximum\n- Focus on quick price movements and high volume\n- Tight stop losses (0.5-1%)\n- High frequency, small gains per trade",
        "day-trading": "📅 DAY TRADING (Intraday only)\n- CLOSE all positions by 3:55 PM EST\n- No overnight risk\n- Focus on intraday momentum and volume",
        "swing-trading": "📈 SWING TRADING (2-7 days)\n- Hold positions for 2-7 days\n- Multi-day trends and momentum continuation\n- Wider stop losses (3-5%)\n- Fewer trades, larger positions",
        "investing": "💼 INVESTING (Long-term)\n- Hold weeks to months\n- Fundamental analysis: valuations, earnings, growth\n- Long-term perspective"
    }
    
    config_section = f"""

{'='*80}
⚙️ MODEL CONFIGURATION - MANDATORY CONSTRAINTS
{'='*80}

🎯 TRADING STYLE: {trading_style.upper().replace('-', ' ')}
{style_descriptions.get(trading_style, '')}

🎯 ACCOUNT TYPE: {'Margin Account' if margin_account else 'Cash Account'}
"""
    
    if margin_account:
        if trading_style in ['scalping', 'day-trading']:
            config_section += "- Buying Power: 4x cash (day trading margin)\n"
        else:
            config_section += "- Buying Power: 2x cash (standard margin)\n"
    else:
        config_section += "- Buying Power: 1x cash (no leverage)\n"
    
    config_section += f"""

🎯 ALLOWED INSTRUMENTS: {instrument.capitalize()} ONLY
- You can ONLY trade {instrument}
- Do NOT attempt other asset types

🎯 TRADING CAPABILITIES:
"""
    
    # Shorting
    if allow_shorting and margin_account:
        config_section += "✅ SHORT SELLING: ENABLED\n"
        config_section += "   - You CAN short stocks\n"
        config_section += "   - Margin requirement: 50% of short value\n"
    elif allow_shorting and not margin_account:
        config_section += "⚠️ SHORT SELLING: ENABLED BUT NO MARGIN\n"
        config_section += "   - Short orders will be REJECTED (no margin account)\n"
    else:
        config_section += "🚫 SHORT SELLING: DISABLED\n"
        config_section += "   - You can ONLY go long (BUY shares)\n"
        config_section += "   - All SELL orders must close existing long positions\n"
    
    # Options
    if allow_options_strategies:
        config_section += "✅ MULTI-LEG OPTIONS: ENABLED\n"
        config_section += "   - You can create spreads, straddles, iron condors\n"
    else:
        config_section += "🚫 MULTI-LEG OPTIONS: DISABLED\n"
        config_section += "   - Single-leg positions only\n"
    
    # Hedging
    if allow_hedging:
        config_section += "✅ HEDGING: ENABLED\n"
        config_section += "   - You can open offsetting positions to hedge risk\n"
    else:
        config_section += "🚫 HEDGING: DISABLED\n"
        config_section += "   - Each position is directional only\n"
    
    order_types_list = allowed_order_types or ["market", "limit"]
    config_section += f"""

🎯 ALLOWED ORDER TYPES: {', '.join(order_types_list)}
- ONLY use these order types when placing trades
- Any other order type will be REJECTED

⚠️ RULE VIOLATIONS = AUTOMATIC REJECTION:
- Wrong instrument → REJECTED + logged
- Short when disabled/no margin → REJECTED + logged
- Wrong order type → REJECTED + logged
- Insufficient margin → REJECTED + logged

All rejections are logged and you'll see them in your next decision context.

{'='*80}
"""
    
    base_prompt += config_section
    
    # Append custom rules/instructions if provided
    additions = []
    
    if custom_rules:
        additions.append(f"""
🎯 CUSTOM TRADING RULES (MUST FOLLOW):
{custom_rules}

These are MANDATORY rules you MUST follow. Override default behavior if these conflict.
""")
    
    if custom_instructions:
        additions.append(f"""
📋 CUSTOM STRATEGY INSTRUCTIONS:
{custom_instructions}

Consider these instructions when making trading decisions.
""")
    
    if additions:
        base_prompt += "\n\n" + "\n".join(additions)
        base_prompt += f"\n\n{'='*80}\n"
        if custom_rules and custom_instructions:
            base_prompt += "⚠️  You have BOTH custom rules and instructions. Follow the rules strictly and use instructions as guidance.\n"
        elif custom_rules:
            base_prompt += "⚠️  You have custom rules. These override default trading behavior.\n"
        else:
            base_prompt += "⚠️  You have custom instructions. Use these to guide your strategy.\n"
        base_prompt += f"{'='*80}\n"
    
    return base_prompt



def get_intraday_system_prompt(
    minute: str, 
    symbol: str, 
    bar: dict, 
    position: dict,
    custom_rules: Optional[str] = None,
    custom_instructions: Optional[str] = None,
    # NEW CONFIGURATION PARAMETERS:
    trading_style: str = "day-trading",
    allow_shorting: bool = False,
    margin_account: bool = False,
    allowed_order_types: Optional[List[str]] = None
) -> str:
    """
    Generate intraday-specific trading prompt
    
    Args:
        minute: Current minute HH:MM
        symbol: Stock symbol
        bar: Current minute's OHLCV data
        position: Current portfolio
        custom_rules: Optional custom rules
        custom_instructions: Optional custom instructions
        trading_style: Trading style
        allow_shorting: Whether shorting allowed
        margin_account: Whether margin account enabled
        allowed_order_types: List of allowed order types
    
    Returns:
        Prompt string for AI
    """
    
    cash = position.get("CASH", 0)
    holdings = position.get(symbol, 0)
    
    # Calculate max shares we can afford
    current_price = bar.get('close', 0)
    max_affordable_shares = int(cash / current_price) if current_price > 0 else 0
    
    prompt = f"""You are trading {symbol} on a minute-by-minute basis.

CURRENT TIME: {minute}
CURRENT MINUTE BAR:
- Open: ${bar.get('open', 0):.2f}
- High: ${bar.get('high', 0):.2f}
- Low: ${bar.get('low', 0):.2f}
- Close: ${bar.get('close', 0):.2f}
- Volume: {bar.get('volume', 0):,}

CURRENT PORTFOLIO:
- Cash: ${cash:.2f}
- {symbol} Holdings: {holdings} shares

⚠️ TRADING LIMITS:
- Maximum BUY: {max_affordable_shares} shares (based on available cash)
- Maximum SELL: {holdings} shares (can't sell more than you own)

INSTRUCTIONS:
Make a FAST trading decision for this minute. You have limited time.

Respond in ONE of these formats with BRIEF reasoning:
- "BUY X shares - [reason in 5-10 words]" (X must be ≤ {max_affordable_shares})
- "SELL X shares - [reason in 5-10 words]" (X must be ≤ {holdings})
- "HOLD - [reason in 5-10 words]"

Examples:
- "BUY 10 shares - price breaking resistance, volume spike"
- "SELL 5 shares - taking profit, momentum weakening"
- "HOLD - consolidating, no clear signal"

🚨 CRITICAL: DO NOT exceed your trading limits or your order will be rejected!

Consider:
- Price movement this minute (open vs close)
- Available cash (${cash:.2f})
- Current holdings ({holdings} shares)
- Volume (market activity)

Make your decision NOW (action + brief reasoning):"""
    
    # Add configuration constraints
    order_types_list = allowed_order_types or ["market", "limit"]
    prompt += f"""

{'='*60}
⚙️ CONSTRAINTS (ENFORCED):
{'='*60}
"""
    
    # Shorting constraint
    if allow_shorting and margin_account:
        prompt += "✅ Shorting: Allowed (margin account active)\n"
    elif allow_shorting and not margin_account:
        prompt += "⚠️ Shorting: Configured but NO MARGIN - shorts will be rejected\n"
    else:
        prompt += "🚫 Shorting: DISABLED - Only BUY/SELL (close positions)\n"
    
    # Order types
    prompt += f"🎯 Order Types: {', '.join(order_types_list)} only\n"
    prompt += f"{'='*60}\n"
    
    # NEW: Append custom rules/instructions (same pattern as daily trading)
    if custom_rules:
        prompt += f"""

🎯 CUSTOM TRADING RULES (MANDATORY):
{custom_rules}

These rules OVERRIDE default behavior. Follow them strictly for every decision.
"""
    
    if custom_instructions:
        prompt += f"""

📋 STRATEGY GUIDANCE:
{custom_instructions}

Use these instructions to guide your minute-by-minute decisions.
"""
    
    return prompt


if __name__ == "__main__":
    today_date = get_config_value("TODAY_DATE")
    signature = get_config_value("SIGNATURE")
    if signature is None:
        raise ValueError("SIGNATURE environment variable is not set")
    print(get_agent_system_prompt(today_date, signature))  