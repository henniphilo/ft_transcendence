FROM redis:7.4.2-alpine

# Create the log directory and set permissions
RUN mkdir -p /var/log/redis && chmod -R 0777 /var/log/redis

# Copy the Redis configuration file into the container
COPY redis.conf /usr/local/etc/redis/redis.conf

# Set the entrypoint to run Redis with the specified configuration file
CMD ["redis-server", "/usr/local/etc/redis/redis.conf", "--appendonly", "yes", "--save", "60", "1", "--loglevel", "verbose"]