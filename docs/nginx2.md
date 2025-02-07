```mermaid
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'primaryColor': '#FFD6A5',
    'primaryTextColor': '#5C5757',
    'primaryBorderColor': '#FFD6A5',
    'secondaryColor': '#CAFFBF',
    'tertiaryColor': '#FDFCDC',
    'lineColor': '#90E0EF',
    'fontFamily': 'monospace',
    'fontSize': '14px'
  }
}}%%
sequenceDiagram
    participant Browser
    participant Nginx
    participant FileSystem
    participant Backend

    Browser->>Nginx: GET / oder /static/ oder /api/ oder /ws/
    
    alt Statische Dateien
        Nginx->>FileSystem: /usr/share/nginx/html (z.B. index.html)
        FileSystem-->>Nginx: Datei gefunden
        Nginx-->>Browser: Datei zurückgeben
    else API-Request
        Nginx->>Backend: Proxy (http://backend:8000/api/)
        Backend-->>Nginx: JSON Response
        Nginx-->>Browser: JSON-Daten
    else WebSocket-Verbindung
        Nginx->>Backend: Proxy (ws://backend:8001)
        Backend-->>Nginx: WS-Nachrichten
        Nginx-->>Browser: WS-Nachrichten
    end


