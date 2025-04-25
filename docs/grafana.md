# Grafana Documentation

## Introduction

Grafana is an open-source analytics and monitoring platform that provides visualization capabilities for time-series data. In our project, we use Grafana exclusively with Prometheus for system and application metrics monitoring. This setup enables us to visualize performance metrics, track usage patterns, and detect anomalies in our application.

## Configuration

Our Grafana instance is configured using a custom Docker image and configuration file. The configuration ensures that Grafana is accessible through a sub-path in our reverse proxy setup.

### Docker Compose Configuration

```yaml
grafana:
  <<: *common
  build: 
    context: ./src/grafana
    dockerfile: Dockerfile.grafana
  profiles: ["grafanaprofile"]
  container_name: grafana
  ports:
    - "3000:3000"
  environment:
    - GF_AUTH_ANONYMOUS_ORG_ROLE=Admin
    - GF_AUTH_BASIC_ENABLED=true
    - ENABLE_LOGS_GRAFANA=true
    - GF_SECURITY_ADMIN_USER=${GF_SECURITY_ADMIN_USER}
    - GF_SECURITY_ADMIN_PASSWORD=${GF_SECURITY_ADMIN_PASSWORD}
    - GF_INSTALL_PLUGINS=redis-datasource
    - GF_PLUGINS_ALLOW_LOADING_UNSIGNED_PLUGINS=redis-datasource
  depends_on:
    redis:
      condition: service_healthy
  logging:
    driver: gelf
    options:
      gelf-address: "udp://${LOG_HOST}:12201"
      tag: "grafana"
  healthcheck:
    test: ["CMD-SHELL", "curl -f http://localhost:3000 || exit 1"]
    interval: 30s
    timeout: 10s
    retries: 5
```

### Key Configuration Aspects

- **Custom Build**: We build Grafana from a custom Dockerfile to include specific configurations
- **Port Mapping**: Exposed on port 3000 for direct access
- **Environment Variables**:
  - Authentication configured via environment variables
  - Redis datasource plugin enabled for monitoring Redis metrics
- **Persistence**: Dashboards and settings are saved in persistent volumes
- **Healthcheck**: Regular health monitoring to ensure availability
- **Logging**: Uses GELF logging driver to integrate with our ELK stack

### Grafana INI Configuration

We use a custom `grafana.ini` file to configure Grafana's core behavior:

```ini
[server]
root_url = http://localhost/grafana/
serve_from_sub_path = true

[log]
mode = file
level = info
file_name = /var/log/grafana/grafana.log
```

This configuration enables:
- **Sub-path Access**: Allows Grafana to be served from a sub-path (/grafana/) in our URL structure
- **Logging Configuration**: Logs are written to files for debugging and monitoring

## Data Sources

In this project, we exclusively use **Prometheus** as our metrics data source. Prometheus collects and stores time-series metrics from our services, which Grafana visualizes.

We also utilize the Redis data source plugin to monitor Redis performance directly.

## Dashboards

Our Grafana implementation includes several pre-configured dashboards for monitoring:

1. **System Overview**: CPU, memory, and disk usage metrics
2. **Redis Performance**: Redis operations, memory usage, and connections
3. **Backend Services**: API response times, request counts, and error rates
4. **PostgreSQL Metrics**: Database performance and query statistics

These dashboards are saved persistently in Docker volumes, ensuring they remain available across container restarts.

## Accessing Grafana

Grafana is accessible at `http://localhost:3000` or via the `/grafana/` path through our reverse proxy.

Login credentials are configured via environment variables:
- Username: Set via `GF_SECURITY_ADMIN_USER`
- Password: Set via `GF_SECURITY_ADMIN_PASSWORD`

## Development vs. Production Usage

This configuration is primarily intended for development environments. For production, additional security measures would be recommended, such as:
- Disabling anonymous access
- Implementing proper authentication (LDAP, OAuth, etc.)
- Configuring more restrictive permissions
