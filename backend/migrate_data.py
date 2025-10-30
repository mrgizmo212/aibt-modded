"""
Data Migration Script
Imports AI trading data from JSONL files to Supabase PostgreSQL
Run this once to populate the database with existing trading history
"""

import json
import sys
import asyncio
from pathlib import Path
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv
import os

# Load environment
load_dotenv()

# Add utils to path
sys.path.insert(0, str(Path(__file__).parent))

from utils.price_tools import all_nasdaq_100_symbols


# Supabase client
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)


class DataMigrator:
    """Handles migration of JSONL data to PostgreSQL"""
    
    def __init__(self, data_dir: Path = None, admin_user_id: str = None):
        """
        Initialize migrator
        
        Args:
            data_dir: Path to data directory (default: ./data)
            admin_user_id: UUID of admin user to assign models to
        """
        self.data_dir = data_dir or Path(__file__).parent / "data"
        self.admin_user_id = admin_user_id
        self.stats = {
            "models_migrated": 0,
            "positions_migrated": 0,
            "logs_migrated": 0,
            "stock_prices_migrated": 0,
            "errors": []
        }
    
    def get_or_create_admin_user(self) -> str:
        """Get admin user ID from database"""
        if self.admin_user_id:
            return self.admin_user_id
        
        # Find first admin in profiles
        result = supabase.table("profiles").select("id").eq("role", "admin").limit(1).execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]["id"]
        
        raise Exception("No admin user found! Please create an admin user first.")
    
    def migrate_stock_prices(self):
        """Migrate stock prices from merged.jsonl to database"""
        print("\n📊 Migrating stock prices...")
        
        merged_file = self.data_dir / "merged.jsonl"
        
        if not merged_file.exists():
            print(f"⚠️  Merged file not found: {merged_file}")
            return
        
        prices_to_insert = []
        
        with open(merged_file, 'r', encoding='utf-8') as f:
            for line in f:
                if not line.strip():
                    continue
                
                try:
                    data = json.loads(line)
                    meta = data.get("Meta Data", {})
                    symbol = meta.get("2. Symbol")
                    
                    if not symbol:
                        continue
                    
                    time_series = data.get("Time Series (Daily)", {})
                    
                    for date_str, price_data in time_series.items():
                        prices_to_insert.append({
                            "symbol": symbol,
                            "date": date_str,
                            "open": float(price_data.get("1. buy price", 0)),
                            "high": float(price_data.get("2. high", 0)),
                            "low": float(price_data.get("3. low", 0)),
                            "close": float(price_data.get("4. sell price", 0)),
                            "volume": int(price_data.get("5. volume", 0))
                        })
                
                except Exception as e:
                    self.stats["errors"].append(f"Stock price error: {e}")
        
        # Batch insert
        if prices_to_insert:
            try:
                # Insert in batches of 1000
                batch_size = 1000
                for i in range(0, len(prices_to_insert), batch_size):
                    batch = prices_to_insert[i:i+batch_size]
                    supabase.table("stock_prices").upsert(batch).execute()
                    print(f"   Inserted {len(batch)} price records...")
                
                self.stats["stock_prices_migrated"] = len(prices_to_insert)
                print(f"✅ Migrated {len(prices_to_insert)} stock prices")
            except Exception as e:
                self.stats["errors"].append(f"Stock prices batch insert error: {e}")
                print(f"❌ Error: {e}")
    
    def migrate_model(self, model_dir: Path, user_id: str):
        """Migrate a single AI model's data"""
        model_signature = model_dir.name
        print(f"\n🤖 Migrating model: {model_signature}")
        
        try:
            # Create model in database
            model_result = supabase.table("models").insert({
                "user_id": user_id,
                "name": model_signature,
                "signature": model_signature,
                "description": f"AI trading model: {model_signature}",
                "is_active": True
            }).execute()
            
            if not model_result.data or len(model_result.data) == 0:
                raise Exception("Failed to create model record")
            
            model_id = model_result.data[0]["id"]
            print(f"   ✅ Created model (ID: {model_id})")
            self.stats["models_migrated"] += 1
            
            # Migrate positions
            positions_migrated = self.migrate_positions(model_dir, model_id)
            print(f"   ✅ Migrated {positions_migrated} positions")
            
            # Migrate logs
            logs_migrated = self.migrate_logs(model_dir, model_id, model_signature)
            print(f"   ✅ Migrated {logs_migrated} log entries")
            
        except Exception as e:
            self.stats["errors"].append(f"Model {model_signature} error: {e}")
            print(f"   ❌ Error: {e}")
    
    def migrate_positions(self, model_dir: Path, model_id: int) -> int:
        """Migrate position.jsonl for a model"""
        position_file = model_dir / "position" / "position.jsonl"
        
        if not position_file.exists():
            return 0
        
        positions_to_insert = []
        
        with open(position_file, 'r', encoding='utf-8') as f:
            for line in f:
                if not line.strip():
                    continue
                
                try:
                    data = json.loads(line)
                    
                    this_action = data.get("this_action", {})
                    positions_json = data.get("positions", {})
                    
                    positions_to_insert.append({
                        "model_id": model_id,
                        "date": data.get("date"),
                        "action_id": data.get("id", 0),
                        "action_type": this_action.get("action"),
                        "symbol": this_action.get("symbol"),
                        "amount": this_action.get("amount"),
                        "positions": positions_json,
                        "cash": positions_json.get("CASH", 0.0)
                    })
                
                except Exception as e:
                    self.stats["errors"].append(f"Position parse error: {e}")
        
        # Batch insert
        if positions_to_insert:
            try:
                supabase.table("positions").insert(positions_to_insert).execute()
                self.stats["positions_migrated"] += len(positions_to_insert)
            except Exception as e:
                self.stats["errors"].append(f"Position insert error: {e}")
        
        return len(positions_to_insert)
    
    def migrate_logs(self, model_dir: Path, model_id: int, signature: str) -> int:
        """Migrate log files for a model"""
        log_dir = model_dir / "log"
        
        if not log_dir.exists():
            return 0
        
        logs_to_insert = []
        
        # Iterate through date directories
        for date_dir in log_dir.iterdir():
            if not date_dir.is_dir():
                continue
            
            date_str = date_dir.name
            log_file = date_dir / "log.jsonl"
            
            if not log_file.exists():
                continue
            
            with open(log_file, 'r', encoding='utf-8') as f:
                for line in f:
                    if not line.strip():
                        continue
                    
                    try:
                        data = json.loads(line)
                        
                        logs_to_insert.append({
                            "model_id": model_id,
                            "date": date_str,
                            "timestamp": data.get("timestamp"),
                            "signature": data.get("signature", signature),
                            "messages": data.get("new_messages", {})
                        })
                    
                    except Exception as e:
                        self.stats["errors"].append(f"Log parse error: {e}")
        
        # Batch insert logs (in smaller batches)
        if logs_to_insert:
            try:
                batch_size = 500
                for i in range(0, len(logs_to_insert), batch_size):
                    batch = logs_to_insert[i:i+batch_size]
                    supabase.table("logs").insert(batch).execute()
                
                self.stats["logs_migrated"] += len(logs_to_insert)
            except Exception as e:
                self.stats["errors"].append(f"Logs insert error: {e}")
        
        return len(logs_to_insert)
    
    def migrate_all(self):
        """Run full migration"""
        print("=" * 60)
        print("🚀 AI-Trader Data Migration")
        print("=" * 60)
        
        # Get admin user
        try:
            admin_id = self.get_or_create_admin_user()
            print(f"✅ Using admin user: {admin_id}")
        except Exception as e:
            print(f"❌ Error: {e}")
            return
        
        # Migrate stock prices (once, shared across all models)
        self.migrate_stock_prices()
        
        # Migrate each model
        agent_data_dir = self.data_dir / "agent_data"
        
        if not agent_data_dir.exists():
            print(f"❌ Agent data directory not found: {agent_data_dir}")
            return
        
        for model_dir in agent_data_dir.iterdir():
            if not model_dir.is_dir():
                continue
            
            self.migrate_model(model_dir, admin_id)
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 Migration Summary")
        print("=" * 60)
        print(f"✅ Models migrated: {self.stats['models_migrated']}")
        print(f"✅ Positions migrated: {self.stats['positions_migrated']}")
        print(f"✅ Logs migrated: {self.stats['logs_migrated']}")
        print(f"✅ Stock prices migrated: {self.stats['stock_prices_migrated']}")
        
        if self.stats['errors']:
            print(f"\n⚠️  Errors encountered: {len(self.stats['errors'])}")
            for error in self.stats['errors'][:10]:  # Show first 10
                print(f"   - {error}")
        else:
            print("\n🎉 Migration completed successfully with no errors!")
        
        print("=" * 60)


def main():
    """Main migration entry point"""
    # Find admin user
    print("🔍 Finding admin user...")
    result = supabase.table("profiles").select("id, email").eq("role", "admin").limit(1).execute()
    
    if not result.data or len(result.data) == 0:
        print("❌ No admin user found!")
        print("Please create an admin user first:")
        print("   1. Signup with admin email")
        print("   2. Update profile role to 'admin' in Supabase")
        return
    
    admin_user = result.data[0]
    print(f"✅ Found admin: {admin_user['email']}")
    
    # Run migration
    migrator = DataMigrator(admin_user_id=admin_user['id'])
    migrator.migrate_all()


if __name__ == "__main__":
    main()

