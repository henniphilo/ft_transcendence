from enum import Enum
from dataclasses import dataclass
from typing import Optional

class PlayerType(Enum):
    HUMAN = "human"
    AI = "ai"

class Controls(Enum):
    WASD = {"up": "w", "down": "s"}
    ARROWS = {"up": "ArrowUp", "down": "ArrowDown"}

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