import os
import pytest

# List of required environment variables
REQUIRED_ENV_VARS = [
    "POSTGRES_USER",
    "POSTGRES_PASSWORD",
    "POSTGRES_DB",
    "GF_SECURITY_ADMIN_USER",
    "GF_SECURITY_ADMIN_PASSWORD",
    "DATABASE_URL",
    "CLOUDFLARE_TUNNEL_TOKEN",
    "EMAIL_HOST",
    "EMAIL_PORT",
    "EMAIL_HOST_USER",
    "EMAIL_HOST_PASSWORD",
    "EMAIL_FROM",
    "EMAIL_TO",
    "DJANGO_SECRET_KEY",
    "ETH_PRIVATE_KEY",
]

def test_env_variables_exist():
    """Test that all required environment variables are set."""
    missing_vars = [var for var in REQUIRED_ENV_VARS if not os.getenv(var)]
    assert not missing_vars, f"Missing required environment variables: {', '.join(missing_vars)}"

def test_database_url_format():
    """Test that DATABASE_URL is correctly formatted."""
    database_url = os.getenv("DATABASE_URL")
    assert database_url is not None, "DATABASE_URL is not set"
    assert database_url.startswith("postgresql://"), "DATABASE_URL must start with 'postgresql://'"