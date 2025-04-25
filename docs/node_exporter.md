# Node Exporter Documentation

## Introduction

Node Exporter is a Prometheus exporter for hardware and OS metrics exposed by *NIX kernels. It provides detailed insights into system-level resources including CPU, memory, disk, network, and more. In our architecture, Node Exporter serves as the primary source of infrastructure metrics, enabling effective resource monitoring and capacity planning.

## Configuration in Docker Compose

We've configured Node Exporter as follows:

```yaml
node-exporter:
  <<: *common
  image: prom/node-exporter:latest
  container_name: node-exporter
  profiles: ["grafanaprofile"]
  ports:
    - "9101:9100"
  logging:
    driver: gelf
    options:
      gelf-address: "udp://${LOG_HOST}:12201"
      tag: "node-exporter"
  healthcheck:
    test: ["CMD-SHELL", "curl -f http://localhost:9101/-/healthy || exit 1"]
    interval: 30s
    timeout: 10s
    retries: 5
```

### Key Configuration Aspects

- **Official Image**: Uses the official `prom/node-exporter` image for reliable metrics collection
- **Port Mapping**: Exposes port 9100 (mapped to 9101 on the host) for metrics access
- **Profiles**: Part of the "grafanaprofile" group for selective startup
- **Logging**: Integrates with our ELK stack via GELF
- **Healthcheck**: Ensures the exporter is functioning properly

## Prometheus Integration

Node Exporter is configured as a scrape target in Prometheus:

```yaml
scrape_configs:
  - job_name: "node"
    static_configs:
      - targets: ["node-exporter:9100"]
```

This allows Prometheus to automatically collect all system metrics exposed by Node Exporter.

## Available Metrics

Node Exporter exposes hundreds of metrics across several categories:

| Category | Description | Example Metrics |
|----------|-------------|-----------------|
| CPU | Processor usage and statistics | `node_cpu_seconds_total`, `node_load1/5/15` |
| Memory | RAM usage and allocation | `node_memory_MemAvailable_bytes`, `node_memory_MemFree_bytes` |
| Disk | Storage usage and I/O | `node_filesystem_free_bytes`, `node_disk_io_time_seconds_total` |
| Network | Interface traffic and errors | `node_network_receive_bytes_total`, `node_network_transmit_errors_total` |
| System | Uptime, process counts | `node_time_seconds`, `node_procs_running` |

## Grafana Dashboard Integration

For optimal visualization, we use the official Node Exporter dashboard in Grafana (Dashboard ID: 1860). This dashboard provides comprehensive views of:

1. **System Load**: CPU usage, load averages, and context switches
2. **Memory Usage**: Available memory, cached memory, and swap usage
3. **Disk Space**: Filesystem usage across all mounted volumes
4. **Disk I/O**: Read/write operations and latency
5. **Network Traffic**: Bandwidth usage and error rates

To import this dashboard:
1. Navigate to Grafana → Dashboards → Import
2. Enter the dashboard ID: 1860
3. Select your Prometheus data source
4. Click Import

## Accessing Node Exporter Metrics Directly

You can access raw metrics at:
```
http://localhost:9101/metrics
```

This endpoint returns all available metrics in Prometheus format, useful for debugging or exploring available metrics.

## Customizing Node Exporter

While we use the default configuration, Node Exporter can be customized with various flags:

```yaml
command:
  - '--collector.filesystem.ignored-mount-points=^/(sys|proc|dev|host|etc)($|/)'
  - '--collector.textfile.directory=/node_exporter/textfile_collector'
```

Common customizations include:
- Ignoring specific filesystems
- Enabling/disabling specific collectors
- Adding textfile collector for custom metrics

## Security Considerations

In production environments, consider:
- Restricting network access to the Node Exporter port
- Using TLS for secure metrics collection
- Running with reduced privileges

## Troubleshooting

If metrics aren't appearing in Prometheus:

1. Check Node Exporter is running:
   ```bash
   docker compose ps node-exporter
   ```

2. Verify metrics endpoint is accessible:
   ```bash
   curl http://localhost:9101/metrics
   ```

3. Check Prometheus targets status:
   ```
   http://localhost:9090/targets
   ```

4. Review Node Exporter logs:
   ```bash
   docker compose logs node-exporter
   ```
