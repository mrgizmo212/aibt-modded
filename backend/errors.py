"""
Enhanced Error Handling
Custom exceptions and error formatters
"""

from fastapi import HTTPException, status
from typing import Any, Dict, Optional
import logging

# Setup logger
logger = logging.getLogger("aibt")
logger.setLevel(logging.INFO)


class AIBTException(HTTPException):
    """Base exception for AIBT API"""
    
    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: Optional[str] = None,
        headers: Optional[Dict[str, Any]] = None
    ):
        super().__init__(status_code=status_code, detail=detail, headers=headers)
        self.error_code = error_code


class AuthenticationError(AIBTException):
    """Authentication failed"""
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            error_code="AUTH_FAILED"
        )


class AuthorizationError(AIBTException):
    """User not authorized for this action"""
    def __init__(self, detail: str = "Not authorized"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="NOT_AUTHORIZED"
        )


class NotFoundError(AIBTException):
    """Resource not found"""
    def __init__(self, resource: str = "Resource"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} not found",
            error_code="NOT_FOUND"
        )


class ValidationError(AIBTException):
    """Request validation failed"""
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
            error_code="VALIDATION_ERROR"
        )


class DatabaseError(AIBTException):
    """Database operation failed"""
    def __init__(self, detail: str = "Database operation failed"):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
            error_code="DB_ERROR"
        )


def log_error(error: Exception, context: str = ""):
    """Log error with context"""
    logger.error(f"{context}: {type(error).__name__} - {str(error)}")


def format_error_response(error: Exception) -> Dict[str, Any]:
    """Format error for JSON response"""
    return {
        "detail": str(error),
        "type": type(error).__name__,
        "timestamp": str(datetime.now())
    }

