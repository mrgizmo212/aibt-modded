"""
Authentication and Authorization
Integrates with Supabase Auth and manages approved users
"""

from fastapi import HTTPException, Security, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from jose import jwt, JWTError
from typing import Optional, Dict, Any
from config import settings, is_approved_email, is_admin

# Security scheme
security = HTTPBearer()

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


# Dependency for routes requiring authentication
async def require_auth(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Require authentication"""
    return current_user


# Dependency for routes requiring admin
async def require_admin(current_user: Dict[str, Any] = Depends(get_current_admin)) -> Dict[str, Any]:
    """Require admin role"""
    return current_user

