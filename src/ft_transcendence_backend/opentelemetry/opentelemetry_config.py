from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.django import DjangoInstrumentor


def setup_opentelemetry():
    # Set up the tracer provider
    trace.set_tracer_provider(TracerProvider())

    # Configure the OTLP exporter
    otlp_exporter = OTLPSpanExporter(endpoint="http://grafana:4317", insecure=True)

    # Add the span processor to the tracer provider
    trace.get_tracer_provider().add_span_processor(BatchSpanProcessor(otlp_exporter))

    # Instrument Django
    DjangoInstrumentor().instrument()