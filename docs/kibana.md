# Kibana Documentation

## Introduction

Kibana is the visualization platform for the Elastic Stack. It provides a user-friendly interface for exploring, analyzing, and visualizing data stored in Elasticsearch. As the "window" into your log data, Kibana offers various visualization tools, dashboards, and search capabilities to make sense of complex data sets.

## Key Features

- **Data Exploration**: Search and filter through logs using a powerful query language
- **Visualizations**: Create charts, graphs, maps, and other visual representations of your data
- **Dashboards**: Combine visualizations into comprehensive dashboards
- **Discover**: Explore raw log data with advanced filtering and field analysis
- **Dev Tools**: Interact directly with Elasticsearch API
- **Canvas**: Create custom presentations of your data
- **Time-Series Analysis**: Analyze time-based patterns in your data

## Docker Compose Configuration

Our Kibana instance is configured in Docker Compose as follows:

```yaml
kibana:
  <<: *common
  image: kibana:8.17.0
  container_name: kibana
  profiles: ["elkprofile"]
  restart: always       
  ports:
  - '5601:5601'
  environment:
    - ELASTICSEARCH_URL=http://elasticsearch:9200
  depends_on:
    elasticsearch:
      condition: service_healthy
  volumes:
    - kibana_data:/usr/share/kibana/data 
  healthcheck:
    test: ["CMD-SHELL", "curl -s -f http://localhost:5601/api/status || exit 1"]
    interval: 30s
    timeout: 10s
    retries: 3
```

### Key Configuration Aspects

- **Image**: Using Kibana 8.17.0 to match our Elasticsearch version
- **Profiles**: Part of the "elkprofile" group for selective startup
- **Ports**: Exposes port 5601 for web interface access
- **Environment Variables**: Configured to connect to Elasticsearch
- **Dependencies**: Waits for Elasticsearch to be healthy before starting
- **Volumes**: Stores data in a persistent volume for configuration continuity
- **Healthcheck**: Regularly checks the Kibana API status to ensure availability

## Configuration File

We use a simple but effective kibana.yml configuration:

```yaml
# kibana.yml
server.host: "0.0.0.0"
server.port: 5601
elasticsearch.hosts: ["http://elasticsearch:9200"]
```

This configuration:
- **server.host**: "0.0.0.0" allows connections from any IP address
- **server.port**: Sets the listening port to 5601
- **elasticsearch.hosts**: Connects to our Elasticsearch instance

We've intentionally kept security features disabled for development purposes, as this setup is running behind a reverse proxy and is not exposed to the public internet.

## Using Kibana for Log Analysis

### Creating Index Patterns

Before you can explore log data, you need to create an index pattern:

1. Navigate to Management → Stack Management → Index Patterns
2. Click "Create index pattern"
3. Enter `docker-logs-*` to match our daily Logstash indices
4. Select `@timestamp` as the Time field
5. Click "Create index pattern"

### Discovering Logs

The Discover tab allows you to search and filter logs:

1. Select your index pattern
2. Use the time picker to select a relevant time range
3. Enter queries in the search bar using Kibana Query Language (KQL) or Lucene syntax
   - Example: `tag:backend AND http_status:500` to find server errors
4. Select relevant fields to display in the column view
5. Analyze log frequency with the time histogram

### Creating Visualizations

Kibana offers various visualization types:

1. **Line Charts**: For time-series data like request volume over time
2. **Pie Charts**: For categorical data like HTTP status code distribution
3. **Data Tables**: For detailed numerical data like slow queries
4. **Metric Visualizations**: For single-value displays like total errors
5. **Heat Maps**: For displaying density of events

To create a visualization:
1. Go to Visualize → Create new visualization
2. Select a visualization type
3. Choose your index pattern
4. Configure metrics and buckets
5. Save your visualization

### Building Dashboards

Combine visualizations into dashboards for a comprehensive view:

1. Go to Dashboard → Create new dashboard
2. Add visualizations using the "Add" button
3. Arrange and resize panels as needed
4. Set up filters that apply to the entire dashboard
5. Save your dashboard for future use

## Verifying Kibana Health

To verify if Kibana is working correctly:

### 1. **Access Kibana Web Interface**
   - Open your browser and navigate to:
     ```
     http://localhost:5601
     ```

### 2. **Check Kibana Status API**
   - Use curl to query the status:
     ```bash
     curl -X GET "http://localhost:5601/api/status"
     ```

### 3. **Check Kibana Logs**
   - View the Docker logs:
     ```bash
     docker compose logs kibana
     ```

### 4. **Verify Elasticsearch Connection**
   - Check Elasticsearch health:
     ```
     http://localhost:9200/_cluster/health
     ```

## Development vs. Production Considerations

This Kibana configuration is optimized for development use. For production environments, consider:

- Enabling security features with proper authentication
- Implementing TLS/SSL for encrypted communications
- Configuring role-based access control
- Setting up more granular user permissions
- Implementing proper backup strategies for Kibana saved objects
