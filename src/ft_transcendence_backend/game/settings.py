class GameSettings:
    def __init__(self):
        print("Initializing GameSettings")
        self._ball_speed = 2
        self._paddle_speed = 5
        self._winning_score = 5
        self._paddle_size = "middle"
        self._mode = "pvp"
        self._difficulty = "medium"
        self._ubahn_size = 1.0  # Standardgröße für das U-Bahn-Modell

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
        if value in ["pvp", "ai"]:
            self._mode = value
        else:
            raise ValueError("Mode must be 'pvp' or 'ai'")

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

    def get_settings(self):
        print("Getting all settings")
        return {
            "ball_speed": self._ball_speed,
            "paddle_speed": self._paddle_speed,
            "winning_score": self._winning_score,
            "paddle_size": self._paddle_size,
            "mode": self._mode,
            "difficulty": self._difficulty,
            "ubahn_size": self._ubahn_size  # U-Bahn-Größe mit ausgeben
        }

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

        updated_settings = self.get_settings()
        print(f"Settings successfully updated to: {updated_settings}")
        return {"action": "settings_updated", "settings": updated_settings}

    except (ValueError, TypeError) as e:
        print(f"Error updating settings: {str(e)}")
        return {"action": "error", "message": str(e)}

