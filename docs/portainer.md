The `404 Not Found` error indicates that Prometheus is able to reach the Portainer service, but the `/metrics` endpoint does not exist. Portainer does not expose a `/metrics` endpoint by default. Instead, you need to enable metrics in Portainer and configure it to expose the metrics endpoint.

### Step 1: Enable Metrics in Portainer

To enable metrics in Portainer, you need to set the `--metrics` flag when starting the Portainer container. This will expose the metrics at the `/metrics` endpoint.

### Update Docker Compose Configuration for Portainer

Update your Docker Compose configuration to enable metrics in Portainer.

```yaml
portainer:
  <<: *common
  build: src/portainer
  volumes:
    - "/var/run/docker.sock:/var/run/docker.sock:ro"
    - portainer-data:/data
  depends_on:
    - caddy
  ports:
    - "9443:9443"
  command: ["--metrics", "--metrics-address=:9443"]
  healthcheck:
    test: ["CMD-SHELL", "curl -f -k https://localhost:9443 || exit 1"]
    interval: 30s
    timeout: 10s
    retries: 5
```

### Step 2: Verify Prometheus Configuration

Ensure that the Prometheus configuration correctly points to the Portainer service with HTTPS and skips TLS verification.

### Prometheus Configuration (`prometheus.yml`):

```yaml
scrape_configs:
  - job_name: 'prometheus'
    scrape_interval: 5s
    scrape_timeout: 5s
    static_configs:
      - targets: ['prometheus:9090']

  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'caddy'
    static_configs:
      - targets: ['caddy:80']

  - job_name: 'backend'
    static_configs:
      - targets: ['backend:8000']

  - job_name: 'grafana'
    static_configs:
      - targets: ['grafana:3000']

  - job_name: 'loki'
    static_configs:
      - targets: ['loki:3100']

  - job_name: 'tempo'
    static_configs:
      - targets: ['tempo:3200']

  - job_name: 'otel-collector'
    static_configs:
      - targets: ['otel-collector:4317', 'otel-collector:4318']

  - job_name: 'portainer'
    scheme: https
    tls_config:
      insecure_skip_verify: true
    static_configs:
      - targets: ['portainer:9443']
```

### Summary:

1. **Enable Metrics in Portainer**: Update the Docker Compose configuration to enable metrics in Portainer by setting the `--metrics` flag.
2. **Verify Prometheus Configuration**: Ensure that the Prometheus configuration correctly points to the Portainer service with HTTPS and skips TLS verification.

By following these steps, you can ensure that Prometheus can scrape metrics from the Portainer service.