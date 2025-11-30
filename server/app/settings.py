import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

# ==============================================================================
# CORE CONFIGURATION
# ==============================================================================

# Load environment variables from a .env file in the `server/` directory
# Make sure your .env file is in the same directory as manage.py
load_dotenv()

# `BASE_DIR` is the root of the Django project (the `server/` directory)
# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: Keep the secret key used in production secret!
# A default is provided for local development, but this should be overridden in production.
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "django-insecure-default-key-for-dev")

# SECURITY WARNING: Don't run with debug turned on in production!
# The value defaults to False and is only True if the env var is "true", "1", or "t".
DEBUG = os.getenv("DJANGO_DEBUG", "False").lower() in ("true", "1", "t")

# A list of allowed hosts for this Django site. In production, this should be
# set to the domain name of your site.
ALLOWED_HOSTS = os.getenv("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")


# ==============================================================================
# APPLICATION DEFINITION
# ==============================================================================

# Apps are split into three groups for clarity: Django's built-in apps,
# third-party apps, and your project's local apps.

DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "django_otp",
]

LOCAL_APPS = [
    # Add your local apps here, e.g., 'users.apps.UsersConfig'
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS


# ==============================================================================
# MIDDLEWARE CONFIGURATION
# https://docs.djangoproject.com/en/5.0/ref/settings/#middleware
# ==============================================================================

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# ==============================================================================
# URL, WSGI, AND TEMPLATE CONFIGURATION
# ==============================================================================

ROOT_URLCONF = "app.urls"
ASGI_APPLICATION = "app.asgi.application"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],  # A global templates directory
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


# ==============================================================================
# DATABASE CONFIGURATION
# ==============================================================================

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME"),
        "USER": os.getenv("DB_USER"),
        "PASSWORD": os.getenv("DB_PASSWORD"),
        "HOST": os.getenv("DB_HOST"),
        "PORT": os.getenv("DB_PORT", "5432"),
        "CONN_MAX_AGE": 60,
    }
}


# ==============================================================================
# AUTHENTICATION AND PASSWORD VALIDATION
# ==============================================================================

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]


# ==============================================================================
# INTERNATIONALIZATION (I18N)
# https://docs.djangoproject.com/en/5.0/topics/i18n/
# ==============================================================================

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Mogadishu"
USE_I18N = True
USE_TZ = True


# ==============================================================================
# STATIC AND MEDIA FILES
# https://docs.djangoproject.com/en/5.0/howto/static-files/
# ==============================================================================

STATIC_URL = "/static/"
# This is where `collectstatic` will gather all static files for production.
STATIC_ROOT = BASE_DIR / "staticfiles"
# This storage engine handles compression and caching for you.
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Media files are user-uploaded content.
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"


# ==============================================================================
# CACHING (REDIS) AND SESSIONS
# ==============================================================================

REDIS_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/1")
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache",
        "LOCATION": REDIS_URL,
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "SOCKET_CONNECT_TIMEOUT": 5,
            "SOCKET_TIMEOUT": 5,
            "RETRY_ON_TIMEOUT": True,
        },
    }
}

# Use Redis for session storage for better performance and scalability.
SESSION_ENGINE = "django.contrib.sessions.backends.cache"
SESSION_CACHE_ALIAS = "default"


# ==============================================================================
# CELERY CONFIGURATION (BACKGROUND TASKS)
# ==============================================================================

CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://127.0.0.1:6379/0")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://127.0.0.1:6379/0")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE


# ==============================================================================
# THIRD-PARTY LIBRARIES CONFIGURATION
# ==============================================================================

# --- DJANGO REST FRAMEWORK ---
# https://www.django-rest-framework.org/api-guide/settings/
REST_FRAMEWORK = {
    # Authentication & Permissions
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    # Parsers & Renderers
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.FormParser",
        "rest_framework.parsers.MultiPartParser",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
        # "rest_framework.renderers.BrowsableAPIRenderer",  # Disable in production
    ],
    # Throttling (Rate Limiting)
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    # Filtering, Search & Ordering
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
    # Pagination
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 20,
    # Versioning (Optional - enables v1/v2 namespacing)
    "DEFAULT_VERSIONING_CLASS": "rest_framework.versioning.NamespaceVersioning",
}


# The Browsable API is a huge help during development, but it's a security risk
# and an unnecessary overhead in production.
if DEBUG:
    REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"].append(
        "rest_framework.renderers.BrowsableAPIRenderer"
    )

# --- SIMPLE JWT ---
# https://django-rest-framework-simplejwt.readthedocs.io/en/latest/settings.html
SIMPLE_JWT = {
    # Token Lifetimes
    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=15
    ),  # TODO: Consider 15 minutes for production
    "REFRESH_TOKEN_LIFETIME": timedelta(hours=1),
    # Token Rotation
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    # Cryptographic Configuration
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,  # Uses Django's secret key for signing
    # Header Configuration
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_TOKEN_CLASSES": ("rest_framework_simplejwt.tokens.AccessToken",),
    # User Identification
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}
