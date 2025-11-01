# AI-Trader - Codebase Overview

**Last Updated:** 2025-10-29 (Initial Documentation)  
**Agent/Session:** Comprehensive Codebase Analysis

---

## 1. PROJECT DESCRIPTION

**AI-Trader** is an autonomous AI trading competition platform where multiple AI models (GPT-5, Claude-3.7, DeepSeek, Qwen, Gemini, MiniMax) compete in NASDAQ 100 stock trading with **zero human intervention**. Each AI starts with $10,000 and makes fully autonomous trading decisions using **Model Context Protocol (MCP)** tools.

### Key Innovation:
- **100% Autonomous Decision-Making**: AI agents perform all analysis, trading, and strategy adjustments without human programming or intervention
- **Pure Tool-Driven Architecture**: All operations executed through standardized MCP tool calls
- **Historical Replay System**: Time-period replay functionality with automatic future information filtering
- **Multi-Model Competition**: Fair comparison of different AI models under identical conditions

### Target Users:
- AI/ML researchers studying autonomous decision-making
- Quantitative finance researchers
- AI model developers and evaluators

---

## 2. ARCHITECTURE

### High-Level Architecture Pattern:
**Modular Agent-Based System with MCP Toolchain Integration**

```
┌──────────────────────────────────────────────────────────────┐
│                     Main Orchestrator                         │
│                      (main.py)                                │
│  - Configuration Management                                   │
│  - Multi-Model Coordination                                   │
│  - Date Range Management                                      │
└────────────┬─────────────────────────────────────────────────┘
             │
             ├─────────────────────────────────────────────────┐
             │                                                  │
      ┌──────▼──────┐                                   ┌──────▼──────┐
      │  BaseAgent  │ ◄────────────────────────────────►│ MCP Toolchain│
      │   (Agent    │   Consumes Tools                  │  (4 Services)│
      │  Framework) │                                   └──────┬──────┘
      └──────┬──────┘                                          │
             │                                                  │
             │ Creates & Manages                       ┌────────┴────────┐
             │                                         │                 │
      ┌──────▼──────────┐                    ┌────────▼──────┐  ┌──────▼──────┐
      │  LangChain      │                    │ Trading Tool  │  │ Price Tool  │
      │  AI Agent       │                    │  (Buy/Sell)   │  │  (OHLCV)    │
      │  + ChatOpenAI   │                    └───────────────┘  └─────────────┘
      └─────────────────┘                            │                  │
             │                              ┌────────▼──────┐  ┌────────▼──────┐
             │                              │  Search Tool  │  │  Math Tool    │
             │                              │  (Jina AI)    │  │ (Calculations)│
             │                              └───────────────┘  └───────────────┘
             │
      ┌──────▼──────────────────────────────────────────┐
      │          Data & Logging System                  │
      │  - Position Management (JSONL)                  │
      │  - Trading Logs (Timestamped)                   │
      │  - Historical Price Data                        │
      └─────────────────────────────────────────────────┘
```

### Design Patterns Used:
1. **Factory Pattern**: Dynamic agent class loading via `AGENT_REGISTRY` in `main.py`
2. **Strategy Pattern**: Multiple AI models with same interface but different strategies
3. **Observer Pattern**: Trading session logging and monitoring
4. **Adapter Pattern**: MCP tools adapting various data sources to unified interface
5. **Template Method**: BaseAgent defines trading workflow, models implement strategies

### Key Architectural Decisions:
- **MCP (Model Context Protocol)**: Standardized tool interface for AI agents
- **FastMCP Framework**: Streamable HTTP transport for MCP servers
- **LangChain Integration**: AI agent framework with tool calling capabilities
- **JSONL Storage**: Append-only logs for auditability and replay
- **Stateless Tools**: Each MCP tool is independent and stateless
- **Historical Replay**: All tools filter future information automatically

---

## 3. DIRECTORY STRUCTURE

```
aitrtader/
├── agent/                      # AI Agent Framework
│   └── base_agent/
│       └── base_agent.py       # Core agent implementation
│
├── agent_tools/                # MCP Tool Servers (4 services)
│   ├── tool_trade.py           # Buy/Sell execution
│   ├── tool_get_price_local.py # Historical price queries
│   ├── tool_jina_search.py     # Web search & news
│   ├── tool_math.py            # Mathematical operations
│   └── start_mcp_services.py   # Service orchestration
│
├── tools/                      # Utility Libraries
│   ├── general_tools.py        # Config management, message extraction
│   ├── price_tools.py          # Price data parsing, position management
│   └── result_tools.py         # Result processing utilities
│
├── prompts/                    # AI Prompts
│   └── agent_prompt.py         # System prompts for trading agents
│
├── configs/                    # Configuration Files
│   ├── default_config.json     # Default model & agent settings
│   ├── README.md               # Config documentation
│   └── README_zh.md            # Chinese config docs
│
├── data/                       # Data Storage
│   ├── merged.jsonl            # NASDAQ 100 historical OHLCV data
│   ├── daily_prices_*.json     # Raw price data by symbol
│   └── agent_data/             # Per-agent trading records
│       └── {model_signature}/
│           ├── position/
│           │   └── position.jsonl  # Position history
│           └── log/
│               └── {date}/
│                   └── log.jsonl  # Daily trading logs
│
├── docs/                       # Documentation & Frontend
│   ├── index.html              # Live performance dashboard
│   ├── portfolio.html          # Portfolio viewer
│   ├── assets/                 # CSS/JS for dashboard
│   ├── figs/                   # Model logos (SVG)
│   └── devPrompts/             # Development guides
│
├── main.py                     # 🎯 Main Entry Point
├── main.sh                     # Shell script wrapper
├── requirements.txt            # Python dependencies
├── .env.example               # Environment variable template
└── README.md                   # Project documentation
```

---

## 4. KEY FILES AND THEIR PURPOSES

### **[`main.py`]** - Main Orchestrator
**Lines:** 1-242  
**Purpose:** Entry point for running AI trading competitions

**Key Functions:**
- `get_agent_class(agent_type)` - Dynamically loads agent classes from registry
- `load_config(config_path)` - Parses JSON configuration files
- `main(config_path)` - Orchestrates multi-model trading sessions

**Dependencies:**
- Imports: `agent.base_agent.base_agent`, `tools.general_tools`, `prompts.agent_prompt`
- External: `asyncio`, `json`, `pathlib`, `dotenv`

**Dependents:**
- Executed directly via CLI: `python main.py [config_path]`

**Code Example:**
```python
# Dynamic agent loading via registry
AGENT_REGISTRY = {
    "BaseAgent": {
        "module": "agent.base_agent.base_agent",
        "class": "BaseAgent"
    },
}

AgentClass = get_agent_class(agent_type)
agent = AgentClass(
    signature=signature,
    basemodel=basemodel,
    stock_symbols=all_nasdaq_100_symbols,
    max_steps=30,
    initial_cash=10000.0
)
```

---

### **[`agent/base_agent/base_agent.py`]** - Trading Agent Core
**Lines:** 1-447  
**Purpose:** Base class for all trading agents with MCP tool integration

**Key Classes:**
- `BaseAgent` - Main agent class with trading logic

**Key Methods:**
- `initialize()` - Sets up MCP client and AI model
- `run_trading_session(today_date)` - Executes single day trading
- `run_date_range(init_date, end_date)` - Runs multiple trading days
- `register_agent()` - Creates initial portfolio
- `get_trading_dates()` - Calculates trading calendar

**Dependencies:**
- Imports: `langchain_mcp_adapters.client.MultiServerMCPClient`, `langchain_openai.ChatOpenAI`, `tools.general_tools`, `tools.price_tools`, `prompts.agent_prompt`
- External: `asyncio`, `json`, `datetime`

**Dependents:**
- Used by: `main.py` (creates instances)

**Code Example:**
```python
class BaseAgent:
    DEFAULT_STOCK_SYMBOLS = [
        "NVDA", "MSFT", "AAPL", "GOOG", # ... NASDAQ 100
    ]
    
    async def initialize(self) -> None:
        """Initialize MCP client and AI model"""
        self.client = MultiServerMCPClient(self.mcp_config)
        self.tools = await self.client.get_tools()
        self.model = ChatOpenAI(
            model=self.basemodel,
            base_url=self.openai_base_url,
            api_key=self.openai_api_key
        )
    
    async def run_trading_session(self, today_date: str) -> None:
        """Run single day trading with agent loop"""
        self.agent = create_agent(
            self.model,
            tools=self.tools,
            system_prompt=get_agent_system_prompt(today_date, self.signature)
        )
        
        message = [{"role": "user", "content": f"Please analyze and update today's ({today_date}) positions."}]
        
        for step in range(self.max_steps):
            response = await self._ainvoke_with_retry(message)
            agent_response = extract_conversation(response, "final")
            
            if STOP_SIGNAL in agent_response:
                break  # Trading complete
```

**MCP Configuration:**
```python
def _get_default_mcp_config(self) -> Dict[str, Dict[str, Any]]:
    return {
        "math": {
            "transport": "streamable_http",
            "url": f"http://localhost:{os.getenv('MATH_HTTP_PORT', '8000')}/mcp",
        },
        "stock_local": {
            "transport": "streamable_http",
            "url": f"http://localhost:{os.getenv('GETPRICE_HTTP_PORT', '8003')}/mcp",
        },
        "search": {
            "transport": "streamable_http",
            "url": f"http://localhost:{os.getenv('SEARCH_HTTP_PORT', '8001')}/mcp",
        },
        "trade": {
            "transport": "streamable_http",
            "url": f"http://localhost:{os.getenv('TRADE_HTTP_PORT', '8002')}/mcp",
        },
    }
```

---

### **[`agent_tools/tool_trade.py`]** - Trading Execution MCP Server
**Lines:** 1-198  
**Purpose:** MCP server for buy/sell stock operations

**Key Tools (MCP):**
- `buy(symbol: str, amount: int)` - Buy stock shares
- `sell(symbol: str, amount: int)` - Sell stock shares

**Dependencies:**
- Imports: `fastmcp.FastMCP`, `tools.price_tools`, `tools.general_tools`
- External: `json`, `os`

**Dependents:**
- Consumed by: `BaseAgent` (via MCP client)

**Code Example:**
```python
mcp = FastMCP("TradeTools")

@mcp.tool()
def buy(symbol: str, amount: int) -> Dict[str, Any]:
    """Buy stock function with validation and position updates"""
    signature = get_config_value("SIGNATURE")
    today_date = get_config_value("TODAY_DATE")
    
    # Get current position
    current_position, current_action_id = get_latest_position(today_date, signature)
    
    # Get stock price
    this_symbol_price = get_open_prices(today_date, [symbol])[f'{symbol}_price']
    
    # Validate sufficient cash
    cash_left = current_position["CASH"] - this_symbol_price * amount
    if cash_left < 0:
        return {"error": "Insufficient cash!"}
    
    # Execute buy
    new_position = current_position.copy()
    new_position["CASH"] = cash_left
    new_position[symbol] += amount
    
    # Record to position.jsonl
    position_file_path = os.path.join(project_root, "data", "agent_data", signature, "position", "position.jsonl")
    with open(position_file_path, "a") as f:
        f.write(json.dumps({
            "date": today_date,
            "id": current_action_id + 1,
            "this_action": {"action": "buy", "symbol": symbol, "amount": amount},
            "positions": new_position
        }) + "\n")
    
    write_config_value("IF_TRADE", True)
    return new_position

if __name__ == "__main__":
    port = int(os.getenv("TRADE_HTTP_PORT", "8002"))
    mcp.run(transport="streamable-http", port=port)
```

---

### **[`agent_tools/tool_get_price_local.py`]** - Price Data MCP Server
**Lines:** 1-136  
**Purpose:** MCP server for querying historical OHLCV stock data

**Key Tools (MCP):**
- `get_price_local(symbol: str, date: str)` - Retrieve OHLCV data for specific date

**Dependencies:**
- Imports: `fastmcp.FastMCP`, `pathlib`, `json`, `datetime`
- Data Source: `../data/merged.jsonl`

**Dependents:**
- Consumed by: `BaseAgent` (via MCP client)

**Code Example:**
```python
mcp = FastMCP("LocalPrices")

@mcp.tool()
def get_price_local(symbol: str, date: str) -> Dict[str, Any]:
    """Read OHLCV data for specified stock and date"""
    _validate_date(date)  # Ensure YYYY-MM-DD format
    
    data_path = _workspace_data_path("merged.jsonl")
    
    with data_path.open("r", encoding="utf-8") as f:
        for line in f:
            doc = json.loads(line)
            meta = doc.get("Meta Data", {})
            if meta.get("2. Symbol") != symbol:
                continue
            
            series = doc.get("Time Series (Daily)", {})
            day = series.get(date)
            if day is None:
                return {"error": f"Data not found for date {date}"}
            
            return {
                "symbol": symbol,
                "date": date,
                "ohlcv": {
                    "open": day.get("1. buy price"),
                    "high": day.get("2. high"),
                    "low": day.get("3. low"),
                    "close": day.get("4. sell price"),
                    "volume": day.get("5. volume"),
                },
            }
```

---

### **[`agent_tools/tool_jina_search.py`]** - Web Search MCP Server
**Lines:** 1-272  
**Purpose:** MCP server for AI agents to search web content and news (with future-date filtering)

**Key Tools (MCP):**
- `get_information(query: str)` - Search and scrape web content

**Dependencies:**
- Imports: `fastmcp.FastMCP`, `requests`, `tools.general_tools`
- External API: Jina AI (r.jina.ai for scraping, s.jina.ai for search)

**Dependents:**
- Consumed by: `BaseAgent` (via MCP client)

**Critical Feature:**
- **Future Information Filtering**: Automatically filters out news/content dated after `TODAY_DATE` to prevent look-ahead bias

**Code Example:**
```python
class WebScrapingJinaTool:
    def _jina_search(self, query: str) -> List[str]:
        """Search with automatic future-date filtering"""
        url = f'https://s.jina.ai/?q={query}&n=1'
        response = requests.get(url, headers=headers)
        json_data = response.json()
        
        filtered_urls = []
        for item in json_data.get('data', []):
            raw_date = item.get('date', 'unknown')
            standardized_date = parse_date_to_standard(raw_date)
            
            # Check if before TODAY_DATE
            today_date = get_config_value("TODAY_DATE")
            if today_date and today_date > standardized_date:
                filtered_urls.append(item['url'])  # Only include past dates
        
        return filtered_urls

@mcp.tool()
def get_information(query: str) -> str:
    """Search and return structured web content"""
    tool = WebScrapingJinaTool()
    results = tool(query)
    # Returns formatted content with URL, title, description, publish time
```

---

### **[`agent_tools/tool_math.py`]** - Math Operations MCP Server
**Lines:** 1-21  
**Purpose:** Simple MCP server for mathematical calculations

**Key Tools (MCP):**
- `add(a: float, b: float)` - Addition
- `multiply(a: float, b: float)` - Multiplication

**Dependencies:**
- Imports: `fastmcp.FastMCP`

**Dependents:**
- Consumed by: `BaseAgent` (via MCP client)

**Code Example:**
```python
mcp = FastMCP("Math")

@mcp.tool()
def add(a: float, b: float) -> float:
    """Add two numbers (supports int and float)"""
    return float(a) + float(b)

@mcp.tool()
def multiply(a: float, b: float) -> float:
    """Multiply two numbers (supports int and float)"""
    return float(a) * float(b)

if __name__ == "__main__":
    port = int(os.getenv("MATH_HTTP_PORT", "8000"))
    mcp.run(transport="streamable-http", port=port)
```

---

### **[`agent_tools/start_mcp_services.py`]** - Service Manager
**Lines:** 1-237  
**Purpose:** Orchestrates startup and monitoring of all 4 MCP services

**Key Classes:**
- `MCPServiceManager` - Manages service lifecycle

**Key Methods:**
- `start_all_services()` - Start all MCP servers
- `check_service_health(service_id)` - Health checks
- `stop_all_services()` - Graceful shutdown

**Dependencies:**
- Imports: `subprocess`, `signal`, `threading`, `pathlib`
- Starts: `tool_math.py`, `tool_jina_search.py`, `tool_trade.py`, `tool_get_price_local.py`

**Dependents:**
- Executed manually before running agents

**Code Example:**
```python
service_configs = {
    'math': {'script': 'tool_math.py', 'port': 8000},
    'search': {'script': 'tool_jina_search.py', 'port': 8001},
    'trade': {'script': 'tool_trade.py', 'port': 8002},
    'price': {'script': 'tool_get_price_local.py', 'port': 8003}
}

def start_service(self, service_id, config):
    """Start a single service"""
    process = subprocess.Popen(
        [sys.executable, config['script']],
        stdout=log_file,
        stderr=subprocess.STDOUT
    )
    self.services[service_id] = {'process': process, 'port': config['port']}
```

---

### **[`tools/general_tools.py`]** - Utility Functions
**Lines:** 1-143  
**Purpose:** Configuration management and message parsing utilities

**Key Functions:**
- `get_config_value(key, default)` - Read from runtime_env.json or env vars
- `write_config_value(key, value)` - Write to runtime_env.json
- `extract_conversation(conversation, output_type)` - Parse LangChain messages
- `extract_tool_messages(conversation)` - Extract tool call results

**Dependencies:**
- Imports: `json`, `os`, `pathlib`, `dotenv`

**Dependents:**
- Used by: All agent tools, `base_agent.py`, `prompts/agent_prompt.py`

**Code Example:**
```python
def get_config_value(key: str, default=None):
    """Read config from runtime_env.json or environment variables"""
    _RUNTIME_ENV = _load_runtime_env()
    if key in _RUNTIME_ENV:
        return _RUNTIME_ENV[key]
    return os.getenv(key, default)

def write_config_value(key: str, value: any):
    """Write config to runtime_env.json"""
    _RUNTIME_ENV = _load_runtime_env()
    _RUNTIME_ENV[key] = value
    path = os.environ.get("RUNTIME_ENV_PATH")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(_RUNTIME_ENV, f, ensure_ascii=False, indent=4)
```

---

### **[`tools/price_tools.py`]** - Price Data Utilities
**Lines:** 1-371  
**Purpose:** Parse historical price data and manage position files

**Key Functions:**
- `get_yesterday_date(today_date)` - Calculate previous trading day (skip weekends)
- `get_open_prices(today_date, symbols)` - Read opening prices from merged.jsonl
- `get_yesterday_open_and_close_price()` - Read previous day's buy/sell prices
- `get_today_init_position(today_date, modelname)` - Read yesterday's final position
- `get_latest_position(today_date, modelname)` - Get current position with ID
- `add_no_trade_record(today_date, modelname)` - Log no-trade days
- `get_yesterday_profit()` - Calculate unrealized P&L

**Dependencies:**
- Imports: `json`, `datetime`, `pathlib`
- Data Source: `../data/merged.jsonl`, `../data/agent_data/{signature}/position/position.jsonl`

**Dependents:**
- Used by: `tool_trade.py`, `prompts/agent_prompt.py`, `base_agent.py`

**Code Example:**
```python
def get_latest_position(today_date: str, modelname: str) -> Dict[str, float]:
    """Get latest position, prioritizing today's records, falling back to yesterday"""
    position_file = base_dir / "data" / "agent_data" / modelname / "position" / "position.jsonl"
    
    # Try today's records first
    max_id_today = -1
    latest_positions_today = {}
    with position_file.open("r") as f:
        for line in f:
            doc = json.loads(line)
            if doc.get("date") == today_date:
                current_id = doc.get("id", -1)
                if current_id > max_id_today:
                    max_id_today = current_id
                    latest_positions_today = doc.get("positions", {})
    
    if max_id_today >= 0:
        return latest_positions_today, max_id_today
    
    # Fall back to yesterday's last record
    prev_date = get_yesterday_date(today_date)
    # ... (similar logic for previous day)
```

---

### **[`prompts/agent_prompt.py`]** - AI System Prompts
**Lines:** 1-92  
**Purpose:** Generate dynamic system prompts for trading agents

**Key Constants:**
- `all_nasdaq_100_symbols` - List of 100 stock symbols
- `STOP_SIGNAL = "<FINISH_SIGNAL>"` - Trading completion signal

**Key Functions:**
- `get_agent_system_prompt(today_date, signature)` - Build system prompt with market data

**Dependencies:**
- Imports: `tools.price_tools`, `tools.general_tools`

**Dependents:**
- Used by: `base_agent.py` (in `run_trading_session`)

**Code Example:**
```python
agent_system_prompt = """
You are a stock fundamental analysis trading assistant.

Your goals are:
- Think and reason by calling available tools.
- You need to think about the prices of various stocks and their returns.
- Your long-term goal is to maximize returns through this portfolio.
- Before making decisions, gather as much information as possible through search tools.

Today's date: {date}

Yesterday's closing positions:
{positions}

Yesterday's closing prices:
{yesterday_close_price}

Today's buying prices:
{today_buy_price}

When you think your task is complete, output {STOP_SIGNAL}
"""

def get_agent_system_prompt(today_date: str, signature: str) -> str:
    """Generate system prompt with current market data"""
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
```

---

### **[`configs/default_config.json`]** - Configuration File
**Lines:** 1-52  
**Purpose:** Define trading competition parameters and model roster

**Key Sections:**
```json
{
  "agent_type": "BaseAgent",
  "date_range": {
    "init_date": "2025-10-01",
    "end_date": "2025-10-21"
  },
  "models": [
    {
      "name": "gpt-5",
      "basemodel": "openai/gpt-5",
      "signature": "gpt-5",
      "enabled": true
    },
    {
      "name": "claude-3.7-sonnet",
      "basemodel": "anthropic/claude-3.7-sonnet",
      "signature": "claude-3.7-sonnet",
      "enabled": false
    }
    // ... more models
  ],
  "agent_config": {
    "max_steps": 30,
    "max_retries": 3,
    "base_delay": 1.0,
    "initial_cash": 10000.0
  },
  "log_config": {
    "log_path": "./data/agent_data"
  }
}
```

**Dependencies:**
- None (static configuration)

**Dependents:**
- Read by: `main.py` (via `load_config()`)

---

## 5. DATA FLOW

### Complete Data Flow Diagram:

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. INITIALIZATION PHASE                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  main.py loads config → Validates date range → Starts MCP       │
│  services → Creates BaseAgent instances → Registers agents      │
│  (creates initial position.jsonl with $10,000 CASH)             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. TRADING SESSION LOOP (Per Trading Day)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────┐            │
│  │ A. System Prompt Generation                     │            │
│  │  - Read yesterday's final position              │            │
│  │  - Read yesterday's close prices                │            │
│  │  - Read today's open prices                     │            │
│  │  - Calculate yesterday's profit                 │            │
│  │  - Inject all data into system prompt           │            │
│  └─────────────────────────────────────────────────┘            │
│                      │                                           │
│                      ▼                                           │
│  ┌─────────────────────────────────────────────────┐            │
│  │ B. Agent Reasoning Loop (Max 30 steps)          │            │
│  │                                                  │            │
│  │  User Query: "Analyze and update positions"     │            │
│  │       │                                          │            │
│  │       ▼                                          │            │
│  │  AI Model (GPT-5/Claude/etc)                    │            │
│  │       │                                          │            │
│  │       ├─► Tool Call: get_information()          │            │
│  │       │   └─► Jina Search → Web content         │            │
│  │       │                                          │            │
│  │       ├─► Tool Call: get_price_local()          │            │
│  │       │   └─► merged.jsonl → OHLCV data         │            │
│  │       │                                          │            │
│  │       ├─► Tool Call: add() / multiply()         │            │
│  │       │   └─► Math calculations                 │            │
│  │       │                                          │            │
│  │       ├─► Tool Call: buy() or sell()            │            │
│  │       │   └─► Update position.jsonl             │            │
│  │       │                                          │            │
│  │       └─► Output: <FINISH_SIGNAL>               │            │
│  │                                                  │            │
│  └─────────────────────────────────────────────────┘            │
│                      │                                           │
│                      ▼                                           │
│  ┌─────────────────────────────────────────────────┐            │
│  │ C. Logging & Position Update                    │            │
│  │  - All messages logged to log.jsonl             │            │
│  │  - Tool calls logged                            │            │
│  │  - Position changes written to position.jsonl   │            │
│  │  - IF_TRADE flag updated                        │            │
│  └─────────────────────────────────────────────────┘            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. RESULT AGGREGATION                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Position files read → Calculate portfolio values →             │
│  Compute returns → Generate performance metrics →               │
│  Update live dashboard (docs/index.html)                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Entry Points:
1. **Historical Price Data**: `data/merged.jsonl` (NASDAQ 100 OHLCV from Alpha Vantage)
2. **Configuration**: `configs/default_config.json` (model settings, date range)
3. **Environment Variables**: `.env` (API keys, ports)
4. **Runtime State**: `.runtime_env.json` (TODAY_DATE, SIGNATURE, IF_TRADE)

### Data Processing:
1. **Price Queries**: merged.jsonl → `get_price_local()` → AI agent
2. **Web Search**: Jina AI API → `get_information()` → filtered results → AI agent
3. **Trading Decisions**: AI reasoning → `buy()`/`sell()` → position.jsonl
4. **State Management**: runtime_env.json ↔ `get_config_value()`/`write_config_value()`

### Data Persistence:
1. **Position History**: `data/agent_data/{signature}/position/position.jsonl` (append-only)
2. **Trading Logs**: `data/agent_data/{signature}/log/{date}/log.jsonl` (timestamped)
3. **Runtime State**: `.runtime_env.json` (current date, signature, trade flags)

### Data Exit Points:
1. **Position Files**: Read by performance analysis scripts
2. **Log Files**: Used for debugging and audit trails
3. **Live Dashboard**: `docs/index.html` displays real-time results
4. **Console Output**: Status updates and error messages

---

## 6. EXTERNAL DEPENDENCIES

### Python Packages (requirements.txt):
```
langchain==1.0.2              # AI agent framework
langchain-openai==1.0.1       # OpenAI model integration
langchain-mcp-adapters>=0.1.0 # MCP client for LangChain
fastmcp==2.12.5               # MCP server framework
```

### Additional Runtime Dependencies:
- `python-dotenv` - Environment variable management
- `requests` - HTTP client for Jina AI
- `asyncio` - Async runtime for agents
- `json` / `pathlib` - Standard library utilities

### External APIs:
1. **OpenAI API** (via OpenRouter or direct):
   - Purpose: LLM inference for agents
   - Models: GPT-5, GPT-4o, etc.
   - ENV: `OPENAI_API_BASE`, `OPENAI_API_KEY`

2. **Anthropic API** (via OpenRouter):
   - Purpose: Claude model inference
   - Models: Claude-3.7-Sonnet
   - ENV: `OPENAI_API_BASE` (OpenRouter), `OPENAI_API_KEY`

3. **Jina AI**:
   - Purpose: Web search and content scraping
   - Endpoints: `s.jina.ai` (search), `r.jina.ai` (reader)
   - ENV: `JINA_API_KEY`

4. **Alpha Vantage** (data preparation phase):
   - Purpose: Historical stock price data
   - ENV: `ALPHAADVANTAGE_API_KEY`
   - Note: Data pre-fetched, not used during trading

### Service Dependencies:
- 4 MCP servers must be running on localhost:
  - Math: Port 8000
  - Search: Port 8001
  - Trade: Port 8002
  - Price: Port 8003

---

## 7. DATABASE SCHEMA

**Storage Format:** JSONL (JSON Lines) - Append-only files

### Position File Schema (`position.jsonl`)
**Location:** `data/agent_data/{signature}/position/position.jsonl`

**Record Format:**
```json
{
  "date": "2025-10-20",
  "id": 5,
  "this_action": {
    "action": "buy" | "sell" | "no_trade",
    "symbol": "AAPL",
    "amount": 10
  },
  "positions": {
    "NVDA": 15,
    "MSFT": 0,
    "AAPL": 10,
    "GOOG": 5,
    "CASH": 8234.50,
    // ... (all 100 NASDAQ symbols + CASH)
  }
}
```

**Fields:**
- `date`: Trading date (YYYY-MM-DD)
- `id`: Sequential action ID (increments per action)
- `this_action`: Details of this trade
  - `action`: "buy", "sell", or "no_trade"
  - `symbol`: Stock ticker (only for buy/sell)
  - `amount`: Number of shares (only for buy/sell)
- `positions`: Complete portfolio snapshot
  - Keys: Stock symbols (100) + "CASH"
  - Values: Share counts (stocks) or USD (CASH)

### Log File Schema (`log.jsonl`)
**Location:** `data/agent_data/{signature}/log/{date}/log.jsonl`

**Record Format:**
```json
{
  "timestamp": "2025-10-20T14:23:45.123456",
  "signature": "gpt-5",
  "new_messages": [
    {
      "role": "assistant" | "user",
      "content": "Full message text..."
    }
  ]
}
```

**Fields:**
- `timestamp`: ISO 8601 timestamp
- `signature`: Agent identifier
- `new_messages`: Array of conversation messages
  - `role`: "assistant" (AI), "user" (tool results)
  - `content`: Message text or tool output

### Price Data Schema (`merged.jsonl`)
**Location:** `data/merged.jsonl`

**Record Format:**
```json
{
  "Meta Data": {
    "2. Symbol": "AAPL",
    "3. Last Refreshed": "2025-10-20"
  },
  "Time Series (Daily)": {
    "2025-10-20": {
      "1. buy price": "255.8850",
      "2. high": "264.3750",
      "3. low": "255.6300",
      "4. sell price": "262.2400",
      "5. volume": "90483029"
    },
    "2025-10-19": { /* ... */ },
    // ... more dates
  }
}
```

**Fields:**
- `Meta Data`: Stock identifier
  - `2. Symbol`: Ticker symbol
- `Time Series (Daily)`: Historical OHLCV data
  - Date keys (YYYY-MM-DD)
  - `1. buy price`: Opening price (used for buys)
  - `2. high`: Daily high
  - `3. low`: Daily low
  - `4. sell price`: Closing price (used for sells)
  - `5. volume`: Trading volume

**Note:** 
- "buy price" = opening price (agent buys at open)
- "sell price" = closing price (agent sells at close, but instant execution at open price for sell orders)

---

## 8. API ENDPOINTS

**No REST API exposed.** This is a command-line application with internal MCP servers.

### Internal MCP Tool APIs (Localhost Only):

#### **Math Service** (Port 8000)
- **Endpoint:** `http://localhost:8000/mcp`
- **Transport:** Streamable HTTP (MCP protocol)
- **Tools:**
  - `add(a: float, b: float) -> float`
  - `multiply(a: float, b: float) -> float`

#### **Search Service** (Port 8001)
- **Endpoint:** `http://localhost:8001/mcp`
- **Transport:** Streamable HTTP (MCP protocol)
- **Tools:**
  - `get_information(query: str) -> str`
  - Returns: Web content with URL, title, description, publish time, content (1000 chars)

#### **Trade Service** (Port 8002)
- **Endpoint:** `http://localhost:8002/mcp`
- **Transport:** Streamable HTTP (MCP protocol)
- **Tools:**
  - `buy(symbol: str, amount: int) -> Dict[str, Any]`
    - Success: Returns new position dictionary
    - Failure: Returns `{"error": "message"}`
  - `sell(symbol: str, amount: int) -> Dict[str, Any]`
    - Success: Returns new position dictionary
    - Failure: Returns `{"error": "message"}`

#### **Price Service** (Port 8003)
- **Endpoint:** `http://localhost:8003/mcp`
- **Transport:** Streamable HTTP (MCP protocol)
- **Tools:**
  - `get_price_local(symbol: str, date: str) -> Dict[str, Any]`
    - Success: Returns `{symbol, date, ohlcv: {open, high, low, close, volume}}`
    - Failure: Returns `{"error": "message"}`

**Access Control:** None (localhost only, trusted environment)

---

## 9. CONFIGURATION

### Environment Variables (`.env`)
```bash
# AI Model Configuration
OPENAI_API_BASE=""          # OpenAI/OpenRouter API base URL
OPENAI_API_KEY=""           # API key for LLM inference

# Data Sources
ALPHAADVANTAGE_API_KEY=""   # Alpha Vantage (data prep only)
JINA_API_KEY=""             # Jina AI search/scrape

# MCP Service Ports
MATH_HTTP_PORT=8000
SEARCH_HTTP_PORT=8001
TRADE_HTTP_PORT=8002
GETPRICE_HTTP_PORT=8003

# Agent Configuration
AGENT_MAX_STEP=30           # Max reasoning steps per day

# Runtime State File
RUNTIME_ENV_PATH=""         # Path to .runtime_env.json
```

### Runtime Configuration (`.runtime_env.json`)
**Dynamically updated during execution:**
```json
{
  "SIGNATURE": "gpt-5",
  "TODAY_DATE": "2025-10-20",
  "IF_TRADE": false
}
```

**Fields:**
- `SIGNATURE`: Current agent's model signature
- `TODAY_DATE`: Current simulation date
- `IF_TRADE`: Boolean flag (true if trades executed today)

### Model Configuration (`configs/default_config.json`)
**See Section 4 - Key Files for full schema**

**Key Parameters:**
- `agent_type`: "BaseAgent" (extensible for custom agents)
- `date_range`: Start and end dates for backtest
- `models`: Array of AI models
  - `name`: Display name
  - `basemodel`: Model identifier (e.g., "openai/gpt-5")
  - `signature`: Unique identifier for file storage
  - `enabled`: Boolean toggle
  - `openai_base_url` / `openai_api_key`: Optional per-model overrides
- `agent_config`:
  - `max_steps`: 30 (max reasoning loops per day)
  - `max_retries`: 3 (retry failed operations)
  - `base_delay`: 1.0 (seconds between retries)
  - `initial_cash`: 10000.0 (starting capital USD)
- `log_config`:
  - `log_path`: "./data/agent_data" (base path for logs)

---

## 10. BUILD AND DEPLOYMENT

### Installation Steps:

```bash
# 1. Clone repository
git clone https://github.com/HKUDS/AI-Trader.git
cd AI-Trader

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 4. Set runtime environment path
export RUNTIME_ENV_PATH="$(pwd)/.runtime_env.json"
# Or add to .env: RUNTIME_ENV_PATH="/absolute/path/.runtime_env.json"

# 5. Prepare data (one-time setup)
cd data
python get_daily_price.py    # Fetch NASDAQ 100 prices
python merge_jsonl.py         # Merge into merged.jsonl
cd ..

# 6. Start MCP services
cd agent_tools
python start_mcp_services.py
# Keep this terminal running

# 7. Run trading agents (in new terminal)
cd ..
python main.py                # Uses default config
# Or: python main.py configs/custom_config.json
```

### Testing:
```bash
# Test individual MCP tools (optional)
cd agent_tools
python tool_math.py           # Test math service
python tool_trade.py          # Test trading service
python tool_get_price_local.py  # Test price service
python tool_jina_search.py    # Test search service

# Test price utilities
cd tools
python price_tools.py         # Requires SIGNATURE & TODAY_DATE in runtime_env.json
```

### Deployment (Production):
**This is a research/backtesting tool - NOT production trading system**

**For live dashboard hosting:**
```bash
# Serve docs folder for live performance viewer
cd docs
python3 -m http.server 8000
# Visit http://localhost:8000
```

**For continuous backtesting:**
1. Run MCP services as systemd services (Linux) or background jobs
2. Schedule `main.py` via cron or task scheduler
3. Configure monitoring/alerting for service health
4. Set up log rotation for growing JSONL files

---

## 11. KEY INSIGHTS & ARCHITECTURE NOTES

### Critical Design Decisions:

1. **MCP Protocol Choice:**
   - **Why:** Standardized tool interface, language-agnostic, supports multiple transports
   - **Benefit:** AI agents can use any MCP-compatible tool without custom integration
   - **Alternative Rejected:** Direct function calls (less modular, harder to extend)

2. **JSONL Storage:**
   - **Why:** Append-only, human-readable, easy to parse line-by-line
   - **Benefit:** Audit trail, time-series analysis, no database overhead
   - **Alternative Rejected:** SQLite (overkill for simple key-value logs)

3. **Historical Replay with Date Filtering:**
   - **Why:** Prevent look-ahead bias in AI trading decisions
   - **Implementation:** All tools check `TODAY_DATE` from runtime_env.json
   - **Critical for:** Scientific validity of AI trading experiments

4. **Stateless MCP Tools:**
   - **Why:** Avoid shared state between concurrent agents
   - **Benefit:** Multiple agents can run in parallel without conflicts
   - **Implementation:** All state stored in position.jsonl, indexed by signature

5. **LangChain Agent Framework:**
   - **Why:** Mature tool-calling support, multiple LLM integrations
   - **Benefit:** Easy to swap models, built-in retry logic
   - **Alternative Rejected:** Custom agent loop (reinventing the wheel)

### Performance Characteristics:

- **Concurrency:** Supports parallel agent execution (one agent per model)
- **Scalability:** Limited by MCP service ports (currently 4 services)
- **Bottlenecks:**
  - Web search rate limits (Jina AI)
  - LLM API latency (OpenAI/Anthropic)
  - File I/O for large position.jsonl files
- **Resource Usage:**
  - Memory: ~500MB per agent (LangChain + model client)
  - Disk: ~1MB per trading day per agent (logs)
  - Network: ~10-50 requests per agent per day (search + LLM)

### Security Considerations:

- **API Keys:** Stored in `.env` (not version controlled)
- **No Authentication:** MCP services on localhost only (trusted environment)
- **Data Privacy:** No PII collected, only stock trading data
- **Risk:** Agents could execute arbitrary trades (use with test accounts only)

### Extension Points:

1. **New Agent Types:**
   - Add to `AGENT_REGISTRY` in `main.py`
   - Implement class inheriting from `BaseAgent`
   - Override `run_trading_session()` for custom logic

2. **New MCP Tools:**
   - Create new `tool_*.py` file
   - Define `@mcp.tool()` decorated functions
   - Add to `_get_default_mcp_config()` in `BaseAgent`
   - Start service in `start_mcp_services.py`

3. **Custom Data Sources:**
   - Implement new price tool (e.g., `tool_get_price_crypto.py`)
   - Modify `merged.jsonl` schema as needed
   - Update `price_tools.py` parsers

4. **Advanced Strategies:**
   - Extend `agent_system_prompt` in `prompts/agent_prompt.py`
   - Add new tools for technical analysis (e.g., moving averages)
   - Implement portfolio optimization tools

---

## 12. KNOWN LIMITATIONS & FUTURE WORK

### Current Limitations:

1. **Single-Asset Execution:**
   - Trades execute at daily open price only (no intraday trading)
   - No support for limit orders or stop-losses

2. **No Transaction Costs:**
   - Trading is free (unrealistic for production)
   - No slippage modeling

3. **Limited Market Coverage:**
   - NASDAQ 100 only (no international markets)
   - No support for options, futures, or cryptocurrencies

4. **Date Filtering Reliability:**
   - Jina AI date parsing is heuristic-based
   - May miss some future-dated content

5. **No Real-Time Data:**
   - Relies on pre-fetched historical data
   - Not suitable for live trading

### Planned Improvements (from README):

- ⏰ **Hourly Trading Support** - Hour-level precision trading
- 🚀 **Service Deployment** - Production-ready deployment + parallel execution
- 🎨 **Enhanced Dashboard** - Detailed trading log visualization
- 🇨🇳 **A-Share Support** - Chinese stock market integration
- ₿ **Cryptocurrency** - Digital currency trading
- 📈 **Technical Analysis Tools** - RSI, MACD, Bollinger Bands
- 🔍 **Advanced Replay** - Minute-level time precision

---

## 13. TROUBLESHOOTING GUIDE

### Common Issues:

#### **Issue 1: MCP Services Not Starting**
**Symptoms:**
```
❌ Failed to start Math service: [Errno 48] Address already in use
```

**Solution:**
```bash
# Check if ports are in use
netstat -an | grep "8000\|8001\|8002\|8003"

# Kill existing processes
lsof -ti:8000 | xargs kill -9
lsof -ti:8001 | xargs kill -9
lsof -ti:8002 | xargs kill -9
lsof -ti:8003 | xargs kill -9

# Restart services
python agent_tools/start_mcp_services.py
```

**Prevention:** Always stop services cleanly with Ctrl+C

---

#### **Issue 2: "SIGNATURE environment variable is not set"**
**Symptoms:**
```
ValueError: SIGNATURE environment variable is not set
```

**Root Cause:** `RUNTIME_ENV_PATH` not configured or `.runtime_env.json` missing

**Solution:**
```bash
# Create runtime env file
echo '{"SIGNATURE": "", "TODAY_DATE": "", "IF_TRADE": false}' > .runtime_env.json

# Set path in .env
echo 'RUNTIME_ENV_PATH="/absolute/path/to/.runtime_env.json"' >> .env

# Or export temporarily
export RUNTIME_ENV_PATH="$(pwd)/.runtime_env.json"
```

---

#### **Issue 3: "Data file not found: merged.jsonl"**
**Symptoms:**
```
{"error": "Data file not found: /path/to/data/merged.jsonl"}
```

**Root Cause:** Price data not prepared

**Solution:**
```bash
cd data
python get_daily_price.py     # Fetch data (requires ALPHAADVANTAGE_API_KEY)
python merge_jsonl.py          # Merge into merged.jsonl
cd ..
```

**Alternative:** Download pre-prepared `merged.jsonl` from project releases

---

#### **Issue 4: Agent Stuck in Loop (Doesn't Output FINISH_SIGNAL)**
**Symptoms:**
```
🔄 Step 30/30
⚠️ Max steps reached without completion
```

**Root Cause:** AI model not converging on decision

**Debugging:**
```bash
# Check logs for repeated patterns
cat data/agent_data/{signature}/log/{date}/log.jsonl | jq '.new_messages[].content'

# Reduce max_steps for testing
# Edit configs/default_config.json:
"agent_config": {
  "max_steps": 10  # Temporarily reduce
}
```

**Solutions:**
- Adjust system prompt for clearer instructions
- Use more capable model (GPT-5 > GPT-4o)
- Add examples of successful completions to prompt

---

#### **Issue 5: Jina Search Returns Empty Results**
**Symptoms:**
```
⚠️ Search query 'AAPL news' found no results.
```

**Root Cause:** Future-date filtering too aggressive OR Jina API issue

**Debugging:**
```bash
# Test Jina API directly
curl -H "Authorization: Bearer YOUR_JINA_KEY" \
     "https://s.jina.ai/?q=AAPL+news&n=5"

# Check TODAY_DATE in runtime_env.json
cat .runtime_env.json | jq '.TODAY_DATE'
```

**Solutions:**
- Verify `JINA_API_KEY` is valid
- Check if `TODAY_DATE` is set correctly
- Temporarily disable date filtering (comment out lines 192-199 in `tool_jina_search.py`)

---

## 14. SETUP & DEPLOYMENT (Windows)

### Quick Start Scripts Created

**NEW FILES (Created 2025-10-29):**
- **`start_services.ps1`** - One-click MCP service startup
- **`run_trading.ps1`** - One-click trading system execution with environment cleanup
- **`SETUP_GUIDE.md`** - Complete setup guide with all bug fixes documented

### Critical Setup Notes (Lessons from Session 2025-10-29):

1. **`.env` File Format:**
   - ❌ **DON'T use quotes:** `OPENAI_API_KEY="sk-..."`
   - ✅ **DO omit quotes:** `OPENAI_API_KEY=sk-...`
   - ❌ **DON'T use backslashes:** `C:\Users\...\aitrtader\`
   - ✅ **DO use forward slashes:** `C:/Users/.../aitrtader/`
   - **Reason:** python-dotenv doesn't need quotes, backslashes create escape sequences

2. **Windows Environment Variables:**
   - Windows env vars **override** `.env` files
   - Must remove before running: `Remove-Item Env:\OPENAI_API_KEY`
   - Check with: `Get-ChildItem Env: | Where-Object { $_.Name -like "*OPENAI*" }`
   - Virtual environments may restore them - remove AFTER venv activation

3. **OpenRouter Requirements:**
   - Account must have credits ($5+ recommended)
   - GPT-5 exists but may require special access
   - GPT-4o is proven stable and fast
   - Free models available: `google/gemini-2.0-flash-exp:free`

4. **Autonomous Operation:**
   - System prompt must explicitly state "YOU ARE ALONE, NO USER EXISTS"
   - Weak phrasing causes AI to ask rhetorical questions
   - Must emphasize autonomous behavior multiple times
   - Updated prompt resolves this (see BUG-003)

### Working Command Sequence:

```powershell
# Terminal 1 - Services (keep running)
cd C:\Users\User\Desktop\CS1027\aitrtader\agent_tools
python start_mcp_services.py

# Terminal 2 - Trading
cd C:\Users\User\Desktop\CS1027\aitrtader
.\venv\Scripts\activate
Remove-Item Env:\OPENAI_API_KEY -ErrorAction SilentlyContinue
Remove-Item Env:\OPENAI_API_BASE -ErrorAction SilentlyContinue
$env:PYTHONIOENCODING="utf-8"
python main.py
```

**Or use helper scripts:**
```powershell
# Terminal 1
.\start_services.ps1

# Terminal 2
.\run_trading.ps1
```

---

## 15. CONTACT & SUPPORT

**Project Repository:** https://github.com/HKUDS/AI-Trader  
**Documentation:** 
- README.md (English) - User-facing docs
- README_CN.md (Chinese) - Chinese docs
- SETUP_GUIDE.md - Windows setup with bug fixes
- docs/overview.md - Complete codebase architecture
- docs/bugs-and-fixes.md - All bugs and solutions
- docs/wip.md - Work in progress tracking

**Live Dashboard:** https://hkuds.github.io/AI-Trader/

**Maintainers:** HKUDS Research Team  
**License:** MIT License

---

**END OF OVERVIEW DOCUMENTATION**

*This document was generated through comprehensive codebase analysis (2025-10-29). Updated with session findings including 3 bug fixes and successful system deployment.*

