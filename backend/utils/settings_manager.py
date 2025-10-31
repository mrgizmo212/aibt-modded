"""
Settings Manager - Handles Global and Per-Model Settings
Supports 3-tier configuration:
1. Global defaults (for all users)
2. Per-model overrides (user-specific)
3. Runtime overrides (trading session specific)
"""

from typing import Dict, Any, Optional
from supabase import Client
from utils.model_config import get_default_params_for_model, get_model_type


class SettingsManager:
    """
    Manages configuration settings at global and per-model levels
    """
    
    def __init__(self, supabase: Client):
        self.supabase = supabase
        self._global_cache = {}
    
    def get_global_setting(self, setting_key: str) -> Optional[Dict[str, Any]]:
        """
        Get a global setting from database
        
        Args:
            setting_key: Setting identifier (e.g., 'default_model_parameters')
            
        Returns:
            Setting value as dictionary or None
        """
        # Check cache first
        if setting_key in self._global_cache:
            return self._global_cache[setting_key]
        
        try:
            result = self.supabase.table("global_settings")\
                .select("setting_value")\
                .eq("setting_key", setting_key)\
                .execute()
            
            if result.data and len(result.data) > 0:
                value = result.data[0].get("setting_value")
                self._global_cache[setting_key] = value
                return value
        except Exception as e:
            print(f"Error fetching global setting {setting_key}: {e}")
        
        return None
    
    def set_global_setting(self, setting_key: str, setting_value: Dict[str, Any], description: str = "") -> bool:
        """
        Set a global setting (admin only)
        
        Args:
            setting_key: Setting identifier
            setting_value: Setting value as dictionary
            description: Optional description
            
        Returns:
            True if successful
        """
        try:
            # Upsert the setting
            self.supabase.table("global_settings").upsert({
                "setting_key": setting_key,
                "setting_value": setting_value,
                "description": description
            }).execute()
            
            # Clear cache
            self._global_cache.pop(setting_key, None)
            return True
        except Exception as e:
            print(f"Error setting global setting {setting_key}: {e}")
            return False
    
    def get_model_parameters(self, model_id: str, user_model_id: Optional[int] = None) -> Dict[str, Any]:
        """
        Get parameters for an AI model with 3-tier priority:
        1. Per-model settings (if user_model_id provided and has custom settings)
        2. Global settings (from global_settings table)
        3. Hardcoded defaults (from model_config.py)
        
        Args:
            model_id: AI model identifier (e.g., 'openai/gpt-5')
            user_model_id: Optional user model ID to check for custom settings
            
        Returns:
            Merged parameters dictionary
        """
        # Start with hardcoded defaults
        params = get_default_params_for_model(model_id)
        model_type = get_model_type(model_id)
        
        # Try to get global settings for this model type
        global_key = f"{model_type}_parameters"
        global_params = self.get_global_setting(global_key)
        if global_params:
            params = {**params, **global_params}
        
        # If user_model_id provided, check for per-model overrides
        if user_model_id:
            try:
                result = self.supabase.table("models")\
                    .select("model_parameters, default_ai_model")\
                    .eq("id", user_model_id)\
                    .execute()
                
                if result.data and len(result.data) > 0:
                    model_data = result.data[0]
                    
                    # Use per-model parameters if set
                    if model_data.get("model_parameters"):
                        params = {**params, **model_data["model_parameters"]}
            except Exception as e:
                print(f"Error fetching model settings: {e}")
        
        return params
    
    def save_model_parameters(self, user_model_id: int, parameters: Dict[str, Any]) -> bool:
        """
        Save per-model parameters
        
        Args:
            user_model_id: Model ID
            parameters: Parameters to save
            
        Returns:
            True if successful
        """
        try:
            self.supabase.table("models")\
                .update({"model_parameters": parameters})\
                .eq("id", user_model_id)\
                .execute()
            return True
        except Exception as e:
            print(f"Error saving model parameters: {e}")
            return False
    
    def get_all_global_settings(self) -> Dict[str, Any]:
        """
        Get all global settings
        
        Returns:
            Dictionary of all global settings
        """
        try:
            result = self.supabase.table("global_settings")\
                .select("*")\
                .execute()
            
            if result.data:
                return {
                    setting["setting_key"]: setting["setting_value"]
                    for setting in result.data
                }
        except Exception as e:
            print(f"Error fetching all global settings: {e}")
        
        return {}


# Helper function for use in routes
def get_settings_manager(supabase: Client) -> SettingsManager:
    """Create a SettingsManager instance"""
    return SettingsManager(supabase)

