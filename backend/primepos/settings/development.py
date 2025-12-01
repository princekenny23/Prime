"""
Development settings
"""
from .base import *

DEBUG = True

# Allow all origins in development
CORS_ALLOW_ALL_ORIGINS = True

# Database can use SQLite for quick development
# Uncomment to use SQLite instead of PostgreSQL
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.sqlite3',
#         'NAME': BASE_DIR / 'db.sqlite3',
#     }
# }

