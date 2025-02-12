FROM caddy:latest

# WORKDIR /etc/caddy

COPY ./Caddyfile /etc/caddy/Caddyfile

# Start Caddy
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
