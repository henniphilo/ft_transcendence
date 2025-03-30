#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
import logging


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
    
    logger = logging.getLogger(__name__)
    logger.info("Application starting with logging enabled")
    
    # Example log messages at different levels
    logger.debug("This is a debug message")
    logger.info("Application starting up...")
    logger.warning("This is a warning message")
    logger.error("This is an error message")
    logger.debug("TEST LOG MESSAGE - IS THIS IN JSON?")

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
