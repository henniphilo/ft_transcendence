# Elastic Stack (ELK) Documentation

## Introduction to ELK Stack

The ELK Stack (Elasticsearch, Logstash, and Kibana) is a powerful open-source log management and analytics platform. It consists of three main components that work together to ingest, process, analyze, and visualize log data:

- **Elasticsearch**: A distributed, RESTful search and analytics engine
- **Logstash**: A data processing pipeline that ingests, transforms, and ships data
- **Kibana**: A web-based visualization and exploration tool

In our development environment, the ELK Stack serves as a comprehensive logging solution that helps developers debug issues, monitor application behavior, and gain insights into system performance.

## ELK vs. Grafana Loki

While we use Grafana for metrics visualization, the ELK Stack has different strengths:

| Feature | ELK Stack | Grafana Loki |
|---------|-----------|--------------|
| Data Storage | Document-based (Elasticsearch) | Log entries only (more lightweight) |
| Querying | Full-text search, complex queries | LogQL (more limited, but efficient) |
| Resource Usage | Higher (more powerful) | Lower (more efficient) |
| Use Case | Full log analytics, complex searches | Simple log aggregation and visualization |
| Adoption | Industry standard, widely adopted | Newer, gaining popularity |

ELK is generally preferred when you need powerful search capabilities and complex analytics, while Loki is better suited for simple log storage and basic querying with lower resource requirements.

## Components and Their Roles

### Elasticsearch

Elasticsearch is the core of the ELK Stack, functioning as a distributed, RESTful search and analytics engine designed for horizontal scalability. It:

- Stores all of your log data in a searchable index
- Enables near real-time searching and analytics
- Provides a RESTful API for data operations
- Handles distributed storage and search

Read more about Elastic Search here: [elastic_search.md](elastic_search.md).

### Logstash

Logstash is the data processing pipeline that ingests data from multiple sources, transforms it, and sends it to Elasticsearch. It:

- Collects logs from various sources (GELF, syslog, files, etc.)
- Parses and transforms logs using filters
- Enriches data with additional context
- Forwards processed data to Elasticsearch

Read more about Elastic Search here: [logstash.md](logstash.md).

### Kibana

Kibana is the visualization platform designed to work with Elasticsearch. It:

- Provides a user-friendly web interface for exploring logs
- Offers customizable dashboards for data visualization
- Enables creation of searches, graphs, charts, and tables
- Includes tools for log analysis and monitoring

**Example Configuration:**
```yaml
# kibana.yml
server.name: kibana
server.host: "0.0.0.0"
elasticsearch.hosts: ["http://elasticsearch:9200"]
monitoring.ui.container.elasticsearch.enabled: true
```

## Accessing the ELK Stack

To access the Kibana dashboard (the web interface for the ELK Stack):

1. Open your browser and navigate to `http://localhost:5601`
2. Log in with the default credentials (typically `elastic`/`changeme` unless specified otherwise)

## Navigating Kibana

### 1. **Create an Index Pattern**
When first accessing Kibana, you'll need to create an index pattern:
- Go to Management → Stack Management → Index Patterns → Create index pattern
- Enter `docker-logs-*` as the pattern
- Select `@timestamp` as the Time field
- Click "Create index pattern"

### 2. **Discover Logs**
To view and search logs:
- Click on "Discover" in the left sidebar
- Select your index pattern
- Use the search bar to find specific logs (e.g., `tag:backend AND http_status:500`)
- Adjust the time range in the upper right corner

### 3. **Create Visualizations**
To create visualizations from your log data:
- Go to "Visualize" in the left sidebar
- Click "Create new visualization"
- Choose a visualization type (e.g., bar chart, pie chart, data table)
- Select your index pattern
- Configure the visualization settings (metrics, buckets, etc.)

### 4. **Build Dashboards**
To create custom dashboards:
- Go to "Dashboard" in the left sidebar
- Click "Create new dashboard"
- Add visualizations by clicking "Add"
- Arrange and resize visualizations as needed
- Save your dashboard for future use

## Development vs. Production Usage

In our project, the ELK Stack is primarily used in the development environment for several reasons:
- **Resource intensive**: The full ELK Stack requires significant resources
- **Complexity**: In production, you may want a more manageable logging solution
- **Development focus**: Detailed logging is most valuable during development

For production environments, you might consider:
- Using a managed ELK service (like Elastic Cloud)
- Implementing log rotation and retention policies
- Setting up proper security measures for the ELK Stack

## Conclusion

The ELK Stack provides a robust solution for log management and analysis during development. By capturing logs from all our containers, transforming them with Logstash, storing them in Elasticsearch, and visualizing them with Kibana, we gain valuable insights into application behavior that help us identify and resolve issues quickly.