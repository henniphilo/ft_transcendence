# Graphana


## LGTM Stack

The LGTM stands for Loki, Grafana, Tempo, and Prometheus (or Mimir), which are the key components of this stack. The LGTM stack aims to provide a unified solution for monitoring and troubleshooting modern applications and infrastructure by addressing the three pillars of observability: logs, metrics, and traces.

http://127.0.0.1:3000/login

This Docker image is specifically designed to be a lightweight collector for OpenTelemetry.  It bundles the OTel Collector with a pre-configured set of processors and exporters, often geared towards sending data to Grafana's Loki for logs, Tempo for traces, and Mimir for metrics.  "LGT" likely stands for Loki, Grafana, and Tempo (or Mimir).

Key features:
OTel Collector: The core of this image is the OTel Collector. This component is responsible for receiving telemetry data from your applications (or other sources), processing it, and then exporting it to your chosen backends (like Loki, Tempo, and Mimir).
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