FROM postgres:16

# this config file will enable logging
COPY postgresql.conf /etc/postgresql/postgresql.conf

# Copy the entrypoint script into the container
COPY entrypoint.sh /tmp/entrypoint.sh

# Make the entrypoint script executable
RUN chmod +x /tmp/entrypoint.sh

USER postgres

# Set the entrypoint to run the custom script
ENTRYPOINT ["/tmp/entrypoint.sh"]