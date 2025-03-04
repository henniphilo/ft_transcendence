from typing import Dict, List
from .player import Player, PlayerType, Controls
import random
import math

class PongGame:
    def __init__(self, settings: dict, player1: Player, player2: Player):
        self.ball_speed = settings.get("ball_speed", 5)
        self.paddle_speed = settings.get("paddle_speed", 5)
        self.winning_score = settings.get("winning_score", 5)
        self.owner = settings.get("online_type") == "host"  # Neues Feld für Host/Join

        # Paddle-Größen-Dictionary (jetzt als absolute Größen)
        self.PADDLE_SIZES = {
            "small": 0.4,   # 20% der Spielfeldhöhe
            "middle": 0.6,  # 30% der Spielfeldhöhe
            "big": 0.8      # 40% der Spielfeldhöhe
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
        print(f"DEBUG: Paddle height set to {self.PADDLE_HEIGHT}, expected: {self.PADDLE_SIZES['middle']}")
        self.PADDLE_X = 0.95

    def start_game(self):
        self.game_active = True
        self.reset_ball()

    def reset_ball(self):
        self.ball_pos = [0.0, 0.0]

        # Zufällige Startrichtung
        angle = random.uniform(-math.pi/4, math.pi/4)  # ±45 Grad
        if random.choice([True, False]):  # Zufällige Richtung (links/rechts)
            angle += math.pi

        self.ball_direction = [
            math.cos(angle),
            math.sin(angle)
        ]

    def move_paddle(self, player: Player, direction: float):
        if not self.game_active:
            return

        movement = direction * self.paddle_speed * self.PADDLE_SPEED_SCALE
        new_pos = player.paddle_pos + movement

        # Begrenze die Paddle-Position unter Berücksichtigung der größeren Paddle-Höhe
        paddle_limit = 1.0 - self.PADDLE_HEIGHT/2
        player.paddle_pos = max(-paddle_limit, min(paddle_limit, new_pos))
        print(f"DEBUG: {player.name} moved paddle to {player.paddle_pos}")  # Neue Debug-Ausgabe


    def check_paddle_collision(self, paddle_pos: float, ball_x: float, ball_y: float) -> bool:
        # Berechne die tatsächlichen Paddle-Grenzen
        paddle_y_min = paddle_pos - self.PADDLE_HEIGHT/2
        paddle_y_max = paddle_pos + self.PADDLE_HEIGHT/2

        # Debug-Ausgabe für Kollisionserkennung
        collision = (ball_y >= paddle_y_min and
                   ball_y <= paddle_y_max and
                   abs(abs(ball_x) - self.PADDLE_X) <= self.PADDLE_WIDTH)

        if collision:
            print(f"Collision at: Ball({ball_x}, {ball_y}), Paddle Y range({paddle_y_min}, {paddle_y_max})")

        return collision

    def check_winner(self):
        if self.player1.score >= self.winning_score:
            self.winner = self.player1
            self.game_active = False
        elif self.player2.score >= self.winning_score:
            self.winner = self.player2
            self.game_active = False

    def update_game_state(self):
        if not self.game_active:
            return self.get_game_state()

        scaled_speed = self.ball_speed * self.BALL_SPEED_SCALE
        next_x = self.ball_pos[0] + self.ball_direction[0] * scaled_speed
        next_y = self.ball_pos[1] + self.ball_direction[1] * scaled_speed

        # Wand-Kollisionen
        if abs(next_y) >= 1.0:
            self.ball_direction[1] *= -1
            next_y = max(-1.0, min(1.0, next_y))

        hit_paddle = False

        # Linkes Paddle (verbesserte Kollisionserkennung)
        if next_x <= -self.PADDLE_X:
            if self.check_paddle_collision(self.player1.paddle_pos, -self.PADDLE_X, next_y):
                hit_paddle = True
                relative_intersect_y = (self.player1.paddle_pos - next_y) / (self.PADDLE_HEIGHT/2)
                bounce_angle = relative_intersect_y * math.pi/3

                self.ball_direction = [
                    abs(math.cos(bounce_angle)),
                    -math.sin(bounce_angle)
                ]
                next_x = -self.PADDLE_X + self.PADDLE_WIDTH

        # Rechtes Paddle (verbesserte Kollisionserkennung)
        elif next_x >= self.PADDLE_X:
            if self.check_paddle_collision(self.player2.paddle_pos, self.PADDLE_X, next_y):
                hit_paddle = True
                relative_intersect_y = (self.player2.paddle_pos - next_y) / (self.PADDLE_HEIGHT/2)
                bounce_angle = relative_intersect_y * math.pi/3

                self.ball_direction = [
                    -abs(math.cos(bounce_angle)),
                    -math.sin(bounce_angle)
                ]
                next_x = self.PADDLE_X - self.PADDLE_WIDTH

        if not hit_paddle:
            if next_x < -1.0:
                self.player2.score += 1
                self.check_winner()
                self.reset_ball()
                return self.get_game_state()
            elif next_x > 1.0:
                self.player1.score += 1
                self.check_winner()
                self.reset_ball()
                return self.get_game_state()

        self.ball_pos = [next_x, next_y]
            # Debugging: Paddle-Positionen ausgeben
        print(f"Player 1 Paddle Positions: {self.get_paddle_positions(self.player1)}")
        print(f"Player 2 Paddle Positions: {self.get_paddle_positions(self.player2)}")

        return self.get_game_state()

    def get_paddle_positions(self, player: Player) -> dict:
        """Berechnet die genauen Y-Koordinaten für ein Paddle"""
        print(f"DEBUG: Calculating paddle positions for {player.name}. Paddle Height: {self.PADDLE_HEIGHT}, Center: {player.paddle_pos}")

        paddle_top = player.paddle_pos - self.PADDLE_HEIGHT / 2
        paddle_bottom = player.paddle_pos + self.PADDLE_HEIGHT / 2

        print(f"DEBUG: Paddle top: {paddle_top}, bottom: {paddle_bottom}")

        return {
            "top": paddle_top,
            "bottom": paddle_bottom,
            "center": player.paddle_pos
        }


    def get_game_state(self):
        state = {
            "ball": self.ball_pos,
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
