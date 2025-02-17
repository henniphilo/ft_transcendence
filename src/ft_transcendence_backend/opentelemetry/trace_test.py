import logging
from opentelemetry import trace

logger = logging.getLogger(__name__)
tracer = trace.get_tracer(__name__)

def your_view(request):
    logger.info("Processing request")
    
    with tracer.start_as_current_span("test_operation") as span:
        span.set_attribute("test.attribute", "test_value")
        logger.info("Inside span")
        
        # Your view logic here
        return JsonResponse({"status": "ok"})