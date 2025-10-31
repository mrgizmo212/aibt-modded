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
    IntradayTradingRequest,
    ErrorResponse
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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
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
    
    # Start agent
    result = await agent_manager.start_agent(
        model_id=model_id,
        user_id=current_user["id"],
        model_signature=model["signature"],
        basemodel=request.base_model,
        start_date=request.start_date,
        end_date=request.end_date
    )
    
    return result


@app.post("/api/trading/stop/{model_id}")
async def stop_trading(model_id: int, current_user: Dict = Depends(require_auth)):
    """Stop AI trading agent for user's model"""
    # Verify ownership
    model = await services.get_model_by_id(model_id, current_user["id"])
    
    if not model:
        raise NotFoundError("Model")
    
    # Stop agent
    result = await agent_manager.stop_agent(model_id)
    
    return result


@app.post("/api/trading/start-intraday/{model_id}")
async def start_intraday_trading(
    model_id: int,
    request: IntradayTradingRequest,
    current_user: Dict = Depends(require_auth)
):
    """
    Start intraday trading session
    
    Loads tick data, caches in Redis, runs minute-by-minute trading
    """
    # Verify ownership
    model = await services.get_model_by_id(model_id, current_user["id"])
    
    if not model:
        raise NotFoundError("Model")
    
    # NEW: Create trading run
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
    
    print(f"🚀 Starting Run #{run_number} (intraday: {request.symbol} on {request.date})")
    
    # Import intraday agent
    from trading.intraday_agent import run_intraday_session
    from trading.base_agent import BaseAgent
    
    # Create agent instance (with custom rules!)
    agent = BaseAgent(
        signature=model["signature"],
        basemodel=request.base_model,
        stock_symbols=[request.symbol],
        max_steps=10,
        initial_cash=model.get("initial_cash", 10000.0),
        model_id=model_id,
        custom_rules=model.get("custom_rules"),  # ← NEW: Pass rules
        custom_instructions=model.get("custom_instructions")  # ← NEW: Pass instructions
    )
    
    # Initialize agent
    await agent.initialize()
    
    # Run intraday session with run_id
    result = await run_intraday_session(
        agent=agent,
        model_id=model_id,
        user_id=current_user["id"],
        symbol=request.symbol,
        date=request.date,
        session=request.session,
        run_id=run_id  # ← NEW: Link trades to run
    )
    
    # NEW: Complete run
    try:
        await services.complete_trading_run(run_id, {
            "total_trades": result.get("trades_executed", 0),
            "final_portfolio_value": result.get("final_position", {}).get("CASH", 0) if result.get("final_position") else None
        })
    except Exception as e:
        print(f"⚠️ Could not complete run: {e}")
    
    return {
        **result,
        "run_id": run_id,
        "run_number": run_number
    }


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
        """Generate SSE events"""
        queue = event_stream.subscribe(model_id)
        
        try:
            # Send initial connection message
            yield f"data: {json.dumps({'type': 'connected', 'model_id': model_id})}\n\n"
            
            # Stream events
            while True:
                event = await queue.get()
                yield f"data: {json.dumps(event)}\n\n"
                
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

