import logging

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.StreamHandler(),  # Log to console
            logging.FileHandler("app.log")  # Log to a file
        ]
    )

    # Log a confirmation message
    logger = logging.getLogger(__name__)
    logger.info("Logging is set up.")