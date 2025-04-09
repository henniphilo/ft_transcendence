import random
import math
from typing import Dict, List
from .player import Player, PlayerType, Controls
import logging

# Logger konfigurieren: Ausgabe in "game.log" (diesen Block kannst du bei Bedarf auskommentieren)
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
if not logger.handlers:
    handler = logging.FileHandler("game.log")
    handler.setLevel(logging.DEBUG)  # Stelle sicher, dass auch DEBUG-Nachrichten geloggt werden
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)
    logger.addHandler(handler)


class PongGame:
    def __init__(self, settings: dict, player1: Player, player2: Player):
        self.initial_ball_speed = settings.get("ball_speed", 5)  # Speichere initiale Geschwindigkeit
        self.ball_speed = self.initial_ball_speed  # Aktuelle Geschwindigkeit
        self.paddle_speed = settings.get("paddle_speed", 5)
        self.winning_score = settings.get("winning_score", 5)
        self.owner = settings.get("online_type") == "host"  # Neues Feld für Host/Join

        # Konstanten für Geschwindigkeitserhöhung
        self.SPEED_INCREASE = 0.2  # 20% schneller nach jedem Treffer
        self.MAX_BALL_SPEED = 15   # Maximale Geschwindigkeit

        # Paddle-Größen-Dictionary (jetzt als absolute Größen)
        self.PADDLE_SIZES = {
            "small": 0.4,   # 40% der Spielfeldhöhe
            "middle": 0.6,  # 60% der Spielfeldhöhe
            "big": 0.8      # 80% der Spielfeldhöhe
        }

        self.BALL_SPEED_SCALE = 0.003
        self.PADDLE_SPEED_SCALE = 0.0008  # Hier anpassen für feinere Kontrolle

        self.player1 = player1
        self.player2 = player2

        self.ball_pos = [0.0, 0.0]
        self.ball_direction = [0.0, 0.0]
        self.game_active = False
        self.winner = None

        self.PADDLE_WIDTH = 0.02
        self.PADDLE_HEIGHT = self.PADDLE_SIZES[settings.get("paddle_size", "middle")]
        self.PADDLE_X = 0.95

    def start_game(self):
        self.game_active = True
        # Logger-Eintrag: Spielstart
        # -------------------------------
        logger.info("Spiel gestartet. Starte Ball-Reset.")
        # -------------------------------
        self.reset_ball()

    def reset_ball(self):
        self.ball_pos = [0.0, 0.0]
        self.ball_speed = self.initial_ball_speed  # Reset auf Anfangsgeschwindigkeit

        # Zufällige Startrichtung (±45 Grad, ggf. um 180° gedreht)
        angle = random.uniform(-math.pi/4, math.pi/4)
        if random.choice([True, False]):
            angle += math.pi

        self.ball_direction = [math.cos(angle), math.sin(angle)]

        # Logger-Eintrag: Ball zurückgesetzt
        # -------------------------------
        logger.debug(f"Ball zurückgesetzt: Position={self.ball_pos}, direction={self.ball_direction}, ball_speed={self.ball_speed}")
        # -------------------------------

    def move_paddle(self, player: Player, direction: float):
        if not self.game_active:
            return

        movement = direction * self.paddle_speed * self.PADDLE_SPEED_SCALE
        new_pos = player.paddle_pos + movement

        # Begrenze die Paddle-Position unter Berücksichtigung der Paddle-Höhe
        paddle_limit = 1.0 - self.PADDLE_HEIGHT/2
        player.paddle_pos = max(-paddle_limit, min(paddle_limit, new_pos))

        # Logger-Eintrag: Paddle-Bewegung
        # -------------------------------
        logger.debug(f"Paddle von '{player.name}' bewegt: Richtung={direction}, Neue Position={player.paddle_pos}")
        # -------------------------------

    def check_paddle_collision(self, paddle_pos: float, ball_x: float, ball_y: float) -> bool:
        # Berechne die tatsächlichen Paddle-Grenzen
        paddle_y_min = paddle_pos - self.PADDLE_HEIGHT/2
        paddle_y_max = paddle_pos + self.PADDLE_HEIGHT/2

        collision = (ball_y >= paddle_y_min and
                     ball_y <= paddle_y_max and
                     abs(abs(ball_x) - self.PADDLE_X) <= self.PADDLE_WIDTH)

        # Logger-Eintrag: Paddle-Kollision (nur wenn Kollision auftritt)
        if collision:
            # -------------------------------
            logger.debug(f"Collision at: Ball({ball_x}, {ball_y}), Paddle Y range({paddle_y_min}, {paddle_y_max})")
            # -------------------------------

        return collision

    def check_winner(self):
        if self.player1.score >= self.winning_score:
            self.winner = self.player1
            self.game_active = False
            # Logger-Eintrag: Spieler 1 hat gewonnen
            # -------------------------------
            logger.info(f"Spiel gewonnen: Spieler '{self.player1.name}' mit Score {self.player1.score}")
            # -------------------------------
        elif self.player2.score >= self.winning_score:
            self.winner = self.player2
            self.game_active = False
            # Logger-Eintrag: Spieler 2 hat gewonnen
            # -------------------------------
            logger.info(f"Spiel gewonnen: Spieler '{self.player2.name}' mit Score {self.player2.score}")
            # -------------------------------

    def update_game_state(self):
        if not self.game_active:
            state = self.get_game_state()
            # Logger for maptplotlib
            # -------------------------------
            logger.info(f"Game State: {state}")
            # -------------------------------
            return state

        scaled_speed = self.ball_speed * self.BALL_SPEED_SCALE
        next_x = self.ball_pos[0] + self.ball_direction[0] * scaled_speed
        next_y = self.ball_pos[1] + self.ball_direction[1] * scaled_speed

        # Wand-Kollisionen
        if abs(next_y) >= 1.0:
            self.ball_direction[1] *= -1
            next_y = max(-1.0, min(1.0, next_y))
            # Logger for maptplotlib
            # -------------------------------
            logger.debug(f"Wandkollision: Neue vertikale Richtung {self.ball_direction[1]}")
            # -------------------------------

        hit_paddle = False

        # Linkes Paddle (verbesserte Kollisionserkennung)
        if next_x <= -self.PADDLE_X:
            if self.check_paddle_collision(self.player1.paddle_pos, -self.PADDLE_X, next_y):
                hit_paddle = True
                relative_intersect_y = (self.player1.paddle_pos - next_y) / (self.PADDLE_HEIGHT/2)
                bounce_angle = relative_intersect_y * math.pi/3

                self.ball_direction = [abs(math.cos(bounce_angle)), -math.sin(bounce_angle)]
                next_x = -self.PADDLE_X + self.PADDLE_WIDTH
                # Logger for maptplotlib
                # -------------------------------
                logger.debug(f"Linke Paddle-Kollision: Bounce-Winkel={bounce_angle}, Neue Richtung={self.ball_direction}")
                # -------------------------------
                
                # Erhöhe Geschwindigkeit nach Paddle-Treffer
                self.increase_ball_speed()

        # Rechtes Paddle (verbesserte Kollisionserkennung)
        elif next_x >= self.PADDLE_X:
            if self.check_paddle_collision(self.player2.paddle_pos, self.PADDLE_X, next_y):
                hit_paddle = True
                relative_intersect_y = (self.player2.paddle_pos - next_y) / (self.PADDLE_HEIGHT/2)
                bounce_angle = relative_intersect_y * math.pi/3

                self.ball_direction = [-abs(math.cos(bounce_angle)), -math.sin(bounce_angle)]
                next_x = self.PADDLE_X - self.PADDLE_WIDTH
                # Logger for maptplotlib
                # -------------------------------
                logger.debug(f"Rechte Paddle-Kollision: Bounce-Winkel={bounce_angle}, Neue Richtung={self.ball_direction}")
                # -------------------------------
                # Erhöhe Geschwindigkeit nach Paddle-Treffer
                self.increase_ball_speed()

        if not hit_paddle:
            if next_x < -1.0:
                self.player2.score += 1
                self.check_winner()
                self.reset_ball()
                state = self.get_game_state()
                # Logger for maptplotlib
                # -------------------------------
                logger.info(f"Score: Spieler '{self.player2.name}' erzielt einen Punkt. Neuer Score: {self.player2.score}")
                logger.info(f"Game State: {state}")
                # -------------------------------
                return state
            elif next_x > 1.0:
                self.player1.score += 1
                self.check_winner()
                self.reset_ball()
                state = self.get_game_state()
                # Logger for maptplotlib
                # -------------------------------
                logger.info(f"Score: Spieler '{self.player1.name}' erzielt einen Punkt. Neuer Score: {self.player1.score}")
                logger.info(f"Game State: {state}")
                # -------------------------------
                return state

        self.ball_pos = [next_x, next_y]
        state = self.get_game_state()
        # Logger for maptplotlib
        # -------------------------------
        logger.info(f"Game State: {state}")
        # -------------------------------
        return state

    def get_paddle_positions(self, player: Player) -> dict:
        """Berechnet die genauen Y-Koordinaten für ein Paddle"""
        paddle_top = player.paddle_pos - self.PADDLE_HEIGHT/2
        paddle_bottom = player.paddle_pos + self.PADDLE_HEIGHT/2
        return {
            "top": paddle_top,
            "bottom": paddle_bottom,
            "center": player.paddle_pos
        }

    def get_game_state(self):
        state = {
            "ball": self.ball_pos,
            "ball_direction": self.ball_direction,
            "ball_speed": self.ball_speed * self.BALL_SPEED_SCALE,  # Füge Ballgeschwindigkeit hinzu
            "player1": {
                "paddle": self.get_paddle_positions(self.player1),
                "score": self.player1.score,
                "name": self.player1.name
            },
            "player2": {
                "paddle": self.get_paddle_positions(self.player2),
                "score": self.player2.score,
                "name": self.player2.name
            },
            "game_active": self.game_active
        }

        if self.winner:
            state["winner"] = {
                "name": self.winner.name,
                "score": self.winner.score
            }

        return state

    def increase_ball_speed(self):
        """Erhöht die Ballgeschwindigkeit nach einem Paddle-Treffer"""
        self.ball_speed = min(
            self.MAX_BALL_SPEED,
            self.ball_speed * (1 + self.SPEED_INCREASE)
        )
        logger.debug(f"Ball speed increased to: {self.ball_speed}")
