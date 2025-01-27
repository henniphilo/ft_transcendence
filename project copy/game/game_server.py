import asyncio
from fastapi import WebSocket
import json
from models.game import PongGame
from models.player import Player, PlayerType, Controls
import time

class GameServer:
    def __init__(self):
        self.active_games = {}
        self.UPDATE_RATE = 1/60  # 60 FPS

    async def handle_game(self, websocket: WebSocket, game_id: str, settings: dict):
        await websocket.accept()
        
        if game_id not in self.active_games:
            player1 = Player(id="p1", name="Player 1", player_type=PlayerType.HUMAN, controls=Controls.WASD)
            player2 = Player(id="p2", name="Player 2", player_type=PlayerType.HUMAN, controls=Controls.ARROWS)
            self.active_games[game_id] = PongGame(settings, player1, player2)
        
        game = self.active_games[game_id]
        game.start_game()
        
        game_loop = asyncio.create_task(self.game_loop(websocket, game, game_id))
        
        try:
            while True:
                data = await websocket.receive_json()
                print(f"\n--- Neue Nachricht ---")
                print(f"Zeit: {time.strftime('%H:%M:%S.%f')[:-3]}")
                print(f"Empfangene Daten: {data}")
                
                if data["action"] == "key_update":
                    pressed_keys = [key for key, value in data["keys"].items() if value]
                    print(f"Aktiv gedrückte Tasten: {pressed_keys}")
                    print(f"Paddle Positionen VOR Bewegung - P1: {game.player1.paddle_pos:.2f}, P2: {game.player2.paddle_pos:.2f}")
                    
                    self.handle_input(game, data["keys"])
                    
                    print(f"Paddle Positionen NACH Bewegung - P1: {game.player1.paddle_pos:.2f}, P2: {game.player2.paddle_pos:.2f}")
                    
        except Exception as e:
            print(f"Error in game {game_id}: {e}")
        finally:
            if game_id in self.active_games:
                del self.active_games[game_id]
            game_loop.cancel()

    def handle_input(self, game: PongGame, keys: dict):
        # Debug für Bewegungslogik
        print("\n--- Bewegungsverarbeitung ---")
        # Bewegungsgeschwindigkeit aus den Spieleinstellungen
        movement_multiplier = game.paddle_speed * game.PADDLE_SPEED_SCALE
        
        # Player 1 (WASD)
        if keys.get('w'):
            print(f"W gedrückt - Bewege P1 nach oben mit multiplier {movement_multiplier}")
            game.move_paddle(game.player1, -1 * movement_multiplier)
        elif keys.get('s'):
            print(f"S gedrückt - Bewege P1 nach unten mit multiplier {movement_multiplier}")
            game.move_paddle(game.player1, 1 * movement_multiplier)
            
        # Player 2 (Arrows)
        if keys.get('ArrowUp'):
            print(f"ArrowUp gedrückt - Bewege P2 nach oben mit multiplier {movement_multiplier}")
            game.move_paddle(game.player2, -1 * movement_multiplier)
        elif keys.get('ArrowDown'):
            print(f"ArrowDown gedrückt - Bewege P2 nach unten mit multiplier {movement_multiplier}")
            game.move_paddle(game.player2, 1 * movement_multiplier)

    async def game_loop(self, websocket: WebSocket, game: PongGame, game_id: str):
        try:
            while True:
                game_state = game.update_game_state()
                await websocket.send_json(game_state)
                
                if game_state.get("winner"):
                    break
                    
                await asyncio.sleep(self.UPDATE_RATE)
                
        except Exception as e:
            print(f"Game loop error in game {game_id}: {e}") 