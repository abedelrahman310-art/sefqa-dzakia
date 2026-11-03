import os
import sys
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
from django.core.exceptions import ImproperlyConfigured

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables (.env for local development only)
load_dotenv(BASE_DIR.parent / '.env')
load_dotenv(BASE_DIR / '.env')

# Detect test execution environment
IS_TESTING = (
    'test' in sys.argv
    or any('pytest' in m for m in sys.modules)
    or bool(os.environ.get('PYTEST_CURRENT_TEST'))
)

# ═══ Security Settings (Priority 1: Production Security) ═══
# DEBUG must default to False in production
DEBUG = os.environ.get('DJANGO_DEBUG', 'False').lower() in ('true', '1', 'yes')

# SECRET_KEY: No hardcoded fallback. Required; startup must fail if missing.
SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')
if not SECRET_KEY:
    if IS_TESTING:
        SECRET_KEY = 'test-insecure-key-strictly-for-pytest-execution-exceeding-50-characters-length'
    elif not DEBUG:
        raise ImproperlyConfigured("DJANGO_SECRET_KEY environment variable is required in production.")
    else:
        raise ImproperlyConfigured("DJANGO_SECRET_KEY environment variable is missing. Please define it in your .env file.")

# ALLOWED_HOSTS: Must be explicitly configured from environment
raw_allowed_hosts = os.environ.get('DJANGO_ALLOWED_HOSTS')
if raw_allowed_hosts:
    ALLOWED_HOSTS = [h.strip() for h in raw_allowed_hosts.split(',') if h.strip()]
elif 'RENDER' in os.environ:
    ALLOWED_HOSTS = ['.onrender.com', 'localhost', '127.0.0.1']
elif DEBUG or IS_TESTING:
    ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'testserver']
else:
    raise ImproperlyConfigured("DJANGO_ALLOWED_HOSTS environment variable must be explicitly configured in production.")

if 'testserver' not in ALLOWED_HOSTS and (DEBUG or IS_TESTING):
    ALLOWED_HOSTS.append('testserver')

# Application definition
INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party apps
    'channels',
    'pgvector.django',
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'drf_spectacular',

    # Safaqat Institutional Domain Apps
    'apps.users',
    'apps.procurements',
    'apps.bids',
    'apps.contracts',
    'apps.execution',
    'apps.reports',
    'apps.audit',
    'apps.ai_gateway',
    'apps.legal_rag',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'apps.users.middleware.WorkspaceStatusMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'safaqat_core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'safaqat_core.wsgi.application'
ASGI_APPLICATION = 'safaqat_core.asgi.application'

REDIS_HOST = os.environ.get('REDIS_HOST', 'redis')
REDIS_PORT = os.environ.get('REDIS_PORT', '6379')
REDIS_URL = os.environ.get('REDIS_URL', f"redis://{REDIS_HOST}:{REDIS_PORT}/0")

# قنوات Channels باستخدام محرك Redis الإنتاجي (channels_redis)
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [REDIS_URL],
        },
    },
}

if IS_TESTING:
    # بيئة الاختبارات الآلية (CI/CD) بدون حاجة لخادم Redis حقيقي
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer',
        },
    }

# Database
# Default to PostgreSQL, with fallback to SQLite for quick local test runs
DB_ENGINE = os.environ.get('DB_ENGINE', 'postgresql')
if IS_TESTING or DB_ENGINE in ('sqlite', 'sqlite3'):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    database_url = os.environ.get('DATABASE_URL')
    if database_url:
        import urllib.parse
        url = urllib.parse.urlparse(database_url)
        db_name = url.path.lstrip('/')
        db_user = url.username
        db_password = url.password
        db_host = url.hostname
        db_port = str(url.port or 5432)
    else:
        db_name = os.environ.get('POSTGRES_DB')
        db_user = os.environ.get('POSTGRES_USER')
        db_password = os.environ.get('POSTGRES_PASSWORD')
        db_host = os.environ.get('POSTGRES_HOST')
        db_port = os.environ.get('POSTGRES_PORT', '5432')

    if not DEBUG:
        if not (db_name and db_user and db_password and db_host):
            raise ImproperlyConfigured(
                "Database configuration is missing. Provide DATABASE_URL or POSTGRES_* environment variables."
            )

    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': db_name or 'safaqat_db',
            'USER': db_user or 'safaqat_user',
            'PASSWORD': db_password or '',
            'HOST': db_host or 'localhost',
            'PORT': db_port or '5432',
        }
    }

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8},
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Custom User Model
AUTH_USER_MODEL = 'users.CustomUser'

# Internationalization - Algerian Timezone & Arabic Default
LANGUAGE_CODE = 'ar'
TIME_ZONE = 'Africa/Algiers'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Django REST Framework Settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_THROTTLE_CLASSES': (
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ),
    'DEFAULT_THROTTLE_RATES': {
        'anon': '60/minute' if not IS_TESTING else '1000/minute',
        'user': '120/minute' if not IS_TESTING else '1000/minute',
        'login': '15/minute' if not IS_TESTING else '1000/minute',
        'deals_search': '60/minute' if not IS_TESTING else '1000/minute',
        'ai_chat': '20/hour' if not IS_TESTING else '1000/minute',
        'ai_insights': '50/hour' if not IS_TESTING else '1000/minute',
        'ai_analyze_tender': '50/hour' if not IS_TESTING else '1000/minute',
    },
}

# SimpleJWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# CORS Settings (React Frontend Integration)
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://localhost',
    'http://127.0.0.1',
    'http://localhost:80',
    'http://localhost:8080',
]
extra_cors = os.environ.get('CORS_ALLOWED_ORIGINS', '')
if extra_cors:
    CORS_ALLOWED_ORIGINS.extend([o.strip() for o in extra_cors.split(',') if o.strip()])

CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://localhost',
    'http://127.0.0.1',
    'http://localhost:80',
    'http://localhost:8080',
]
extra_csrf = os.environ.get('CSRF_TRUSTED_ORIGINS', '')
if extra_csrf:
    CSRF_TRUSTED_ORIGINS.extend([o.strip() for o in extra_csrf.split(',') if o.strip()])

# drf-spectacular Settings (OpenAPI Documentation)
SPECTACULAR_SETTINGS = {
    'TITLE': 'منصة صفقات ذكية — Algerian Public Procurement API',
    'DESCRIPTION': 'واجهة برمجة التطبيقات لمنصة تسيير الصفقات العمومية وفق القانون رقم 23-12',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

# LLM Gateway Configuration
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "rule_based")
LLM_MODEL = os.getenv("LLM_MODEL", "gemini-1.5-flash")

# Cache Configuration (LocMemCache for dev/testing, Redis for prod)
if REDIS_URL and not IS_TESTING:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": REDIS_URL,
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "safaqat-cache",
        }
    }

# ═══ Production Security Hardening (Priority 1) ═══
if not DEBUG and not IS_TESTING:
    SECURE_SSL_REDIRECT = os.environ.get('DJANGO_SECURE_SSL_REDIRECT', 'True').lower() in ('true', '1', 'yes')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = int(os.environ.get('DJANGO_SECURE_HSTS_SECONDS', '31536000'))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# ═══ Payment Gateway (Chargily Pay V2 / SATIM) ═══
CHARGILY_API_KEY = os.getenv('CHARGILY_API_KEY', '')
CHARGILY_MODE = os.getenv('CHARGILY_MODE', 'test')  # 'test' or 'production'
CHARGILY_BASE_URL = 'https://pay.chargily.net/test/api/v2' if CHARGILY_MODE == 'test' else 'https://pay.chargily.net/api/v2'


