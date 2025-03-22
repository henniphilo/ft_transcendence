FROM bitnami/logstash:8.15.0

USER root
# Copy the Logstash pipeline configuration to the correct directory
COPY logstash.conf /opt/bitnami/logstash/pipeline/logstash.conf

# Ensure the copied file has the correct permissions
RUN chmod -R 644 /opt/bitnami/logstash/pipeline/logstash.conf && \
    chown -R 1001:1001 /opt/bitnami/logstash/pipeline/logstash.conf

USER 1001