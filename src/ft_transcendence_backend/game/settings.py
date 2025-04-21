import os
import logging.config


class GameSettings:
    def __init__(self):
        print("Initializing GameSettings")
        self._ball_speed = 3
        self._paddle_speed = 5
        self._winning_score = 2
        self._paddle_size = "middle"
        self._mode = "online"
        self._difficulty = "medium"
        self._ubahn_size = 1.0  # Standardgröße für das U-Bahn-Modell
        self._player1_profile = None  # Neues Feld für Player1-Profil
        self._player2_profile = None  # Neues Feld für Player2-Profil

        self.update_ubahn_size()  # Initiale Skalierung setzen

    @property
    def ball_speed(self):
        print(f"Getting ball_speed: {self._ball_speed}")
        return self._ball_speed

    @ball_speed.setter
    def ball_speed(self, value: int):
        print(f"Setting ball_speed to: {value}")
        if 1 <= value <= 10:
            self._ball_speed = value
        else:
            raise ValueError("Ball speed must be between 1 and 10")

    @property
    def paddle_speed(self):
        print(f"Getting paddle_speed: {self._paddle_speed}")
        return self._paddle_speed

    @paddle_speed.setter
    def paddle_speed(self, value: int):
        print(f"Setting paddle_speed to: {value}")
        if 1 <= value <= 10:
            self._paddle_speed = value
        else:
            raise ValueError("Paddle speed must be between 1 and 10")

    @property
    def winning_score(self):
        print(f"Getting winning_score: {self._winning_score}")
        return self._winning_score

    @winning_score.setter
    def winning_score(self, value: int):
        print(f"Setting winning_score to: {value}")
        if 1 <= value <= 20:
            self._winning_score = value
        else:
            raise ValueError("Winning score must be between 1 and 20")

    @property
    def paddle_size(self):
        print(f"Getting paddle_size: {self._paddle_size}")
        return self._paddle_size

    @paddle_size.setter
    def paddle_size(self, value: str):
        print(f"Setting paddle_size to: {value}")
        if value in ["small", "middle", "big"]:
            self._paddle_size = value
            self.update_ubahn_size()  # U-Bahn-Größe automatisch aktualisieren
        else:
            raise ValueError("Paddle size must be 'small', 'middle', or 'big'")

    def update_ubahn_size(self):
        """Passt die U-Bahn-Größe basierend auf der Paddle-Größe an."""
        size_mapping = {
            "small": 0.8,  # Kleinere Skalierung
            "middle": 1.0,  # Standardgröße
            "big": 1.2  # Größere Skalierung
        }
        self._ubahn_size = size_mapping[self._paddle_size]
        print(f"U-Bahn size updated to: {self._ubahn_size}")

    @property
    def ubahn_size(self):
        print(f"Getting ubahn_size: {self._ubahn_size}")
        return self._ubahn_size

    @property
    def mode(self):
        print(f"Getting mode: {self._mode}")
        return self._mode

    @mode.setter
    def mode(self, value: str):
        print(f"Setting mode to: {value}")
        if value in ["online", "ai", "local"]:
            self._mode = value
        else:
            raise ValueError("Mode must be 'online', 'ai', or 'local'")

    @property
    def difficulty(self):
        print(f"Getting difficulty: {self._difficulty}")
        return self._difficulty

    @difficulty.setter
    def difficulty(self, value: str):
        print(f"Setting difficulty to: {value}")
        if value in ["easy", "medium", "impossible"]:
            self._difficulty = value
        else:
            raise ValueError("Difficulty must be 'easy', 'medium', or 'impossible'")

    @property
    def player1_profile(self):
        print(f"Getting player1_profile: {self._player1_profile}")
        return self._player1_profile

    @player1_profile.setter
    def player1_profile(self, value):
        print(f"Setting player1_profile to: {value}")
        self._player1_profile = value

    @property
    def player2_profile(self):
        print(f"Getting player2_profile: {self._player2_profile}")
        return self._player2_profile

    @player2_profile.setter
    def player2_profile(self, value):
        print(f"Setting player2_profile to: {value}")
        self._player2_profile = value

    def get_settings(self):
        print("Getting all settings")
        settings = {
            "ball_speed": self._ball_speed,
            "paddle_speed": self._paddle_speed,
            "winning_score": self._winning_score,
            "paddle_size": self._paddle_size,
            "mode": self._mode,
            "difficulty": self._difficulty,
            "ubahn_size": self._ubahn_size,  # U-Bahn-Größe mit ausgeben
        }
        
        # Füge User-Profile nur hinzu, wenn sie nicht None sind
        if self._player1_profile is not None:
            settings["player1_profile"] = self._player1_profile
        if self._player2_profile is not None:
            settings["player2_profile"] = self._player2_profile
            
        return settings

async def update_settings(self, settings_data):
    print(f"Updating settings with data: {settings_data}")
    try:
        if "ball_speed" in settings_data:
            self.ball_speed = int(settings_data["ball_speed"])
        if "paddle_speed" in settings_data:
            self.paddle_speed = int(settings_data["paddle_speed"])
        if "winning_score" in settings_data:
            self.winning_score = int(settings_data["winning_score"])
        if "paddle_size" in settings_data:
            self.paddle_size = settings_data["paddle_size"]
            self.update_ubahn_size()  # ✅ U-Bahn-Größe wird neu berechnet
        if "mode" in settings_data:
            self.mode = settings_data["mode"]
        if "difficulty" in settings_data:
            self.difficulty = settings_data["difficulty"]
        if "player1_profile" in settings_data:
            self.player1_profile = settings_data["player1_profile"]
        if "player2_profile" in settings_data:
            self.player2_profile = settings_data["player2_profile"]

        updated_settings = self.get_settings()
        print(f"Settings successfully updated to: {updated_settings}")
        return {"action": "settings_updated", "settings": updated_settings}

    except (ValueError, TypeError) as e:
        print(f"Error updating settings: {str(e)}")
        return {"action": "error", "message": str(e)}



LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
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

# Ensure the logs directory exists
os.makedirs('/app/logs', exist_ok=True)
