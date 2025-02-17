from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.instrumentation.django import DjangoInstrumentor
from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
from opentelemetry.exporter.otlp.proto.grpc._log_exporter import OTLPLogExporter
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
    	endpoint="http://tempo:4317",  # Changed from grafana to tempo
    	insecure=True
	)
    otlp_log_exporter = OTLPLogExporter(
   		endpoint="http://tempo:4317",  # Changed from grafana to tempo
    	insecure=True
	)
    
    tracer_provider = TracerProvider(resource=resource)
    tracer_provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
    trace.set_tracer_provider(tracer_provider)
    
    # Initialize Django instrumentation
    DjangoInstrumentor().instrument()
    
    # Create OTLP logging handler
    logger_provider = LoggerProvider(resource=resource)
    otlp_log_exporter = OTLPLogExporter(endpoint="http://grafana:4317", insecure=True)
    logger_provider.add_log_record_processor(BatchLogRecordProcessor(otlp_log_exporter))
    otlp_handler = LoggingHandler(level=logging.INFO, logger_provider=logger_provider)
    
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
            'otlp': {
                '()': lambda: otlp_handler
            }
        },
        'root': {
            'handlers': ['console', 'otlp'],
            'level': os.getenv('LOG_LEVEL', 'INFO'),
        },
        'loggers': {
            'django': {
                'handlers': ['console', 'otlp'],
                'level': os.getenv('DJANGO_LOG_LEVEL', 'INFO'),
                'propagate': False,
            },
        }
    }
    
    # Apply logging configuration
    logging.config.dictConfig(logging_config)