"""
Configuration Management for AI-Trader Backend
Loads environment variables and provides typed config
"""

import os
import json
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import List
from dotenv import load_dotenv

# Load .env file
load_dotenv()


class Settings(BaseSettings):
    """Application settings from environment variables"""
    
    # Supabase Configuration
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_JWT_SECRET: str
    DATABASE_URL: str
    
    # Backend Configuration
    PORT: int = 8080
    DATA_DIR: str = "./data"
    
    # CORS Configuration
    ALLOWED_ORIGINS: str = "http://localhost:3000"
    
    # Authentication
    AUTH_REQUIRE_EMAIL_CONFIRMATION: bool = False
    AUTH_APPROVED_LIST_PATH: str = "./config/approved_users.json"
    
    # AI Trading Configuration
    OPENAI_API_BASE: str = "https://openrouter.ai/api/v1"
    OPENAI_API_KEY: str = ""
    JINA_API_KEY: str = ""
    
    # Proxy Configuration (for market data)
    POLYGON_PROXY_URL: str = ""
    POLYGON_PROXY_KEY: str = ""
    YFINANCE_PROXY_URL: str = ""
    YFINANCE_PROXY_KEY: str = ""
    
    # MCP Service Ports
    MATH_HTTP_PORT: int = 8000
    SEARCH_HTTP_PORT: int = 8001
    TRADE_HTTP_PORT: int = 8002
    GETPRICE_HTTP_PORT: int = 8003
    
    # AI Agent Configuration
    AGENT_MAX_STEPS: int = 30
    AGENT_MAX_RETRIES: int = 3
    AGENT_BASE_DELAY: float = 1.0
    AGENT_INITIAL_CASH: float = 10000.0
    
    # Market Data Proxies (Optional - for future integration)
    POLYGON_PROXY_URL: str = ""
    POLYGON_PROXY_KEY: str = ""
    YFINANCE_PROXY_URL: str = ""
    YFINANCE_PROXY_KEY: str = ""
    
    # Upstash Redis (for intraday trading cache)
    UPSTASH_REDIS_REST_URL: str = ""
    UPSTASH_REDIS_REST_TOKEN: str = ""
    
    # Environment
    NODE_ENV: str = "development"
    
    # Runtime Configuration
    RUNTIME_ENV_PATH: str = "./data/.runtime_env.json"
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """Parse ALLOWED_ORIGINS into list"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]
    
    @property
    def is_development(self) -> bool:
        """Check if running in development mode"""
        return self.NODE_ENV == "development"
    
    @property
    def is_production(self) -> bool:
        """Check if running in production mode"""
        return self.NODE_ENV == "production"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra env vars (like BACKEND_PORT)


# Global settings instance
settings = Settings()


def load_approved_users() -> dict:
    """
    Load approved users from JSON file
    
    Returns:
        dict with 'admins' and 'users' lists
    """
    approved_list_path = Path(settings.AUTH_APPROVED_LIST_PATH)
    
    if not approved_list_path.exists():
        # Default if file doesn't exist
        return {
            "admins": [],
            "users": []
        }
    
    try:
        with open(approved_list_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading approved users: {e}")
        return {
            "admins": [],
            "users": []
        }


def is_approved_email(email: str) -> tuple[bool, str | None]:
    """
    Check if email is in approved list and determine role
    
    Args:
        email: Email address to check
    
    Returns:
        tuple of (is_approved, role)
        role is 'admin' or 'user' or None
    """
    approved = load_approved_users()
    
    if email in approved.get('admins', []):
        return True, 'admin'
    elif email in approved.get('users', []):
        return True, 'user'
    else:
        return False, None


def is_admin(user_role: str) -> bool:
    """Check if user has admin role"""
    return user_role == 'admin'


# Export settings
__all__ = ['settings', 'load_approved_users', 'is_approved_email', 'is_admin']

