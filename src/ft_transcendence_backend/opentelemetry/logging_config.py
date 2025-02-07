import logging
from loki_logger import LokiHandler

def setup_logging():
    handler = LokiHandler(
        url="http://grafana:3100/loki/api/v1/push",
        tags={"application": "django"},
        version="1",
    )

    logging.basicConfig(
        level=logging.INFO,
        handlers=[handler],
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    logging.getLogger().addHandler(handler)