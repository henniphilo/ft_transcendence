FROM caddy:latest

# WORKDIR /etc/caddy

# curl install
RUN apk update && apk add --no-cache curl && \
	rm -rf /var/cache/apk/*

RUN mkdir -p /var/log/caddy && chmod -R 0755 /var/log/caddy

COPY ./caddy/Caddyfile /etc/caddy/Caddyfile

COPY ft_transcendence_backend/game /usr/share/caddy/game
COPY ft_transcendence_frontend/looks /usr/share/caddy/looks
COPY ft_transcendence_frontend/index.html /usr/share/caddy/
COPY ft_transcendence_frontend/css /usr/share/caddy/css
COPY ft_transcendence_frontend/js /usr/share/caddy/js

# Start Caddy
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
