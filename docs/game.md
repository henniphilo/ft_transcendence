# Game



## logging
For your **game service** (which uses Uvicorn/FastAPI), you should use a slightly different logging setup than Django. Here’s the **optimized configuration** that matches your Django setup (stdout + GELF) while being tailored for Uvicorn’s async nature:

---

### **Updated Game Service Logging (Uvicorn + GELF)**
```python
# In your game service (e.g., pong_game.py or logging_config.py)
import logging.config
from pygelf import GelfUdpHandler

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'json': {
            '()': 'pythonjsonlogger.jsonlogger.JsonFormatter',
            'format': '''
                %(asctime)s %(levelname)s %(name)s
                %(module)s %(process)d %(thread)d %(message)s
            ''',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'gelf': {
            'class': 'pygelf.GelfUdpHandler',
            'host': 'logstash',  # Docker service name
            'port': 12201,       # GELF UDP port
            'formatter': 'json',
            'include_extra_fields': True,  # Adds extra context (e.g., game_id)
            'compress': True,     # Optional: Reduces network overhead
        },
    },
    'loggers': {
        # Uvicorn's core loggers
        'uvicorn': {
            'handlers': ['console', 'gelf'],
            'level': 'INFO',
            'propagate': False,
        },
        'uvicorn.error': {
            'level': 'INFO',
            'propagate': False,
        },
        'uvicorn.access': {
            'handlers': ['console', 'gelf'],
            'level': 'INFO',
            'propagate': False,
        },
        # Your game-specific logger
        'game': {
            'handlers': ['console', 'gelf'],
            'level': 'DEBUG',  # Debug for game logic (adjust as needed)
            'propagate': False,
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}

# Apply the config
logging.config.dictConfig(LOGGING)
```

---

### **Key Differences from Django Setup**
1. **Uvicorn-Specific Loggers**  
   - `uvicorn`, `uvicorn.error`, `uvicorn.access` are configured separately for granular control.

2. **No FileHandler** (Optional)  
   - Since you’re using Docker, stdout (`console`) and GELF are sufficient.  
   - Add `FileHandler` back if you need persistent logs outside Docker.

3. **Game-Specific Logger**  
   - Use `logger = logging.getLogger('game')` in your code to log game events.  
   - Example:
     ```python
     logger.debug(f"Player {player_id} scored", extra={'game_id': game_id})
     ```

---

### **Required Steps**
1. **Install Dependencies** (in your game service’s `requirements.txt`):
   ```bash
   pygelf>=1.0.0
   python-json-logger>=2.0.0
   ```

2. **Update Logstash Config** (same as Django):  
   Ensure Logstash accepts GELF UDP input on port `12201`.

3. **Test Logs**:
   - **Stdout**: `docker compose logs game` (human-readable).  
   - **GELF**: Check Logstash/Kibana for structured JSON logs.

---

### **Why This Works**
- **Async-Friendly**: GELF over UDP won’t block the game loop.  
- **Structured Logs**: JSON + GELF ensures logs include context (e.g., `game_id`).  
- **Unified with Django**: Same Logstash host/port for centralized logging.

---

### **Optional Tweaks**
1. **Add File Logging** (if needed):
   ```python
   'handlers': {
       'file': {
           'level': 'DEBUG',
           'class': 'logging.FileHandler',
           'filename': '/app/logs/game.log',
           'formatter': 'verbose',
       },
   },
   ```
   Mount the volume in `docker-compose.yml`:
   ```yaml
   volumes:
     - game_logs:/app/logs
   ```

2. **Filter Sensitive Data**:
   ```python
   'filters': {
       'remove_sensitive': {
           '()': 'myapp.filters.SensitiveDataFilter',
       },
   },
   'handlers': {
       'gelf': {
           'filters': ['remove_sensitive'],
       },
   },
   ```

3. **Custom GELF Fields** (e.g., for game analytics):
   ```python
   logger.info(
       "Game event",
       extra={
           '_game_id': game_id,
           '_player_count': 4,
       }
   )
   ```

---

### **Example Log Output**
- **Stdout** (human-readable):
  ```
  INFO 2025-04-01 12:34:56 game.pong_game 1 140735806934848 Player 3 scored
  ```
- **GELF** (in Logstash/Kibana):
  ```json
  {
    "timestamp": "2025-04-01T12:34:56.123Z",
    "level": "INFO",
    "logger": "game",
    "module": "pong_game",
    "message": "Player 3 scored",
    "_game_id": "abc123",
    "_player_count": 4
  }
  ```

This setup ensures your game service logs are **visible in real-time** (stdout) and **searchable in Logstash** (GELF), without the socket pickling errors. 🎮📊