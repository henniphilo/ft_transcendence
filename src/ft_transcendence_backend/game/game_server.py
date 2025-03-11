import asyncio
from fastapi import WebSocket
import json
from models.game import PongGame
from models.player import Player, PlayerType, Controls
import time
from models.ai_player import AI
import redis
import os
import logging
from datetime import datetime
import urllib.request
import urllib.error
import urllib.parse

logger = logging.getLogger('game')

class GameServer:
    def __init__(self):
        self.active_games = {}  # game_id -> PongGame
        self.game_websockets = {}  # game_id -> list of websockets
        self.game_loops = {}  # game_id -> game loop task
        self.ai_players = {}
        self.game_user_profiles = {}  # game_id -> {player_role: user_profile}
        self.UPDATE_RATE = 1/60  # 60 FPS
        self.API_URL = "http://backend:8000/api/gamestats/"  # URL zum Backend-Container
        self.stats_file = "game_stats.json"

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
        is_online_mode = settings.get("mode") == "online"
        
        print(f"\n=== New Game Connection ===")
        print(f"Game ID: {game_id}")
        print(f"Mode: {'Online' if is_online_mode else 'AI' if is_ai_mode else 'Local'}")
        print(f"Player Role: {settings.get('player_role')}")  # Debug
        
        # Speichere Benutzerprofile für dieses Spiel
        if game_id not in self.game_user_profiles:
            self.game_user_profiles[game_id] = {}
        
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
                
                # Verarbeite Benutzerprofilinformationen
                if data["action"] == "player_info":
                    player_role = data.get("player_role")
                    user_profile = data.get("user_profile")
                    
                    if player_role and user_profile:
                        self.game_user_profiles[game_id][player_role] = user_profile
                        print(f"Received user profile for {player_role} in game {game_id}")
                        
                        # Aktualisiere Spielernamen, wenn das Spiel bereits existiert
                        if game_id in self.active_games:
                            game = self.active_games[game_id]
                            if player_role == "player1" and hasattr(game, "player1"):
                                game.player1.name = user_profile.get("username", game.player1.name)
                            elif player_role == "player2" and hasattr(game, "player2"):
                                game.player2.name = user_profile.get("username", game.player2.name)
                
                # Verarbeite Tasteneingaben
                elif data["action"] == "key_update":
                    self.handle_input(game, data["keys"])
                
                # Weitere Aktionen können hier hinzugefügt werden
                
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
        logger.info(f"Starting game loop for game {game_id}")
        game = self.active_games[game_id]
        previous_winner = None
        
        while game_id in self.active_games:
            if game.game_active:
                # Wenn es ein AI-Spiel ist, berechne den AI-Zug
                if game_id in self.ai_players:
                    ai = self.ai_players[game_id]
                    ai_move = ai.calculate_move(game.get_game_state())
                    self.handle_input(game, ai_move["keys"])

                game_state = game.update_game_state()
                
                # Prüfe, ob das Spiel beendet wurde und ein Gewinner feststeht
                if not game.game_active and game.winner and previous_winner is None:
                    previous_winner = game.winner  # Speichere den Gewinner, um mehrfache API-Aufrufe zu vermeiden
                    
                    # Prüfe, ob es ein Online-Spiel ist und ob wir Benutzerprofile haben
                    if game_id in self.game_user_profiles and len(self.game_user_profiles[game_id]) >= 2:
                        # Erstelle einen separaten Task für die API-Anfrage
                        asyncio.create_task(self.send_game_stats(game_id, game))
                
                for ws in self.game_websockets[game_id]:
                    try:
                        await ws.send_json(game_state)
                    except Exception as e:
                        print(f"Error sending game state: {e}")
                        logger.error(f"Error sending game state: {e}")
                        if ws in self.game_websockets[game_id]:
                            self.game_websockets[game_id].remove(ws)
            await asyncio.sleep(self.UPDATE_RATE)

    async def send_game_stats(self, game_id: str, game: PongGame):
        """Sendet die Spielstatistiken an die Django-API"""
        try:
            print(f"Versuche Spielstatistiken zu senden für Spiel {game_id}")
            
            # Hole die Benutzerprofile für dieses Spiel
            user_profiles = self.game_user_profiles.get(game_id, {})
            print(f"Gefundene Benutzerprofile: {user_profiles}")
            
            player1_profile = user_profiles.get("player1")
            player2_profile = user_profiles.get("player2")
            
            if not player1_profile or not player2_profile:
                print(f"Fehlende Benutzerprofile für Spiel {game_id}, überspringe Statistiksendung")
                return
                
            # Bestimme den Gewinner
            winner_id = None
            if game.winner:
                if game.winner.name == game.player1.name:
                    winner_id = player1_profile.get("id")
                else:
                    winner_id = player2_profile.get("id")
            
            # Erstelle die Daten im Format, das die Django-API erwartet
            api_data = {
                "player1": player1_profile.get("id"),
                "player2": player2_profile.get("id"),
                "player1_username": player1_profile.get("username"),
                "player2_username": player2_profile.get("username"),
                "player1_score": game.player1.score,
                "player2_score": game.player2.score,
                "winner": winner_id
            }
            
            print(f"Sende Daten an Django-API: {api_data}")
            
            # Verwende einen separaten Thread für die blockierende HTTP-Anfrage
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self._send_stats_http, api_data)
                    
        except Exception as e:
            print(f"FEHLER beim Senden der Spielstatistiken an API: {str(e)}")
    
    def _send_stats_http(self, data):
        """Sendet HTTP-Anfrage in einem separaten Thread"""
        try:
            # Konvertiere Daten in JSON
            data_json = json.dumps(data).encode('utf-8')
            
            # Erstelle Request-Objekt
            req = urllib.request.Request(
                self.API_URL,
                data=data_json,
                headers={'Content-Type': 'application/json'}
            )
            
            # Sende Anfrage
            with urllib.request.urlopen(req) as response:
                response_data = response.read().decode('utf-8')
                print(f"API-Antwort: {response.status} {response_data}")
                
        except urllib.error.HTTPError as e:
            print(f"HTTP-Fehler: {e.code} {e.reason}")
        except urllib.error.URLError as e:
            print(f"URL-Fehler: {e.reason}")
        except Exception as e:
            print(f"Unerwarteter Fehler: {str(e)}")

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
