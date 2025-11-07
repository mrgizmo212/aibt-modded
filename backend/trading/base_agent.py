"""
BaseAgent class - Base class for trading agents
Encapsulates core functionality including MCP tool management, AI agent creation, and trading execution
"""

import os
import json
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pathlib import Path

from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_openai import ChatOpenAI
from langchain.agents import create_agent
from dotenv import load_dotenv

# Import project tools
import sys
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, project_root)

from utils.general_tools import extract_conversation, extract_tool_messages, get_config_value, write_config_value
from utils.price_tools import add_no_trade_record
from trading.agent_prompt import get_agent_system_prompt, STOP_SIGNAL

# Load environment variables
load_dotenv()


class BaseAgent:
    """
    Base class for trading agents
    
    Main functionalities:
    1. MCP tool management and connection
    2. AI agent creation and configuration
    3. Trading execution and decision loops
    4. Logging and management
    5. Position and configuration management
    """
    
    # Default NASDAQ 100 stock symbols
    DEFAULT_STOCK_SYMBOLS = [
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
    
    def __init__(
        self,
        signature: str,
        basemodel: str,
        stock_symbols: Optional[List[str]] = None,
        mcp_config: Optional[Dict[str, Dict[str, Any]]] = None,
        log_path: Optional[str] = None,
        max_steps: int = 10,
        max_retries: int = 3,
        base_delay: float = 0.5,
        openai_base_url: Optional[str] = None,
        openai_api_key: Optional[str] = None,
        initial_cash: float = 10000.0,
        init_date: str = "2025-10-13",
        model_id: Optional[int] = None,
        custom_rules: Optional[str] = None,
        custom_instructions: Optional[str] = None,
        model_parameters: Optional[Dict[str, Any]] = None,
        # NEW CONFIGURATION PARAMETERS:
        trading_style: str = "day-trading",
        instrument: str = "stocks",
        allow_shorting: bool = False,
        allow_options_strategies: bool = False,
        allow_hedging: bool = False,
        allowed_order_types: Optional[List[str]] = None,
        margin_account: bool = False,
        trading_service: Optional[Any] = None
    ):
        """
        Initialize BaseAgent
        
        Args:
            signature: Agent signature/name
            basemodel: Base model name
            stock_symbols: List of stock symbols, defaults to NASDAQ 100
            mcp_config: MCP tool configuration, including port and URL information
            log_path: Log path, defaults to ./data/agent_data
            max_steps: Maximum reasoning steps
            max_retries: Maximum retry attempts
            base_delay: Base delay time for retries
            openai_base_url: OpenAI API base URL
            openai_api_key: OpenAI API key
            initial_cash: Initial cash amount
            init_date: Initialization date
            custom_rules: Optional custom trading rules
            custom_instructions: Optional custom instructions
        """
        self.signature = signature
        self.basemodel = basemodel
        self.stock_symbols = stock_symbols or self.DEFAULT_STOCK_SYMBOLS
        self.max_steps = max_steps
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.initial_cash = initial_cash
        self.init_date = init_date
        self.custom_rules = custom_rules
        self.custom_instructions = custom_instructions
        self.model_parameters = model_parameters or {}
        
        # NEW: Trading configuration
        self.trading_style = trading_style
        self.instrument = instrument
        self.allow_shorting = allow_shorting
        self.allow_options_strategies = allow_options_strategies
        self.allow_hedging = allow_hedging
        self.allowed_order_types = allowed_order_types or ["market", "limit"]
        self.margin_account = margin_account
        
        # Calculate buying power multiplier based on margin and style
        if not margin_account:
            self.buying_power_multiplier = 1.0  # Cash account
        elif trading_style in ['scalping', 'day-trading']:
            self.buying_power_multiplier = 4.0  # Day trading margin
        else:
            self.buying_power_multiplier = 2.0  # Standard margin
        
        print(f"🤖 Agent Configuration:")
        print(f"   Style: {self.trading_style}")
        print(f"   Margin: {'Yes' if self.margin_account else 'No'}")
        print(f"   Buying Power: {self.buying_power_multiplier}x")
        print(f"   Shorting: {'Allowed' if self.allow_shorting else 'Disabled'}")
        print(f"   Order Types: {', '.join(self.allowed_order_types)}")
        
        # TradingService for trade execution (replaces MCP trade subprocess)
        self.trading_service = trading_service
        self._current_date: Optional[str] = None  # Set in run_trading_session
        self._current_run_id: Optional[int] = None  # Set when run starts (for linking trades)
        
        # Set MCP configuration
        self.mcp_config = mcp_config or self._get_default_mcp_config()
        
        # Set log path
        self.base_log_path = log_path or "./data/agent_data"
        
        # Set OpenAI configuration
        if openai_base_url==None:
            self.openai_base_url = os.getenv("OPENAI_API_BASE")
        else:
            self.openai_base_url = openai_base_url
        if openai_api_key==None:
            self.openai_api_key = os.getenv("OPENAI_API_KEY")
        else:
            self.openai_api_key = openai_api_key
        
        # Model ID for streaming events
        self.model_id = model_id
        
        # Initialize components
        self.client: Optional[MultiServerMCPClient] = None
        self.tools: Optional[List] = None
        self.model: Optional[ChatOpenAI] = None
        self.agent: Optional[Any] = None
        
        # Data paths
        self.data_path = os.path.join(self.base_log_path, self.signature)
        self.position_file = os.path.join(self.data_path, "position", "position.jsonl")
        
        # Import event stream
        try:
            from streaming import event_stream
            self.event_stream = event_stream
        except ImportError:
            self.event_stream = None
        
    def _get_default_mcp_config(self) -> Dict[str, Dict[str, Any]]:
        """Get default MCP configuration with June 2025 compliant timeouts"""
        return {
            "math": {
                "transport": "streamable_http",
                "url": f"http://localhost:{os.getenv('MATH_HTTP_PORT', '8000')}/mcp",
                "timeout": 30.0,              # Connection timeout (increased)
                "sse_read_timeout": 180.0,    # 3 min for math operations (increased)
            },
            "stock_local": {
                "transport": "streamable_http",
                "url": f"http://localhost:{os.getenv('GETPRICE_HTTP_PORT', '8003')}/mcp",
                "timeout": 30.0,              # Connection timeout (increased)
                "sse_read_timeout": 360.0,    # 6 min for large data fetches (increased)
            },
            "search": {
                "transport": "streamable_http",
                "url": f"http://localhost:{os.getenv('SEARCH_HTTP_PORT', '8001')}/mcp",
                "timeout": 30.0,              # Connection timeout for web requests (increased)
                "sse_read_timeout": 240.0,    # 4 min for web searches (increased)
            },
            # "trade" removed - now using TradingService instead of MCP subprocess
        }
    
    async def initialize(self) -> None:
        """Initialize MCP client and AI model"""
        print(f"🚀 Initializing agent: {self.signature}")
        
        # Try to connect to MCP services (optional - graceful degradation)
        self.mcp_tools = []
        
        if self.mcp_config:
            try:
                # Create MCP client
                print(f"📡 Connecting to MCP services...")
                print(f"   Math: {self.mcp_config.get('math', {}).get('url', 'N/A')}")
                print(f"   Stock: {self.mcp_config.get('stock_local', {}).get('url', 'N/A')}")
                print(f"   Search: {self.mcp_config.get('search', {}).get('url', 'N/A')}")
                # Trade: Now using TradingService instead of MCP
                
                # Retry connection with backoff
                max_retries = 2  # Reduced from 3 for faster failure
                retry_delay = 1  # Reduced from 2 for faster startup
                
                for attempt in range(max_retries):
                    try:
                        print(f"   Connection attempt {attempt + 1}/{max_retries}...")
                        self.client = MultiServerMCPClient(self.mcp_config)
                        
                        # Get MCP tools
                        self.mcp_tools = await self.client.get_tools()
                        print(f"✅ Loaded {len(self.mcp_tools)} MCP tools")
                        break
                    
                    except Exception as e:
                        if attempt < max_retries - 1:
                            print(f"   ⚠️  Attempt {attempt + 1} failed, retrying in {retry_delay}s...")
                            await asyncio.sleep(retry_delay)
                        else:
                            raise e
                
            except Exception as e:
                # MCP connection failed - continue without MCP tools (graceful degradation)
                print(f"⚠️  Could not connect to MCP services: {str(e)}")
                print(f"   Continuing without MCP tools (Math, Search, Price)")
                print(f"   Trading will still work via TradingService")
                self.mcp_tools = []
        else:
            print(f"  ℹ️  No MCP config provided - skipping MCP services")
            self.mcp_tools = []
        
        # Add trading tools (whether MCP succeeded or failed)
        if self.trading_service:
            from langchain_core.tools import tool
            
            # Use @tool decorator instead of lambda (fixes parameter binding)
            @tool
            def buy(symbol: str, amount: int) -> dict:
                """Buy stock shares. Args: symbol (str), amount (int). Returns position dict or error."""
                return self._execute_buy(symbol, amount)
            
            @tool
            def sell(symbol: str, amount: int) -> dict:
                """Sell stock shares. Args: symbol (str), amount (int). Returns position dict or error."""
                return self._execute_sell(symbol, amount)
            
            trading_tools = [buy, sell]
            
            # Combine MCP tools (if any) + trading tools
            self.tools = self.mcp_tools + trading_tools
            print(f"  ✅ Added trading tools (buy, sell) via TradingService")
            print(f"  📊 Total tools: {len(self.tools)} (MCP: {len(self.mcp_tools)}, Trading: 2)")
        else:
            # No TradingService - use MCP tools only
            self.tools = self.mcp_tools
            print(f"  ⚠️  No TradingService provided - using {len(self.mcp_tools)} MCP tools only")
        
        try:
            # Create AI model
            print(f"🤖 Creating AI model: {self.basemodel}")
            
            # Build ChatOpenAI kwargs with model parameters
            chat_kwargs = {
                "model": self.basemodel,
                "base_url": self.openai_base_url,
                "api_key": self.openai_api_key,
                "max_retries": 3,
                "timeout": 30,
                "default_headers": {
                    "HTTP-Referer": "https://aibt.truetradinggroup.com",
                    "X-Title": "AIBT AI Trading Platform"
                }
            }
            
            # Add model_parameters if provided
            if self.model_parameters:
                print(f"⚙️  Applying model parameters: {list(self.model_parameters.keys())}")
                # Filter to only valid ChatOpenAI parameters
                # NOTE: max_prompt_tokens is NOT a valid ChatOpenAI param (causes errors)
                valid_params = {
                    'temperature', 'max_tokens', 'max_completion_tokens', 
                    'top_p', 'frequency_penalty', 'presence_penalty'
                }
                
                # Special handling for parameters that need model_kwargs
                # Note: web_search removed - not supported by most models
                special_params = {'verbosity', 'reasoning_effort'}
                model_kwargs = {}
                
                for key, value in self.model_parameters.items():
                    if key in valid_params:
                        chat_kwargs[key] = value
                        print(f"   ✅ {key}: {value}")
                    elif key in special_params:
                        model_kwargs[key] = value
                        print(f"   ✅ {key}: {value} (in model_kwargs)")
                    elif key == 'max_prompt_tokens':
                        print(f"   ⏭️  {key}: {value} (skipped - not supported by ChatOpenAI)")
                    elif key == 'web_search':
                        print(f"   ⏭️  {key}: {value} (skipped - not needed for trading)")
                    else:
                        print(f"   ⚠️  {key}: {value} (unknown parameter, skipped)")
                
                # Add model_kwargs if we have any
                if model_kwargs:
                    chat_kwargs['model_kwargs'] = model_kwargs
            
            self.model = ChatOpenAI(**chat_kwargs)
            print(f"✅ AI model created")
            
        except Exception as e:
            print(f"❌ Failed to create AI model: {str(e)}")
            raise Exception(f"AI model creation failed: {str(e)}")
        
        # Note: agent will be created in run_trading_session() based on specific date
        # because system_prompt needs the current date and price information
        
        print(f"✅ Agent {self.signature} initialization completed")
    
    def _setup_logging(self, today_date: str) -> str:
        """Set up log file path"""
        log_path = os.path.join(self.base_log_path, self.signature, 'log', today_date)
        if not os.path.exists(log_path):
            os.makedirs(log_path)
        return os.path.join(log_path, "log.jsonl")
    
    def _log_message(self, log_file: str, new_messages: List[Dict[str, str]]) -> None:
        """Log messages to log file"""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "signature": self.signature,
            "new_messages": new_messages
        }
        with open(log_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")
    
    async def _ainvoke_with_retry(self, message: List[Dict[str, str]]) -> Any:
        """Agent invocation with retry"""
        for attempt in range(1, self.max_retries + 1):
            try:
                return await self.agent.ainvoke(
                    {"messages": message}, 
                    {"recursion_limit": 100}
                )
            except Exception as e:
                if attempt == self.max_retries:
                    raise e
                print(f"⚠️ Attempt {attempt} failed, retrying after {self.base_delay * attempt} seconds...")
                print(f"Error details: {e}")
                await asyncio.sleep(self.base_delay * attempt)
    
    def _execute_buy(self, symbol: str, amount: int) -> Dict[str, Any]:
        """
        Execute buy via TradingService
        
        Args:
            symbol: Stock ticker
            amount: Number of shares
        
        Returns:
            New position or error dict
        """
        if not self.trading_service:
            return {"error": "TradingService not available"}
        
        if not self._current_date:
            return {"error": "Current date not set"}
        
        if not self.model_id:
            return {"error": "Model ID not set"}
        
        result = self.trading_service.buy(
            symbol=symbol,
            amount=amount,
            model_id=self.model_id,
            date=self._current_date,
            execution_source="ai",
            run_id=getattr(self, '_current_run_id', None)  # ← Pass run_id if available
        )
        
        return result
    
    def _execute_sell(self, symbol: str, amount: int) -> Dict[str, Any]:
        """
        Execute sell via TradingService
        
        Args:
            symbol: Stock ticker
            amount: Number of shares
        
        Returns:
            New position or error dict
        """
        if not self.trading_service:
            return {"error": "TradingService not available"}
        
        if not self._current_date:
            return {"error": "Current date not set"}
        
        if not self.model_id:
            return {"error": "Model ID not set"}
        
        result = self.trading_service.sell(
            symbol=symbol,
            amount=amount,
            model_id=self.model_id,
            date=self._current_date,
            execution_source="ai",
            run_id=getattr(self, '_current_run_id', None)  # ← Pass run_id if available
        )
        
        return result
    
    async def run_trading_session(self, today_date: str) -> None:
        """
        Run single day trading session
        
        Args:
            today_date: Trading date
        """
        # Set current date for trading tools
        self._current_date = today_date
        
        print(f"📈 Starting trading session: {today_date}")
        
        # Emit event
        if self.event_stream and self.model_id:
            await self.event_stream.emit(self.model_id, "session_start", {
                "message": f"Starting trading session for {today_date}",
                "date": today_date
            })
        
        # Set up logging
        log_file = self._setup_logging(today_date)
        
        # Update system prompt
        self.agent = create_agent(
            self.model,
            tools=self.tools,
            system_prompt=get_agent_system_prompt(
                today_date, 
                self.signature,
                custom_rules=self.custom_rules,
                custom_instructions=self.custom_instructions,
                # NEW: Pass configuration to prompt
                trading_style=self.trading_style,
                instrument=self.instrument,
                allow_shorting=self.allow_shorting,
                margin_account=self.margin_account,
                allow_options_strategies=self.allow_options_strategies,
                allow_hedging=self.allow_hedging,
                allowed_order_types=self.allowed_order_types
            ),
        )
        
        # Initial user query
        user_query = [{"role": "user", "content": f"Please analyze and update today's ({today_date}) positions."}]
        message = user_query.copy()
        
        # Log initial message
        self._log_message(log_file, user_query)
        
        # Trading loop
        current_step = 0
        while current_step < self.max_steps:
            current_step += 1
            print(f"🔄 Step {current_step}/{self.max_steps}")
            
            # Emit step event
            if self.event_stream and self.model_id:
                await self.event_stream.emit(self.model_id, "thinking", {
                    "message": f"AI analyzing (step {current_step}/{self.max_steps})...",
                    "step": current_step
                })
            
            try:
                # Call agent
                response = await self._ainvoke_with_retry(message)
                
                # Extract agent response
                agent_response = extract_conversation(response, "final")
                
                # Emit AI response
                if self.event_stream and self.model_id:
                    await self.event_stream.emit(self.model_id, "ai_response", {
                        "message": agent_response[:200] + "..." if len(agent_response) > 200 else agent_response
                    })
                
                # Check for buy/sell in response
                if "buy(" in agent_response.lower():
                    if self.event_stream and self.model_id:
                        await self.event_stream.emit(self.model_id, "trade", {
                            "action": "buy",
                            "message": "AI executing BUY order..."
                        })
                elif "sell(" in agent_response.lower():
                    if self.event_stream and self.model_id:
                        await self.event_stream.emit(self.model_id, "trade", {
                            "action": "sell",
                            "message": "AI executing SELL order..."
                        })
                elif "hold" in agent_response.lower():
                    if self.event_stream and self.model_id:
                        await self.event_stream.emit(self.model_id, "trade", {
                            "action": "hold",
                            "message": "AI decided to HOLD positions"
                        })
                
                # Check stop signal
                if STOP_SIGNAL in agent_response:
                    print("✅ Received stop signal, trading session ended")
                    print(agent_response)
                    self._log_message(log_file, [{"role": "assistant", "content": agent_response}])
                    
                    if self.event_stream and self.model_id:
                        await self.event_stream.emit(self.model_id, "session_complete", {
                            "message": "Trading session completed"
                        })
                    break
                
                # Extract tool messages
                tool_msgs = extract_tool_messages(response)
                tool_response = '\n'.join([msg.content for msg in tool_msgs])
                
                # Emit tool usage
                if tool_msgs and self.event_stream and self.model_id:
                    await self.event_stream.emit(self.model_id, "tool_use", {
                        "message": f"Used {len(tool_msgs)} tool(s)",
                        "tools": [msg.name for msg in tool_msgs if hasattr(msg, 'name')]
                    })
                
                # Prepare new messages
                new_messages = [
                    {"role": "assistant", "content": agent_response},
                    {"role": "user", "content": f'Tool results: {tool_response}'}
                ]
                
                # Add new messages
                message.extend(new_messages)
                
                # Log messages
                self._log_message(log_file, new_messages[0])
                self._log_message(log_file, new_messages[1])
                
            except Exception as e:
                print(f"❌ Trading session error: {str(e)}")
                print(f"Error details: {e}")
                raise
        
        # Handle trading results
        await self._handle_trading_result(today_date)
    
    async def _handle_trading_result(self, today_date: str) -> None:
        """Handle trading results"""
        if_trade = get_config_value("IF_TRADE")
        if if_trade:
            write_config_value("IF_TRADE", False)
            print("✅ Trading completed")
        else:
            print("📊 No trading, maintaining positions")
            try:
                add_no_trade_record(today_date, self.signature)
            except NameError as e:
                print(f"❌ NameError: {e}")
                raise
            write_config_value("IF_TRADE", False)
    
    def register_agent(self) -> None:
        """Register new agent, create initial positions"""
        # Check if position.jsonl file already exists
        if os.path.exists(self.position_file):
            print(f"⚠️ Position file {self.position_file} already exists, skipping registration")
            return
        
        # Ensure directory structure exists
        position_dir = os.path.join(self.data_path, "position")
        if not os.path.exists(position_dir):
            os.makedirs(position_dir)
            print(f"📁 Created position directory: {position_dir}")
        
        # Create initial positions
        init_position = {symbol: 0 for symbol in self.stock_symbols}
        init_position['CASH'] = self.initial_cash
        
        with open(self.position_file, "w") as f:  # Use "w" mode to ensure creating new file
            f.write(json.dumps({
                "date": self.init_date, 
                "id": 0, 
                "positions": init_position
            }) + "\n")
        
        print(f"✅ Agent {self.signature} registration completed")
        print(f"📁 Position file: {self.position_file}")
        print(f"💰 Initial cash: ${self.initial_cash}")
        print(f"📊 Number of stocks: {len(self.stock_symbols)}")
    
    def get_trading_dates(self, init_date: str, end_date: str) -> List[str]:
        """
        Get trading date list
        
        Args:
            init_date: Start date
            end_date: End date
            
        Returns:
            List of trading dates
        """
        dates = []
        max_date = None
        
        if not os.path.exists(self.position_file):
            self.register_agent()
            max_date = init_date
        else:
            # Read existing position file, find latest date
            with open(self.position_file, "r") as f:
                for line in f:
                    doc = json.loads(line)
                    current_date = doc['date']
                    if max_date is None:
                        max_date = current_date
                    else:
                        current_date_obj = datetime.strptime(current_date, "%Y-%m-%d")
                        max_date_obj = datetime.strptime(max_date, "%Y-%m-%d")
                        if current_date_obj > max_date_obj:
                            max_date = current_date
        
        # Use init_date if it's later than historical max_date
        init_date_obj = datetime.strptime(init_date, "%Y-%m-%d")
        max_date_obj = datetime.strptime(max_date, "%Y-%m-%d")
        end_date_obj = datetime.strptime(end_date, "%Y-%m-%d")
        
        # Start from whichever is later: init_date or historical max_date
        start_from = max(init_date_obj, max_date_obj + timedelta(days=1))
        
        if end_date_obj < start_from:
            return []
        
        # Generate trading date list
        trading_dates = []
        current_date = start_from
        
        while current_date <= end_date_obj:
            if current_date.weekday() < 5:  # Weekdays
                trading_dates.append(current_date.strftime("%Y-%m-%d"))
            current_date += timedelta(days=1)
        
        return trading_dates
    
    async def run_with_retry(self, today_date: str) -> None:
        """Run method with retry"""
        for attempt in range(1, self.max_retries + 1):
            try:
                print(f"🔄 Attempting to run {self.signature} - {today_date} (Attempt {attempt})")
                await self.run_trading_session(today_date)
                print(f"✅ {self.signature} - {today_date} run successful")
                return
            except Exception as e:
                print(f"❌ Attempt {attempt} failed: {str(e)}")
                if attempt == self.max_retries:
                    print(f"💥 {self.signature} - {today_date} all retries failed")
                    raise
                else:
                    wait_time = self.base_delay * attempt
                    print(f"⏳ Waiting {wait_time} seconds before retry...")
                    await asyncio.sleep(wait_time)
    
    async def run_date_range(self, init_date: str, end_date: str) -> None:
        """
        Run all trading days in date range
        
        Args:
            init_date: Start date
            end_date: End date
        """
        print(f"📅 Running date range: {init_date} to {end_date}")
        
        # Get trading date list
        trading_dates = self.get_trading_dates(init_date, end_date)
        
        if not trading_dates:
            print(f"ℹ️ No trading days to process")
            return
        
        print(f"📊 Trading days to process: {trading_dates}")
        
        # Process each trading day
        for date in trading_dates:
            print(f"🔄 Processing {self.signature} - Date: {date}")
            
            # Set configuration
            write_config_value("TODAY_DATE", date)
            write_config_value("SIGNATURE", self.signature)
            
            try:
                await self.run_with_retry(date)
            except Exception as e:
                print(f"❌ Error processing {self.signature} - Date: {date}")
                print(e)
                raise
        
        print(f"✅ {self.signature} processing completed")
    
    def get_position_summary(self) -> Dict[str, Any]:
        """Get position summary"""
        if not os.path.exists(self.position_file):
            return {"error": "Position file does not exist"}
        
        positions = []
        with open(self.position_file, "r") as f:
            for line in f:
                positions.append(json.loads(line))
        
        if not positions:
            return {"error": "No position records"}
        
        latest_position = positions[-1]
        return {
            "signature": self.signature,
            "latest_date": latest_position.get("date"),
            "positions": latest_position.get("positions", {}),
            "total_records": len(positions)
        }
    
    def __str__(self) -> str:
        return f"BaseAgent(signature='{self.signature}', basemodel='{self.basemodel}', stocks={len(self.stock_symbols)})"
    
    def __repr__(self) -> str:
        return self.__str__()
