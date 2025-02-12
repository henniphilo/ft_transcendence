FROM grafana/otel-lgtm

USER root

# Install required packages using Alpine's package manager
RUN apk update && \
    apk add --no-cache wget curl && \
    rm -rf /var/cache/apk/*

# Install Redis data source plugin
RUN grafana cli plugins install redis-datasource

# Set correct permissions
RUN chown -R grafana:root /var/lib/grafana && \
    chmod -R 777 /var/lib/grafana

USER grafana
