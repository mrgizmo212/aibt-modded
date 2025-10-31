"""
Pydantic Models for API Request/Response Validation
All data models for the AI-Trader API
"""

from pydantic import BaseModel, EmailStr, Field
from typing import List, Dict, Optional, Any
from datetime import datetime, date


# ============================================================================
# AUTH MODELS
# ============================================================================

class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]


class UserProfile(BaseModel):
    id: str
    email: str
    role: str
    display_name: Optional[str]
    avatar_url: Optional[str]
    created_at: datetime


# ============================================================================
# MODEL MODELS
# ============================================================================

class ModelInfo(BaseModel):
    id: int
    user_id: str
    name: str
    signature: str
    description: Optional[str] = None
    is_active: Optional[bool] = True
    allowed_tickers: Optional[List[str]] = None
    default_ai_model: Optional[str] = None
    model_parameters: Optional[Dict[str, Any]] = None
    custom_rules: Optional[str] = None
    custom_instructions: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class ModelCreate(BaseModel):
    name: str
    description: Optional[str] = None
    initial_cash: float = 10000.0
    allowed_tickers: Optional[List[str]] = None
    default_ai_model: Optional[str] = None
    model_parameters: Optional[Dict[str, Any]] = None
    custom_rules: Optional[str] = None
    custom_instructions: Optional[str] = None


class ModelListResponse(BaseModel):
    models: List[ModelInfo]
    total_models: int


# ============================================================================
# POSITION MODELS
# ============================================================================

class Position(BaseModel):
    id: int
    model_id: int
    date: date
    action_id: int
    action_type: Optional[str]
    symbol: Optional[str]
    amount: Optional[int]
    positions: Dict[str, float]
    cash: Optional[float]
    created_at: datetime


class PositionHistoryResponse(BaseModel):
    model_id: int
    model_name: str
    positions: List[Position]
    total_records: int


class LatestPositionResponse(BaseModel):
    model_id: int
    model_name: str
    date: str
    positions: Dict[str, float]
    cash: float
    stocks_value: float
    total_value: float


# ============================================================================
# LOG MODELS
# ============================================================================

class LogEntry(BaseModel):
    id: int
    model_id: int
    date: date
    timestamp: datetime
    signature: str
    messages: Any  # Can be Dict or List depending on log format
    created_at: datetime


class LogResponse(BaseModel):
    model_id: int
    model_name: str
    date: str
    logs: List[LogEntry]
    total_entries: int


# ============================================================================
# PERFORMANCE MODELS
# ============================================================================

class PerformanceMetrics(BaseModel):
    sharpe_ratio: float
    max_drawdown: float
    max_drawdown_start: Optional[date]
    max_drawdown_end: Optional[date]
    cumulative_return: float
    annualized_return: float
    volatility: float
    win_rate: float
    profit_loss_ratio: float
    total_trading_days: int
    initial_value: float
    final_value: float


class PerformanceResponse(BaseModel):
    model_id: int
    model_name: str
    start_date: date
    end_date: date
    metrics: PerformanceMetrics
    portfolio_values: Dict[str, float]  # {date: value}


# ============================================================================
# STOCK PRICE MODELS
# ============================================================================

class StockPrice(BaseModel):
    id: int
    symbol: str
    date: date
    open: float
    high: float
    low: float
    close: float
    volume: int
    created_at: datetime


class StockPriceListResponse(BaseModel):
    prices: List[StockPrice]
    total_records: int


# ============================================================================
# ADMIN MODELS
# ============================================================================

class UserListResponse(BaseModel):
    """Admin-only: List of all users"""
    users: List[UserProfile]
    total_users: int


class SystemStatsResponse(BaseModel):
    """Admin-only: System statistics"""
    total_users: int
    total_models: int
    total_positions: int
    total_logs: int
    active_models: int
    admin_count: int
    user_count: int


# ============================================================================
# LEADERBOARD MODELS (Admin-only in private mode)
# ============================================================================

class LeaderboardEntry(BaseModel):
    rank: int
    model_id: int
    model_name: str
    user_id: str
    user_email: str
    cumulative_return: float
    sharpe_ratio: float
    max_drawdown: float
    final_value: float
    trading_days: int


class LeaderboardResponse(BaseModel):
    """Admin-only: Compare all models across all users"""
    leaderboard: List[LeaderboardEntry]
    total_models: int


# ============================================================================
# TRADING CONTROL MODELS
# ============================================================================

class StartTradingRequest(BaseModel):
    base_model: str
    start_date: str
    end_date: str


class IntradayTradingRequest(BaseModel):
    base_model: str
    symbol: str  # Single stock for intraday
    date: str  # Specific date
    session: str = "regular"  # 'pre', 'regular', 'after'


# ============================================================================
# ERROR MODELS
# ============================================================================

class ErrorResponse(BaseModel):
    detail: str
    error_code: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)


# ============================================================================
# MIGRATION MODELS
# ============================================================================

class MigrationStatus(BaseModel):
    """Status of data migration from JSONL to PostgreSQL"""
    models_migrated: int
    positions_migrated: int
    logs_migrated: int
    stock_prices_migrated: int
    errors: List[str]
    status: str  # 'success', 'partial', 'failed'

