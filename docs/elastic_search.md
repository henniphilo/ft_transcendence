# elastic search

verify the logs are coming in

```bash
curl -X GET "localhost:9200/_cat/indices?v"
```
You will see something like this 
c4c1c1% curl -X GET "localhost:9200/_cat/indices?v"
health status index                                        uuid                   pri rep docs.count docs.deleted store.size pri.store.size
green  open   .geoip_databases                             lDA_es6AQg2yUTM2YQ8dyA   1   0         40            0       37mb           37mb
green  open   .kibana_task_manager_7.16.2_001              GaePEImzSAG4rPTbkHnpdg   1   0         17         5157        1mb            1mb
green  open   .apm-custom-link                             Ca_K4VlzTDCF9PUd2b4zzg   1   0          0            0       226b           226b
green  open   .kibana_7.16.2_001                           PaOy4E8kT2-U6ngI7nU-iw   1   0         41            5      2.7mb          2.7mb
yellow open   .ds-logs-%{job}-2025.03.23-2025.03.23-000001 kK1cUKu3QWKRfXG7bZRapA   1   1          0            0       226b           226b
yellow open   logstash-2025.03.23-000001                   334yn6VjRJ-KHOHOFh2dFQ   1   1         12            0     66.3kb         66.3kb
green  open   .apm-agent-configuration                     A2LJY0z1Qfylim1oCNSUyA   1   0          0            0       226b           226b
```