FROM postgres:16

# Copy the custom configuration file
COPY postgresql.conf /etc/postgresql/postgresql.conf

USER postgres

# Set the entrypoint to run the custom script
ENTRYPOINT [ "postgres", "-c", "config_file=/etc/postgresql/postgresql.conf" ]
