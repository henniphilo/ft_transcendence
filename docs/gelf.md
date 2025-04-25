# GELF (Graylog Extended Log Format)

GELF is a log format designed to address the shortcomings of traditional syslog formats. It was originally developed for the Graylog project but has since become a widely adopted standard in the logging ecosystem.

## Key Features of GELF

- **JSON-based**: GELF messages are structured as JSON objects, making them easy to parse and extend
- **Compression**: GELF supports message compression to reduce bandwidth usage
- **Chunking**: Large messages can be split into chunks to overcome UDP datagram size limitations
- **Standardized Fields**: Includes predefined fields like timestamp, level, host, and message
- **Extensible**: Supports arbitrary additional fields for custom metadata

## GELF in Our ELK Stack

In our project, we use Docker's built-in GELF logging driver to send container logs to Logstash. When we configure the Docker logging driver to use GELF:

```yaml
logging:
  driver: gelf
  options:
    gelf-address: "udp://${LOG_HOST}:12201"
    tag: "service_name"
```

Each container sends its logs to Logstash in GELF format via UDP port 12201. The benefits include:

1. **Structured Logging**: Logs arrive with metadata already structured (container ID, service name, etc.)
2. **Consistent Format**: All container logs follow the same format, simplifying processing
3. **Tag Support**: Each service can be tagged, enabling filtering and custom processing

## GELF Message Structure

A typical GELF message includes:

```json
{
  "version": "1.1",
  "host": "container_id",
  "short_message": "Log message",
  "full_message": "Extended log message (optional)",
  "timestamp": 1618961053.654,
  "level": 6,
  "_container_name": "backend",
  "_tag": "backend",
  "_custom_field": "value"
}
```

- Fields starting with underscore (`_`) are custom fields
- Level values follow syslog severity levels (0=Emergency to 7=Debug)

## macOS and Docker GELF Configuration

On macOS, special consideration is required when configuring GELF logging with Docker. Due to Docker's virtualization layer on macOS:

- `localhost` inside a container refers to the container itself, not the host machine
- If your `gelf-address` is set to `udp://localhost:12201`, containers will try to send logs to themselves, not to the host

**Solution**: Update the `gelf-address` in your docker-compose.yml to point to the Docker host using the special DNS name:

```yaml
logging:
  driver: gelf
  options:
    gelf-address: "udp://host.docker.internal:12201"
    tag: "service_name"
```

The `host.docker.internal` DNS name resolves to the host machine from within Docker containers on macOS, ensuring logs are correctly sent to Logstash running on the host.

## Advantages Over Traditional Logging

1. **Structure**: Unlike plain text logs, GELF provides structured data
2. **Multi-line Support**: GELF handles multi-line stack traces as a single message
3. **Metadata**: Contains valuable context (container ID, service name) without parsing
4. **Efficient Transport**: Supports compression for network efficiency

This is why we chose GELF as the logging format for our Docker-based microservices architecture.