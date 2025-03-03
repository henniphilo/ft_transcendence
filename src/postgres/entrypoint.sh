#!/bin/sh

# Read secrets from files and export as environment variables
export POSTGRES_USER=$(cat /run/secrets/postgres_user)
export POSTGRES_PASSWORD=$(cat /run/secrets/postgres_password)
export POSTGRES_DB=$(cat /run/secrets/postgres_db)

# debug
echo "POSTGRES_USER: $POSTGRES_USER"
echo "POSTGRES_PASSWORD: $POSTGRES_PASSWORD"
echo "POSTGRES_DB: $POSTGRES_DB"

# Start PostgreSQL with the specified configuration file
exec postgres -c config_file=/etc/postgresql/postgresql.conf