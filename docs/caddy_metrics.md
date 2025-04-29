# Caddy Metrics for Prometheus

## Introduction

Caddy, our reverse proxy server, exposes metrics in Prometheus format, allowing detailed monitoring of HTTP requests, response times, and server performance. This integration is essential for maintaining high-quality service and promptly detecting issues.

## Configuration

### Enabling Metrics in Caddyfile

Caddy natively supports Prometheus metrics with minimal configuration. We've enabled metrics in our Caddyfile using the following directive:

```caddyfile
metrics /metrics
```

This simple line exposes all Caddy metrics at the `/metrics` endpoint, which can be accessed at `http://localhost:8080/metrics` or internally at `http://caddy:80/metrics`.

### Full Caddyfile Context

```caddyfile
:80 {
    # Other directives omitted for brevity
    
    # Various handlers for api, static files, websockets, etc.
    
    # Expose Prometheus metrics
    metrics /metrics
}
```

## Prometheus Configuration

In our `prometheus.yml`, we've configured Prometheus to scrape metrics from Caddy:

```yaml
scrape_configs:
  - job_name: 'caddy'
    static_configs:
      - targets: ['caddy:80'] 
```

This configuration tells Prometheus to:
- Name the job "caddy" for easy identification
- Collect metrics from the Caddy service at its internal network address (port 80)
- Use the default `/metrics` path (implicitly defined)

## Available Metrics

Caddy exposes the following key metrics categories:

| Metric Category | Description | Example |
|----------------|-------------|---------|
| `caddy_http_requests_total` | Total number of HTTP requests by status code | `caddy_http_requests_total{code="200"}` |
| `caddy_http_request_duration_seconds` | Request duration histogram | `caddy_http_request_duration_seconds_sum` |
| `caddy_http_response_size_bytes` | Response size in bytes | `caddy_http_response_size_bytes_sum` |
| `caddy_http_request_size_bytes` | Request size in bytes | `caddy_http_request_size_bytes_sum` |
| `caddy_http_errors_total` | Total number of HTTP errors | `caddy_http_errors_total{zone="example.com"}` |

## Logging and Metrics Correlation

Our Caddy configuration includes structured JSON logging, which complements metrics collection:

```caddyfile
log {
    output file /var/log/caddy/access.log {
        roll_size 100MiB
        roll_keep 5
        roll_keep_for 100d
    }
    output stdout
    format json
    level INFO
}
```

These logs are collected by Logstash (via Docker's GELF driver), allowing correlation between metrics anomalies and specific log events.

## Creating Grafana Dashboards

Using these metrics, we've created Grafana dashboards for monitoring:

1. Request volume by endpoint
2. HTTP status code distribution
3. Response time percentiles
4. Error rates
5. Resource consumption

## Troubleshooting

If Caddy metrics aren't appearing in Prometheus:

1. Verify the metrics endpoint is working:
   ```bash
   curl http://localhost:8080/metrics
   ```

2. Check Prometheus targets:
   ```
   http://localhost:9090/targets
   ```
   
3. Ensure the Caddy container is properly tagged for logging:
   ```yaml
   logging:
     driver: gelf
     options:
       gelf-address: "udp://${LOG_HOST}:12201"
       tag: "caddy"
   ```

## Additional Customization

To add custom labels to metrics or enable additional metrics modules, modify the metrics directive:

```caddyfile
metrics {
    enable_openmetrics_path
    use_caddy_labels
}
```

This feature is particularly useful for categorizing metrics by specific routes or services.