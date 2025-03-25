# alert manager  

# AlertManager Email Configuration 

```yaml
global:
  resolve_timeout: 1m
  smtp_smarthost: 'smtp-relay.brevo.com:587'
  smtp_from: 'u-acht@pongbahnhof.de'  
  smtp_auth_username: '8881eb001@smtp-brevo.com'
  smtp_auth_password: 'Z8rOCaLt4b1EwTph'
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
  - to: 'metter2ooo@gmail.com'
    send_resolved: true
    headers:
      subject: '{{ template "email.default.subject" . }}'
    html: '{{ template "email.default.html" . }}'
```

## Key Fixes

1. **SMTP Authentication**:
   - The `smtp_from` must match a domain you're authorized to send from in Brevo

2. **Proper Email Templates**:
   - Using the default AlertManager templates which work better than hardcoded HTML

## Verification Steps

1. **Test SMTP Connection**:
   ```bash
   telnet smtp-relay.brevo.com 587
   ```
   (You should see SMTP server response)

2. **Check AlertManager Logs**:
   ```bash
   docker logs alertmanager
   ```
   Look for SMTP connection errors

3. **Verify Alert is Firing**:
   - Check Prometheus alerts page (http://your-prometheus:9090/alerts)
   - Check AlertManager UI (http://your-alertmanager:9093)

4. **Test with Simpler Alert**:
   Try a simpler alert rule that fires immediately:
   ```yaml
   groups:
   - name: immediate-test
     rules:
     - alert: ImmediateTest
       expr: vector(1)
       labels:
         severity: critical
       annotations:
         summary: "Immediate Test Alert"
   ```

## Additional Troubleshooting

- Make sure your Brevo account allows SMTP sending
- Check if your account has enough credits for sending emails
- Verify that port 587 isn't blocked by your firewall
- Try using `smtp-relay.brevo.com:25` with TLS disabled if you continue having issues


## Explanation of send_resolved:
When send_resolved: true:

Alertmanager will send a notification when an alert is resolved (i.e., the condition that triggered the alert is no longer true).
This is useful for informing the recipients that the issue has been fixed or is no longer occurring.
When send_resolved: false (default):

Alertmanager will only send notifications when an alert is firing.
No notification will be sent when the alert is resolved.


## links  

https://prometheus.io/docs/alerting/latest/configuration/  
https://github.com/prometheus/alertmanager  