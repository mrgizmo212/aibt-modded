"""
Authentication and Authorization
Integrates with Supabase Auth and manages approved users
Supports both JWT (Supabase) and API Key authentication
"""

from fastapi import HTTPException, Security, status, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, APIKeyHeader
from supabase import create_client, Client
from jose import jwt, JWTError
from typing import Optional, Dict, Any
import os
from config import settings, is_approved_email, is_admin

# Security schemes (both optional - don't auto-error)
security = HTTPBearer(auto_error=False)
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

# Valid API keys (read from environment variables)
def get_valid_api_keys() -> Dict[str, Dict[str, Any]]:
    """Build API keys dict from environment variables"""
    keys = {}
    
    # Primary API key from environment
    api_key_1 = os.getenv("API_KEY_1")
    if api_key_1:
        keys[api_key_1] = {
            "name": "Primary API Key",
            "role": "admin",
            "email": "api@truetradinggroup.com"
        }
    
    # Add more keys as needed (API_KEY_2, API_KEY_3, etc.)
    api_key_2 = os.getenv("API_KEY_2")
    if api_key_2:
        keys[api_key_2] = {
            "name": "Secondary API Key",
            "role": "admin",
            "email": "api2@truetradinggroup.com"
        }
    
    return keys

# Load API keys on module import
VALID_API_KEYS = get_valid_api_keys()

# Log API key status on startup
if VALID_API_KEYS:
    print(f"✅ API Key Authentication: {len(VALID_API_KEYS)} key(s) configured")
else:
    print("⚠️  API Key Authentication: No keys configured (set API_KEY_1 env var)")

# Supabase client
def get_supabase_client() -> Client:
    """Create Supabase client with service role key"""
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY
    )


def verify_token_string(token: str) -> Dict[str, Any]:
    """
    Verify JWT token from string (for query params)
    
    Args:
        token: JWT token string
    
    Returns:
        Decoded token payload with user info
    
    Raises:
        JWTError: If token is invalid
    """
    # Decode JWT token
    payload = jwt.decode(
        token,
        settings.SUPABASE_JWT_SECRET,
        algorithms=["HS256"],
        audience="authenticated"
    )
    
    return payload


def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> Dict[str, Any]:
    """
    Verify JWT token from Supabase Auth
    
    Args:
        credentials: Bearer token from Authorization header
    
    Returns:
        Decoded token payload with user info
    
    Raises:
        HTTPException: If token is invalid
    """
    token = credentials.credentials
    
    try:
        # Decode JWT token
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        
        return payload
        
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(token_payload: Dict[str, Any] = Depends(verify_token)) -> Dict[str, Any]:
    """
    Get current authenticated user
    
    Args:
        token_payload: Decoded JWT payload
    
    Returns:
        User information
    """
    user_id = token_payload.get("sub")
    email = token_payload.get("email")
    role = token_payload.get("user_metadata", {}).get("role", "user")
    
    if not user_id or not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user token"
        )
    
    return {
        "id": user_id,
        "email": email,
        "role": role
    }


async def get_current_admin(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """
    Verify current user is an admin
    
    Args:
        current_user: Current authenticated user
    
    Returns:
        Admin user information
    
    Raises:
        HTTPException: If user is not an admin
    """
    if not is_admin(current_user.get("role", "")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return current_user


def check_approved_email_for_signup(email: str) -> str:
    """
    Check if email is approved for signup and return role
    
    Args:
        email: Email address to check
    
    Returns:
        Role ('admin' or 'user')
    
    Raises:
        HTTPException: If email is not approved
    """
    is_approved, role = is_approved_email(email)
    
    if not is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not approved for signup. This platform is invite-only."
        )
    
    return role


async def create_user_profile(user_id: str, email: str, role: str):
    """
    Create user profile in database after signup
    
    Args:
        user_id: Supabase user ID
        email: User email
        role: User role (admin or user)
    """
    supabase = get_supabase_client()
    
    try:
        supabase.table("profiles").insert({
            "id": user_id,
            "email": email,
            "role": role,
            "display_name": email.split("@")[0]
        }).execute()
    except Exception as e:
        print(f"Error creating profile: {e}")
        # Profile creation handled by trigger, this is backup


def verify_api_key(api_key: Optional[str] = Security(api_key_header)) -> Optional[Dict[str, Any]]:
    """
    Verify API Key authentication
    
    Args:
        api_key: API key from X-API-Key header
    
    Returns:
        User info if valid API key, None otherwise
    """
    if not api_key:
        return None
    
    if api_key in VALID_API_KEYS:
        key_info = VALID_API_KEYS[api_key]
        return {
            "id": f"apikey_{api_key[:8]}",  # Pseudo user ID
            "email": key_info["email"],
            "role": key_info["role"]
        }
    
    return None


async def get_current_user_or_api_key(
    api_key: Optional[str] = Depends(api_key_header),
    bearer_credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Dict[str, Any]:
    """
    Authenticate via JWT (Supabase) OR API Key
    Tries API key first, falls back to JWT
    
    Args:
        api_key: API key from X-API-Key header (optional)
        bearer_credentials: Bearer token from Authorization header (optional)
    
    Returns:
        User information
    
    Raises:
        HTTPException: If both authentication methods fail
    """
    # Try API key first
    if api_key and api_key in VALID_API_KEYS:
        key_info = VALID_API_KEYS[api_key]
        return {
            "id": f"apikey_{api_key[:8]}",  # Pseudo user ID
            "email": key_info["email"],
            "role": key_info["role"]
        }
    
    # Fall back to JWT
    if bearer_credentials:
        try:
            payload = jwt.decode(
                bearer_credentials.credentials,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated"
            )
            
            user_id = payload.get("sub")
            email = payload.get("email")
            role = payload.get("user_metadata", {}).get("role", "user")
            
            if not user_id or not email:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid user token"
                )
            
            return {
                "id": user_id,
                "email": email,
                "role": role
            }
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    # No valid authentication provided
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Provide either Bearer token or X-API-Key header.",
        headers={"WWW-Authenticate": "Bearer"},
    )


# Dependency for routes requiring authentication (JWT or API key)
async def require_auth(current_user: Dict[str, Any] = Depends(get_current_user_or_api_key)) -> Dict[str, Any]:
    """Require authentication (JWT or API Key)"""
    return current_user


# Dependency for routes requiring admin
async def require_admin(current_user: Dict[str, Any] = Depends(get_current_user_or_api_key)) -> Dict[str, Any]:
    """Require admin role (JWT or API Key)"""
    if not is_admin(current_user.get("role", "")):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return current_user

