import asyncio
from fastapi import WebSocket
import json
from models.game import PongGame
from models.player import Player, PlayerType, Controls
from models.ai_player import AI
import logging
from datetime import datetime
import urllib.request
import urllib.error
import urllib.parse

logger = logging.getLogger('game')
# Static fields (repeated in each log call)
DEFAULT_EXTRAS = {
    "_service": "pong_game",
    "_version": "1.0",
}

def log_event(event: str, **kwargs):
    logger.info(
        event,
        extra={**DEFAULT_EXTRAS, **kwargs},
    )

class GameServer:
    def __init__(self):
        self.active_games = {}          # game_id -> PongGame
        self.game_websockets = {}       # game_id -> list of websockets
        self.game_loops = {}            # game_id -> game loop task
        self.ai_players = {}
        self.game_user_profiles = {}    # game_id -> {player_role: user_profile}
        self.game_ready = {}            # game_id -> {player_role: bool}
        self.UPDATE_RATE = 1/60         # 60 FPS
        self.API_URL = "http://backend:8000/api/gamestats/"  # URL zum Backend-Container
        self.stats_file = "game_stats.json"
        # Example usage for game startup
        logger.info(
			"Game server starting",
			extra={
				**DEFAULT_EXTRAS,  # Include static fields
				"_port": 8001,
				"_players_connected": 0,
			},
		)
        # logger.info(
        #     "TEST GELF LOG",
        #     extra={"_test": True, "_debug": "Is this reaching Logstash?"},
        # )

    def print_active_games(self):
        print("\n=== Active Games Status ===")
        for game_id, game in self.active_games.items():
            ws_count = len(self.game_websockets.get(game_id, []))
            print(f"\nGame ID: {game_id}")
            print(f"Connected WebSockets: {ws_count}")
            print(f"Game Loop Active: {game_id in self.game_loops}")
            print(f"Game Active: {game.game_active}")
            print(f"Ready States: {self.game_ready.get(game_id)}")
            print("------------------------")

    async def handle_game(self, websocket: WebSocket, game_id: str, settings: dict):
        await websocket.accept()
    
        print(f"\n=== Game Settings ===")
        print(json.dumps(settings, indent=2))
        print("====================\n")
        
        is_ai_mode = settings.get("mode") == "ai"
        is_online_mode = settings.get("mode") == "online"
        is_tournament_mode = settings.get("mode") == "tournament"  # Neue Prüfung für Tournament-Modus
        player_role = settings.get("player_role")  # z.B. "player1", "player2" oder "both" bei lokal
        
        print(f"\n=== New Game Connection ===")
        print(f"Game ID: {game_id}")
        print(f"Mode: {'Tournament' if is_tournament_mode else 'Online' if is_online_mode else 'AI' if is_ai_mode else 'Local'}")
        print(f"Player Role: {player_role}")
        
        # Initialisiere Profile und Ready-States
        if game_id not in self.game_user_profiles:
            self.game_user_profiles[game_id] = {}
        if game_id not in self.game_ready:
            self.game_ready[game_id] = {}
        
        # Behandle Tournament-Modus wie Online-Modus
        if is_tournament_mode:
            print(f"Tournament game detected, handling like online game")
            is_online_mode = True  # Behandle Tournament wie Online für die weitere Verarbeitung
        
        if is_online_mode:
            if game_id in self.active_games:
                print(f"Joining existing game {game_id}")
                game = self.active_games[game_id]
                if game_id not in self.game_websockets:
                    self.game_websockets[game_id] = []
                self.game_websockets[game_id].append(websocket)
                print(f"Players now connected: {len(self.game_websockets[game_id])}")
                # Im Online-Modus warten wir auf Ready-Signale von beiden Spielern
            else:
                print(f"Creating new online game {game_id}")
                player1 = Player(id="p1", name=settings.get("player1_name", "Player 1"),
                                 player_type=PlayerType.HUMAN, controls=Controls.WASD)
                player2 = Player(id="p2", name=settings.get("player2_name", "Player 2"),
                                 player_type=PlayerType.HUMAN, controls=Controls.ARROWS)
                
                game = PongGame(settings, player1, player2)
                self.active_games[game_id] = game
                self.game_websockets[game_id] = [websocket]
                print("Online game created – waiting for both players to send ready signals...")
        else:
            # Für AI und Local Mode: Erstelle das Spiel
            if is_ai_mode:
                print("Creating AI game...")
                player1 = Player(id="p1", name="Player 1", player_type=PlayerType.HUMAN, controls=Controls.WASD)
                player2 = Player(id="p2", name="AI Player", player_type=PlayerType.AI, controls=Controls.ARROWS)
                self.ai_players[game_id] = AI(settings.get("difficulty", "medium"))
                game = PongGame(settings, player1, player2)
                self.active_games[game_id] = game
                self.game_websockets[game_id] = [websocket]
                # Markiere den AI-Spieler automatisch als ready
                self.game_ready[game_id]["player2"] = True
                print("AI game created – Player2 (AI) is automatically ready.")
            else:
                # Local Mode: Ein einzelner Client steuert beide Spieler.
                print("Creating local game...")
                player1 = Player(id="p1", name="Player 1", player_type=PlayerType.HUMAN, controls=Controls.WASD)
                player2 = Player(id="p2", name="Player 2", player_type=PlayerType.HUMAN, controls=Controls.ARROWS)
                game = PongGame(settings, player1, player2)
                self.active_games[game_id] = game
                self.game_websockets[game_id] = [websocket]
                # Im Local Mode setzen wir KEINE Ready-Flags automatisch – der Spieler muss den Ready-Button klicken.
                print("Local mode: Waiting for ready signal (click ready button) ...")
        
        self.print_active_games()  # Zeige Status nach jeder Änderung

        try:
            while True:
                data = await websocket.receive_json()
                
                # Verarbeite Benutzerprofilinformationen
                if data["action"] == "player_info":
                    pr = data.get("player_role")
                    user_profile = data.get("user_profile")
                    if pr and user_profile:
                        # WICHTIG: Hier speichern wir das vollständige Benutzerprofil
                        # Wir müssen sicherstellen, dass tournament_match_id erhalten bleibt
                        self.game_user_profiles[game_id][pr] = user_profile
                        print(f"Received user profile for {pr} in game {game_id}")
                        print(f"User profile: {user_profile}")  # Debug-Ausgabe
                        if game_id in self.active_games:
                            game = self.active_games[game_id]
                            if pr == "player1" and hasattr(game, "player1"):
                                game.player1.name = user_profile.get("username", game.player1.name)
                            elif pr == "player2" and hasattr(game, "player2"):
                                game.player2.name = user_profile.get("username", game.player2.name)
                
                # Verarbeite Ready-Signale
                elif data["action"] == "player_ready":
                    pr = data.get("player_role")
                    user_profile = data.get("userProfile")  # Prüfe, ob ein Benutzerprofil mitgesendet wurde
                    if pr:
                        if game_id not in self.game_ready:
                            self.game_ready[game_id] = {}
                        # Falls im lokalen Modus der Client "both" sendet, setze beide Flags:
                        if pr == "both":
                            self.game_ready[game_id]["player1"] = True
                            self.game_ready[game_id]["player2"] = True
                        else:
                            self.game_ready[game_id][pr] = True
                        print(f"{pr} is ready in game {game_id}")
                        
                        # Wenn ein Benutzerprofil mitgesendet wurde, speichere es
                        if user_profile:
                            self.game_user_profiles[game_id][pr] = user_profile
                            print(f"Updated user profile for {pr} in game {game_id}")
                            print(f"User profile: {user_profile}")  # Debug-Ausgabe
                        
                        ready = self.game_ready[game_id]
                        if ready.get("player1") and ready.get("player2"):
                            game = self.active_games[game_id]
                            if not game.game_active:
                                print("Both players ready, starting game!")
                                game.start_game()
                                if game_id not in self.game_loops:
                                    self.game_loops[game_id] = asyncio.create_task(self.game_loop(game_id))
                
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
        movement_multiplier = game.paddle_speed  # Verwende die Geschwindigkeit aus den Settings

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
        winner_processed = False
        
        while game_id in self.active_games:
            # Update game state
            if game.game_active:
                # Falls es ein AI-Spiel ist, berechne den AI-Zug
                if game_id in self.ai_players:
                    ai = self.ai_players[game_id]
                    ai_move = ai.calculate_move(game.get_game_state())
                    self.handle_input(game, ai_move["keys"])

            # Hole den aktuellen Spielstatus (auch wenn das Spiel nicht mehr aktiv ist)
            game_state = game.update_game_state()
            
            # Prüfe, ob das Spiel beendet wurde und ein Gewinner feststeht
            if not game.game_active and game.winner and previous_winner is None:
                previous_winner = game.winner
                
                print(f"\n=== GAME COMPLETED ===")
                print(f"Game ID: {game_id}")
                print(f"Winner: {game.winner.name}")
                print(f"Score: {game.player1.score} - {game.player2.score}")
                
                # Füge explizit Gewinner-Informationen zum Spielstatus hinzu
                game_state["game_over"] = True
                game_state["winner"] = {
                    "name": game.winner.name,
                    "id": game.winner.id
                }
                
                # Debug: Zeige den Spielstatus, der an das Frontend gesendet wird
                print(f"\n=== FINAL GAME STATE ===")
                print(json.dumps(game_state, indent=2))
                
                # Sende Spielstatistiken an die API
                if game_id in self.game_user_profiles and len(self.game_user_profiles[game_id]) >= 2:
                    asyncio.create_task(self.send_game_stats(game_id, game))
                
                # DEBUG: Zeige alle Benutzerprofile für dieses Spiel
                print(f"\n=== USER PROFILES FOR GAME {game_id} ===")
                if game_id in self.game_user_profiles:
                    for role, profile in self.game_user_profiles[game_id].items():
                        print(f"Role: {role}, Profile: {profile}")
                else:
                    print("No user profiles found for this game!")
                
                # NEU: Informiere das Turnier über das Spielergebnis, falls es ein Turnierspiel ist
                # Prüfe zuerst, ob tournament_match_id in den Spieleinstellungen vorhanden ist
                settings = game.settings if hasattr(game, 'settings') else {}
                match_id = settings.get('tournament_match_id')
                
                if not match_id:
                    # Falls nicht in den Einstellungen, prüfe in den Benutzerprofilen
                    user_profiles = self.game_user_profiles.get(game_id, {})
                    for role, profile in user_profiles.items():
                        print(f"Checking profile for role {role}: {profile}")
                        if isinstance(profile, dict) and profile.get('tournament_match_id'):
                            match_id = profile.get('tournament_match_id')
                            print(f"Found tournament_match_id: {match_id} in profile for role {role}")
                            break
                
                if match_id:
                    print(f"\n=== TOURNAMENT MATCH DETECTED ===")
                    print(f"Match ID: {match_id}")
                    
                    winner_id = None
                    
                    # Bestimme die ID des Gewinners
                    user_profiles = self.game_user_profiles.get(game_id, {})
                    if game.winner.name == game.player1.name and 'player1' in user_profiles:
                        winner_id = user_profiles['player1'].get('id')
                        print(f"Winner is player1 with ID: {winner_id}")
                    elif game.winner.name == game.player2.name and 'player2' in user_profiles:
                        winner_id = user_profiles['player2'].get('id')
                        print(f"Winner is player2 with ID: {winner_id}")
                    else:
                        print(f"Could not determine winner ID!")
                        print(f"Game winner name: {game.winner.name}")
                        print(f"Player1 name: {game.player1.name}")
                        print(f"Player2 name: {game.player2.name}")
                    
                    if winner_id:
                        print(f"Tournament match {match_id} completed. Winner: {winner_id}")
                        # Hier müsste ein Aufruf an das Tournament-Objekt erfolgen
                        # Wir müssen das richtige Tournament-Objekt finden
                        
                        # KORRIGIERTER IMPORT: Importiere active_tournaments aus dem richtigen Modul
                        from .tournament import active_tournaments
                        
                        print(f"\n=== SEARCHING FOR TOURNAMENT ===")
                        print(f"Active tournaments: {list(active_tournaments.keys())}")
                        
                        tournament_found = False
                        for tournament_id, tournament in active_tournaments.items():
                            print(f"Checking tournament {tournament_id}")
                            print(f"Tournament matches: {list(tournament.matches.keys())}")
                            
                            if match_id in tournament.matches:
                                print(f"Found match {match_id} in tournament {tournament_id}")
                                tournament_found = True
                                try:
                                    print(f"Calling handle_match_result for match {match_id} with winner {winner_id}")
                                    await tournament.handle_match_result(match_id, winner_id)
                                    print(f"handle_match_result completed successfully")
                                except Exception as e:
                                    print(f"Error in handle_match_result: {e}")
                                break
                        
                        if not tournament_found:
                            print(f"No tournament found containing match {match_id}!")
                    else:
                        print(f"No winner_id found, cannot update tournament!")
                else:
                    print(f"This is not a tournament match (no tournament_match_id found)")
            
            # Markiere, dass der Gewinner verarbeitet wurde
            winner_processed = True
        
            # Sende den aktuellen Spielstatus an alle verbundenen Clients
            for ws in self.game_websockets[game_id]:
                try:
                    # Debug: Zeige den Spielstatus, der an das Frontend gesendet wird
                    if not game.game_active and game.winner:
                        print(f"Sending final game state to client")
                    
                    await ws.send_json(game_state)
                except Exception as e:
                    print(f"Error sending game state: {e}")
                    logger.error(f"Error sending game state: {e}")
                    if ws in self.game_websockets[game_id]:
                        self.game_websockets[game_id].remove(ws)
            
            # Wenn das Spiel beendet ist und wir den Gewinner bereits verarbeitet haben,
            # warten wir noch 10 Sekunden (länger als vorher), damit der Winning Screen angezeigt werden kann
            if not game.game_active and winner_processed:
                print(f"Game {game_id} completed, waiting 10 seconds before exiting game loop...")
                await asyncio.sleep(10)  # Warte 10 Sekunden
                print(f"Exiting game loop for game {game_id}")
                break
            
            await asyncio.sleep(self.UPDATE_RATE)

    async def send_game_stats(self, game_id: str, game: PongGame):
        """Sendet die Spielstatistiken an die Django-API"""
        try:
            print(f"Versuche Spielstatistiken zu senden für Spiel {game_id}")
            
            user_profiles = self.game_user_profiles.get(game_id, {})
            print(f"Gefundene Benutzerprofile: {user_profiles}")
            
            player1_profile = user_profiles.get("player1")
            player2_profile = user_profiles.get("player2")
            
            if not player1_profile or not player2_profile:
                print(f"Fehlende Benutzerprofile für Spiel {game_id}, überspringe Statistiksendung")
                return
                
            winner_id = None
            if game.winner:
                if game.winner.name == game.player1.name:
                    winner_id = player1_profile.get("id")
                else:
                    winner_id = player2_profile.get("id")
            
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
            
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, self._send_stats_http, api_data)
                    
        except Exception as e:
            print(f"FEHLER beim Senden der Spielstatistiken an API: {str(e)}")
    
    def _send_stats_http(self, data):
        """Sendet HTTP-Anfrage in einem separaten Thread"""
        try:
            data_json = json.dumps(data).encode('utf-8')
            req = urllib.request.Request(
                self.API_URL,
                data=data_json,
                headers={'Content-Type': 'application/json'}
            )
            with urllib.request.urlopen(req) as response:
                response_data = response.read().decode('utf-8')
                print(f"API-Antwort: {response.status} {response_data}")
        except urllib.error.HTTPError as e:
            print(f"HTTP-Fehler: {e.code} {e.reason}")
        except urllib.error.URLError as e:
            print(f"URL-Fehler: {e.reason}")
        except Exception as e:
            print(f"Unerwarteter Fehler: {str(e)}")

    # Weitere Log-Ausgaben, etc.
    # logger.info("Application starting with OpenTelemetry logging enabled")
    # logger.debug("This is a debug message")
    # logger.info("Application starting up...")
    # logger.warning("This is a warning message")
    # logger.error("This is an error message")

    async def handle_ready(self, websocket: WebSocket, data: dict):
        """Verarbeitet das Ready-Signal eines Spielers"""
        player_role = data.get('player_role')
        user_profile = data.get('userProfile')
        
        # Debug-Ausgabe
        print(f"=== Ready Signal ===")
        print(f"Game ID: {self.game_id}")
        print(f"Player Role: {player_role}")
        print(f"User Profile: {user_profile}")
        
        if not player_role:
            print("No player role provided")
            return
        
        # Setze den Spieler als bereit
        if player_role == 'player1':
            self.player1_ready = True
            # Wenn ein Benutzerprofil vorhanden ist, setze den Namen
            if user_profile:
                # Bevorzuge tournament_name falls vorhanden
                self.player1_name = user_profile.get('tournament_name', user_profile.get('username', 'Player 1'))
                print(f"Set player1 name to: {self.player1_name}")
        elif player_role == 'player2':
            self.player2_ready = True
            # Wenn ein Benutzerprofil vorhanden ist, setze den Namen
            if user_profile:
                # Bevorzuge tournament_name falls vorhanden
                self.player2_name = user_profile.get('tournament_name', user_profile.get('username', 'Player 2'))
                print(f"Set player2 name to: {self.player2_name}")
        
        # Wenn beide Spieler bereit sind, starte das Spiel
        if self.player1_ready and self.player2_ready:
            await self.start_game()
