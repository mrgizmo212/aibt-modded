import os
from dotenv import load_dotenv

load_dotenv()

print("=== Environment Variables ===")
print(f"OPENAI_API_BASE: {os.getenv('OPENAI_API_BASE')}")
print(f"OPENAI_API_KEY: {os.getenv('OPENAI_API_KEY')[:20]}...")  # Only first 20 chars
print(f"JINA_API_KEY: {os.getenv('JINA_API_KEY')[:20]}...")
print(f"RUNTIME_ENV_PATH: {os.getenv('RUNTIME_ENV_PATH')}")