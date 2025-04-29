# Django Prometheus Integration

## Introduction

Our Django application is configured to expose Prometheus metrics, providing detailed insights into application performance, database queries, cache operations, and more. This is achieved through the `django-prometheus` package, which automatically instruments various Django components.

## Configuration in Django

### 1. Installation in Django

The `django-prometheus` package is added to the list of installed applications in settings.py:

```python
INSTALLED_APPS = [
    # ...other apps
    'django_prometheus',
    # ...
]
```

### 2. Middleware Configuration

Two middleware components are added to capture request metrics:

```python
MIDDLEWARE = [
    # ...other middleware
    'django_prometheus.middleware.PrometheusBeforeMiddleware',
    # All other middlewares go here
    'django_prometheus.middleware.PrometheusAfterMiddleware',
]
```

This configuration ensures that:
- `PrometheusBeforeMiddleware` is placed early in the middleware chain
- `PrometheusAfterMiddleware` is placed at the end
- Together, they measure the time taken by each request

### 3. Database Instrumentation

The database backend is replaced with a Prometheus-instrumented version:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django_prometheus.db.backends.postgresql',
        # ...other database settings
    }
}
```

### 4. Cache Instrumentation

Similarly, the cache is instrumented:

```python
CACHES = {
    "default": {
        "BACKEND": "django_prometheus.cache.backends.redis.RedisCache",
        # ...other cache settings
    }
}
```

## URL Configuration

The metrics endpoint is exposed by adding the following to the project's `urls.py`:

```python
from django.urls import path, include

urlpatterns = [
    # ...other URL patterns
    path('', include('django_prometheus.urls')),
]
```

This makes metrics available at `/metrics` on the Django application (accessible at `http://backend:8000/metrics`).

## Available Metrics

Django Prometheus exposes the following key metrics:

| Metric Category | Description | Example |
|----------------|-------------|---------|
| `django_http_requests_total` | Total number of HTTP requests | `django_http_requests_total{method="GET", view="home"}` |
| `django_http_responses_total_by_status` | HTTP responses by status code | `django_http_responses_total_by_status{status="200"}` |
| `django_http_requests_latency_seconds` | Request latency | `django_http_requests_latency_seconds_bucket{le="0.1"}` |
| `django_db_execute_total` | Database operations | `django_db_execute_total{operation="SELECT"}` |
| `django_cache_hits_total` | Cache hits | `django_cache_hits_total{cache_name="default"}` |
| `django_cache_misses_total` | Cache misses | `django_cache_misses_total{cache_name="default"}` |
| `django_model_inserts_total` | Model operations | `django_model_inserts_total{model="user"}` |

## Prometheus Configuration

The Django application's metrics endpoint is configured as a target in Prometheus:

```yaml
scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['backend:8000']
```

Unlike the Caddy setup, we don't need to explicitly configure a metrics path in Django, as `django-prometheus` automatically exposes it at the root `/metrics` path.

## Connection Flow

The metrics flow follows this path:
1. Django application collects metrics via `django-prometheus`
2. Metrics are exposed at `http://backend:8000/metrics`
3. Prometheus scrapes this endpoint at regular intervals
4. Grafana visualizes these metrics in dashboards

## Creating Custom Metrics

For application-specific metrics, you can define custom counters, gauges, and histograms:

```python
from prometheus_client import Counter, Gauge, Histogram

# Define metrics
api_requests_counter = Counter(
    'api_requests_total',
    'Number of API requests processed',
    ['endpoint', 'method']
)

active_users_gauge = Gauge(
    'active_users',
    'Number of currently active users'
)

# Use in your views
def my_view(request):
    api_requests_counter.labels(endpoint='/api/data', method='GET').inc()
    # ...view logic
```

## Grafana Dashboard Considerations

When creating Grafana dashboards for Django metrics:

1. **Request Rate Panel**: 
   ```
   rate(django_http_requests_total[5m])
   ```

2. **Error Rate Panel**:
   ```
   rate(django_http_responses_total_by_status{status=~"5.."}[5m])
   ```

3. **Database Operation Panel**:
   ```
   rate(django_db_execute_total[5m])
   ```

