# Prometheus Documentation

## Introduction

Prometheus is an open-source systems monitoring and alerting toolkit. It collects and stores time-series data as metrics, which makes it ideal for monitoring container environments. In our project, Prometheus serves as the backbone for monitoring service health, performance metrics, and resource utilization.

## Docker Compose Configuration

Our Prometheus instance is configured in Docker Compose as follows:

```yaml
prometheus:
  <<: *common
  build: 
    context: ./src/grafana
    dockerfile: Dockerfile.prometheus
  profiles: ["grafanaprofile"]
  container_name: prometheus
  ports:
    - "9090:9090"
  volumes:
    - prometheus_data:/prometheus
  logging:
    driver: gelf
    options:
      gelf-address: "udp://${LOG_HOST}:12201"
      tag: "prometheus"
  healthcheck:
    test: ["CMD-SHELL", "curl -f http://localhost:9090/-/healthy || exit 1"]
    interval: 30s
    timeout: 10s
    retries: 5
```

### Key Configuration Aspects

- **Custom Build**: Uses a custom Dockerfile to include specific configurations
- **Profiles**: Part of the "grafanaprofile" group, allowing selective startup
- **Port Mapping**: Exposes port 9090 for the web interface and API
- **Persistence**: Stores time-series data in a volume for data retention across restarts
- **Logging**: Uses GELF logging driver to integrate with our ELK stack
- **Healthcheck**: Regularly checks Prometheus health endpoint

## Prometheus Configuration

Our Prometheus is configured to scrape metrics from various services in our stack:

```yaml
global:
  scrape_interval:     15s
  evaluation_interval: 15s
  external_labels:
      monitor: 'transcendence'

# This ensures that Prometheus sends alerts to Alertmanager.
alerting:
  alertmanagers:
  - static_configs:
    - targets: ['alertmanager:9093'] 

rule_files:
  - /etc/prometheus/rules.yaml
  - /etc/prometheus/alerts.yaml
  - /etc/node_exporter_recording_rules.yml

# Prometheus scrapes metrics from the services.
scrape_configs:
  - job_name: 'caddy'
    static_configs:
      - targets: ['caddy:80'] 

  - job_name: 'backend'
    static_configs:
      - targets: ['backend:8000']

  - job_name: "node"
    static_configs:
      - targets: ["node-exporter:9100"]

  - job_name: 'postgresql'
    static_configs:
      - targets: ['postgres-exporter:9187']
  
  - job_name: 'alertmanager'
    static_configs:
      - targets: ['alertmanager:9093']
    
  - job_name: 'prometheus'
    scrape_interval: 5s
    scrape_timeout: 5s
    static_configs:
      - targets: ['prometheus:9090']
```

### Configuration Breakdown

#### Global Settings
- **`scrape_interval`**: Default interval (15s) for collecting metrics
- **`evaluation_interval`**: How often evaluation rules are evaluated
- **`external_labels`**: Labels added to any time series or alerts

#### Alerting
- Configured to send alerts to Alertmanager on port 9093

#### Rule Files
- Paths to recording rules and alerting rules
- Rules for node exporter metrics pre-processing

#### Scrape Configurations
Prometheus collects metrics from the following services:

1. **Caddy**: Web server metrics (port 80)
2. **Backend**: Django application metrics (port 8000)
3. **Node Exporter**: Host machine metrics (CPU, memory, disk, network) on port 9100
4. **PostgreSQL**: Database metrics via postgres-exporter on port 9187
5. **Alertmanager**: Alert handling metrics (port 9093)
6. **Prometheus**: Self-monitoring metrics (port 9090)

## Connected Services

### 1. **Caddy (Reverse Proxy)**
- Exposes metrics about HTTP requests, response times, and status codes
- Useful for monitoring web traffic patterns and identifying issues

### 2. **Backend (Django Application)**
- Provides custom application metrics
- Includes API endpoint performance, database query times, and request counts

### 3. **Node Exporter**
- Collects system-level metrics from the host
- Monitors CPU usage, memory usage, disk I/O, and network statistics
- Essential for identifying resource bottlenecks

### 4. **PostgreSQL (via postgres-exporter)**
- Provides database performance metrics
- Monitors connections, queries, indexes, and table statistics
- Helps identify slow queries and database issues

### 5. **Alertmanager**
- Handles alerts sent by Prometheus
- Deduplicates, groups, and routes alerts to the appropriate receiver
- Manages silences and inhibitions

### 6. **Prometheus (Self-monitoring)**
- Monitors its own performance
- Tracks metrics about internal operations, storage, and query execution

## Data Persistence

Prometheus data is persisted in a Docker volume (`prometheus_data`) to ensure metrics history is preserved across container restarts or rebuilds. This allows for:

- Historical data analysis
- Long-term trend visualization
- Consistent alerting based on historical patterns

The storage location is configured via the `--storage.tsdb.path=/prometheus` parameter in the Dockerfile CMD.

## Accessing Prometheus

The Prometheus web interface is accessible at:
```
http://localhost:9090
```

Key pages:
- **Graph**: For querying and visualizing metrics
- **Alerts**: For viewing configured alert rules and their current status
- **Status > Targets**: For checking the health of monitored services
- **Status > Configuration**: For viewing the current Prometheus configuration

## Node Exporter Integration

The Node Exporter is a key component that provides system-level metrics. To utilize these metrics in Grafana:

1. Prometheus scrapes metrics from the Node Exporter on port 9100
2. In Grafana, you can import the pre-made Node Exporter dashboard (ID: 13978)
3. This dashboard provides visualizations for CPU, memory, disk, and network metrics

## Integration with Grafana

Grafana uses Prometheus as a data source to create dashboards for:
- System metrics from Node Exporter
- PostgreSQL performance metrics
- Backend application metrics
- Web server (Caddy) traffic analysis

## Verifying Prometheus Setup

To verify that Prometheus is correctly scraping metrics from all targets:

1. Access the Prometheus web UI at `http://localhost:9090`
2. Navigate to Status > Targets
3. Check that all targets show "UP" status
4. If any target shows "DOWN", check the target's metrics endpoint directly

For example, to check if Caddy is exposing metrics correctly:
```bash
docker run --rm --network transcendence_network curlimages/curl curl http://caddy:80/metrics
```

## links  
https://prometheus.io/docs/prometheus/latest/getting_started/  

https://github.com/prometheus/prometheus/tree/main?tab=readme-ov-file  

https://medium.com/@tommyraspati/monitoring-your-django-project-with-prometheus-and-grafana-b06a5ca78744  

id13978 node exporter quickstart and dashboard  
https://grafana.com/grafana/dashboards/13978-node-exporter-quickstart-and-dashboard/  

id 17658 dashboard  
https://grafana.com/grafana/dashboards/17658-django/
