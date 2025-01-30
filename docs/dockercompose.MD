```mermaid
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'primaryColor': '#FFC4C4',
    'primaryTextColor': '#5C5757',
    'primaryBorderColor': '#FFA5A5',
    'secondaryColor': '#CAFFBF',
    'tertiaryColor': '#FDFCDC',
    'lineColor': '#90E0EF',
    'fontFamily': 'monospace',
    'fontSize': '14px'
  }
}}%%
flowchart TB
    A[(Postgres<br/>image: postgres:16)] 
    B[(Backend<br/>build aus ./src)]
    C[(Game<br/>Uvicorn auf Port 8001)]
    D[(NGINX<br/>Port 8080 -> 80)]

    A -->|Docker Network: transcendence_network| B
    B -->|API Port 8000| D
    C -->|WebSockets Port 8001| D
    
    A -.->|Volume: postgres_data| A
