# AlertManager Documentation

## Introduction

AlertManager is a component of the Prometheus ecosystem that handles alerts sent by Prometheus server. Its primary responsibility is to deduplicate, group, and route alerts to the appropriate recipient integration such as email, Slack, or other notification channels. In our project, AlertManager is configured to send email notifications when specific monitoring thresholds are breached.

## Docker Compose Configuration

Our AlertManager instance is configured in Docker Compose as follows:

```yaml
alertmanager:
  <<: *common
  build:
    context: ./src/grafana
    dockerfile: Dockerfile.alertmanager
  profiles: ["grafanaprofile"]
  container_name: alertmanager
  environment:
    - EMAIL_FROM=${EMAIL_FROM}
    - EMAIL_TO=${EMAIL_TO}
    - EMAIL_HOST=${EMAIL_HOST}
    - EMAIL_PORT=${EMAIL_PORT}
    - EMAIL_HOST_USER=${EMAIL_HOST_USER}
    - EMAIL_HOST_PASSWORD=${EMAIL_HOST_PASSWORD}
  ports:
    - "9093:9093"
  logging:
    driver: gelf
    options:
      gelf-address: "udp://${LOG_HOST}:12201"
      tag: "alertmanager"
```

### Key Configuration Aspects

- **Custom Build**: Uses a custom Dockerfile to include our specific configuration
- **Profiles**: Part of the "grafanaprofile" group for selective startup
- **Environment Variables**: Email configuration is passed through environment variables for security
- **Port Mapping**: Exposes port 9093 for the web interface
- **Logging**: Uses GELF logging driver to integrate with our ELK stack

## AlertManager Configuration

Our AlertManager is configured with email notifications:

```yaml
global:
  resolve_timeout: 1m
  smtp_smarthost: '${EMAIL_HOST}:${EMAIL_PORT}' 
  smtp_from: '${EMAIL_FROM}' 
  smtp_auth_username: '${EMAIL_HOST_USER}'  
  smtp_auth_password: '${EMAIL_HOST_PASSWORD}'  
  smtp_require_tls: true

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 5m
  repeat_interval: 3h
  receiver: 'email-notifications'

receivers:
- name: 'email-notifications'
  email_configs:
  - to: '${EMAIL_TO}'  
    from: '${EMAIL_FROM}'  
    send_resolved: true
    headers:
      subject: '{{ template "email.default.subject" . }}'
    html: '{{ template "email.default.html" . }}'
```

### Configuration Breakdown

#### Global Settings
- **`resolve_timeout`**: How long to wait before resolving an alert (1 minute)
- **`smtp_smarthost`**: The SMTP server used for sending emails
- **`smtp_from`**: The sender email address
- **`smtp_auth_username`**: Username for SMTP authentication
- **`smtp_auth_password`**: Password for SMTP authentication
- **`smtp_require_tls`**: Forces TLS for secure email transmission

#### Routing
- **`group_by`**: Groups alerts by alert name
- **`group_wait`**: Initial wait time before sending a notification for a new group (10s)
- **`group_interval`**: Minimum time between sending two notifications for a group (5m)
- **`repeat_interval`**: Minimum time before resending an alert (3h)
- **`receiver`**: Default receiver for all alerts

#### Receivers
- **Email Notifications**:
  - Configured to send to the specified email addresses
  - Uses default templates for email formatting
  - `send_resolved: true` ensures notifications when alerts are resolved

## Environment Variables

Our AlertManager uses the following environment variables for configuration:
- `EMAIL_FROM`: Sender email address
- `EMAIL_TO`: Recipient email address(es)
- `EMAIL_HOST`: SMTP server hostname
- `EMAIL_PORT`: SMTP server port (typically 587 for TLS)
- `EMAIL_HOST_USER`: SMTP authentication username
- `EMAIL_HOST_PASSWORD`: SMTP authentication password

These variables are set in the .env file or passed through CI/CD secrets for security.

## Email Template Customization

AlertManager uses Go templates for email formatting. The default templates provide:
- Alert summary in the subject line
- Details of the alert in the email body
- Status information (firing/resolved)
- Alert labels and annotations

## Understanding send_resolved

The `send_resolved: true` setting ensures that:
- AlertManager sends a notification when an alert is triggered
- A follow-up notification is sent when the alert condition is resolved
- Recipients are informed when issues are fixed or no longer occurring

When set to `false` (default), only firing alerts trigger notifications.

## Verification Steps

To verify AlertManager is working correctly:

1. **Test SMTP Connection**:
   ```bash
   telnet ${EMAIL_HOST} ${EMAIL_PORT}
   ```

2. **Check AlertManager Logs**:
   ```bash
   docker logs alertmanager
   ```

3. **Verify Alert Routing**:
   - Visit the AlertManager UI at `http://localhost:9093`
   - Check active alerts and their status

4. **Test with a Simple Alert**:
   Add a test alert rule to Prometheus that will trigger immediately:
   ```yaml
   groups:
   - name: test-alerts
     rules:
     - alert: TestAlert
       expr: vector(1)
       labels:
         severity: info
       annotations:
         summary: "Test alert for email verification"
         description: "This is a test alert to verify email notifications"
   ```

## Common Issues and Troubleshooting

1. **SMTP Authentication Failures**:
   - Ensure your SMTP credentials are correct
   - Verify that your email provider allows SMTP access
   - Check if you need to generate an app password (common with Gmail)

2. **TLS Connection Issues**:
   - Verify port 587 is open for TLS connections
   - Try alternating between port 25, 465, or 587 depending on your provider
   - Consider setting `smtp_require_tls: false` for testing

3. **Email Not Received**:
   - Check spam/junk folders
   - Verify the recipient email address is correct
   - Ensure your sender domain has proper SPF/DKIM records

4. **Alert Grouping Issues**:
   - Adjust `group_by` settings to control how alerts are grouped
   - Modify `group_wait` and `group_interval` to change notification timing

## Accessing AlertManager

The AlertManager web interface is accessible at:
```
http://localhost:9093
```

Key pages:
- **Alerts**: View current alerts and their status
- **Silences**: Create and manage silences to suppress notifications
- **Status**: Check configuration and runtime information

## Integration with Prometheus

Prometheus is configured to send alerts to AlertManager through the `alerting` section in its configuration:

```yaml
alerting:
  alertmanagers:
  - static_configs:
    - targets: ['alertmanager:9093']
```

## Resources and Documentation

- [AlertManager Documentation](https://prometheus.io/docs/alerting/latest/configuration/)
- [AlertManager GitHub Repository](https://github.com/prometheus/alertmanager)
- [Email Template Documentation](https://prometheus.io/docs/alerting/latest/notification_examples/)