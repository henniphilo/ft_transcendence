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


* **Access Node Exporter Metrics:**
    * First, make sure Node Exporter is running correctly and exposing metrics.
    * If you're using Docker Compose, find the Node Exporter service's port mapping (usually `9100`).
    * Open your web browser and navigate to `http://<node-exporter-container-IP or localhost>:9100/metrics`.
    * You should see a large amount of text-based metrics data. If you don't, there's a problem with your Node Exporter container.

**2. Configure Prometheus to Scrape Node Exporter Metrics:**

* **Prometheus Configuration:**
    * Prometheus is the tool that will collect the metrics from Node Exporter.
    * You need to add a scrape job to your Prometheus configuration file (`prometheus.yml`).
    * If you are using docker compose and linking your prometheus container to the node exporter container, you can use the container name as the hostname.
* **Example `prometheus.yml` Snippet:**

```yaml
scrape_configs:
  - job_name: "node_exporter"
    static_configs:
      - targets: ["node-exporter:9100"] #use the container name and the port
```

* **Explanation:**
    * `job_name`: A label to identify this scrape job.
    * `static_configs`: Defines the target(s) to scrape.
    * `targets`: The Node Exporter's address and port.

**3. Restart Prometheus:**

* **Apply Changes:**
    * After modifying `prometheus.yml`, you need to restart your Prometheus container to apply the changes.
    * If you are using docker-compose.
        * `docker-compose restart prometheus`

**4. Verify Prometheus is Scrapping Node Exporter:**

* **Prometheus Web UI:**
    * Open the Prometheus web UI in your browser (usually `http://localhost:9090`).
    * Go to "Status" -> "Targets."
    * You should see your Node Exporter target listed, and its state should be "UP."
    * If the state is down, check the prometheus logs for errors.

**5. Add a Prometheus Data Source to Grafana:**

* **Grafana UI:**
    * Open your Grafana web UI (usually `http://localhost:3000`).
    * Go to "Configuration" -> "Data Sources."
    * Click "Add data source."
    * Select "Prometheus."
* **Prometheus URL:**
    * Enter the URL of your Prometheus server (e.g., `http://prometheus:9090` if you're using Docker Compose and linking containers).
    * Click "Save & test."

**6. Create a Grafana Dashboard:**

* **New Dashboard:**
	* add the data source to grafana
    * In Grafana, you can also click on the + sign and add by number id. There is a premade dashboard with id 13978 for node exporter.
* **Query Metrics:**
    * In the panel's query editor, start typing metric names from Node Exporter (e.g., `node_cpu_seconds_total`).
    * Grafana will suggest metrics as you type.
    * Use Prometheus Query Language (PromQL) to create graphs and visualizations.
* **Example Query:**
    * To get CPU utilization: `100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)`


Once the Node Exporter Container is running, you can access its metrics by visiting the following URL in your web browser: 

Then Prometheus will scrape the metrics from the Node Exporter and store them in its time-series database. Check if everything is ok here:
http://localhost:9090/targets

## did you know
in docker compose you can inline a docker file
```yaml
dockerfile_inline: |
        FROM grafana/promtail:latest
        RUN apt-get update && apt-get install -y curl
```


# persistence

Yes, your `docker-compose.yml` and `Dockerfile` are correctly configured for Prometheus data persistence.

Here's a breakdown of why it works and some additional points to consider:

**1. `docker-compose.yml` Volume Mount:**

* `volumes: - prometheus_data:/prometheus`: This is the key to persistence.
    * `prometheus_data` defines a named Docker volume. Docker will manage the storage location for this volume.
    * `/prometheus`: This is the directory *inside* the Prometheus container where Prometheus stores its time-series database (TSDB).
    * By mounting the named volume to this directory, you ensure that the TSDB is stored outside the container's ephemeral filesystem.
    * When the container is stopped or removed, the data in the `prometheus_data` volume will persist.
    * When the container is restarted, the data will be reattached to the `/prometheus` directory.

**2. `Dockerfile` CMD:**

* `CMD ["--config.file=/etc/prometheus/prometheus.yml", "--storage.tsdb.path=/prometheus"]`:
    * `--storage.tsdb.path=/prometheus`: This tells Prometheus to store its TSDB in the `/prometheus` directory.
    * This matches the mount point defined in your `docker-compose.yml` file, ensuring that Prometheus uses the persistent volume.

**3. Named Docker Volume:**

* Docker will create and manage the `prometheus_data` volume.
* The actual location of the data on the host system depends on your Docker configuration.
* You can inspect the volume using `docker volume inspect prometheus_data`.

**Additional Considerations:**

* **Volume Size:**
    * Prometheus can consume a significant amount of disk space, especially if you're collecting a lot of metrics.
    * Monitor the size of your `prometheus_data` volume and adjust your storage configuration as needed.
* **Storage Performance:**
    * The performance of your storage can impact Prometheus's performance.
    * If you're experiencing slow queries or high disk I/O, consider using faster storage.
* **Data Retention:**
    * Prometheus has built-in data retention settings.
    * You can configure how long Prometheus keeps data using the `--storage.tsdb.retention.time` or `--storage.tsdb.retention.size` flags in your `prometheus.yml` file. If you don't set a retention time, Prometheus will keep all data.
* **Backup:**
    * While the data is persistent, it's still good practice to back up your `prometheus_data` volume regularly.
    * You can use Docker volume backups or other backup tools.
* **Permissions:**
    * Ensure that the Prometheus container has the necessary permissions to read and write to the `/prometheus` directory. Docker volumes usually handle this automatically, but it's worth checking.
* **Data Migration:**
    * If you need to migrate your Prometheus data to a different machine or storage location, you can back up and restore the `prometheus_data` volume.

**In Summary:**

Your current setup with the named Docker volume and the `Dockerfile`'s `CMD` is sufficient for Prometheus data persistence. Just be mindful of disk space, performance, and backups.



## links  
https://prometheus.io/docs/prometheus/latest/getting_started/  

https://github.com/prometheus/prometheus/tree/main?tab=readme-ov-file  

13978 node exporter quickstart and dashboard
https://grafana.com/grafana/dashboards/13978-node-exporter-quickstart-and-dashboard/  

https://medium.com/@tommyraspati/monitoring-your-django-project-with-prometheus-and-grafana-b06a5ca78744  

id 17658
https://grafana.com/grafana/dashboards/17658-django/
