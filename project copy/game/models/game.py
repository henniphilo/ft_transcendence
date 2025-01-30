from typing import Dict, List
from .player import Player, PlayerType, Controls
import random
import math

class PongGame:
    def __init__(self, settings: dict, player1, player2):
        self.ball_speed = settings.get("ball_speed", 4)  # Increased from 5
        self.paddle_speed = settings.get("paddle_speed", 5)
        self.winning_score = settings.get("winning_score", 5)

        self.PADDLE_SIZES = {
            "small": 0.2,
            "middle": 0.3,
            "big": 0.4
        }

        self.BALL_SPEED_SCALE = 0.004  # Increased from 0.003
        self.PADDLE_SPEED_SCALE = 0.015

        self.player1 = player1
        self.player2 = player2

        self.ball_pos = [0.0, 0.0]
        self.ball_direction = [0.0, 0.0]
        self.game_active = False
        self.winner = None

        self.PADDLE_WIDTH = 0.02
        self.PADDLE_HEIGHT = self.PADDLE_SIZES[settings.get("paddle_size", "middle")]
        self.PADDLE_X = 1  # Changed from 0.95

    def start_game(self):
        self.game_active = True
        self.reset_ball()

    def reset_ball(self):
        self.ball_pos = [random.uniform(-0.2, 0.2), random.uniform(-0.2, 0.2)]

        angle = random.uniform(-math.pi/4, math.pi/4)
        if random.choice([True, False]):
            angle += math.pi

        self.ball_direction = [
            math.cos(angle),
            math.sin(angle)
        ]

    def move_paddle(self, player, direction: float):
        if not self.game_active:
            return

        movement = direction * self.paddle_speed * self.PADDLE_SPEED_SCALE
        new_pos = player.paddle_pos + movement

        paddle_limit = 1.0 - self.PADDLE_HEIGHT/2
        player.paddle_pos = max(-paddle_limit, min(paddle_limit, new_pos))

    def check_paddle_collision(self, paddle_pos: float, ball_x: float, ball_y: float) -> bool:
        paddle_y_min = paddle_pos - self.PADDLE_HEIGHT/2
        paddle_y_max = paddle_pos + self.PADDLE_HEIGHT/2

        collision = (ball_y >= paddle_y_min - 0.05 and
                     ball_y <= paddle_y_max + 0.05 and
                     abs(abs(ball_x) - self.PADDLE_X) <= self.PADDLE_WIDTH + 0.02)

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

        # Ensure the ball doesn't get stuck moving vertically
        if abs(self.ball_direction[0]) < 0.1:
            self.ball_direction[0] = 0.1 if self.ball_direction[0] >= 0 else -0.1

        # Normalize direction vector to maintain consistent speed
        magnitude = math.sqrt(self.ball_direction[0]**2 + self.ball_direction[1]**2)
        self.ball_direction = [self.ball_direction[0]/magnitude, self.ball_direction[1]/magnitude]

        if abs(next_y) >= 1.0:
            self.ball_direction[1] *= -1
            next_y = max(-1.0, min(1.0, next_y))

        hit_paddle = False

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
        return self.get_game_state()

    def get_paddle_positions(self, player) -> dict:
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
