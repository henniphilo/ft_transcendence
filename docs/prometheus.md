# Prometheus

## debug
docker run --rm --network transcendence_network curlimages/curl curl http://caddy:8080/metrics
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0
curl: (7) Failed to connect to caddy port 8080 after 1 ms: Could not connect to server


## Node Exporter

Purpose:
The Node Exporter is a Prometheus exporter that collects hardware and
operating system metrics from your host machine.  
It provides metrics like CPU usage, memory usage, disk I/O, network statistics, and more.


## did you know
in docker compose you can inline a docker file
```yaml
dockerfile_inline: |
        FROM grafana/promtail:latest
        RUN apt-get update && apt-get install -y curl
```

## links  
https://prometheus.io/docs/prometheus/latest/getting_started/  

https://github.com/prometheus/prometheus/tree/main?tab=readme-ov-file  
