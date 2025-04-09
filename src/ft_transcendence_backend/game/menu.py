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
                print("Tournament is ready to start with 4 players")
                entries = [self.tournament_queue.pop(0) for _ in range(4)]

                # Sende "tournament_ready" an alle
                player_infos = [{"tournament_name": e["player"].name} for e in entries]
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

                # Initialisiere den TournamentManager
                self.tournament_manager = TournamentManager(entries)
                matchups = self.tournament_manager.create_matchups()

                # Starte für jedes Match ein Spiel
                for p1_entry, p2_entry in matchups:
                    game_id = str(uuid.uuid4())
                    settings = self.game_settings.get_settings()
                    settings.update({
                        "mode": "online",
                        "is_tournament": True,
                        "game_id": game_id,
                        "player1_name": p1_entry["player"].name,
                        "player2_name": p2_entry["player"].name,
                    })

                    # Übergib die Profile an den GameServer
                    self.game_server.game_user_profiles[game_id] = {
                        "player1": {"id": None, "username": p1_entry["player"].name},
                        "player2": {"id": None, "username": p2_entry["player"].name},
                    }

                    # Verbinde TournamentManager mit dem GameServer
                    self.game_server.tournament_manager = self.tournament_manager

                    # Benachrichtige beide Spieler
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
                        print(f"⏯️ Match gestartet: {p1_entry['player'].name} vs {p2_entry['player'].name}")
                    except Exception as e:
                        print(f"Fehler beim Match-Start: {e}")

            await asyncio.sleep(1)

