# PostgreSQL Monitoring with Prometheus

## Introduction

PostgreSQL Exporter is a specialized Prometheus exporter designed to collect 
and expose a wide range of PostgreSQL database metrics.  
This allows for comprehensive monitoring of database performance, 
resource utilization, and query patterns through Prometheus and Grafana.

## Docker Compose Configuration

Our PostgreSQL Exporter is configured in Docker Compose as follows:

```yaml
postgres-exporter:
  <<: *common
  image: bitnami/postgres-exporter:latest
  profiles: ["grafanaprofile"]
  container_name: postgres-exporter
  environment:
    DATA_SOURCE_NAME: "postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}?sslmode=disable"
    DISABLE_DEFAULT_METRICS: "true"
  depends_on:
    postgres:
        condition: service_healthy
    prometheus:
        condition: service_started
  ports:
    - "9187:9187"
```

### Key Configuration Aspects

- **Official Bitnami Image**: Uses the reliable `bitnami/postgres-exporter` image
- **Environment Variables**:
  - `DATA_SOURCE_NAME`: Connection string for the PostgreSQL database
  - `DISABLE_DEFAULT_METRICS`: Customizes which metrics are collected
- **Dependencies**:
  - Waits for PostgreSQL to be healthy before starting
  - Requires Prometheus to be running
- **Port Mapping**: Exposes port 9187 for metrics scraping

## PostgreSQL Configuration for Monitoring

For optimal monitoring, we have configured PostgreSQL with these key settings 
in postgresql.conf:

```
# Enable statistics collection
track_activities = on
track_counts = on
track_io_timing = on
track_functions = all

# Log settings for monitoring
log_destination = 'stderr,csvlog'
logging_collector = on
log_directory = '/var/log/postgresql'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'

# Performance-related settings that affect metrics
shared_buffers = 128MB
max_connections = 100
```

These settings ensure that PostgreSQL tracks the necessary statistics that PostgreSQL Exporter can collect.

## Available Metrics

PostgreSQL Exporter provides a rich set of metrics, including:

| Metric Category | Description | Example Metrics |
|----------------|-------------|-----------------|
| Database Stats | Overall database statistics | `pg_database_size_bytes`, `pg_stat_database_*` |
| Table Stats | Table-level metrics | `pg_stat_user_tables_*`, `pg_statio_user_tables_*` |
| Index Stats | Index usage and efficiency | `pg_stat_user_indexes_*`, `pg_statio_user_indexes_*` |
| Query Stats | Query execution metrics | `pg_stat_statements_*` (if enabled) |
| Connection Stats | Connection pool information | `pg_stat_activity_*`, `pg_stat_database_connections` |
| Replication | Replication lag and status | `pg_stat_replication_*` (if replication is configured) |

## Prometheus Integration

PostgreSQL Exporter is configured as a scrape target in Prometheus:

```yaml
scrape_configs:
  - job_name: 'postgresql'
    static_configs:
      - targets: ['postgres-exporter:9187']
```

Prometheus scrapes these metrics at regular intervals (default 15s), storing them for later querying and visualization.

## Accessing PostgreSQL Metrics

You can directly access the raw metrics exposed by PostgreSQL Exporter at:
```
http://localhost:9187/metrics
```

This endpoint returns all available PostgreSQL metrics in Prometheus format, which is useful for debugging or exploring available metrics.

## Grafana Dashboard Integration

For optimal visualization, we recommend importing one of these Grafana dashboards:

1. **PostgreSQL Database** (Dashboard ID: 9628)
   - Comprehensive view of database performance
   - Includes connections, transactions, cache hits, and more

2. **PostgreSQL Overview** (Dashboard ID: 455)
   - Focus on query performance and table statistics
   - Includes vacuum metrics and buffer usage

To import a dashboard:
1. Navigate to Grafana → Dashboards → Import
2. Enter the dashboard ID (e.g., 9628)
3. Select your Prometheus data source
4. Click Import

## Custom Queries

You can create custom Prometheus queries for specific PostgreSQL metrics:

```
# Database size
pg_database_size_bytes{datname="your_database"}

# Connection count
pg_stat_activity_count{datname="your_database"}

# Transaction rate
rate(pg_stat_database_xact_commit{datname="your_database"}[5m])

# Cache hit ratio
pg_stat_database_blks_hit / (pg_stat_database_blks_hit + pg_stat_database_blks_read)
```

## Troubleshooting

If PostgreSQL metrics aren't appearing in Prometheus:

1. Check if the exporter is running:
   ```bash
   docker compose ps postgres-exporter
   ```

2. Verify the metrics endpoint is accessible:
   ```bash
   curl http://localhost:9187/metrics
   ```

3. Check connection string configuration:
   ```bash
   docker compose logs postgres-exporter
   ```

4. Ensure PostgreSQL is configured to track statistics:
   ```sql
   SELECT * FROM pg_stat_database;
   ```

## links

https://betterstack.com/community/guides/logging/how-to-start-logging-with-postgresql/#setting-up-a-sample-database

https://www.postgresql.org/docs/current/runtime-config-logging.html  
https://stackoverflow.com/questions/30848670/how-to-customize-the-configuration-file-of-the-official-postgresql-docker-image