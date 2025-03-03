import os
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc import OTLPSpanExporter
from opentelemetry.instrumentation.django import DjangoInstrumentor
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor

def configure_opentelemetry():
    # Configure the OTLP exporter to send traces to Tempo
    otlp_exporter = OTLPSpanExporter(endpoint=f"{os.environ.get('TEMPO_HOST', 'tempo')}:{os.environ.get('TEMPO_PORT', 4317)}", insecure=True)
    span_processor = BatchSpanProcessor(otlp_exporter)

    # Configure the tracer provider
    provider = TracerProvider()
    provider.add_span_processor(span_processor)
    trace.set_tracer_provider(provider)

    # Instrument Django
    DjangoInstrumentor().instrument()
    FastAPIInstrumentor.instrument_app()

configure_opentelemetry()