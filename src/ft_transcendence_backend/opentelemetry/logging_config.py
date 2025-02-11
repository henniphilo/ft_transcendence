# opentelemetry_config.py

from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.instrumentation.django import DjangoInstrumentor
import logging
import logging.config
import os

OTEL_RESOURCE_ATTRIBUTES = {
    "service.name": "django-app",
    "service.namespace": "backend",
    "service.version": "1.0.0",
    "deployment.environment": os.getenv("ENVIRONMENT", "development"),
    "team.name": "backend",
    "application.framework": "django",
    "application.language": "python"
}

def setup_telemetry_and_logging():
    """
    Configure both OpenTelemetry and logging for Grafana LGTM stack
    """
    # OpenTelemetry setup
    resource = Resource.create(OTEL_RESOURCE_ATTRIBUTES)
    
    # Configure OTLP exporter for OpenTelemetry
    otlp_exporter = OTLPSpanExporter(
        endpoint="http://localhost:4317",  # OTLP gRPC endpoint
        insecure=True  # For development; use SSL in production
    )
    
    tracer_provider = TracerProvider(resource=resource)
    tracer_provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
    trace.set_tracer_provider(tracer_provider)
    
    # Initialize Django instrumentation
    DjangoInstrumentor().instrument()
    
    # Logging configuration
    logging_config = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'verbose': {
                'format': '%(levelname)s %(asctime)s %(name)s %(message)s'
            }
        },
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'formatter': 'verbose',
            },
            'loki': {
                'class': 'logging_loki.LokiHandler',
                'url': 'http://localhost:3100/loki/api/v1/push',
                'tags': {
                    'application': 'django-app',
                    'environment': os.getenv('ENVIRONMENT', 'development')
                },
                'formatter': 'verbose'
            }
        },
        'root': {
            'handlers': ['console', 'loki'],
            'level': os.getenv('LOG_LEVEL', 'INFO'),
        },
        'loggers': {
            'django': {
                'handlers': ['console', 'loki'],
                'level': os.getenv('DJANGO_LOG_LEVEL', 'INFO'),
                'propagate': False,
            },
        }
    }
    
    # Apply logging configuration
    logging.config.dictConfig(logging_config)

# For Django settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'opentelemetry': {
            'class': 'logging.StreamHandler',
        },
    },
    'loggers': {
        'opentelemetry.auto_instrumentation': {
            'handlers': ['opentelemetry'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}
    
# import logging

# def setup_logging():
#     logging.basicConfig(
#         level=logging.INFO,
#         format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
#         handlers=[
#             logging.StreamHandler(),  # Log to console
#             logging.FileHandler("app.log")  # Log to a file
#         ]
#     )

#     # Log a confirmation message
#     logger = logging.getLogger(__name__)
#     logger.info("Logging is set up.")