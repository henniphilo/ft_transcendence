from enum import Enum
from dataclasses import dataclass
from typing import Optional

class PlayerType(Enum):
    HUMAN = "human"
    AI = "ai"

class Controls(Enum):
    WASD = {"right": "d", "left": "a"}
    ARROWS = {"right": "ArrowRight", "left": "ArrowLeft"}
    WASD = {"left": "a", "right": "d"}  # Für horizontale Bewegung
    ARROWS = {"left": "ArrowLeft", "right": "ArrowRight"}

@dataclass
class Player:
    id: str
    name: str
    player_type: PlayerType
    controls: Optional[Controls] = None
    score: int = 0
    paddle_pos: float = 0.0

    def __post_init__(self):
        if self.player_type == PlayerType.HUMAN and self.controls is None:
            raise ValueError("Human players must have controls assigned")
