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
from tools.price_tools import get_yesterday_date, get_open_prices, get_yesterday_open_and_close_price, get_today_init_position, get_yesterday_profit
from tools.general_tools import get_config_value

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

def get_agent_system_prompt(today_date: str, signature: str) -> str:
    print(f"signature: {signature}")
    print(f"today_date: {today_date}")
    # Get yesterday's buy and sell prices
    yesterday_buy_prices, yesterday_sell_prices = get_yesterday_open_and_close_price(today_date, all_nasdaq_100_symbols)
    today_buy_price = get_open_prices(today_date, all_nasdaq_100_symbols)
    today_init_position = get_today_init_position(today_date, signature)
    yesterday_profit = get_yesterday_profit(today_date, yesterday_buy_prices, yesterday_sell_prices, today_init_position)
    return agent_system_prompt.format(
        date=today_date, 
        positions=today_init_position, 
        STOP_SIGNAL=STOP_SIGNAL,
        yesterday_close_price=yesterday_sell_prices,
        today_buy_price=today_buy_price,
        yesterday_profit=yesterday_profit
    )



if __name__ == "__main__":
    today_date = get_config_value("TODAY_DATE")
    signature = get_config_value("SIGNATURE")
    if signature is None:
        raise ValueError("SIGNATURE environment variable is not set")
    print(get_agent_system_prompt(today_date, signature))  