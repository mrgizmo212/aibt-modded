"""
Celery application for background tasks
Uses Upstash Redis as broker and result backend
"""

from celery import Celery
from config import settings

# Create Celery app
celery_app = Celery(
    'trading',
    broker=f'rediss://default:{settings.REDIS_PASSWORD}@{settings.REDIS_HOST}:{settings.REDIS_PORT}/0',
    backend=f'rediss://default:{settings.REDIS_PASSWORD}@{settings.REDIS_HOST}:{settings.REDIS_PORT}/0',
    broker_connection_retry_on_startup=True
)

# Configure Celery
celery_app.conf.update(
    # Task settings
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    
    # Result backend settings
    result_expires=3600,  # Results expire after 1 hour
    result_extended=True,  # Store more task info
    
    # Broker settings (SSL)
    broker_use_ssl={
        'ssl_cert_reqs': 'required'
    },
    redis_backend_use_ssl={
        'ssl_cert_reqs': 'required'
    },
    
    # Task execution settings
    task_track_started=True,  # Track when task starts
    task_time_limit=7200,  # 2 hour hard limit
    task_soft_time_limit=6600,  # 1h 50m soft limit
    
    # Worker settings
    worker_prefetch_multiplier=1,  # Only fetch 1 task at a time
    worker_max_tasks_per_child=10,  # Restart worker after 10 tasks (prevent memory leaks)
)

# Import tasks directly (autodiscover had path issues on Render)
# This ensures tasks are registered when celery_app is imported
try:
    from workers import trading_tasks
except ImportError as e:
    print(f"Warning: Could not import trading_tasks: {e}")

