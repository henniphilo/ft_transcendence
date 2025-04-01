# Gelf


Itis docker built in gelf driver.

## macOS and docker
On macOS, localhost inside a container refers to the container itself, not the host machine. If your gelf-address is set to udp://localhost:12201, the containers are trying to send logs to themselves, not to the host.
Solution: Update the gelf-address in your docker-compose.yml to point to the Docker host:
```
gelf-address: "udp://host.docker.internal:12201"
```