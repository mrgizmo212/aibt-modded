"""
Update Model Rules Tool - Actually modify model configuration
"""

from langchain.tools import tool
from typing import Optional
from supabase import Client

def create_update_model_rules_tool(supabase: Client, model_id: int, user_id: str):
    """Factory to create update_model_rules tool"""
    
    # Verify ownership
    model = supabase.table("models").select("user_id").eq("id", model_id).execute()
    if not model.data or model.data[0]["user_id"] != user_id:
        raise PermissionError("Access denied")
    
    @tool
    async def update_model_rules(
        custom_rules: Optional[str] = None,
        custom_instructions: Optional[str] = None,
        append: bool = False
    ) -> str:
        """
        Update the model's custom rules and/or instructions
        
        Args:
            custom_rules: New custom trading rules (max 2000 chars). If None, rules unchanged.
            custom_instructions: New custom instructions (max 2000 chars). If None, instructions unchanged.
            append: If True, append to existing rules/instructions. If False (default), replace completely.
        
        Returns:
            Success message with updated configuration
        
        Examples:
            - update_model_rules(custom_rules="Only trade tech stocks. Max 3 positions.")
            - update_model_rules(custom_instructions="Focus on momentum breakouts")
            - update_model_rules(custom_rules="Never hold overnight", append=True)
        """
        
        # Validate lengths
        if custom_rules and len(custom_rules) > 2000:
            return "Error: custom_rules must be 2000 characters or less"
        
        if custom_instructions and len(custom_instructions) > 2000:
            return "Error: custom_instructions must be 2000 characters or less"
        
        # Get current config if appending
        update_data = {}
        
        if append and (custom_rules or custom_instructions):
            current = supabase.table("models").select("custom_rules, custom_instructions").eq("id", model_id).execute()
            if current.data:
                current_data = current.data[0]
                
                if custom_rules:
                    existing_rules = current_data.get("custom_rules") or ""
                    if existing_rules:
                        update_data["custom_rules"] = f"{existing_rules}\n\n{custom_rules}"
                    else:
                        update_data["custom_rules"] = custom_rules
                
                if custom_instructions:
                    existing_instructions = current_data.get("custom_instructions") or ""
                    if existing_instructions:
                        update_data["custom_instructions"] = f"{existing_instructions}\n\n{custom_instructions}"
                    else:
                        update_data["custom_instructions"] = custom_instructions
        else:
            # Replace mode
            if custom_rules is not None:
                update_data["custom_rules"] = custom_rules
            
            if custom_instructions is not None:
                update_data["custom_instructions"] = custom_instructions
        
        # Perform update
        if update_data:
            result = supabase.table("models").update(update_data).eq("id", model_id).eq("user_id", user_id).execute()
            
            if not result.data:
                return "Error: Failed to update model. Check permissions."
            
            response = "✅ **Model configuration updated successfully!**\n\n"
            
            if "custom_rules" in update_data:
                response += f"**New Custom Rules:**\n{update_data['custom_rules']}\n\n"
            
            if "custom_instructions" in update_data:
                response += f"**New Custom Instructions:**\n{update_data['custom_instructions']}\n\n"
            
            response += "These rules will apply to the next run. The model will now:\n"
            response += "- Follow the updated custom rules\n"
            response += "- Use the updated instructions for context\n\n"
            response += "Note: Changes take effect on the next run start."
            
            return response
        else:
            return "No changes specified. Provide custom_rules and/or custom_instructions to update."
    
    return update_model_rules

