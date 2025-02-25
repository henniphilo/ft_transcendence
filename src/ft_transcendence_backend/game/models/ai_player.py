from .player import Player, PlayerType, Controls
import random
import time

class AI:
    def __init__(self, difficulty: str = "medium"):
        self.difficulty = difficulty
        # Reaktionsgeschwindigkeit (wie schnell die AI auf den Ball reagiert)
        self.reaction_speeds = {
            "easy": 0.3,      # Reagiert langsam und ungenau
            "medium": 0.6,    # Mittlere Reaktion
            "impossible": 1.0  # Perfekte Reaktion
        }
        # Fehlertoleranz (wie genau die AI den Ball trifft)
        self.error_margins = {
            "easy": 0.3,      # Großer Fehlerbereich
            "medium": 0.15,   # Mittlerer Fehlerbereich
            "impossible": 0.0  # Kein Fehler
        }
        self.speed = self.reaction_speeds[difficulty]
        self.error_margin = self.error_margins[difficulty]
        self.last_move_time = time.time()
        self.last_target = 0

    def calculate_move(self, game_state: dict) -> dict:
        """Berechnet den nächsten Zug basierend auf der Ballposition"""
        current_time = time.time()
        ball_pos = game_state["ball"]
        paddle_pos = game_state["player2"]["paddle"]["center"]
        
        # Zufällige Verzögerung basierend auf Schwierigkeit
        if current_time - self.last_move_time < (1 - self.speed) * 0.1:
            return {"action": "key_update", "keys": self.get_empty_keys()}
            
        # Füge absichtliche Ungenauigkeit hinzu
        target_pos = ball_pos[1] + random.uniform(-self.error_margin, self.error_margin)
        
        # Träge Bewegung - AI behält teilweise die alte Richtung bei
        if self.difficulty == "easy":
            target_pos = 0.7 * self.last_target + 0.3 * target_pos
        
        self.last_target = target_pos
        self.last_move_time = current_time
        
        # Erstelle ein simuliertes Tastenstate
        keys = self.get_empty_keys()
        
        # Totzone - kleine Bewegungen ignorieren
        if abs(target_pos - paddle_pos) > 0.05:
            if target_pos > paddle_pos:
                keys['ArrowLeft'] = True
            else:
                keys['ArrowRight'] = True
                
        return {
            "action": "key_update",
            "keys": keys
        }
    
    def get_empty_keys(self):
        return {
            'a': False,
            'd': False,
            'ArrowRight': False,
            'ArrowLeft': False
        } 