import asyncio
from fastapi import WebSocket
import json
from models.game import PongGame
from models.player import Player, PlayerType, Controls

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
        
        # Starte Game Loop Task
        game_loop = asyncio.create_task(self.game_loop(websocket, game, game_id))
        
        try:
            while True:
                data = await websocket.receive_json()
                if data["action"] == "key_update":
                    self.handle_input(game, data["keys"])
                    
        except Exception as e:
            print(f"Error in game {game_id}: {e}")
        finally:
            if game_id in self.active_games:
                del self.active_games[game_id]
            game_loop.cancel()

    def handle_input(self, game: PongGame, keys: dict):
        # Player 1 (WASD)
        if keys.get('w'):
            game.move_paddle(game.player1, -1)
        elif keys.get('s'):
            game.move_paddle(game.player1, 1)
            
        # Player 2 (Arrows)
        if keys.get('ArrowUp'):
            game.move_paddle(game.player2, -1)
        elif keys.get('ArrowDown'):
            game.move_paddle(game.player2, 1)

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