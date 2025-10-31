"""
Check Models in Database
Lists all available models and their IDs for intraday trading
"""

from supabase import create_client
from config import settings


def check_models():
    """List all models in the database"""
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    
    print("=" * 80)
    print("CHECKING MODELS IN DATABASE")
    print("=" * 80)
    print()
    
    # Get all models
    result = supabase.table("models").select("id, name, signature, user_id, created_at, initial_cash").order("id").execute()
    
    if not result.data:
        print("❌ No models found in database")
        print()
        print("To create a model:")
        print("   1. Go to the frontend: http://localhost:3000")
        print("   2. Click 'Create New Model'")
        print("   3. Fill in the details and save")
        print()
        return
    
    print(f"✅ Found {len(result.data)} model(s):")
    print()
    print(f"{'ID':<6} {'Name':<30} {'Signature':<30} {'Initial Cash':<15}")
    print("-" * 85)
    
    for model in result.data:
        model_id = model.get('id', 'N/A')
        name = model.get('name', 'N/A')
        signature = model.get('signature', 'N/A')
        initial_cash = model.get('initial_cash', 0)
        
        print(f"{model_id:<6} {name:<30} {signature:<30} ${initial_cash:<14,.2f}")
    
    print()
    print("=" * 80)
    print("TO START INTRADAY TRADING:")
    print("=" * 80)
    print()
    print("Use one of the Model IDs above when calling the intraday trading API:")
    print()
    print("POST /api/trading/start-intraday/{model_id}")
    print()
    print("Example with curl:")
    first_model_id = result.data[0]['id']
    print(f'curl -X POST "http://localhost:8080/api/trading/start-intraday/{first_model_id}" \\')
    print('  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\')
    print('  -H "Content-Type: application/json" \\')
    print('  -d \'{"symbol": "IBM", "date": "2025-01-15", "session": "regular", "base_model": "openai/gpt-4o-mini"}\'')
    print()


if __name__ == "__main__":
    check_models()

