import asyncio
from fastapi import WebSocket
import json
from models.game import PongGame
from models.player import Player, PlayerType, Controls
import time
from models.ai_player import AI
import redis
import os

class GameServer:
    def __init__(self):
        self.active_games = {}  # game_id -> PongGame
        self.game_websockets = {}  # game_id -> list of websockets
        self.game_loops = {}  # game_id -> game loop task
        self.ai_players = {}
        self.UPDATE_RATE = 1/60  # 60 FPS

    def print_active_games(self):
        print("\n=== Active Games Status ===")
        for game_id, game in self.active_games.items():
            print(f"\nGame ID: {game_id}")
            print(f"Connected WebSockets: {len(self.game_websockets[game_id])}")
            print(f"Game Loop Active: {game_id in self.game_loops}")
            print(f"Game Active: {game.game_active}")
            print("------------------------")

    async def handle_game(self, websocket: WebSocket, game_id: str, settings: dict):
        await websocket.accept()
        
        print(f"\n=== Game Settings ===")
        print(json.dumps(settings, indent=2))
        print("====================\n")
        
        is_ai_mode = settings.get("mode") == "ai"
        is_online_mode = settings.get("mode") == "pvp"
        
        print(f"\n=== New Game Connection ===")
        print(f"Game ID: {game_id}")
        print(f"Mode: {'Online' if is_online_mode else 'AI' if is_ai_mode else 'Local'}")
        print(f"Player Role: {settings.get('player_role')}")  # Debug
        
        if is_online_mode:
            if game_id in self.active_games:
                print(f"Joining existing game {game_id}")
                game = self.active_games[game_id]
                if game_id not in self.game_websockets:
                    self.game_websockets[game_id] = []
                self.game_websockets[game_id].append(websocket)  # Wichtig: Füge WebSocket zur Liste hinzu
                print(f"Players now connected: {len(self.game_websockets[game_id])}")
                
                if len(self.game_websockets[game_id]) == 2:
                    print("Second player joined, starting game!")
                    game.start_game()
                    if game_id not in self.game_loops:
                        self.game_loops[game_id] = asyncio.create_task(self.game_loop(game_id))
            else:
                print(f"Creating new online game {game_id}")
                player1 = Player(id="p1", name=settings.get("player1_name", "Player 1"), 
                               player_type=PlayerType.HUMAN, controls=Controls.WASD)
                player2 = Player(id="p2", name=settings.get("player2_name", "Player 2"), 
                               player_type=PlayerType.HUMAN, controls=Controls.ARROWS)
                
                game = PongGame(settings, player1, player2)
                self.active_games[game_id] = game
                self.game_websockets[game_id] = [websocket]
                
        else:
            # Bestehende Logik für AI und Local Mode
            if is_ai_mode:
                player1 = Player(id="p1", name="Player 1", player_type=PlayerType.HUMAN, controls=Controls.WASD)
                player2 = Player(id="p2", name="AI Player", player_type=PlayerType.AI, controls=Controls.ARROWS)
                self.ai_players[game_id] = AI(settings.get("difficulty", "medium"))
            else:
                player1 = Player(id="p1", name="Player 1", player_type=PlayerType.HUMAN, controls=Controls.WASD)
                player2 = Player(id="p2", name="Player 2", player_type=PlayerType.HUMAN, controls=Controls.ARROWS)

            game = PongGame(settings, player1, player2)
            self.active_games[game_id] = game
            self.game_websockets[game_id] = [websocket]
            game.start_game()
            self.game_loops[game_id] = asyncio.create_task(self.game_loop(game_id))

        self.print_active_games()  # Zeige Status nach jeder Änderung

        try:
            while True:
                data = await websocket.receive_json()
                if data["action"] == "key_update":
                    self.handle_input(game, data["keys"])
        except Exception as e:
            print(f"\nError in game {game_id}: {e}")
            if game_id in self.game_websockets:
                self.game_websockets[game_id].remove(websocket)
                print(f"Player disconnected from game {game_id}")
                if not self.game_websockets[game_id]:
                    if game_id in self.game_loops:
                        self.game_loops[game_id].cancel()
                        del self.game_loops[game_id]
                    del self.active_games[game_id]
                    del self.game_websockets[game_id]
                    print(f"Game {game_id} cleaned up")
                    if game_id in self.ai_players:
                        del self.ai_players[game_id]
            self.print_active_games()

    def handle_input(self, game: PongGame, keys: dict):
        movement_multiplier = game.paddle_speed  # Benutze die Geschwindigkeit aus den Settings

        # Player 1 (WASD)
        if keys.get('a'):
            game.move_paddle(game.player1, -1 * movement_multiplier)
        elif keys.get('d'):
            game.move_paddle(game.player1, 1 * movement_multiplier)

        # Player 2 (Arrows)
        if keys.get('ArrowRight'):
            game.move_paddle(game.player2, -1 * movement_multiplier)
        elif keys.get('ArrowLeft'):
            game.move_paddle(game.player2, 1 * movement_multiplier)

    async def game_loop(self, game_id: str):
        print(f"Starting game loop for game {game_id}")
        game = self.active_games[game_id]
        while game_id in self.active_games:
            if game.game_active:
                # Wenn es ein AI-Spiel ist, berechne den AI-Zug
                if game_id in self.ai_players:
                    ai = self.ai_players[game_id]
                    ai_move = ai.calculate_move(game.get_game_state())
                    self.handle_input(game, ai_move["keys"])

                game_state = game.update_game_state()
                for ws in self.game_websockets[game_id]:
                    try:
                        await ws.send_json(game_state)
                    except Exception as e:
                        print(f"Error sending game state: {e}")
                        if ws in self.game_websockets[game_id]:
                            self.game_websockets[game_id].remove(ws)
            await asyncio.sleep(self.UPDATE_RATE)

    # import logging        
    # logger = logging.getLogger(__name__)
    
    # logger.info("Application starting with OpenTelemetry logging enabled")
    
	# # Get logger for this module
    # logger = logging.getLogger(__name__)
    
    # # Example log messages at different levels
    # logger.debug("This is a debug message")

    # logger.info("Application starting up...")
    # logger.warning("This is a warning message")
    # logger.error("This is an error message")
