from .player import Player, PlayerType, Controls
import random
import time
import math

class AI:
    def __init__(self, difficulty: str = "medium"):
        self.difficulty = difficulty
        # Reaktionsgeschwindigkeit und Genauigkeit je nach Schwierigkeitsgrad
        self.reaction_speeds = {
            "easy": 0.3,      # Langsame Reaktion
            "medium": 0.6,    # Mittlere Reaktion
            "impossible": 1.0  # Perfekte Reaktion
        }
        self.error_margins = {
            "easy": 0.3,      # Große Ungenauigkeit
            "medium": 0.15,   # Mittlere Ungenauigkeit
            "impossible": 0.0  # Keine Ungenauigkeit
        }
        
        self.speed = self.reaction_speeds[difficulty]
        self.error_margin = self.error_margins[difficulty]
        self.last_update_time = time.time()
        self.last_game_state = None
        self.predicted_ball_pos = None
        self.decision_cooldown = 1.0  # 1 Sekunde Cooldown für Entscheidungen
        
        # Strategische Parameter
        self.aggressive_mode = False
        self.defensive_position = 0.0
        self.prediction_confidence = 0.7
        
        self.current_target = 0.0
        self.next_target = 0.0
        self.interpolation_factor = 0.0
        self.ball_moving_towards_ai = False

    def predict_ball_position(self, game_state: dict) -> float:
        """Berechnet die voraussichtliche Y-Position des Balls"""
        if not self.last_game_state:
            self.last_game_state = game_state
            return game_state["ball"][1]

        current_ball = game_state["ball"]
        last_ball = self.last_game_state["ball"]
        
        # Berechne Bewegungsvektor des Balls
        ball_velocity = [
            current_ball[0] - last_ball[0],
            current_ball[1] - last_ball[1]
        ]

        # Prädiktiere Position basierend auf Geschwindigkeit und Schwierigkeit
        prediction_time = (1.0 - self.speed) * 2.0
        predicted_y = current_ball[1] + (ball_velocity[1] * prediction_time)
        
        # Berücksichtige Wandkollisionen
        if abs(predicted_y) > 1.0:
            predicted_y = math.copysign(1.0, predicted_y)
            
        return predicted_y

    def update_strategy(self, game_state: dict):
        """Aktualisiert die Spielstrategie basierend auf der Spielsituation"""
        player2_score = game_state["player2"]["score"]
        player1_score = game_state["player1"]["score"]
        
        # Wechsel zu aggressivem Modus wenn hinten
        self.aggressive_mode = player2_score < player1_score
        
        # Passe Vorhersagegenauigkeit basierend auf Punktestand an
        score_diff = abs(player2_score - player1_score)
        if score_diff > 2:
            self.prediction_confidence = min(0.9, self.prediction_confidence + 0.1)
        else:
            self.prediction_confidence = max(0.6, self.prediction_confidence - 0.05)

    def is_ball_moving_towards_ai(self, game_state: dict) -> bool:
        """Überprüft, ob sich der Ball auf die AI zu bewegt"""
        if not self.last_game_state:
            return False
            
        current_ball_x = game_state["ball"][0]
        last_ball_x = self.last_game_state["ball"][0]
        
        # Ball bewegt sich nach rechts (zur AI)
        return current_ball_x > last_ball_x

    def calculate_ball_intersection(self, game_state: dict) -> float:
        """Berechnet den Punkt, wo der Ball das AI-Paddle treffen wird"""
        if not self.last_game_state:
            return game_state["ball"][1]
            
        current_ball = game_state["ball"]
        last_ball = self.last_game_state["ball"]
        
        # Berechne Bewegungsvektor
        dx = current_ball[0] - last_ball[0]
        dy = current_ball[1] - last_ball[1]
        
        if dx == 0:
            return current_ball[1]
            
        # Berechne die Steigung
        slope = dy / dx
        
        # X-Position des AI-Paddles ist 0.95 (aus der PongGame-Klasse)
        paddle_x = 0.95
        
        # Berechne Y-Position am Paddle
        steps_to_paddle = (paddle_x - current_ball[0]) / dx
        intersection_y = current_ball[1] + (dy * steps_to_paddle)
        
        # Berücksichtige Wandreflektionen
        while abs(intersection_y) > 1.0:
            if intersection_y > 1.0:
                intersection_y = 2.0 - intersection_y
            elif intersection_y < -1.0:
                intersection_y = -2.0 - intersection_y
                
        return intersection_y

    def calculate_move(self, game_state: dict) -> dict:
        """Berechnet den nächsten Zug basierend auf Spielsituation und Strategie"""
        current_time = time.time()
        current_paddle_pos = game_state["player2"]["paddle"]["center"]
        
        # Aktualisiere die Zielposition nur einmal pro Sekunde
        if current_time - self.last_update_time >= self.decision_cooldown:
            self.last_update_time = current_time
            self.update_strategy(game_state)
            
            # Speichere die aktuelle Zielposition als Ausgangspunkt
            self.current_target = self.next_target
            
            # Überprüfe Ballrichtung
            self.ball_moving_towards_ai = self.is_ball_moving_towards_ai(game_state)
            
            if self.ball_moving_towards_ai:
                # Ball kommt auf AI zu: Berechne Schnittpunkt
                predicted_y = self.calculate_ball_intersection(game_state)
                
                if self.aggressive_mode:
                    # Aggressiv: Leicht vor dem Ball positionieren
                    self.next_target = predicted_y * 1.1
                else:
                    # Defensiv: Genau auf Ballhöhe warten
                    self.next_target = predicted_y
            else:
                # Ball bewegt sich weg: Zurück zur Mitte
                self.next_target = 0.0
                
                if self.aggressive_mode:
                    # Im aggressiven Modus: Bleibe etwas höher/tiefer als die Mitte
                    # basierend auf der Ballposition für schnellere Reaktion
                    self.next_target += game_state["ball"][1] * 0.3
            
            # Füge menschliche Ungenauigkeit hinzu
            error_scale = 1.5 if self.aggressive_mode else 1.0
            self.next_target += random.uniform(-self.error_margin, self.error_margin) * error_scale
            self.last_game_state = game_state
            self.interpolation_factor = 0.0

        # Interpoliere zwischen aktueller und nächster Zielposition
        self.interpolation_factor = min(1.0, self.interpolation_factor + 0.05)
        current_target = (1.0 - self.interpolation_factor) * self.current_target + \
                        self.interpolation_factor * self.next_target
        
        # Erstelle simulierte Tasteneingaben
        keys = self.get_empty_keys()
        
        # Kontinuierliche Bewegung zum interpolierten Zielpunkt
        movement_threshold = 0.02
        distance_to_target = current_target - current_paddle_pos
        
        if abs(distance_to_target) > movement_threshold:
            if distance_to_target > 0:
                keys['ArrowLeft'] = True
            else:
                keys['ArrowRight'] = True
        
        return {
            "action": "key_update",
            "keys": keys
        }

    def get_empty_keys(self) -> dict:
        """Gibt ein leeres Tastenstate zurück"""
        return {
            'a': False,
            'd': False,
            'ArrowLeft': False,
            'ArrowRight': False
        }
