FROM postgres:16

# Copy the custom configuration file
COPY postgresql.conf /etc/postgresql/postgresql.conf

# Set the user to postgres (as you did, which is correct)

# Correct permissions for the configuration file
RUN chmod 644 /etc/postgresql/postgresql.conf
USER postgres

# Permissions for the data directory are handled by the postgres base image.
# You should not need to change them.
# The base image handles the correct permissions on startup.

# Use the custom entrypoint
ENTRYPOINT ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"]