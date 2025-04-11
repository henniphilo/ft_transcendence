from fastapi import WebSocket
import json
import uuid
import asyncio
from settings import GameSettings
from models.player import Player, PlayerType, Controls
from tournament_manager import TournamentManager
from game_server import GameServer



class Menu:
    def __init__(self):
        self.game_settings = GameSettings()
        self.current_menu_stack = []
        self.current_game_settings = None
        self.is_tournament = False
        self.searching_players = {}  # {websocket: player_name}
        self.matchmaking_task = None
        self.tournament_queue = []  # list of {"websocket": ..., "player": Player}
        self.tournament_task = None
        self.tournament_manager = None
        self.game_server = GameServer()

        # Hauptmenü
        self.menu_items = [
            {"id": "play_game", "text": "Play Pong"},
            {"id": "play_tournament", "text": "Play Tournament"},
            {"id": "leaderboard", "text": "Leaderboard"}
        ]

        # Spielmodus-Menü
        self.play_mode_items = [
            {"id": "local", "text": "Play Local"},
            {"id": "ai", "text": "Play vs AI"},
            {"id": "online", "text": "Play Online"},
            {"id": "back", "text": "Back"}
        ]

        # AI-Schwierigkeitsgrad
        self.ai_difficulty_items = [
            {"id": "easy", "text": "Easy"},
            {"id": "medium", "text": "Medium"},
            {"id": "impossible", "text": "Hard"},
            {"id": "back", "text": "Back"}
        ]

        # Turnier-Spieleranzahl
        self.tournament_size_items = [
            {"id": "4_players", "text": "4 Players"},
            {"id": "6_players", "text": "6 Players"},
            {"id": "8_players", "text": "8 Players"},
            {"id": "back", "text": "Back"}
        ]

        # Neues Online-Modus-Menü
        self.online_mode_items = [
            {"id": "host", "text": "Host Game"},
            {"id": "join", "text": "Join Game"},
            {"id": "back", "text": "Back"}
        ]

    async def start_matchmaking_loop(self):
        print("Starting matchmaking loop")
        while True:
            print(f"Current searching players: {[name for name in self.searching_players.values()]}")
            await self.match_players()
            await asyncio.sleep(1)

    async def handle_menu_selection(self, websocket: WebSocket, selection: str, userProfile=None):
        print(f"\n=== Menu Selection ===")
        print(f"Selection: {selection}")
        print(f"Current Menu Stack: {self.current_menu_stack}")

        if selection == "main":
            self.is_tournament = False
            self.current_menu_stack = []
            return {"action": "show_main_menu", "menu_items": self.menu_items}

        elif selection == "play_game":
            self.is_tournament = False
            self.current_menu_stack.append("main")
            return {"action": "show_submenu", "menu_items": self.play_mode_items}

        elif selection == "play_tournament":
            self.is_tournament = True
            self.current_menu_stack.append("main")

            tournament_name = "Unknown"
            if userProfile and "tournament_name" in userProfile:
                tournament_name = userProfile["tournament_name"]

            print(f"Adding tournament player: {tournament_name}")

            player = Player(
                id=str(uuid.uuid4()),
                name=tournament_name,
                player_type=PlayerType.HUMAN,
                controls=Controls.ARROWS
            )
            
            if userProfile:
                player.user_profile = userProfile

            self.tournament_queue.append({
                "websocket": websocket,
                "player": player
            })

            if not self.tournament_task or self.tournament_task.done():
                self.tournament_task = asyncio.create_task(self.start_tournament())

            await self.broadcast_tournament_queue_update()
            return None  # da die Nachricht schon direkt gesendet wurde


        elif selection == "leaderboard":
            return {
                "action": "show_leaderboard",
                "type": "leaderboard",
                "back_action": "show_main_menu",
                "back_menu_items": self.menu_items
            }

        elif selection == "local":
            game_settings = self.game_settings.get_settings()
            game_settings.update({"mode": selection, "is_tournament": self.is_tournament})
            self.current_game_settings = game_settings

            return {
                "action": "game_found",
                "game_id": str(uuid.uuid4()),
                "settings": game_settings,
                "player1": "Player 1",
                "player2": "Player 2",
                "playerRole": "both"
            }

        elif selection == "online":
            player_name = "Player"
            self.searching_players[websocket] = player_name

            if not self.matchmaking_task or self.matchmaking_task.done():
                self.matchmaking_task = asyncio.create_task(self.start_matchmaking_loop())

            return {
                "action": "searching_opponent",
                "message": "Searching for opponent..."
            }

        elif selection == "cancel_search":
            if websocket in self.searching_players:
                del self.searching_players[websocket]
            self.tournament_queue = [
                entry for entry in self.tournament_queue if entry["websocket"] != websocket
            ]

            if not self.searching_players and self.matchmaking_task:
                self.matchmaking_task.cancel()
                self.matchmaking_task = None

            return {"action": "show_main_menu", "menu_items": self.menu_items}

        elif selection in ["host", "join"]:
            game_settings = self.game_settings.get_settings()
            game_settings.update({
                "mode": "online",
                "online_type": selection,
                "is_tournament": self.is_tournament
            })
            self.current_game_settings = game_settings

            if self.is_tournament:
                self.current_menu_stack.append("online_mode")
                return {"action": "show_submenu", "menu_items": self.tournament_size_items}
            return {"action": "start_game", "settings": game_settings}

        elif selection == "ai":
            self.current_menu_stack.append("play_mode")
            return {"action": "show_submenu", "menu_items": self.ai_difficulty_items}

        elif selection in ["easy", "medium", "impossible"]:
            game_settings = self.game_settings.get_settings()
            game_settings.update({
                "mode": "ai",
                "difficulty": selection,
                "is_tournament": self.is_tournament
            })
            self.current_game_settings = game_settings

            return {
                "action": "game_found",
                "game_id": str(uuid.uuid4()),
                "settings": game_settings,
                "player1": "Player 1",
                "player2": "AI Player",
                "playerRole": "player1"
            }

        elif selection in ["4_players", "6_players", "8_players"]:
            num_players = int(selection.split("_")[0])
            return {
                "action": "show_player_names",
                "num_players": num_players,
                "tournament": True
            }

        elif selection == "back":
            if self.current_menu_stack:
                last_menu = self.current_menu_stack.pop()
                if last_menu == "main":
                    self.is_tournament = False
                    return {"action": "show_main_menu", "menu_items": self.menu_items}
                elif last_menu == "play_mode":
                    return {"action": "show_submenu", "menu_items": self.play_mode_items}
            self.is_tournament = False
            return {"action": "show_main_menu", "menu_items": self.menu_items}


    async def update_settings(self, settings_data):
        print(f"Menu update_settings called with: {settings_data}")
        return await self.game_settings.update_settings(settings_data)

    async def get_menu_items(self):
        return self.menu_items

    def get_current_settings(self):
        if self.current_game_settings is not None:
            print(f"Using current game settings: {self.current_game_settings}")
            return self.current_game_settings
        return self.game_settings.get_settings()

    async def match_players(self):
        print(f"Checking for matches... Current players: {len(self.searching_players)}")

        if len(self.searching_players) >= 2:
            player1_ws, player1_name = list(self.searching_players.items())[0]
            player2_ws, player2_name = list(self.searching_players.items())[1]

            print(f"Found match: {player1_name} vs {player2_name}")

            del self.searching_players[player1_ws]
            del self.searching_players[player2_ws]

            game_id = str(uuid.uuid4())
            game_settings = self.game_settings.get_settings()
            game_settings.update({
                "mode": "online",
                "online_type": "host",
                "player1_name": player1_name,
                "player2_name": player2_name,
                "game_id": game_id
            })

            self.current_game_settings = game_settings.copy()

            try:
                match_data = {
                    "action": "game_found",
                    "game_id": game_id,
                    "settings": game_settings,
                    "player1": player1_name,
                    "player2": player2_name,
                }

                await player1_ws.send_json({**match_data, "playerRole": "player1"})
                await player2_ws.send_json({**match_data, "playerRole": "player2"})

                print(f"Game {game_id} created and both players notified")
            except Exception as e:
                print(f"Error notifying players: {e}")
                self.searching_players[player1_ws] = player1_name
                self.searching_players[player2_ws] = player2_name

    async def broadcast_tournament_queue_update(self):
        names = [entry["player"].name for entry in self.tournament_queue]
        message = f"Waiting for more players to join the tournament: {', '.join(names)}"
        
        for entry in self.tournament_queue:
            try:
                await entry["websocket"].send_json({
                    "action": "searching_opponent",
                    "message": message
                })
            except Exception as e:
                print(f"Fehler beim Senden an {entry['player'].name}: {e}")


    async def start_tournament(self):
        print("Starting tournament check loop")
        while True:
            print(f"Tournament Queue: {len(self.tournament_queue)} Spieler")
            if len(self.tournament_queue) == 4:
                print("Tournament is ready to show grid with 4 players")
                entries = [self.tournament_queue.pop(0) for _ in range(4)]

                # Debug-Ausgabe der User-Profile
                for i, entry in enumerate(entries):
                    player = entry["player"]
                    print(f"Player {i+1}: {player.name}")
                    if hasattr(player, 'user_profile') and player.user_profile:
                        print(f"  User Profile: {player.user_profile}")
                    else:
                        print("  No user profile found!")

                # Speichere Entries im Manager, aber starte noch nicht
                self.tournament_manager = TournamentManager(entries)

                # Erstelle Player-Infos mit Tournament-Namen
                player_infos = []
                for e in entries:
                    player = e["player"]
                    info = {"tournament_name": player.name}
                    
                    # Füge das vollständige User-Profil hinzu, falls vorhanden
                    if hasattr(player, 'user_profile') and player.user_profile:
                        info["user_profile"] = player.user_profile
                        # Für einfacheren Zugriff auch den Username direkt hinzufügen
                        if "username" in player.user_profile:
                            info["username"] = player.user_profile["username"]
                    
                    player_infos.append(info)
                print(f"Player Infos:___________ {player_infos}")


                for entry in entries:
                    try:
                        await entry["websocket"].send_json({
                            "action": "tournament_ready",
                            "players": player_infos,
                            "round": 1,
                            "total_rounds": 2
                        })
                    except Exception as e:
                        print(f"Fehler beim Senden an Spieler: {e}")

                break  # Brich die Schleife ab, jetzt warten wir auf Button "Start Tournament"

            await asyncio.sleep(1)
            

    async def start_tournament_matches(self):
        if not self.tournament_manager:
            print("❌ Kein TournamentManager vorhanden.")
            return

        print("⏯️ Starte Matches aus dem gespeicherten TournamentManager")
        matchups = self.tournament_manager.create_matchups()

        for p1_entry, p2_entry in matchups:
            game_id = str(uuid.uuid4())
            settings = self.game_settings.get_settings()
            
            # Extrahiere die User-Profile, falls vorhanden
            p1_profile = getattr(p1_entry["player"], "user_profile", {}) or {}
            p2_profile = getattr(p2_entry["player"], "user_profile", {}) or {}
            
            settings.update({
                "mode": "online",
                "is_tournament": True,
                "game_id": game_id,
                "player1_name": p1_entry["player"].name,
                "player2_name": p2_entry["player"].name,
                "tournament_round": self.tournament_manager.current_round,
                "tournament_totalRounds": self.tournament_manager.total_rounds,
                "tournament_players": [
                    {"tournament_name": entry["player"].name, 
                     "username": entry["player"].user_profile.get("username", entry["player"].name) if entry["player"].user_profile else entry["player"].name}
                    for entry in self.tournament_manager.players
                ],
                "player1_profile": p1_profile,
                "player2_profile": p2_profile
            })
            print(f"Settings in startmatches tournament: {settings}")

            # Übergib die Profile an den GameServer
            self.game_server.game_user_profiles[game_id] = {
                "player1": {
                    "id": p1_profile.get("id"),
                    "username": p1_profile.get("username", p1_entry["player"].name),
                    "user_profile": p1_profile
                },
                "player2": {
                    "id": p2_profile.get("id"),
                    "username": p2_profile.get("username", p2_entry["player"].name),
                    "user_profile": p2_profile
                },
            }
            print(f"Game Server User Profiles: {self.game_server.game_user_profiles}")
            print(f"Player 1: user_profile: {p1_profile}")
            print(f"Player 2: user_profile: {p2_profile}")

            # Verbinde TournamentManager mit dem GameServer
            self.game_server.tournament_manager = self.tournament_manager

            try:
                await p1_entry["websocket"].send_json({
                    "action": "game_found",
                    "game_id": game_id,
                    "settings": settings,
                    "player1": p1_entry["player"].name,
                    "player2": p2_entry["player"].name,
                    "playerRole": "player1"
                })
                await p2_entry["websocket"].send_json({
                    "action": "game_found",
                    "game_id": game_id,
                    "settings": settings,
                    "player1": p1_entry["player"].name,
                    "player2": p2_entry["player"].name,
                    "playerRole": "player2"
                })
                print(f"🎮 Match gestartet: {p1_entry['player'].name} vs {p2_entry['player'].name}")
            except Exception as e:
                print(f"❌ Fehler beim Match-Start: {e}")



