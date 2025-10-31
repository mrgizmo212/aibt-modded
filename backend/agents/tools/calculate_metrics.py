"""
Calculate Metrics Tool - For System Agent
Computes performance statistics
"""

from langchain.tools import tool
from typing import Optional
from supabase import Client

def create_calculate_metrics_tool(supabase: Client, model_id: int, run_id: Optional[int], user_id: str):
    """Factory to create metrics calculation tool"""
    
    # Verify ownership
    model = supabase.table("models").select("user_id").eq("id", model_id).execute()
    if not model.data or model.data[0]["user_id"] != user_id:
        raise PermissionError("Access denied")
    
    @tool
    async def calculate_metrics(metric_type: str = "all") -> str:
        """
        Calculate performance metrics for the run
        
        Args:
            metric_type: "all" | "return" | "risk" | "win_rate"
        
        Returns:
            Formatted metrics summary
        """
        
        from utils.result_tools_db import calculate_all_metrics_db, calculate_intraday_metrics_db
        
        try:
            # Determine if this is intraday or daily
            if run_id:
                run = supabase.table("trading_runs").select("*").eq("id", run_id).execute()
                if run.data:
                    trading_mode = run.data[0]["trading_mode"]
                    
                    if trading_mode == "intraday":
                        date = run.data[0]["intraday_date"]
                        metrics = calculate_intraday_metrics_db(model_id, date)
                    else:
                        metrics = calculate_all_metrics_db(model_id)
                else:
                    metrics = calculate_all_metrics_db(model_id)
            else:
                # All runs combined
                metrics = calculate_all_metrics_db(model_id)
            
            if "error" in metrics:
                return f"Could not calculate metrics: {metrics['error']}"
            
            # Format based on requested type
            if metric_type == "return":
                return f"""Return Metrics:
Total Return: {metrics.get('cumulative_return', 0)*100:.2f}%
Annualized Return: {metrics.get('annualized_return', 0)*100:.2f}%
Initial Value: ${metrics.get('initial_value', 0):,.2f}
Final Value: ${metrics.get('final_value', 0):,.2f}
P/L: ${metrics.get('final_value', 0) - metrics.get('initial_value', 0):,.2f}
"""
            
            elif metric_type == "risk":
                return f"""Risk Metrics:
Max Drawdown: {metrics.get('max_drawdown', 0)*100:.2f}%
Volatility: {metrics.get('volatility', 0)*100:.2f}%
Sharpe Ratio: {metrics.get('sharpe_ratio', 0):.2f}
Drawdown Period: {metrics.get('max_drawdown_start', 'N/A')} to {metrics.get('max_drawdown_end', 'N/A')}
"""
            
            elif metric_type == "win_rate":
                return f"""Win Rate Metrics:
Win Rate: {metrics.get('win_rate', 0)*100:.1f}%
P/L Ratio: {metrics.get('profit_loss_ratio', 0):.2f}
Trading Days: {metrics.get('total_trading_days', 0)}
"""
            
            else:  # "all"
                return f"""Complete Performance Metrics:

📈 Returns:
Total Return: {metrics.get('cumulative_return', 0)*100:.2f}%
Annualized Return: {metrics.get('annualized_return', 0)*100:.2f}%
Initial Value: ${metrics.get('initial_value', 0):,.2f}
Final Value: ${metrics.get('final_value', 0):,.2f}
Total P/L: ${metrics.get('final_value', 0) - metrics.get('initial_value', 0):,.2f}

⚠️ Risk:
Max Drawdown: {metrics.get('max_drawdown', 0)*100:.2f}%
Volatility: {metrics.get('volatility', 0)*100:.2f}%
Sharpe Ratio: {metrics.get('sharpe_ratio', 0):.2f}

🎯 Win Rate:
Win Rate: {metrics.get('win_rate', 0)*100:.1f}%
P/L Ratio: {metrics.get('profit_loss_ratio', 0):.2f}

📊 Activity:
Trading Days: {metrics.get('total_trading_days', 0)}
Period: {metrics.get('start_date', 'N/A')} to {metrics.get('end_date', 'N/A')}
"""
        
        except Exception as e:
            return f"Error calculating metrics: {str(e)}"
    
    return calculate_metrics

