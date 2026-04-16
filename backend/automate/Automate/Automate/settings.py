import os
from datetime import timedelta
from pathlib import Path

# --------------------------------------------------
# Base directory
# --------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent


# --------------------------------------------------
# Security
# --------------------------------------------------
SECRET_KEY = "change-me-for-production"
DEBUG = True
ALLOWED_HOSTS = []


# --------------------------------------------------
# Applications
# --------------------------------------------------
INSTALLED_APPS = [
    "corsheaders",
    "rest_framework",

    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "AutoApp",
]


# --------------------------------------------------
# Middleware
# --------------------------------------------------
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
]


# --------------------------------------------------
# URL & WSGI
# --------------------------------------------------
ROOT_URLCONF = "Automate.urls"
WSGI_APPLICATION = "Automate.wsgi.application"


# --------------------------------------------------
# Templates
# --------------------------------------------------
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
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


# --------------------------------------------------
# Database
# --------------------------------------------------
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": "automate",
        "USER": "django",
        "PASSWORD": "password",
        "HOST": "127.0.0.1",
        "PORT": "3306",
    }
}


# --------------------------------------------------
# Internationalization
# --------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True


# --------------------------------------------------
# Static files
# --------------------------------------------------
STATIC_URL = "/static/"


# --------------------------------------------------
# CORS
# --------------------------------------------------
CORS_ALLOW_ALL_ORIGINS = True


# --------------------------------------------------
# Authentication
# --------------------------------------------------
AUTH_USER_MODEL = "AutoApp.User"


# --------------------------------------------------
# Django REST Framework
# --------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
}


# --------------------------------------------------
# JWT Configuration
# --------------------------------------------------
SIMPLE_JWT = {
    "USER_ID_FIELD": "user_id",
    "USER_ID_CLAIM": "user_id",

    "ACCESS_TOKEN_LIFETIME": timedelta(hours=2),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),

    "AUTH_HEADER_TYPES": ("Bearer",),
}
