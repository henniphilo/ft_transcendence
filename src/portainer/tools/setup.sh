#!/bin/sh

PORTAINER_HOME=/var/lib/portainer
PORTAINER_VERSION=2.14.2

echo "[portainer] Setting up Portainer..."

mkdir ${PORTAINER_HOME} && \
addgroup -S portainer && \
adduser -S -D -g "" -G portainer -s /bin/sh -h ${PORTAINER_HOME} portainer && \
chown portainer:portainer ${PORTAINER_HOME}

curl -sSL https://github.com/portainer/portainer/releases/download/${PORTAINER_VERSION}/portainer-${PORTAINER_VERSION}-linux-amd64.tar.gz | \
    tar -xzo -C /usr/local

echo "[portainer] Portainer setup complete."

exec /usr/local/portainer/portainer

