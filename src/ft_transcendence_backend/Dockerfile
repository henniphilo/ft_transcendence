FROM python:3.10

RUN mkdir -p /app/logs
WORKDIR /app

# Kopiere requirements und installiere
COPY requirements.txt .
# Upgrade pip first
RUN python -m pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Kopiere den restlichen Code
COPY . .

# Setze den Port für Django
EXPOSE 8001

# Standardbefehl
CMD ["python", "manage.py", "runserver", "0.0.0.0:8001"]

# # Default command to run the instrumented app
# CMD ["opentelemetry-instrument", \
#      "--traces_exporter", "otlp", \
#      "--metrics_exporter", "otlp", \
#      "--logs_exporter", "otlp", \
#      "--service_name", "django-server", \
#      "python", "manage.py", "runserver", "0.0.0.0:8001"]