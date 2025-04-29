# Logstash Documentation

## Introduction

Logstash is a data processing pipeline that ingests, transforms, and ships log data to various destinations. In our ELK stack, it serves as the central log processor, collecting logs from different services via GELF, parsing them, and sending them to Elasticsearch for storage and analysis.

About GELF see [gelf.md](gelf.md)

## Configuration

Our Logstash service is configured in Docker Compose as follows:

```yaml
logstash:
  <<: *common
  container_name: logstash
  build: ./src/elk/logstash
  profiles: ["elkprofile"]
  restart: always
  command: logstash -f /logstash_dir/logstash.conf 
  ports:
    - "5000:5000/udp" 
    - "9600:9600"
    - "12201:12201/udp"
  environment:
    - ES_JAVA_OPTS=-Xmx1g -Xms1g
    - xpack.monitoring.enabled=true
    - xpack.monitoring.elasticsearch.hosts=http://elasticsearch:9200
```

### Key Configuration Aspects

- **Custom Build**: Uses a Dockerfile from logstash
- **Profiles**: Part of the "elkprofile" group for selective startup
- **Command**: Explicitly runs Logstash with our custom configuration
- **Ports**:
  - 5000/udp: Additional UDP input
  - 9600: Logstash API endpoint
  - 12201/udp: GELF input (used by Docker logging driver)
- **Environment Variables**:
  - `ES_JAVA_OPTS`: Limits JVM heap size to 1GB
  - Monitoring settings to report Logstash metrics to Elasticsearch

## Logstash Pipeline Configuration

Our custom pipeline configuration (`logstash.conf`) handles different log formats from various services:

```properties
input {
  gelf {
    host => "0.0.0.0"
    port => 12201
    type => "docker"
  }
}

filter {
  mutate {
    rename => { "host" => "hostname" }
    gsub => [
      "message", "\r", "",
      "message", "\n", ""
    ]
  }

  # Parse backend logs (tag: "backend")
  if [tag] == "backend" {
    grok {
      match => { 
        "message" => "%{IPORHOST:client_ip}:%{POSINT:client_port} \- \- \[%{MONTHDAY:day}/%{MONTH:month}/%{YEAR:year}:%{TIME:time}\] \"%{WORD:http_method} %{URIPATHPARAM:request_path}.*\" %{NUMBER:http_status} %{NUMBER:response_size}" 
      }
      remove_tag => ["_grokparsefailure"]
      add_tag => ["http_request"]
    }

    date {
      match => ["timestamp", "dd/MMM/yyyy:HH:mm:ss"]
      target => "@timestamp"
      remove_field => ["timestamp"]
    }
  }
  
  # Parse game logs (tag: "game")
  if [tag] == "game" {
    grok {
      match => { 
        "message" => "%{GREEDYDATA:log_message}" 
      }
      remove_tag => ["_grokparsefailure"]
    }
  }

  # Parse redis logs (tag: "redis")
  if [tag] == "redis" {
    grok {
     match => { "message" => "%{NONNEGINT:pid}:%{WORD:log_level}\s+%{MONTHDAY:day} %{MONTH:month} %{YEAR:year} %{TIME:time} (?<redis_priority>[*#\.-]) %{GREEDYDATA:redis_message}" }
      remove_tag => ["_grokparsefailure"]
      add_tag => ["redis_parsed"]
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "docker-logs-%{+yyyy.MM.dd}"
  }
  stdout { codec => rubydebug }
}
```

### Configuration Breakdown

#### Input Section
- **GELF Input**: Listens on all interfaces (0.0.0.0) on port 12201 for GELF-formatted logs from Docker containers
- Sets the type to "docker" for easier filtering

#### Filter Section
- **Mutate Filter**: 
  - Renames "host" field to "hostname" to avoid field conflicts
  - Removes carriage returns and newlines from log messages for cleaner display

- **Backend Logs Parser**:
  - Uses grok pattern to extract fields from Django/HTTP logs
  - Captures client IP, request path, HTTP method, status code, and response size
  - Adds "http_request" tag for easier filtering in Kibana

- **Game Service Logs Parser**:
  - Simple pattern to capture log messages from the game service
  - Can be extended with more specific patterns if needed

- **Redis Logs Parser**:
  - Specialized pattern for Redis log format
  - Extracts process ID, log level, timestamp, and message
  - Adds "redis_parsed" tag for easier filtering

#### Output Section
- **Elasticsearch Output**:
  - Sends processed logs to Elasticsearch at elasticsearch:9200
  - Creates daily indices (docker-logs-YYYY.MM.DD) for better log management
- **Stdout Output**:
  - Also outputs logs to stdout in a readable format for debugging

## Testing and Verification

### Checking if Logstash is Running
1. Check container status:
   ```bash
   docker compose ps logstash
   ```

2. Check Logstash logs:
   ```bash
   docker compose logs logstash
   ```

3. Check if Logstash API is responding:
   ```bash
   curl http://localhost:9600/?pretty
   ```
   This should return information about the Logstash instance.

### Testing GELF Input
Test if the GELF server is reachable:
```bash
echo '{"version":"1.1","host":"test","short_message":"test message"}' | nc -u -w1 localhost 12201
```

Check if the port is open:
```bash
sudo lsof -iUDP -nP | grep 12201
```

### Viewing Processed Logs
1. Check if logs are reaching Elasticsearch:
   ```bash
   curl -X GET "http://localhost:9200/docker-logs-*/_search?pretty&size=5"
   ```

2. Visit Kibana at `http://localhost:5601` and:
   - Create an index pattern for `docker-logs-*`
   - Go to Discover tab to view and search logs
   - Create visualizations based on parsed fields

## Debugging Grok Patterns

If you need to debug or test grok patterns, use the online Grok Debugger at https://grokdebugger.com/

Example pattern:
```grok
%{IPORHOST:client_ip}:%{POSINT:client_port} - - %{MONTHDAY:d}/%{MONTH:m}/%{YEAR:year}:%{TIME:time}\] \"%{WORD:http_method} %{URIPATHPARAM:request_path}.*\" %{NUMBER:http_status} %{NUMBER:response_size}
```

Will match a log line like:
