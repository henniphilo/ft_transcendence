# Caddy vs. Nginx

## Caddy
Caddy is a modern web server designed for ease of use, with automatic HTTPS and a simple configuration.

### Features:
- **Automatic HTTPS**: Caddy automatically obtains and renews SSL certificates.
- **Simple Configuration**: Uses a straightforward `Caddyfile` syntax.
- **Supports HTTP/2 and HTTP/3**: Offers better performance and modern web standards.
- **Built-in Reverse Proxy**: Can act as a reverse proxy with minimal configuration.
- **Automatic Certificate Management**: Uses Let's Encrypt by default.

### Use Cases:
- Small to medium-sized web applications
- Developers who want a simple, automated web server
- Quickly setting up secure reverse proxies


## Our implementation
The Caddyfile is a configuration file for the Caddy web server. It defines how Caddy should handle incoming HTTP requests, including serving static files and reverse proxying requests to backend services.  

```Caddyfile
:80 {
    log {
        output file /var/log/caddy/access.log
        format json
    }

    root * /usr/share/caddy
    file_server

    @static {
        path /static/*
    }
    handle @static {
        root * /usr/share/caddy/static
        file_server
    }

    @api {
        path /api/*
    }
    handle @api {
        reverse_proxy backend:8000
    }

    @ws {
        path /ws/*
    }
    handle @ws {
        reverse_proxy backend:8001
    }

    @media {
        path /media/*
    }
    handle @media {
        reverse_proxy backend:8000
    }
}
```

### Explanation

Global Configuration for Port 80:

`:80 { ... }` specifies that the configuration inside the block applies to HTTP requests on port 80.

#### Logging:
`log { ... }` configures logging.  
output file `/var/log/caddy/access.log` specifies the log file location.  
format json sets the log format to JSON.  

#### Root Directory and File Server:
`root * /usr/share/caddy` sets the root directory for serving files.
`file_server` enables the file server to serve static files from the root directory.

#### Static Files Handling:
`@static { path /static/* }` defines a matcher for requests to `/static/*`.  
`handle @static { ... }` handles requests matching the `@static` matcher.  
`root * /usr/share/caddy/static` sets the root directory for static files.  
`file_server` serves the static files.  

#### API Requests Handling:
`@api { path /api/* }` defines a matcher for requests to `/api/*`.   
`handle @api { ... }` handles requests matching the `@api` matcher.  
`reverse_proxy backend:8000` proxies the requests to the backend service running on port 8000.  

WebSocket Requests Handling:
`@ws { path /ws/* }` defines a matcher for WebSocket requests to `/ws/*`.  
`handle @ws { ... }` handles requests matching the @ws matcher.  
`reverse_proxy backend:8001` proxies the WebSocket requests to the backend service running on port 8001.

Media Requests Handling:
`@media { path /media/* }` defines a matcher for requests to `/media/*`.  
`handle @media { ... }` handles requests matching the @media matcher.  
`reverse_proxy backend:8000` proxies the media requests to the backend service running on port 8000.