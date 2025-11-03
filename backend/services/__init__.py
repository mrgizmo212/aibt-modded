"""
Services Package
Provides both:
1. All functions from services.py (20+ functions)
2. New blueprint services (run_service, reasoning_service, chat_service)
"""

import sys
from pathlib import Path

# Add parent directory to path to import from services.py
parent_dir = Path(__file__).parent.parent
if str(parent_dir) not in sys.path:
    sys.path.insert(0, str(parent_dir))

# Import ALL functions from services.py module using importlib
import importlib.util
services_py_path = parent_dir / "services.py"
spec = importlib.util.spec_from_file_location("services_module", services_py_path)
services_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(services_module)

# Re-export ALL functions from services.py (20+ functions)
get_supabase = services_module.get_supabase
get_user_profile = services_module.get_user_profile
get_all_users = services_module.get_all_users
update_user_role = services_module.update_user_role
get_user_models = services_module.get_user_models
get_all_models_admin = services_module.get_all_models_admin
get_model_by_id = services_module.get_model_by_id
create_model = services_module.create_model
update_model = services_module.update_model
delete_model = services_module.delete_model
get_model_positions = services_module.get_model_positions
get_latest_position = services_module.get_latest_position
create_position = services_module.create_position
get_model_logs = services_module.get_model_logs
create_log = services_module.create_log
get_stock_prices = services_module.get_stock_prices
create_stock_price = services_module.create_stock_price
get_model_performance = services_module.get_model_performance
calculate_and_cache_performance = services_module.calculate_and_cache_performance
get_admin_leaderboard = services_module.get_admin_leaderboard
get_system_stats = services_module.get_system_stats

# Import NEW blueprint services (from run_service.py)
from .run_service import (
    create_trading_run, 
    update_trading_run,
    complete_trading_run, 
    get_model_runs, 
    get_run_by_id,
    get_active_run
)

# Import backtesting services
from .backtesting import TradingService

# The other sub-modules are accessible via:
# from services.reasoning_service import save_ai_reasoning
# from services.chat_service import save_chat_message

__all__ = [
    # Core
    'get_supabase',
    # User management
    'get_user_profile',
    'get_all_users',
    'update_user_role',
    # Model management
    'get_user_models',
    'get_all_models_admin',
    'get_model_by_id',
    'create_model',
    'update_model',
    'delete_model',
    # Positions
    'get_model_positions',
    'get_latest_position',
    'create_position',
    # Logs
    'get_model_logs',
    'create_log',
    # Stock prices
    'get_stock_prices',
    'create_stock_price',
    # Performance
    'get_model_performance',
    'calculate_and_cache_performance',
    'get_admin_leaderboard',
    'get_system_stats',
    # NEW: Run management
    'create_trading_run',
    'update_trading_run',
    'complete_trading_run',
    'get_model_runs',
    'get_run_by_id',
    'get_active_run',
    # NEW: Backtesting
    'TradingService',
]

