# Logstash

Do I need a config file? there are two files to configure and only one file for the bitnami image. There is a default config though so it is not needed.

Based on the Bitnami documentation, here's a simplified approach to test if your Logstash setup works **without** a custom `logstash.conf` file, using the default configuration:

---

### **1. Default Logstash Behavior**
The Bitnami Logstash image already includes a preconfigured `logstash.conf` that:
- Listens for inputs on multiple protocols (TCP, UDP, HTTP, Beats, GELF).
- Outputs data to Elasticsearch at `http://localhost:9200`.

If your use case matches this behavior (e.g., sending logs via Beats to Elasticsearch), **you don’t need a custom `logstash.conf`**.

---

### **2. Minimal Dockerfile**
If you want to test the default configuration, use this stripped-down Dockerfile:
```Dockerfile
FROM bitnami/logstash:8.15.0

# No need to copy logstash.conf or adjust permissions!
# The default configuration is already included.
```

---

### **3. Test the Default Setup**
#### **Step 1: Update Docker Compose**
Ensure your `logstash` service in `docker-compose.yml` has:
- No volumes overriding `/opt/bitnami/logstash/pipeline/`.
- Correct dependencies on Elasticsearch.

Example:
```yaml
logstash:
  image: bitnami/logstash:8.15.0
  profiles: ["elkprofile"]
  networks:
    - appnetwork
  ports:
    - "5044:5044"  # Beats input (Promtail sends logs here)
    - "9600:9600"  # Logstash API
  depends_on:
    elasticsearch:
      condition: service_healthy
```

#### **Step 2: Send Logs via Promtail**
Your Promtail configuration is already correct:
```yaml
clients:
  - url: http://logstash:5044  # Send logs to Logstash's Beats input
```

#### **Step 3: Verify Log Flow**
1. **Check Logstash Logs**:
   ```bash
   docker logs logstash
   ```
   Look for messages like:
   ```
   [logstash.agent           ] Successfully started Logstash API endpoint {:port=>9600}
   [logstash.javapipeline    ] Pipeline started successfully
   ```

2. **Check Elasticsearch Indices**:
   ```bash
   curl http://localhost:9200/_cat/indices?v
   ```
   You should see an index like `logstash-*` if logs are flowing.

3. **Check Kibana**:
   - Create an index pattern for `logstash-*` in Kibana.
   - Explore logs in the **Discover** tab.

---

### **4. When to Use a Custom `logstash.conf`**
You only need a custom configuration if:
- You want to **process logs** (e.g., parse JSON, add fields).
- You need to **customize the Elasticsearch index name**.
- You want to **filter or enrich logs** before sending them to Elasticsearch.

---

### **5. Verify Default Configuration**
To confirm the default `logstash.conf` is being used:
1. Enter the Logstash container:
   ```bash
   docker exec -it logstash bash
   ```
2. View the default configuration:
   ```bash
   cat /opt/bitnami/logstash/pipeline/logstash.conf
   ```
   You should see the default pipeline configuration provided by Bitnami.

---

### **6. Troubleshooting**
If logs aren’t reaching Elasticsearch:
- **Check Promtail Logs**:
  ```bash
  docker logs promtail
  ```
  Ensure Promtail is sending logs to `http://logstash:5044`.

- **Check Network Connectivity**:
  Ensure all services are on the same Docker network (`appnetwork`).

- **Test Logstash Manually**:
  Send a test log to Logstash’s Beats input:
  ```bash
  echo '{"message": "test"}' | nc localhost 5044
  ```
  Check if it appears in Elasticsearch:
  ```bash
  curl -X GET "http://localhost:9200/logstash-*/_search?pretty"
  ```

---

## Grok
you will need a grok debugger at a certain point.
https://grokdebugger.com/
```grok
%{IPORHOST:client_ip}:%{POSINT:client_port} - - %{MONTHDAY:d}/%{MONTH:m}/%{YEAR:year}:%{TIME:time}\] \\\"%{WORD:http_method} %{URIPATHPARAM:request_path}.*\" %{NUMBER:http_status} %{NUMBER:response_size}\\r
```
will match this
```log
172.18.0.2:49524 - - 30/Mar/2025:11:29:24] \"GET /metrics\" 200 19638\r
```


## additional debugging
To check if the GELF server is running on `localhost` on your Mac, follow these steps:

### 1. **Verify if a GELF-compatible server is running**
   - GELF logs are typically sent to a logging server like **Graylog**, **Logstash**, or similar. Ensure that such a server is installed and running on your machine.

   - If you're using **Logstash**, check if it is configured to listen on `udp://localhost:12201`. For example, in the `logstash.conf` file, you should have something like:
     ```plaintext
     input {
       gelf {
         host => "0.0.0.0"
         port => 12201
       }
     }
     ```

### 2. **Check if the port is open**
   Use the `lsof` command to check if something is listening on port `12201`:
   ```bash
   sudo lsof -iUDP -nP | grep 12201
   ```
   - If you see output like this:
     ```
     java    12345 username   123u  IPv4 0x123456789abcdef  UDP *:12201
     ```
     It means a process (e.g., Logstash or Graylog) is listening on port `12201`.

   - If no output is shown, the GELF server is not running or not configured to listen on that port.

### 3. **Test connectivity to the GELF server**
   Use `nc` (Netcat) to test if the GELF server is reachable:
   ```bash
   echo '{"version":"1.1","host":"test","short_message":"test message"}' | nc -u -w1 localhost 12201
   ```
   - If the GELF server is running, it should process the test message.
   - If you get no response or an error, the server is not running or not configured correctly.



### links

remember it is a bitnami container    
https://github.com/bitnami/containers/tree/main/bitnami/logstash  

https://logz.io/blog/debug-logstash/  
https://github.com/logstash-plugins/logstash-patterns-core/blob/main/patterns/ecs-v1/grok-patterns  