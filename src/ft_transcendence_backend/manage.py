#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

    # Import OpenTelemetry configuration if ENABLE_OTEL is set
    if os.getenv("ENABLE_OTEL"):
        from opentelemetry.opentelemetry_config import setup_opentelemetry
        setup_opentelemetry()
    
	# Setup logging configuration
    from opentelemetry.logging_config import setup_logging
    setup_logging()

    # Log a confirmation message
    import logging
    logger = logging.getLogger(__name__)
    logger.info("Logging to Loki is enabled.")
    
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
