# Elasticsearch Documentation

## Introduction

Elasticsearch is a distributed, RESTful search and analytics engine capable of addressing a growing number of use cases. In our project, it serves as the core storage component of the ELK stack, storing and indexing all logs for efficient retrieval and analysis.

## Configuration in Docker Compose

Our Elasticsearch instance is configured in the Docker Compose file as follows:

```yaml
elasticsearch:
  <<: *common
  image: elasticsearch:8.17.0
  profiles: ["elkprofile"]
  container_name: elasticsearch
  restart: always
  volumes:
  - elastic_data:/usr/share/elasticsearch/data/
  environment:
    - ES_JAVA_OPTS=-Xmx256m -Xms256m
    - xpack.monitoring.collection.enabled=true
    - discovery.type=single-node
    - xpack.security.enabled=false 
  ports:
  - '9200:9200'
  - '9300:9300'
  healthcheck:
    test: ["CMD-SHELL", "curl -s -f http://localhost:9200/_cluster/health?wait_for_status=yellow || exit 1"]
    interval: 30s
    timeout: 10s
    retries: 3
```

### Key Configuration Parameters

- **Image**: Using Elasticsearch 8.17.0
- **Profiles**: Part of the "elkprofile" group, allowing selective startup
- **Volumes**: Persistent data storage in `elastic_data` volume
- **Environment Variables**:
  - `ES_JAVA_OPTS=-Xmx256m -Xms256m`: Limits Java heap size to 256MB (for development environments)
  - `xpack.monitoring.collection.enabled=true`: Enables monitoring
  - `discovery.type=single-node`: Runs as a single-node cluster (simplified setup)
  - `xpack.security.enabled=false`: Disables security features (acceptable for development behind a reverse proxy)
- **Ports**:
  - 9200: REST API
  - 9300: Inter-node communication
- **Healthcheck**: Ensures the cluster is at least in "yellow" status before marking as healthy

## Security Note

We've disabled X-Pack security (`xpack.security.enabled=false`) because:
1. This setup is for development environments only
2. The service is behind a Cloudflare tunnel and reverse proxy
3. It simplifies development workflow without credentials

In production environments, you should enable security and configure proper authentication.

## Verifying Elasticsearch is Working

You can check if Elasticsearch is running and storing logs by querying the indices:

```bash
curl -X GET "localhost:9200/_cat/indices?v"
```

You should see output similar to:
```
health status index                                                              uuid                   pri rep docs.count docs.deleted store.size pri.store.size dataset.size
green  open   .monitoring-es-7-2025.04.25                                        uW0In4TpQv2msb4DCql5lg   1   0       2245          812      1.7mb          1.7mb        1.7mb
green  open   .monitoring-es-7-2025.04.03                                        0S7L6aziTJmMlH7HaIczXQ   1   0     250559         2070     73.7mb         73.7mb       73.7mb
green  open   .internal.alerts-transform.health.alerts-default-000001            n5YldV6ORKqAM9qz5o6lmw   1   0          0            0       249b           249b         249b
green  open   .monitoring-es-7-2025.04.04                                        2_PB3EpqRTCkTu_MFioPqw   1   0      98084         2958     31.1mb         31.1mb       31.1mb
green  open   .monitoring-es-7-2025.04.02                                        6yp__rcwTVaKXIiSGSPJgQ   1   0     119676          164     34.4mb         34.4mb       34.4mb
yellow open   docker-logs-2025.04.02                                             Pkb61et7RZ2oVVJCbV6STg   1   1      21910            0        9mb            9mb          9mb
yellow open   docker-logs-2025.04.03                                             SdpGQCy8Qpa1LKMf4yc4uA   1   1      43095            0     15.1mb         15.1mb       15.1mb
yellow open   docker-logs-2025.04.25                                             eX9uT92MRjq_8h-h0PZ61g   1   1        310            0    924.6kb        924.6kb      924.6kb
yellow open   docker-logs-2025.04.04                                             GVI2_2WYRCCemmf1GXOhtA   1   1      16626            0      9.4mb          9.4mb        9.4mb
green  open   .monitoring-es-7-2025.03.31                                        ZRL73LwKSamM-QxTuuDPKw   1   0      41108         1908     13.4mb         13.4mb       13.4mb
green  open   .monitoring-kibana-7-2025.04.02                                    QMerNNZhQP-ay4O19nQ4dQ   1   0       9560            0      2.4mb          2.4mb        2.4mb
green  open   .internal.alerts-ml.anomaly-detection.alerts-default-000001        CY4N-VsGTr-UqUfR9OvMsQ   1   0          0            0       249b           249b         249b
green  open   .internal.alerts-observability.slo.alerts-default-000001           jV-sW6JGS1CrJGZYJMNB2Q   1   0          0            0       249b           249b         249b
green  open   .monitoring-kibana-7-2025.03.31                                    Uq0uUifLT--w-bKagxD7ew   1   0       3890            0      1.2mb          1.2mb        1.2mb
green  open   .internal.alerts-default.alerts-default-000001                     dZdwiYdrQEO0PGu967I8cw   1   0          0            0       249b           249b         249b
green  open   .internal.alerts-observability.apm.alerts-default-000001           UOT9SFd5RbaSEdxkGp5IQA   1   0          0            0       249b           249b         249b
green  open   .monitoring-kibana-7-2025.04.04                                    4JxcU9ASSuC3ZcQmlHTEjQ   1   0       5896            0      1.5mb          1.5mb        1.5mb
green  open   .monitoring-kibana-7-2025.04.03                                    WPIwj3TJSkSCZMBZ-bK8_A   1   0      17276            0      4.1mb          4.1mb        4.1mb
green  open   .monitoring-kibana-7-2025.04.25                                    vmF-3mXBS8uyk47avNRHyA   1   0        108            0    271.1kb        271.1kb      271.1kb
green  open   .internal.alerts-observability.metrics.alerts-default-000001       IZEuVIc4Q025DmN42pyNDg   1   0          0            0       249b           249b         249b
green  open   .internal.alerts-ml.anomaly-detection-health.alerts-default-000001 2VO8THBCRGSfYRk8L0vAaw   1   0          0            0       249b           249b         249b
green  open   .internal.alerts-security.alerts-default-000001                    BvcdP4gJSzWipbR_PqSgFg   1   0          0            0       249b           249b         249b
green  open   .internal.alerts-stack.alerts-default-000001                       OCGsnyeITBe-bwlTWad0LQ   1   0          0            0       249b           249b         249b
yellow open   docker-logs-2025.03.31                                             -GZcpfrSRcSLc4yIdYBEAQ   1   1       8280            0      4.3mb          4.3mb        4.3mb
green  open   .internal.alerts-observability.logs.alerts-default-000001          C9ZB1vd7TsG0wKM7BxAf6w   1   0          0            0       249b           249b         249b
green  open   .internal.alerts-observability.uptime.alerts-default-000001        -mbWXkbxT4aBdpkzEdbnxw   1   0          0            0       249b           249b         249b
green  open   .monitoring-logstash-7-2025.04.04                                  u-BYLhC9RYyJu2FLUAER9g   1   0      58562            0      2.9mb          2.9mb        2.9mb
green  open   .monitoring-logstash-7-2025.04.25                                  Hqvx0GxeRsyFx4y1lg0VGw   1   0        932            0    467.3kb        467.3kb      467.3kb
```

You can also visit the Elasticsearch API directly at:
http://localhost:9200/_cat/indices


## Checking Cluster Health

To verify the health of your Elasticsearch cluster:

```bash
curl -X GET "localhost:9200/_cluster/health?pretty"
```
or visit http://localhost:9200/_cluster/health?pretty

This should return a JSON response with details about the cluster status, number of nodes, and other health indicators.

## Useful Elasticsearch API Endpoints

- **Cluster Health**: `http://localhost:9200/_cluster/health`
- **Nodes Info**: `http://localhost:9200/_nodes/stats`
- **Indices**: `http://localhost:9200/_cat/indices?v`
- **Mapping**: `http://localhost:9200/<index_name>/_mapping`

## Managing Elasticsearch

- **Starting the Elasticsearch Container**:
  ```bash
  docker compose --profile elkprofile up elasticsearch
  ```

- **Viewing Logs**:
  ```bash
  docker compose logs elasticsearch
  ```

- **Accessing Elasticsearch Shell**:
  ```bash
  docker compose exec elasticsearch bash
  ```

## Additional Resources

- [Elasticsearch Official Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Elasticsearch Docker Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/docker.html)