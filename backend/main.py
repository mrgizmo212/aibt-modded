"""
AI-Trader FastAPI Backend
Main application with authentication and private data access
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from supabase import create_client
from typing import List, Dict, Any, Optional
from datetime import datetime
from contextlib import asynccontextmanager
import asyncio
import os
import json

from config import settings
from auth import (
    get_current_user,
    get_current_admin,
    require_auth,
    require_admin,
    create_user_profile,
    check_approved_email_for_signup
)
from models import (
    SignupRequest,
    LoginRequest,
    AuthResponse,
    UserProfile,
    ModelInfo,
    ModelCreate,
    ModelListResponse,
    PositionHistoryResponse,
    LatestPositionResponse,
    LogResponse,
    PerformanceResponse,
    LeaderboardResponse,
    UserListResponse,
    SystemStatsResponse,
    StartTradingRequest,
    DailyBacktestRequest,
    IntradayTradingRequest,
    ErrorResponse,
    ChatRequest,
    ChatResponse,
    RunInfo
)
from pagination import create_pagination_params, PaginationParams
from errors import NotFoundError, AuthorizationError, log_error
import services
from trading.agent_manager import agent_manager
from trading.mcp_manager import mcp_manager
from streaming import event_stream
from utils.redis_client import redis_client

# ============================================================================
# APP INITIALIZATION WITH LIFESPAN
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler (replaces deprecated on_event)"""
    # Startup
    print("🚀 AI-Trader API Starting...")
    print(f"📊 Environment: {settings.NODE_ENV}")
    print(f"🔐 Auth: Enabled (Supabase)")
    print(f"🗄️  Database: PostgreSQL (Supabase)")
    print(f"🌐 CORS: {settings.ALLOWED_ORIGINS}")
    
    # Start MCP services automatically
    print("🔧 Starting MCP services...")
    mcp_startup_result = await mcp_manager.start_all_services()
    if mcp_startup_result.get("status") == "started":
        print("✅ MCP services ready")
    else:
        print("⚠️  MCP services failed to start - AI trading may not work")
    
    print(f"✅ API Ready on port {settings.PORT}")
    
    yield
    
    # Shutdown
    print("🔧 Stopping MCP services...")
    try:
        await asyncio.wait_for(mcp_manager.stop_all_services(), timeout=3.0)
        print("✅ MCP services stopped")
    except asyncio.TimeoutError:
        print("⚠️  MCP services didn't stop gracefully - force killing")
    
    # Close Redis client connection pool
    print("🔧 Closing Redis connection pool...")
    try:
        await redis_client.close()
        print("✅ Redis connection pool closed")
    except Exception as e:
        print(f"⚠️  Redis cleanup error: {e}")
    
    print("👋 AI-Trader API Shutting Down...")


app = FastAPI(
    title="AI-Trader API",
    description="REST API for AI Trading Platform with Multi-User Auth",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase client
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)


# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.get("/")
def root():
    """API health check"""
    return {
        "message": "AI-Trader API v2.0",
        "status": "operational",
        "environment": settings.NODE_ENV,
        "auth_enabled": True,
        "database": "Supabase PostgreSQL"
    }


@app.get("/api/health")
def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "supabase_connected": True,
        "timestamp": str(datetime.now())
    }


@app.get("/api/model-config")
async def get_model_configuration(model_id: str):
    """
    Get recommended configuration for a specific AI model
    Returns default parameters and model type information
    
    Query param: ?model_id=openai/gpt-5
    """
    from utils.model_config import get_default_params_for_model, get_model_type, PARAMETER_TEMPLATES
    
    model_type = get_model_type(model_id)
    default_params = get_default_params_for_model(model_id)
    template = PARAMETER_TEMPLATES.get(model_type, PARAMETER_TEMPLATES['standard'])
    
    return {
        "model_id": model_id,
        "model_type": model_type,
        "default_parameters": default_params,
        "template": template,
        "supports_temperature": template.get('supports_temperature', True),
        "supports_verbosity": template.get('supports_verbosity', False),
        "supports_reasoning_effort": template.get('supports_reasoning_effort', False)
    }


@app.get("/api/available-models")
async def get_available_models():
    """
    Fetch available AI models from OpenRouter
    Returns list of models with their IDs, names, and capabilities
    """
    try:
        import httpx
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                "https://openrouter.ai/api/v1/models",
                headers={
                    "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                models = data.get("data", [])
                
                # Filter and format models for trading (text generation only)
                filtered_models = []
                for model in models:
                    model_id = model.get("id", "").lower()
                    
                    # Skip image/vision/audio models
                    if any(skip in model_id for skip in ["image", "vision", "vl-", "audio", "whisper", "tts", "dall-e"]):
                        continue
                    
                    # Skip embedding and moderation models
                    if any(skip in model_id for skip in ["embed", "moderation", "search"]):
                        continue
                    
                    # Only include text-generation models suitable for trading
                    if any(include in model_id for include in [
                        "instruct", "gpt", "claude", "gemini", "llama", 
                        "qwen", "deepseek", "mistral", "phi", "gemma",
                        "mixtral", "command", "yi", "falcon", "codex"
                    ]):
                        filtered_models.append({
                            "id": model.get("id"),
                            "name": model.get("name", model.get("id")),
                            "provider": model.get("id", "").split("/")[0] if "/" in model.get("id", "") else "unknown",
                            "context_length": model.get("context_length", 0),
                            "pricing": model.get("pricing", {})
                        })
                
                # Sort models: prioritize popular trading models
                def get_priority(model_id):
                    """Higher number = higher priority"""
                    mid = model_id.lower()
                    # Tier 1: Best for trading
                    if "gpt-5-pro" in mid or "claude-sonnet-4.5" in mid or "gemini-2.5-pro" in mid:
                        return 1000
                    # Tier 2: Excellent
                    if "gpt-5" in mid or "claude-4.5" in mid or "gemini-2.5" in mid:
                        return 900
                    # Tier 3: Very good
                    if "gpt-4o" in mid or "claude-3.5" in mid or "gemini-2" in mid:
                        return 800
                    # Tier 4: Good
                    if "deepseek" in mid or "qwen" in mid or "llama-3.3" in mid:
                        return 700
                    # Default
                    return 500
                
                sorted_models = sorted(filtered_models, key=lambda m: get_priority(m["id"]), reverse=True)
                
                return {
                    "models": sorted_models[:50],  # Limit to 50 most relevant
                    "total": len(filtered_models),
                    "source": "openrouter",
                    "cached": False
                }
            else:
                # Return fallback hardcoded list if API fails
                return {
                    "models": [
                        {"id": "openai/gpt-4o", "name": "GPT-4o", "provider": "openai"},
                        {"id": "openai/gpt-4o-mini", "name": "GPT-4o Mini", "provider": "openai"},
                        {"id": "anthropic/claude-3.5-sonnet", "name": "Claude 3.5 Sonnet", "provider": "anthropic"},
                        {"id": "google/gemini-2.0-flash-exp", "name": "Gemini 2.0 Flash", "provider": "google"},
                    ],
                    "total": 4,
                    "source": "fallback",
                    "cached": True
                }
    except Exception as e:
        print(f"Error fetching models: {e}")
        # Return fallback list on error
        return {
            "models": [
                {"id": "openai/gpt-4o", "name": "GPT-4o", "provider": "openai"},
                {"id": "openai/gpt-4o-mini", "name": "GPT-4o Mini", "provider": "openai"},
                {"id": "anthropic/claude-3.5-sonnet", "name": "Claude 3.5 Sonnet", "provider": "anthropic"},
                {"id": "google/gemini-2.0-flash-exp", "name": "Gemini 2.0 Flash", "provider": "google"},
            ],
            "total": 4,
            "source": "fallback",
            "cached": True,
            "error": str(e)
        }


# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

@app.post("/api/auth/signup", response_model=AuthResponse)
async def signup(request: SignupRequest):
    """
    User signup (whitelist-only)
    Checks approved_users.json before allowing signup
    """
    # Check if email is approved
    role = check_approved_email_for_signup(request.email)
    
    try:
        # Create user in Supabase Auth
        auth_response = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {
                "data": {
                    "role": role  # Store role in user metadata
                }
            }
        })
        
        if auth_response.user is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Signup failed. Email may already be registered."
            )
        
        # Check if session exists (depends on email confirmation settings)
        if auth_response.session:
            access_token = auth_response.session.access_token
        else:
            # No session means email confirmation required
            # Auto-login the user anyway (since we disabled email confirmation)
            login_response = supabase.auth.sign_in_with_password({
                "email": request.email,
                "password": request.password
            })
            
            if login_response.session:
                access_token = login_response.session.access_token
            else:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Signup succeeded but auto-login failed. Please log in manually."
                )
        
        # Profile created automatically by database trigger
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": auth_response.user.id,
                "email": auth_response.user.email,
                "role": role
            }
        }
        
    except Exception as e:
        import traceback
        error_detail = f"Signup error: {str(e)}"
        print(f"❌ Signup error details:")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=error_detail
        )


@app.post("/api/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """User login"""
    try:
        # Authenticate with Supabase
        auth_response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        if auth_response.user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials"
            )
        
        # Get user profile to get role
        profile = await services.get_user_profile(auth_response.user.id)
        role = profile.get("role", "user") if profile else "user"
        
        return {
            "access_token": auth_response.session.access_token,
            "token_type": "bearer",
            "user": {
                "id": auth_response.user.id,
                "email": auth_response.user.email,
                "role": role
            }
        }
        
    except Exception as e:
        # Log actual error for debugging
        print(f"❌ Login failed: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Login failed: {str(e)}"
        )


@app.post("/api/auth/logout")
async def logout(current_user: Dict = Depends(require_auth)):
    """User logout"""
    try:
        supabase.auth.sign_out()
        return {"message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Logout error: {str(e)}"
        )


@app.get("/api/auth/me", response_model=UserProfile)
async def get_me(current_user: Dict = Depends(require_auth)):
    """Get current user profile"""
    profile = await services.get_user_profile(current_user["id"])
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    return profile


# ============================================================================
# USER ENDPOINTS (Private - Own Data Only)
# ============================================================================

@app.get("/api/models", response_model=ModelListResponse)
async def get_my_models(current_user: Dict = Depends(require_auth)):
    """Get current user's AI models"""
    models = await services.get_user_models(current_user["id"])
    
    return {
        "models": models,
        "total_models": len(models)
    }


@app.post("/api/models", response_model=ModelInfo)
async def create_my_model(model_data: ModelCreate, current_user: Dict = Depends(require_auth)):
    """Create new AI model for current user (signature auto-generated from name)"""
    model = await services.create_model(
        user_id=current_user["id"],
        name=model_data.name,
        description=model_data.description,
        initial_cash=model_data.initial_cash,
        allowed_tickers=model_data.allowed_tickers,
        default_ai_model=model_data.default_ai_model,
        model_parameters=model_data.model_parameters,
        custom_rules=model_data.custom_rules,
        custom_instructions=model_data.custom_instructions
    )
    
    if not model:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create model"
        )
    
    return model


@app.put("/api/models/{model_id}", response_model=ModelInfo)
async def update_my_model(model_id: int, model_data: ModelCreate, current_user: Dict = Depends(require_auth)):
    """Update user's AI model"""
    # Verify ownership
    model = await services.get_model_by_id(model_id, current_user["id"])
    
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found or access denied"
        )
    
    updated_model = await services.update_model(
        model_id=model_id,
        user_id=current_user["id"],
        name=model_data.name,
        description=model_data.description,
        allowed_tickers=model_data.allowed_tickers,
        default_ai_model=model_data.default_ai_model,
        model_parameters=model_data.model_parameters,
        custom_rules=model_data.custom_rules,
        custom_instructions=model_data.custom_instructions
    )
    
    if not updated_model:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update model"
        )
    
    return updated_model


@app.delete("/api/models/{model_id}")
async def delete_my_model(model_id: int, current_user: Dict = Depends(require_auth)):
    """Delete user's AI model"""
    # Verify ownership
    model = await services.get_model_by_id(model_id, current_user["id"])
    
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found or access denied"
        )
    
    success = await services.delete_model(model_id, current_user["id"])
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete model"
        )
    
    return {"message": "Model deleted successfully"}


@app.get("/api/models/{model_id}/positions", response_model=PositionHistoryResponse)
async def get_model_positions_endpoint(
    model_id: int,
    current_user: Dict = Depends(require_auth),
    pagination: PaginationParams = Depends(create_pagination_params)
):
    """Get position history for user's model (paginated)"""
    model = await services.get_model_by_id(model_id, current_user["id"])
    
    if not model:
        raise NotFoundError("Model")
    
    # Get all positions (would add pagination to DB query in production)
    positions = await services.get_model_positions(model_id, current_user["id"])
    
    # Apply pagination
    start = pagination.offset
    end = start + pagination.limit
    paginated_positions = positions[start:end]
    
    return {
        "model_id": model_id,
        "model_name": model["signature"],
        "positions": paginated_positions,
        "total_records": len(positions),
        "page": pagination.page,
        "page_size": pagination.page_size
    }


@app.get("/api/models/{model_id}/positions/latest", response_model=LatestPositionResponse)
async def get_latest_position_endpoint(model_id: int, current_user: Dict = Depends(require_auth)):
    """Get latest position for user's model"""
    model = await services.get_model_by_id(model_id, current_user["id"])
    
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found or access denied"
        )
    
    position = await services.get_latest_position(model_id, current_user["id"])
    
    if not position:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No positions found for this model"
        )
    
    positions_data = position.get("positions", {})
    cash = position.get("cash", positions_data.get("CASH", 0.0))
    stocks_value = position.get("stocks_value", 0.0)
    total_value = position.get("total_value", cash)
    
    return {
        "model_id": model_id,
        "model_name": position.get("model_name", model["signature"]),
        "date": str(position["date"]),
        "positions": positions_data,
        "cash": cash,
        "stocks_value": stocks_value,
        "total_value": total_value
    }


@app.get("/api/models/{model_id}/logs", response_model=LogResponse)
async def get_model_logs_endpoint(model_id: int, trade_date: Optional[str] = None, current_user: Dict = Depends(require_auth)):
    """Get trading logs for user's model"""
    model = await services.get_model_by_id(model_id, current_user["id"])
    
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found or access denied"
        )
    
    logs = await services.get_model_logs(model_id, current_user["id"], trade_date)
    
    return {
        "model_id": model_id,
        "model_name": model["signature"],
        "date": trade_date or "all",
        "logs": logs,
        "total_entries": len(logs)
    }


@app.get("/api/models/{model_id}/performance", response_model=PerformanceResponse)
async def get_model_performance_endpoint(model_id: int, current_user: Dict = Depends(require_auth)):
    """Get performance metrics for user's model"""
    model = await services.get_model_by_id(model_id, current_user["id"])
    
    if not model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model not found or access denied"
        )
    
    # Check if cached metrics exist
    cached_metrics = await services.get_model_performance(model_id, current_user["id"])
    
    if cached_metrics:
        # Return cached (validate required fields)
        return {
            "model_id": model_id,
            "model_name": model["signature"],
            "start_date": cached_metrics.get("start_date") or "2025-01-01",
            "end_date": cached_metrics.get("end_date") or "2025-01-01",
            "metrics": {
                **cached_metrics,
                "initial_value": cached_metrics.get("initial_value", model.get("initial_cash", 10000.0)),
                "final_value": cached_metrics.get("final_value", model.get("initial_cash", 10000.0)),
                "max_drawdown_start": cached_metrics.get("max_drawdown_start") or None,
                "max_drawdown_end": cached_metrics.get("max_drawdown_end") or None
            },
            "portfolio_values": {}
        }
    else:
        # Calculate fresh metrics
        metrics = await services.calculate_and_cache_performance(model_id, model["signature"])
        
        # Handle no trading history case
        if metrics.get("error") or not metrics.get("start_date"):
            return {
                "model_id": model_id,
                "model_name": model["signature"],
                "start_date": "2025-01-01",
                "end_date": "2025-01-01",
                "metrics": {
                    "sharpe_ratio": 0.0,
                    "max_drawdown": 0.0,
                    "max_drawdown_start": None,
                    "max_drawdown_end": None,
                    "cumulative_return": 0.0,
                    "annualized_return": 0.0,
                    "volatility": 0.0,
                    "win_rate": 0.0,
                    "profit_loss_ratio": 0.0,
                    "total_trading_days": 0,
                    "initial_value": model.get("initial_cash", 10000.0),
                    "final_value": model.get("initial_cash", 10000.0)
                },
                "portfolio_values": {}
            }
        
        return {
            "model_id": model_id,
            "model_name": model["signature"],
            "start_date": metrics.get("start_date", "2025-01-01"),
            "end_date": metrics.get("end_date", "2025-01-01"),
            "metrics": {
                **metrics,
                "initial_value": metrics.get("initial_value", model.get("initial_cash", 10000.0)),
                "final_value": metrics.get("final_value", model.get("initial_cash", 10000.0)),
                "max_drawdown_start": metrics.get("max_drawdown_start") or None,
                "max_drawdown_end": metrics.get("max_drawdown_end") or None
            },
            "portfolio_values": metrics.get("portfolio_values", {})
        }


# ============================================================================
# ADMIN ENDPOINTS (Admin Only)
# ============================================================================

@app.get("/api/admin/users", response_model=UserListResponse)
async def get_all_users_admin(current_user: Dict = Depends(require_admin)):
    """Admin only: Get all users"""
    users = await services.get_all_users()
    
    return {
        "users": users,
        "total_users": len(users)
    }


@app.get("/api/admin/models", response_model=ModelListResponse)
async def get_all_models_admin(current_user: Dict = Depends(require_admin)):
    """Admin only: Get all models across all users"""
    models = await services.get_all_models_admin()
    
    return {
        "models": models,
        "total_models": len(models)
    }


@app.get("/api/admin/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard_admin(current_user: Dict = Depends(require_admin)):
    """Admin only: Get leaderboard of all models"""
    leaderboard = await services.get_admin_leaderboard()
    
    return {
        "leaderboard": leaderboard,
        "total_models": len(leaderboard)
    }


# ============================================================================
# GLOBAL SETTINGS ENDPOINTS (Admin Only)
# ============================================================================

@app.get("/api/admin/global-settings")
async def get_all_global_settings(current_user: Dict = Depends(require_admin)):
    """Admin only: Get all global settings"""
    from utils.settings_manager import get_settings_manager
    
    supabase = services.get_supabase()
    manager = get_settings_manager(supabase)
    settings = manager.get_all_global_settings()
    
    return {
        "settings": settings,
        "total": len(settings)
    }


@app.get("/api/admin/global-settings/{setting_key}")
async def get_global_setting(setting_key: str, current_user: Dict = Depends(require_admin)):
    """Admin only: Get specific global setting"""
    from utils.settings_manager import get_settings_manager
    
    supabase = services.get_supabase()
    manager = get_settings_manager(supabase)
    setting = manager.get_global_setting(setting_key)
    
    if not setting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Setting '{setting_key}' not found"
        )
    
    return {
        "setting_key": setting_key,
        "setting_value": setting
    }


@app.put("/api/admin/global-settings/{setting_key}")
async def update_global_setting(
    setting_key: str,
    data: Dict[str, Any],
    current_user: Dict = Depends(require_admin)
):
    """Admin only: Update global setting"""
    from utils.settings_manager import get_settings_manager
    
    supabase = services.get_supabase()
    manager = get_settings_manager(supabase)
    
    success = manager.set_global_setting(
        setting_key,
        data.get("setting_value"),
        data.get("description", "")
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update setting"
        )
    
    return {
        "message": "Setting updated successfully",
        "setting_key": setting_key
    }


@app.get("/api/admin/stats", response_model=SystemStatsResponse)
async def get_system_stats_admin(current_user: Dict = Depends(require_admin)):
    """Admin only: Get system statistics"""
    stats = await services.get_system_stats()
    
    return stats


@app.put("/api/admin/users/{user_id}/role")
async def update_user_role_admin(user_id: str, new_role: str, current_user: Dict = Depends(require_admin)):
    """Admin only: Update user role"""
    if new_role not in ["user", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be 'user' or 'admin'"
        )
    
    updated_user = await services.update_user_role(user_id, new_role)
    
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return updated_user


# ============================================================================
# PUBLIC ENDPOINTS (No auth required)
# ============================================================================

@app.get("/api/stock-prices")
async def get_stock_prices_endpoint(
    symbol: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Get stock price data (public)"""
    prices = await services.get_stock_prices(symbol, start_date, end_date)
    
    return {
        "prices": prices,
        "total_records": len(prices)
    }


# ============================================================================
# ERROR HANDLERS
# ============================================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "status_code": exc.status_code
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle unexpected errors"""
    if settings.is_development:
        # In dev, show full error
        return JSONResponse(
            status_code=500,
            content={
                "detail": str(exc),
                "type": type(exc).__name__
            }
        )
    else:
        # In production, hide details
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )


# Startup/shutdown handled by lifespan context manager above


# ============================================================================
# TRADING CONTROL ENDPOINTS (User's own models)
# ============================================================================

@app.post("/api/trading/start/{model_id}")
async def start_trading(
    model_id: int,
    request: StartTradingRequest,
    current_user: Dict = Depends(require_auth)
):
    """Start AI trading agent for user's model"""
    # Verify ownership
    model = await services.get_model_by_id(model_id, current_user["id"])
    
    if not model:
        raise NotFoundError("Model")
    
    # Start agent with model's parameters
    result = await agent_manager.start_agent(
        model_id=model_id,
        user_id=current_user["id"],
        model_signature=model["signature"],
        basemodel=request.base_model,
        start_date=request.start_date,
        end_date=request.end_date,
        model_parameters=model.get("model_parameters")
    )
    
    return result


@app.post("/api/trading/stop/{model_id}")
async def stop_trading(model_id: int, current_user: Dict = Depends(require_auth)):
    """Stop trading and auto-delete the run (clean stop = full cleanup)"""
    # Verify ownership
    model = await services.get_model_by_id(model_id, current_user["id"])
    
    if not model:
        raise NotFoundError("Model")
    
    # Get active run for this model
    active_run = await services.get_active_run(model_id)
    
    if not active_run:
        # Fallback to agent_manager (for daily trading)
        result = await agent_manager.stop_agent(model_id)
        return result if result.get("status") != "not_running" else {
            "status": "not_running",
            "message": "No active trading session found"
        }
    
    # Check if this is a Celery task (has task_id)
    if active_run.get("task_id"):
        from celery_app import celery_app
        
        task_id = active_run["task_id"]
        run_number = active_run["run_number"]
        
        print(f"🛑 Revoking and deleting run: Run #{run_number} (task: {task_id})")
        
        # Revoke task (terminate=True stops it immediately)
        celery_app.control.revoke(task_id, terminate=True)
        
        # Delete run (auto-cleanup on stop)
        await services.delete_trading_run(active_run["id"], model_id, current_user["id"])
        
        print(f"✅ Stopped and deleted Run #{run_number}")
        
        return {
            "status": "stopped_and_deleted",
            "task_id": task_id,
            "run_id": active_run["id"],
            "run_number": run_number,
            "message": f"Run #{run_number} stopped and deleted"
        }
    else:
        # Fallback to agent_manager (for daily trading or old intraday)
        result = await agent_manager.stop_agent(model_id)
        return result


@app.post("/api/trading/start-intraday/{model_id}")
async def start_intraday_trading(
    model_id: int,
    request: IntradayTradingRequest,
    current_user: Dict = Depends(require_auth)
):
    """
    Start intraday trading session (async with Celery)
    
    Returns task_id immediately, trading runs in background
    """
    # Verify ownership
    model = await services.get_model_by_id(model_id, current_user["id"])
    
    if not model:
        raise NotFoundError("Model")
    
    # Create trading run first
    run = await services.create_trading_run(
        model_id=model_id,
        trading_mode="intraday",
        strategy_snapshot={
            "custom_rules": model.get("custom_rules"),
            "custom_instructions": model.get("custom_instructions"),
            "model_parameters": model.get("model_parameters"),
            "default_ai_model": model.get("default_ai_model")
        },
        intraday_symbol=request.symbol,
        intraday_date=request.date,
        intraday_session=request.session
    )
    
    run_id = run["id"]
    run_number = run["run_number"]
    
    # Import Celery task
    from workers.trading_tasks import run_intraday_trading
    
    # Queue task (returns immediately)
    task = run_intraday_trading.delay(
        model_id=model_id,
        user_id=current_user["id"],
        symbol=request.symbol,
        date=request.date,
        session=request.session,
        base_model=request.base_model,
        run_id=run_id  # Pass run_id to worker
    )
    
    # Store task_id in run (enables stop functionality!)
    await services.update_trading_run(run_id, {"task_id": task.id})
    
    print(f"✅ Queued intraday trading task: {task.id} (Run #{run_number})")
    
    return {
        "status": "queued",
        "task_id": task.id,
        "run_id": run_id,
        "run_number": run_number,
        "model_id": model_id,
        "symbol": request.symbol,
        "date": request.date,
        "message": "Trading session queued. Use task_id to check status."
    }


@app.post("/api/trading/start-daily/{model_id}")
async def start_daily_backtest(
    model_id: int,
    request: DailyBacktestRequest,
    current_user: Dict = Depends(require_auth)
):
    """
    Start daily backtest (NEW - single stock, date range, Celery)
    Different from old /start endpoint (multi-stock, agent_manager)
    """
    # Verify ownership
    model = await services.get_model_by_id(model_id, current_user["id"])
    if not model:
        raise NotFoundError("Model")
    
    # Create run
    run = await services.create_trading_run(
        model_id=model_id,
        trading_mode="daily",
        strategy_snapshot={
            "custom_rules": model.get("custom_rules"),
            "custom_instructions": model.get("custom_instructions"),
            "model_parameters": model.get("model_parameters")
        },
        date_range_start=request.start_date,
        date_range_end=request.end_date
    )
    
    run_id = run["id"]
    run_number = run["run_number"]
    
    # Queue task
    from workers.trading_tasks import run_daily_backtest
    
    task = run_daily_backtest.delay(
        model_id=model_id,
        user_id=current_user["id"],
        symbol=request.symbol,
        start_date=request.start_date,
        end_date=request.end_date,
        base_model=request.base_model,
        run_id=run_id
    )
    
    # Store task_id
    await services.update_trading_run(run_id, {"task_id": task.id})
    
    print(f"✅ Queued daily backtest: {task.id} (Run #{run_number}, {request.symbol})")
    
    return {
        "status": "queued",
        "task_id": task.id,
        "run_id": run_id,
        "run_number": run_number,
        "symbol": request.symbol,
        "start_date": request.start_date,
        "end_date": request.end_date
    }


@app.get("/api/trading/task-status/{task_id}")
async def get_task_status(task_id: str, current_user: Dict = Depends(require_auth)):
    """
    Get status of a Celery task
    
    Returns:
        - state: PENDING, STARTED, PROGRESS, SUCCESS, FAILURE, REVOKED
        - meta: Progress info (if PROGRESS)
        - result: Final result (if SUCCESS)
    """
    from celery.result import AsyncResult
    from celery_app import celery_app
    
    result = AsyncResult(task_id, app=celery_app)
    
    response = {
        "task_id": task_id,
        "state": result.state,
    }
    
    if result.state == 'PENDING':
        response["status"] = "Task is waiting to start"
        
    elif result.state == 'PROGRESS':
        response["status"] = result.info.get('status', 'In progress')
        response["current"] = result.info.get('current', 0)
        response["total"] = result.info.get('total', 390)
        response["run_id"] = result.info.get('run_id')
        response["run_number"] = result.info.get('run_number')
        
    elif result.state == 'SUCCESS':
        response["status"] = "Completed"
        response["result"] = result.result
        
    elif result.state == 'FAILURE':
        response["status"] = "Failed"
        response["error"] = str(result.info)
        
    elif result.state == 'REVOKED':
        response["status"] = "Cancelled"
    
    return response


@app.get("/api/trading/status/{model_id}")
async def get_trading_status(model_id: int, current_user: Dict = Depends(require_auth)):
    """Get trading status for user's model"""
    # Verify ownership
    model = await services.get_model_by_id(model_id, current_user["id"])
    
    if not model:
        raise NotFoundError("Model")
    
    # Get status
    status_info = agent_manager.get_agent_status(model_id)
    
    if status_info is None:
        return {
            "status": "not_running",
            "model_id": model_id
        }
    
    return status_info


@app.get("/api/trading/status")
async def get_all_trading_status(current_user: Dict = Depends(require_auth)):
    """Get status of all user's running agents"""
    all_status = agent_manager.get_all_running_agents()
    
    # Filter to only user's models
    user_models = await services.get_user_models(current_user["id"])
    user_model_ids = {m["id"] for m in user_models}
    
    filtered_status = {
        model_id: info
        for model_id, info in all_status.items()
        if model_id in user_model_ids
    }
    
    return {
        "running_agents": filtered_status,
        "total_running": len(filtered_status)
    }


# ============================================================================
# MCP SERVICE CONTROL (Admin Only)
# ============================================================================

@app.post("/api/mcp/start")
async def start_mcp_services(current_user: Dict = Depends(require_admin)):
    """Admin only: Start all MCP services"""
    results = mcp_manager.start_all_services()
    return results


@app.post("/api/mcp/stop")
async def stop_mcp_services(current_user: Dict = Depends(require_admin)):
    """Admin only: Stop all MCP services"""
    mcp_manager.stop_all_services()
    return {"status": "stopped", "message": "All MCP services stopped"}


@app.get("/api/mcp/status")
async def get_mcp_status(current_user: Dict = Depends(require_admin)):
    """Admin only: Get MCP service status"""
    return mcp_manager.get_all_status()


# ============================================================================
# RUN TRACKING & SYSTEM AGENT (NEW)
# ============================================================================

@app.get("/api/models/{model_id}/runs")
async def get_model_runs_endpoint(
    model_id: int,
    current_user: Dict = Depends(require_auth)
):
    """Get all trading runs for a model"""
    try:
        runs = await services.get_model_runs(model_id, current_user["id"])
        return {"runs": runs, "total": len(runs)}
    except PermissionError:
        raise HTTPException(403, "Access denied")


@app.get("/api/models/{model_id}/runs/{run_id}")
async def get_run_details_endpoint(
    model_id: int,
    run_id: int,
    current_user: Dict = Depends(require_auth)
):
    """Get detailed info about a specific run"""
    try:
        run = await services.get_run_by_id(model_id, run_id, current_user["id"])
        
        if not run:
            raise HTTPException(404, "Run not found")
        
        return run
    except PermissionError:
        raise HTTPException(403, "Access denied")


@app.post("/api/models/{model_id}/runs/{run_id}/stop")
async def stop_specific_run(
    model_id: int,
    run_id: int,
    current_user: Dict = Depends(require_auth)
):
    """Stop a specific running task and delete it (clean stop = auto-delete)"""
    # Verify ownership
    model = await services.get_model_by_id(model_id, current_user["id"])
    if not model:
        raise NotFoundError("Model")
    
    # Get the specific run
    run = await services.get_run_by_id(model_id, run_id, current_user["id"])
    if not run:
        raise HTTPException(404, "Run not found")
    
    # Check if it's running and has task_id
    if run.get("status") != "running":
        return {"status": "not_running", "message": "Run is not currently running"}
    
    if not run.get("task_id"):
        return {"status": "no_task", "message": "Run has no task_id (old format)"}
    
    # Revoke the Celery task
    from celery_app import celery_app
    task_id = run["task_id"]
    
    print(f"🛑 Revoking and deleting run: Run #{run['run_number']} (task: {task_id})")
    
    celery_app.control.revoke(task_id, terminate=True)
    
    # Delete run instead of marking stopped (cascades delete positions/reasoning)
    await services.delete_trading_run(run_id, model_id, current_user["id"])
    
    print(f"✅ Stopped and deleted Run #{run['run_number']}")
    
    return {
        "status": "stopped_and_deleted",
        "task_id": task_id,
        "run_id": run_id,
        "run_number": run["run_number"],
        "message": "Run stopped and deleted"
    }


@app.delete("/api/models/{model_id}/runs/{run_id}")
async def delete_run_endpoint(
    model_id: int,
    run_id: int,
    current_user: Dict = Depends(require_auth)
):
    """Delete a trading run (cannot delete running tasks)"""
    try:
        result = await services.delete_trading_run(run_id, model_id, current_user["id"])
        return result
    except PermissionError:
        raise HTTPException(403, "Access denied")
    except ValueError as e:
        raise HTTPException(400, str(e))


@app.post("/api/models/{model_id}/runs/{run_id}/chat", response_model=ChatResponse)
async def chat_with_system_agent(
    model_id: int,
    run_id: int,
    request: ChatRequest,
    current_user: Dict = Depends(require_auth)
):
    """Chat with system agent about a specific run"""
    
    # Verify ownership
    model = await services.get_model_by_id(model_id, current_user["id"])
    if not model:
        raise HTTPException(404, "Model not found")
    
    try:
        # Create system agent
        from agents.system_agent import create_system_agent
        
        agent = create_system_agent(
            model_id=model_id,
            run_id=run_id,
            user_id=current_user["id"],
            supabase=services.get_supabase()
        )
        
        # Get conversation history
        from services.chat_service import get_chat_messages
        chat_history = await get_chat_messages(model_id, run_id, current_user["id"])
        
        # Get AI response
        result = await agent.chat(request.message, chat_history)
        
        # Save messages to database
        from services.chat_service import save_chat_message
        
        await save_chat_message(
            model_id=model_id,
            run_id=run_id,
            role="user",
            content=request.message,
            user_id=current_user["id"]  # ← FIX: Pass actual user_id
        )
        
        await save_chat_message(
            model_id=model_id,
            run_id=run_id,
            role="assistant",
            content=result["response"],
            user_id=current_user["id"],  # ← FIX: Pass actual user_id
            tool_calls=result.get("tool_calls")
        )
        
        return {
            "response": result["response"],
            "suggested_rules": result.get("suggested_rules", [])
        }
    
    except PermissionError:
        raise HTTPException(403, "Access denied")
    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(500, f"Chat error: {str(e)}")


@app.get("/api/models/{model_id}/runs/{run_id}/chat-history")
async def get_chat_history_endpoint(
    model_id: int,
    run_id: int,
    current_user: Dict = Depends(require_auth)
):
    """Get chat message history for a run"""
    try:
        from services.chat_service import get_chat_messages
        messages = await get_chat_messages(model_id, run_id, current_user["id"])
        return {"messages": messages}
    except PermissionError:
        raise HTTPException(403, "Access denied")


@app.get("/api/models/{model_id}/chat-history")
async def get_general_chat_history_endpoint(
    model_id: int,
    current_user: Dict = Depends(require_auth)
):
    """Get general chat message history (no run context)"""
    try:
        from services.chat_service import get_chat_messages
        messages = await get_chat_messages(model_id, None, current_user["id"])
        return {"messages": messages}
    except PermissionError:
        raise HTTPException(403, "Access denied")


@app.get("/api/admin/chat-settings")
async def get_global_chat_settings(current_user: Dict = Depends(require_admin)):
    """Get global chat AI configuration (admin only)"""
    try:
        supabase = services.get_supabase()
        
        # Fetch from database (RLS ensures admin-only)
        result = supabase.table("global_chat_settings")\
            .select("*")\
            .eq("id", 1)\
            .execute()
        
        if result.data and len(result.data) > 0:
            settings = result.data[0]
            model_params = settings.get("model_parameters") or {}
            
            return {
                "chat_model": settings["chat_model"],
                "chat_instructions": settings["chat_instructions"] or "",
                "model_parameters": model_params,
                "updated_at": settings.get("updated_at"),
                "updated_by": settings.get("updated_by")
            }
        else:
            # Return defaults
            return {
                "chat_model": "openai/gpt-4.1-mini",
                "chat_instructions": "",
                "model_parameters": {
                    "temperature": 0.30,
                    "top_p": 0.90,
                    "frequency_penalty": 0.00,
                    "presence_penalty": 0.00,
                    "max_prompt_tokens": 800000,
                    "max_tokens": 32000,
                    "max_completion_tokens": 32000
                }
            }
    except Exception as e:
        print(f"Error getting chat settings: {e}")
        raise HTTPException(500, f"Failed to load settings: {str(e)}")


@app.post("/api/admin/chat-settings")
async def save_global_chat_settings(
    request: Dict,
    current_user: Dict = Depends(require_admin)
):
    """Save global chat AI configuration (admin only)"""
    try:
        supabase = services.get_supabase()
        
        # Update database (always id=1, single global config)
        chat_model = request.get("chat_model", "openai/gpt-4.1-mini")
        chat_instructions = request.get("chat_instructions", "")
        model_parameters = request.get("model_parameters", {})
        
        update_data = {
            "chat_model": chat_model,
            "chat_instructions": chat_instructions,
            "model_parameters": model_parameters,
            "updated_by": current_user["id"],
            "updated_at": datetime.now().isoformat()
        }
        
        supabase.table("global_chat_settings")\
            .update(update_data)\
            .eq("id", 1)\
            .execute()
        
        print(f"✅ Admin {current_user.get('email')} updated global chat:")
        print(f"   Model: {chat_model}")
        print(f"   Instructions: {len(chat_instructions)} chars")
        print(f"   Parameters: {model_parameters}")
        
        return {
            "status": "success",
            "settings": update_data
        }
    except Exception as e:
        print(f"Error saving chat settings: {e}")
        raise HTTPException(500, f"Failed to save: {str(e)}")


# ============================================================================
# CHAT SESSIONS V2 (Multi-Conversation Support)
# ============================================================================

@app.get("/api/chat/sessions")
async def list_chat_sessions_endpoint(
    model_id: Optional[int] = None,
    current_user: Dict = Depends(require_auth)
):
    """
    List chat sessions for current user
    
    Query params:
        model_id (optional): Filter by model (omit for general conversations)
    
    Returns:
        List of sessions with message counts
    """
    try:
        from services.chat_service import list_user_sessions
        
        sessions = await list_user_sessions(
            user_id=current_user["id"],
            model_id=model_id
        )
        
        # Add message count to each session
        supabase = services.get_supabase()
        for session in sessions:
            count_result = supabase.table("chat_messages")\
                .select("id", count="exact")\
                .eq("session_id", session["id"])\
                .execute()
            
            session["message_count"] = count_result.count if hasattr(count_result, 'count') else 0
        
        return {"sessions": sessions, "total": len(sessions)}
    
    except Exception as e:
        print(f"Error listing sessions: {e}")
        raise HTTPException(500, str(e))


@app.post("/api/chat/sessions/new")
async def create_new_session_endpoint(
    request: Dict,
    current_user: Dict = Depends(require_auth)
):
    """
    Start a new conversation
    
    Body:
        model_id (optional): Model ID for model-specific conversation
    
    Returns:
        New session record
    """
    try:
        from services.chat_service import start_new_conversation
        
        model_id = request.get("model_id")
        
        session = await start_new_conversation(
            user_id=current_user["id"],
            model_id=model_id
        )
        
        return {"session": session}
    
    except PermissionError as e:
        raise HTTPException(403, str(e))
    except Exception as e:
        print(f"Error creating session: {e}")
        raise HTTPException(500, str(e))


@app.post("/api/chat/sessions/{session_id}/resume")
async def resume_session_endpoint(
    session_id: int,
    current_user: Dict = Depends(require_auth)
):
    """Resume a previous conversation (make it active)"""
    try:
        from services.chat_service import resume_conversation
        
        session = await resume_conversation(
            session_id=session_id,
            user_id=current_user["id"]
        )
        
        return {"session": session}
    
    except PermissionError as e:
        raise HTTPException(403, str(e))
    except Exception as e:
        print(f"Error resuming session: {e}")
        raise HTTPException(500, str(e))


@app.get("/api/chat/sessions/{session_id}/messages")
async def get_session_messages_endpoint(
    session_id: int,
    limit: Optional[int] = 50,
    current_user: Dict = Depends(require_auth)
):
    """Get messages for a specific session"""
    try:
        from services.chat_service import get_or_create_session_v2
        
        # Verify access
        session = await get_or_create_session_v2(
            user_id=current_user["id"],
            session_id=session_id
        )
        
        # Get messages
        supabase = services.get_supabase()
        result = supabase.table("chat_messages")\
            .select("*")\
            .eq("session_id", session_id)\
            .order("timestamp", desc=False)\
            .limit(limit)\
            .execute()
        
        return {"messages": result.data if result.data else [], "session": session}
    
    except PermissionError as e:
        raise HTTPException(403, str(e))
    except Exception as e:
        print(f"Error getting session messages: {e}")
        raise HTTPException(500, str(e))


@app.delete("/api/chat/sessions/{session_id}")
async def delete_session_endpoint(
    session_id: int,
    current_user: Dict = Depends(require_auth)
):
    """Delete a chat session and all its messages"""
    try:
        from services.chat_service import delete_session
        
        await delete_session(
            session_id=session_id,
            user_id=current_user["id"]
        )
        
        return {"status": "success", "message": "Session deleted"}
    
    except PermissionError as e:
        raise HTTPException(403, str(e))
    except Exception as e:
        print(f"Error deleting session: {e}")
        raise HTTPException(500, str(e))


@app.get("/api/chat/general-stream")
async def general_chat_stream_endpoint(
    message: str,
    token: Optional[str] = None
):
    """General chat without run context (dashboard chat)"""
    from sse_starlette.sse import EventSourceResponse
    
    # Manual token verification (EventSource can't send Authorization header)
    current_user = None
    if token:
        try:
            from auth import verify_token_string
            payload = verify_token_string(token)
            current_user = {"id": payload.get("sub"), "email": payload.get("email"), "role": payload.get("user_metadata", {}).get("role", "user")}
        except Exception as e:
            print(f"🔒 General chat auth failed: {e}")
            pass
    
    if not current_user:
        async def error_generator():
            yield {
                "event": "message",
                "data": json.dumps({"type": "error", "error": "Not authenticated"})
            }
        return EventSourceResponse(error_generator())
    
    async def event_generator():
        try:
            # Get global chat settings
            supabase = services.get_supabase()
            
            global_settings = supabase.table("global_chat_settings")\
                .select("*")\
                .eq("id", 1)\
                .execute()
            
            # Get model and params
            if global_settings.data and len(global_settings.data) > 0:
                chat_settings = global_settings.data[0]  # Renamed to avoid shadowing
                ai_model = chat_settings["chat_model"]
                model_params = chat_settings.get("model_parameters") or {}
                instructions = chat_settings.get("chat_instructions") or ""
            else:
                ai_model = "openai/gpt-4.1-mini"
                model_params = {"temperature": 0.3, "top_p": 0.9}
                instructions = ""
            
            # Get user's first model for API key and session linking
            user_models = supabase.table("models")\
                .select("id, signature")\
                .eq("user_id", current_user["id"])\
                .limit(1)\
                .execute()
            
            if not user_models.data:
                yield {
                    "event": "message",
                    "data": json.dumps({"type": "error", "error": "No model found. Create a model first."})
                }
                return
            
            # Use global OpenRouter API key from config settings (imported at top)
            api_key = settings.OPENAI_API_KEY
            
            # Create simple ChatOpenAI (no tools for general chat)
            from langchain_openai import ChatOpenAI
            
            params = {
                "model": ai_model,
                "temperature": model_params.get("temperature", 0.3),
                "base_url": "https://openrouter.ai/api/v1",
                "api_key": api_key
            }
            
            if "top_p" in model_params:
                params["top_p"] = model_params["top_p"]
            
            # Smart token handling
            if ai_model.startswith("openai/gpt-5") or ai_model.startswith("openai/o"):
                if "max_completion_tokens" in model_params:
                    params["max_completion_tokens"] = model_params["max_completion_tokens"]
            else:
                if "max_tokens" in model_params:
                    params["max_tokens"] = model_params["max_tokens"]
            
            model = ChatOpenAI(**params)
            
            # Load general conversation history (model_id=None)
            chat_history = []
            conversation_summary = None
            
            try:
                from services.chat_service import get_or_create_session_v2
                
                # Get or create general conversation session
                session = await get_or_create_session_v2(
                    user_id=current_user["id"],
                    model_id=None  # ← General conversation
                )
                conversation_summary = session.get("conversation_summary")
                
                # Get last 30 messages from this session
                messages_result = supabase.table("chat_messages")\
                    .select("*")\
                    .eq("session_id", session["id"])\
                    .order("timestamp", desc=True)\
                    .limit(30)\
                    .execute()
                
                chat_history = list(reversed(messages_result.data)) if messages_result.data else []
                
                print(f"📖 Loaded {len(chat_history)} previous messages for context (session_id={session['id']})")
                if conversation_summary:
                    print(f"📝 Using conversation summary ({len(conversation_summary)} chars)")
            except Exception as e:
                print(f"⚠️ Failed to load general conversation history: {e}")
                pass  # No history yet
            
            # Simple system prompt
            system_prompt = f"""You are a helpful assistant for True Trading Group's AI Trading Platform.

{instructions}

You can help users:
- Understand the platform
- Explain trading concepts
- Answer questions about features
- Guide them to use specific tools

For detailed trade analysis, ask users to select a specific run first (then you'll have access to analysis tools)."""
            
            # Build messages with history
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add summary if exists (for long conversations)
            if conversation_summary:
                messages.append({
                    "role": "system",
                    "content": f"<conversation_summary>\nPrevious conversation context: {conversation_summary}\n</conversation_summary>"
                })
            
            # Add last 30 messages for context (increased from 10)
            for msg in chat_history[-30:]:
                if msg["role"] in ["user", "assistant"]:
                    messages.append({"role": msg["role"], "content": msg["content"]})
            
            # Add current message
            messages.append({"role": "user", "content": message})
            
            print(f"🤖 Starting AI stream with model: {ai_model}")
            print(f"📨 Message count: {len(messages)}")
            
            # Stream response
            full_response = ""
            try:
                chunk_count = 0
                async for chunk in model.astream(messages):
                    if chunk.content:
                        chunk_count += 1
                        full_response += chunk.content
                        event_data = {
                            "event": "message",
                            "data": json.dumps({"type": "token", "content": chunk.content})
                        }
                        print(f"📤 Yielding chunk #{chunk_count}: {chunk.content[:20]}...")
                        yield event_data
                
                print(f"✅ AI stream completed, {chunk_count} chunks, response length: {len(full_response)}")
                
            except Exception as stream_error:
                print(f"❌ AI stream error: {stream_error}")
                yield {
                    "event": "message",
                    "data": json.dumps({"type": "error", "error": f"AI model error: {str(stream_error)}"})
                }
                return
            
            # Save conversation to database as general conversation (model_id=None)
            try:
                from services.chat_service import save_chat_message_v2
                
                # Save user message
                await save_chat_message_v2(
                    user_id=current_user["id"],
                    role="user",
                    content=message,
                    model_id=None,  # ← General conversation (not tied to a model)
                    run_id=None
                )
                
                # Save AI response
                await save_chat_message_v2(
                    user_id=current_user["id"],
                    role="assistant",
                    content=full_response,
                    model_id=None,  # ← General conversation (not tied to a model)
                    run_id=None
                )
                
                print(f"💾 Saved general chat conversation (model_id=None)")
                    
                # Summarize if needed (>60 messages)
                from services.chat_summarization import should_summarize, summarize_conversation, update_session_summary
                from services.chat_service import get_or_create_session_v2
                
                session = await get_or_create_session_v2(
                    user_id=current_user["id"],
                    model_id=None  # ← General conversation
                )
                
                if await should_summarize(session["id"], supabase):
                    print(f"📝 Summarizing general chat (>60 messages)...")
                    
                    # Get all messages for this session
                    messages_result = supabase.table("chat_messages")\
                        .select("*")\
                        .eq("session_id", session["id"])\
                        .order("timestamp")\
                        .limit(1000)\
                        .execute()
                    
                    all_messages = messages_result.data if messages_result.data else []
                    
                    if len(all_messages) > 30:
                        messages_to_summarize = all_messages[:-30]  # Summarize all except last 30
                        
                        summary = await summarize_conversation(
                            messages_to_summarize,
                            ai_model=ai_model,
                            api_key=api_key
                        )
                        
                        if summary:
                            await update_session_summary(session["id"], summary, supabase)
                            print(f"✅ General chat summary saved ({len(summary)} chars)")
            
            except Exception as e:
                print(f"⚠️  Failed to save general chat: {e}")
            
            yield {
                "event": "message",
                "data": json.dumps({"type": "done"})
            }
            
        except Exception as e:
            print(f"General chat stream error: {e}")
            yield {
                "event": "message",
                "data": json.dumps({"type": "error", "error": str(e)})
            }
    
    return EventSourceResponse(event_generator())


@app.get("/api/models/{model_id}/runs/{run_id}/chat-stream")
async def chat_stream_endpoint(
    model_id: int,
    run_id: int,
    message: str,
    token: Optional[str] = None
):
    """Stream chat response (SSE)"""
    from sse_starlette.sse import EventSourceResponse
    
    # Manual token verification (EventSource can't send Authorization header)
    current_user = None
    if token:
        try:
            from auth import verify_token_string
            payload = verify_token_string(token)
            current_user = {"id": payload.get("sub"), "email": payload.get("email"), "role": payload.get("user_metadata", {}).get("role", "user")}
        except Exception as e:
            print(f"🔒 Auth failed: {e}")
            pass
    
    if not current_user:
        async def error_generator():
            yield {
                "event": "message",
                "data": json.dumps({"type": "error", "error": "Not authenticated"})
            }
        return EventSourceResponse(error_generator())
    
    # Verify ownership
    model = await services.get_model_by_id(model_id, current_user["id"])
    if not model:
        raise HTTPException(404, "Model not found")
    
    async def event_generator():
        try:
            # Create agent
            from agents.system_agent import create_system_agent
            
            agent = create_system_agent(
                model_id=model_id,
                run_id=run_id,
                user_id=current_user["id"],
                supabase=services.get_supabase()
            )
            
            # Get history and summary
            from services.chat_service import get_chat_messages, get_or_create_chat_session
            
            chat_history = await get_chat_messages(model_id, run_id, current_user["id"], limit=30)
            
            # Get session for summary
            session = await get_or_create_chat_session(model_id, run_id, current_user["id"])
            conversation_summary = session.get("conversation_summary")
            
            # Check if we should summarize (>60 messages)
            from services.chat_summarization import should_summarize, summarize_conversation, update_session_summary
            
            if await should_summarize(session["id"], services.get_supabase()):
                print(f"📝 Conversation has >60 messages, will summarize after response...")
            
            # Stream response
            full_response = ""
            tool_calls = []
            
            async for chunk in agent.chat_stream(message, chat_history, conversation_summary):
                if chunk["type"] == "token":
                    full_response += chunk["content"]
                    yield {
                        "event": "message",
                        "data": json.dumps({"type": "token", "content": chunk["content"]})
                    }
                elif chunk["type"] == "tool":
                    tool_calls.append(chunk["tool"])
                    yield {
                        "event": "message",
                        "data": json.dumps({"type": "tool", "tool": chunk["tool"]})
                    }
                elif chunk["type"] == "done":
                    # Save messages
                    from services.chat_service import save_chat_message
                    
                    await save_chat_message(
                        model_id=model_id,
                        run_id=run_id,
                        role="user",
                        content=message,
                        user_id=current_user["id"]
                    )
                    
                    await save_chat_message(
                        model_id=model_id,
                        run_id=run_id,
                        role="assistant",
                        content=full_response,
                        user_id=current_user["id"],
                        tool_calls=tool_calls if tool_calls else None
                    )
                    
                    # Summarize if needed (>60 messages)
                    if await should_summarize(session["id"], services.get_supabase()):
                        print(f"📝 Summarizing conversation (>60 messages)...")
                        
                        # Get ALL messages for summarization
                        all_messages = await get_chat_messages(model_id, run_id, current_user["id"], limit=1000)
                        
                        # Summarize oldest 30 (keep recent 30 as-is)
                        if len(all_messages) > 30:
                            messages_to_summarize = all_messages[:-30]  # All except last 30
                            
                            summary = await summarize_conversation(
                                messages_to_summarize,
                                ai_model=agent.model.model_name,
                                api_key=agent.model.openai_api_key
                            )
                            
                            if summary:
                                await update_session_summary(session["id"], summary, services.get_supabase())
                                print(f"✅ Summary generated and saved ({len(summary)} chars)")
                    
                    yield {
                        "event": "message",
                        "data": json.dumps({"type": "done"})
                    }
                elif chunk["type"] == "error":
                    yield {
                        "event": "message",
                        "data": json.dumps({"type": "error", "error": chunk["error"]})
                    }
        
        except Exception as e:
            print(f"Stream error: {e}")
            yield {
                "event": "message",
                "data": json.dumps({"type": "error", "error": str(e)})
            }
    
    return EventSourceResponse(event_generator())


# ============================================================================
# STREAMING ENDPOINTS (Real-time trading updates)
# ============================================================================

@app.get("/api/trading/stream/{model_id}")
async def stream_trading_events(model_id: int, token: Optional[str] = None):
    """Stream real-time trading events for a model (Server-Sent Events)"""
    from fastapi.responses import StreamingResponse
    from auth import verify_token_string
    import json
    import asyncio
    
    # Verify token (EventSource can't send headers, so token is in query param)
    if not token:
        raise HTTPException(status_code=401, detail="Token required")
    
    try:
        token_payload = verify_token_string(token)
        user_id = token_payload.get("sub")  # JWT uses 'sub' for user ID
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    
    # Verify ownership
    model = await services.get_model_by_id(model_id, user_id)
    if not model:
        raise NotFoundError("Model")
    
    async def event_generator():
        """
        Generate SSE events from both:
        1. In-memory queue (same process events)
        2. Redis polling (worker process events)
        """
        queue = event_stream.subscribe(model_id)
        
        try:
            # Send initial connection message
            yield f"data: {json.dumps({'type': 'connected', 'model_id': model_id})}\n\n"
            
            # Poll Redis for worker events while streaming
            redis_channel = f"trading:model:{model_id}:events"
            last_event_time = datetime.now()
            
            while True:
                try:
                    # Try to get event from queue (non-blocking with timeout)
                    event = await asyncio.wait_for(queue.get(), timeout=1.0)
                    yield f"data: {json.dumps(event)}\n\n"
                except asyncio.TimeoutError:
                    # No queue event - check Redis for worker events
                    try:
                        from utils.redis_client import redis_client
                        redis_event = await redis_client.get(redis_channel)
                        
                        if redis_event and isinstance(redis_event, dict):
                            # Safely get and parse timestamp
                            timestamp_str = redis_event.get('timestamp')
                            if timestamp_str:
                                try:
                                    event_time = datetime.fromisoformat(timestamp_str)
                                    # Only send if newer than last event
                                    if event_time > last_event_time:
                                        yield f"data: {json.dumps(redis_event)}\n\n"
                                        last_event_time = event_time
                                except (ValueError, TypeError):
                                    # Invalid timestamp format, skip this event
                                    pass
                    except Exception as e:
                        # Redis poll failed - don't crash SSE connection
                        pass
                    
                    # Send keepalive (keeps connection alive)
                    yield f": keepalive\n\n"
                
        except asyncio.CancelledError:
            event_stream.unsubscribe(model_id, queue)
            raise
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


# ============================================================================
# RUN SERVER
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    from datetime import datetime
    from typing import Optional
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.is_development,
        log_level="info"
    )

