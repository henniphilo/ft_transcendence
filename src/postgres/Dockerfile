FROM postgres:16

# this config file will enable logging
COPY postgresql.conf /etc/postgresql/postgresql.conf

# Set the entrypoint to run PostgreSQL with the specified configuration file
CMD ["postgres", "-c", "config_file=/etc/postgresql/postgresql.conf"]