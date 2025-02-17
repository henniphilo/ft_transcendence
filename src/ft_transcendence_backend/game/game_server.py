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
        self.active_games = {}
        self.ai_players = {}  # Speichert AI-Instanzen für jedes Spiel
        self.UPDATE_RATE = 1/60  # 60 FPS

    async def handle_game(self, websocket: WebSocket, game_id: str, settings: dict):
        await websocket.accept()

        print("\n=== New Game Started ===")
        print(f"Game ID: {game_id}")
        print(f"Received Settings: {settings}")
        
        is_ai_mode = settings.get("mode") == "ai"
        is_online_mode = settings.get("mode") == "online"
        
        # Erstelle Spieler basierend auf Spielmodus
        if is_online_mode:
            # Online Modus: Beide Spieler mit WASD Controls
            player1 = Player(id="p1", name=settings.get("player1_name", "Player 1"), 
                           player_type=PlayerType.HUMAN, controls=Controls.WASD)
            player2 = Player(id="p2", name=settings.get("player2_name", "Player 2"), 
                           player_type=PlayerType.HUMAN, controls=Controls.WASD)
        elif is_ai_mode:
            # AI Modus bleibt unverändert
            player1 = Player(id="p1", name="Player 1", player_type=PlayerType.HUMAN, controls=Controls.WASD)
            player2 = Player(id="p2", name="AI Player", player_type=PlayerType.AI, controls=Controls.ARROWS)
            self.ai_players[game_id] = AI(settings.get("difficulty", "medium"))
        else:
            # Lokaler Modus bleibt unverändert
            player1 = Player(id="p1", name="Player 1", player_type=PlayerType.HUMAN, controls=Controls.WASD)
            player2 = Player(id="p2", name="Player 2", player_type=PlayerType.HUMAN, controls=Controls.ARROWS)
        
        self.active_games[game_id] = PongGame(settings, player1, player2)
        game = self.active_games[game_id]
        game.start_game()

        game_loop = asyncio.create_task(self.game_loop(websocket, game, game_id))

        try:
            while True:
                data = await websocket.receive_json()
                if data["action"] == "key_update":
                    if is_ai_mode:
                        # Im AI-Modus nur Spieler 1 Eingaben verarbeiten
                        ai_safe_keys = {
                            'a': data['keys'].get('a', False),
                            'd': data['keys'].get('d', False),
                            'ArrowRight': False,
                            'ArrowLeft': False
                        }
                        self.handle_input(game, ai_safe_keys)
                    else:
                        # Im Online/Local Modus normale Eingabeverarbeitung
                        self.handle_input(game, data["keys"])

        except Exception as e:
            if game_id in self.active_games:
                del self.active_games[game_id]
            if game_id in self.ai_players:
                del self.ai_players[game_id]
            game_loop.cancel()

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

    async def game_loop(self, websocket: WebSocket, game: PongGame, game_id: str):
        try:
            while True:
                if game_id in self.active_games:
                    if not game.game_active:  # Wenn das Spiel vorbei ist
                        print("Game ended, cleaning up resources...")
                        if game_id in self.ai_players:
                            del self.ai_players[game_id]
                        if game_id in self.active_games:
                            del self.active_games[game_id]
                        break  # Beende den Loop

                    # Normale Spiel-Loop
                    if game_id in self.ai_players:
                        ai_move = self.ai_players[game_id].calculate_move(game.get_game_state())
                        self.handle_input(game, ai_move["keys"])

                    game_state = game.update_game_state()
                    await websocket.send_json(game_state)
                await asyncio.sleep(1/60)
        except Exception as e:
            print(f"Game loop error: {e}")
            # Cleanup bei Fehlern
            if game_id in self.ai_players:
                del self.ai_players[game_id]
            if game_id in self.active_games:
                del self.active_games[game_id]
