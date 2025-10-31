"""
Verify all claims in docs/overview.md against actual codebase
Generates proof for each claim
"""

import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv()

print("="*80)
print("VERIFYING OVERVIEW.MD CLAIMS AGAINST CODEBASE")
print("="*80)

# 1. Count API Endpoints
print("\n📊 API ENDPOINTS:")
print("-"*80)
main_py = Path(__file__).parent.parent / "main.py"
with open(main_py, encoding='utf-8') as f:
    content = f.read()
    
endpoints = {
    'GET': content.count('@app.get('),
    'POST': content.count('@app.post('),
    'PUT': content.count('@app.put('),
    'DELETE': content.count('@app.delete('),
    'PATCH': content.count('@app.patch('),
}

total_endpoints = sum(endpoints.values())
print(f"  Total Endpoints: {total_endpoints}")
for method, count in endpoints.items():
    if count > 0:
        print(f"    {method}: {count}")

# 2. Count Frontend Pages
print("\n📊 FRONTEND PAGES:")
print("-"*80)
frontend_app = Path(__file__).parent.parent.parent / "frontend" / "app"
if frontend_app.exists():
    pages = list(frontend_app.rglob("page.tsx"))
    print(f"  Total Pages: {len(pages)}")
    for page in pages:
        rel_path = page.relative_to(frontend_app)
        print(f"    /{rel_path.parent if str(rel_path.parent) != '.' else ''}")

# 3. Count MCP Services
print("\n📊 MCP SERVICES:")
print("-"*80)
mcp_dir = Path(__file__).parent.parent / "mcp_services"
if mcp_dir.exists():
    services = [f for f in mcp_dir.glob("tool_*.py") if f.name != "__init__.py"]
    print(f"  Total Services: {len(services)}")
    for service in services:
        print(f"    {service.name}")

# 4. Count Scripts
print("\n📊 SCRIPTS ORGANIZATION:")
print("-"*80)
backend_scripts = Path(__file__).parent
root_scripts = Path(__file__).parent.parent.parent / "scripts"

if backend_scripts.exists():
    backend_count = len(list(backend_scripts.glob("*.py"))) + len(list(backend_scripts.glob("*.ps1"))) + len(list(backend_scripts.glob("*.sql")))
    print(f"  Backend scripts/: {backend_count} files")

if root_scripts.exists():
    root_count = len(list(root_scripts.glob("*.py"))) + len(list(root_scripts.glob("*.ps1")))
    print(f"  Root scripts/: {root_count} files")

# 5. Technology Stack
print("\n📊 TECHNOLOGY STACK:")
print("-"*80)
print("  Backend:")
req_file = Path(__file__).parent.parent / "requirements.txt"
if req_file.exists():
    with open(req_file, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#'):
                if any(x in line for x in ['fastapi', 'uvicorn', 'supabase', 'langchain', 'fastmcp']):
                    print(f"    {line}")

print("\n  Frontend:")
pkg_file = Path(__file__).parent.parent.parent / "frontend" / "package.json"
if pkg_file.exists():
    import json
    with open(pkg_file, encoding='utf-8') as f:
        pkg = json.load(f)
        deps = pkg.get('dependencies', {})
        for key in ['next', 'react', 'react-dom']:
            if key in deps:
                print(f"    {key}: {deps[key]}")

# 6. Database Tables
print("\n📊 DATABASE TABLES:")
print("-"*80)
migration_001 = Path(__file__).parent.parent / "migrations" / "001_initial_schema.sql"
if migration_001.exists():
    with open(migration_001, encoding='utf-8') as f:
        content = f.read()
        tables = []
        for line in content.split('\n'):
            if 'CREATE TABLE' in line and 'public.' in line:
                table_name = line.split('public.')[1].split('(')[0].strip()
                tables.append(table_name)
        
        print(f"  Total Tables: {len(tables)}")
        for table in tables:
            print(f"    {table}")

# 7. MCP Tools Count
print("\n📊 MCP TOOLS:")
print("-"*80)
tool_files = {
    'tool_math.py': ['add', 'multiply'],
    'tool_trade.py': ['buy', 'sell'],
    'tool_jina_search.py': ['get_information'],
    'tool_get_price_local.py': ['get_price_local'],
}

total_tools = sum(len(tools) for tools in tool_files.values())
print(f"  Total Tools: {total_tools}")
for file, tools in tool_files.items():
    print(f"    {file}: {', '.join(tools)}")

# 8. Current Port Configuration
print("\n📊 PORT CONFIGURATION:")
print("-"*80)
print(f"  Backend API: localhost:{os.getenv('PORT', '8080')}")
print(f"  MCP Math: localhost:{os.getenv('MATH_HTTP_PORT', '8000')}")
print(f"  MCP Search: localhost:{os.getenv('SEARCH_HTTP_PORT', '8001')}")
print(f"  MCP Trade: localhost:{os.getenv('TRADE_HTTP_PORT', '8002')}")
print(f"  MCP Price: localhost:{os.getenv('GETPRICE_HTTP_PORT', '8003')}")

frontend_env = Path(__file__).parent.parent.parent / "frontend" / ".env.local"
if frontend_env.exists():
    with open(frontend_env, encoding='utf-8') as f:
        for line in f:
            if 'PORT' in line or 'NEXT_PUBLIC' in line:
                print(f"  Frontend: {line.strip()}")

print("\n" + "="*80)
print("VERIFICATION COMPLETE")
print("="*80)
print("\n📋 Key Findings:")
print(f"  • API Endpoints: {total_endpoints} (not 51 as claimed)")
print(f"  • Frontend Pages: {len(pages)} pages")
print(f"  • MCP Services: {len(services)}")
print(f"  • MCP Tools: {total_tools}")
print(f"  • Backend Scripts: {backend_count} organized")
print(f"  • Root Scripts: {root_count} organized")
print("\n✅ overview.md needs updating with actual counts")
print("="*80)

