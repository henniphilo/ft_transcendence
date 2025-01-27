class GameSettings:
    def __init__(self):
        print("Initializing GameSettings")
        self._ball_speed = 5
        self._paddle_speed = 5
        self._winning_score = 5
        self._paddle_size = "middle"

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
        else:
            raise ValueError("Paddle size must be 'small', 'middle', or 'big'")

    def get_settings(self):
        print("Getting all settings")
        return {
            "ball_speed": self._ball_speed,
            "paddle_speed": self._paddle_speed,
            "winning_score": self._winning_score,
            "paddle_size": self._paddle_size
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

            updated_settings = self.get_settings()
            print(f"Settings successfully updated to: {updated_settings}")
            return {"action": "settings_updated", "settings": updated_settings}
            
        except (ValueError, TypeError) as e:
            print(f"Error updating settings: {str(e)}")
            return {"action": "error", "message": str(e)} 