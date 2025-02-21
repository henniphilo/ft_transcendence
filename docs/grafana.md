# Graphana


## LGTM Stack

The LGTM stands for Loki, Grafana, Tempo, and Prometheus (or Mimir), which are the key components of this stack. The LGTM stack aims to provide a unified solution for monitoring and troubleshooting modern applications and infrastructure by addressing the three pillars of observability: logs, metrics, and traces.

http://127.0.0.1:3000/login

This Docker image is specifically designed to be a lightweight collector for OpenTelemetry.  It bundles the OTel Collector with a pre-configured set of processors and exporters, often geared towards sending data to Grafana's Loki for logs, Tempo for traces, and Mimir for metrics.  "LGT" likely stands for Loki, Grafana, and Tempo (or Mimir).

Key features:
The core of this image is the OTel Collector. This component is responsible for receiving telemetry data from your applications (or other sources), processing it, and then exporting it to your chosen backends (like Loki, Tempo, and Mimir).
Pre-configured: The grafana/otel-lgtm image comes with a configuration tailored for these backends. This simplifies setup, as you don't have to write the collector configuration from scratch. However, you'll likely still need to customize it to fit your specific needs.
Lightweight: The image is optimized to be small and efficient, making it suitable for running in resource-constrained environments.
How to use it:

Running the container: You're already running the container, which is great.  Make sure you're mapping the necessary ports and volumes.  A typical command might look like this (adjust as needed):

```Bash

docker run -d \
  -p 4317:4317 \ # OTel gRPC port
  -p 4318:4318 \ # OTel HTTP port
  -v ./otel-collector-config.yaml:/etc/otelcol-config.yaml \ # Mount your config
  grafana/otel-lgtm
```
Ports: 4317 and 4318 are the standard ports for the OTel Collector. You'll need to expose these so your applications can send telemetry data to the collector.
Volumes: Mounting a configuration file (otel-collector-config.yaml) is crucial. This allows you to customize the collector's behavior.
Configuration (otel-collector-config.yaml): This is the most important part.  You'll need to create this file to define:

Receivers: How the collector receives data (e.g., OTLP, Jaeger, Prometheus).
Processors: Any transformations or enrichment you want to apply to the data (e.g., adding attributes, filtering).
Exporters: Where the collector sends the data (e.g., Loki, Tempo, Mimir).
A basic example (sending logs to Loki) might look like this:

```
YAML

receivers:
  otlp: # Receive data via OTLP
    protocols:
      grpc:
      http:

processors:
  batch: # Batch data for efficient export

exporters:
  loki:
    endpoint: "http://loki:3100" # Your Loki endpoint

service:
  pipelines:
    logs:
      receivers: [otlp]
      processors: [batch]
      exporters: [loki]
```
Instrumenting your applications:  You'll need to instrument your applications to send telemetry data to the OTel Collector.  This involves using OTel libraries in your code to generate traces, metrics, and logs.  Make sure your OTel SDK is configured to send data to the collector's address (e.g., localhost:4317 or the Docker container's IP).

## Links

https://hub.docker.com/r/grafana/otel-lgtm  
https://github.com/grafana/docker-otel-lgtm/  



```bash

```

## Loki 

### test the connection

First of all in the grafana dashboard, go to connections and datasources. Click on Loki. On the bottom of the page you will see  button: Test. This will tell you if Loki is connected and running.

Next you can click on the explore button to start building queries.

 
 ## The main Grafana image

 The otel-lgtm image is good for development but it seems that it cannot work with redis?

 When configuring a new Redis data source in Grafana, you need to use the service name and port as defined in your Docker Compose file. Since your Redis service is defined in Docker Compose and mapped to port 6380 on the host, you should use the internal Docker network address.

### Redis Data Source Configuration in Grafana
Use the following settings to configure the Redis data source in Grafana:

- **Host**: `redis:6379`
- **Password**: (if you have set a password for Redis, provide it here)

### Steps to Add Redis Data Source in Grafana:
1. **Access Grafana**:
   Open your browser and go to `http://localhost:3000`. Log in with your credentials (default is `admin`/`admin`).

2. **Add Redis Data Source**:
   - Go to **Configuration** > **Data Sources**.
   - Click **Add data source**.
   - Select **Redis** from the list of available data sources.
   - Configure the Redis data source with the following settings:
     - **Host**: `redis:6379`
     - **Password**: (if you have set a password for Redis, provide it here)

3. **Save & Test**:
   - Click **Save & Test** to ensure the data source is working correctly.

### Example Configuration:
```yaml
services:
  redis:
    <<: *common
    image: "redis:alpine"
    ports:
      - "6380:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --save 60 1 --loglevel verbose
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  grafana:
    <<: *common
    build: 
      context: ./src/grafana
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - GF_AUTH_ANONYMOUS_ORG_ROLE=Admin
      - GF_AUTH_ANONYMOUS_ENABLED=true
      - GF_AUTH_BASIC_ENABLED=false
      - GF_AUTH_DISABLE_LOGIN_FORM=false
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=grafana
      - GF_INSTALL_PLUGINS=redis-datasource
      - GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS=redis-datasource
    volumes:
      - grafana_data:/var/lib/grafana
      - ./src/grafana:/etc/grafana/provisioning/datasources
      - ./config/grafana-datasources.yml:/etc/grafana/provisioning/datasources/datasources.yml
      - ./src/grafana/dashboard.yaml:/etc/grafana/provisioning/dashboards/main.yaml
      - ./src/grafana/dashboards:/var/lib/grafana/dashboards
    depends_on:
      - redis
      - loki
      - tempo
```

By using `redis:6379` as the host in the Grafana Redis data source configuration, you should be able to connect to your Redis instance running in the Docker container.