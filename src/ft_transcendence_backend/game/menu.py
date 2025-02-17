from fastapi import FastAPI, WebSocket
import json
from settings import GameSettings
import uuid
import asyncio

class Menu:
    def __init__(self):
        self.game_settings = GameSettings()
        self.current_menu_stack = []
        self.current_game_settings = None
        self.is_tournament = False  # Neuer Flag für Tournament-Modus
        self.searching_players = {}  # {websocket: player_name}
        self.matchmaking_task = None
        
        # Hauptmenü
        self.menu_items = [
            {"id": "play_game", "text": "Play Game"},
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
            {"id": "impossible", "text": "Impossible"},
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
        """Startet eine kontinuierliche Überprüfung nach möglichen Matches"""
        while True:
            await self.match_players()
            await asyncio.sleep(1)  # Überprüfe jede Sekunde

    async def handle_menu_selection(self, websocket: WebSocket, selection: str):
        print(f"\n=== Menu Selection ===")
        print(f"Selection: {selection}")
        print(f"Current Menu Stack: {self.current_menu_stack}")
        
        if selection == "play_game":
            self.is_tournament = False
            self.current_menu_stack.append("main")
            return {"action": "show_submenu", "menu_items": self.play_mode_items}
        
        elif selection == "play_tournament":
            self.is_tournament = True
            self.current_menu_stack.append("main")
            return {"action": "show_submenu", "menu_items": self.play_mode_items}
        
        elif selection == "leaderboard":
            return {
                "action": "show_leaderboard",
                "type": "leaderboard",
                "back_action": "show_main_menu",
                "back_menu_items": self.menu_items
            }
        
        elif selection == "local":
            game_settings = self.game_settings.get_settings()
            game_settings.update({
                "mode": selection,
                "is_tournament": self.is_tournament
            })
            self.current_game_settings = game_settings
            
            if self.is_tournament:
                self.current_menu_stack.append("mode")
                return {"action": "show_submenu", "menu_items": self.tournament_size_items}
            return {"action": "start_game", "settings": game_settings}
        
        elif selection == "online":
            # Füge den Spieler zur Suchliste hinzu
            player_name = "Player"  # Hier später den echten Spielernamen verwenden
            self.searching_players[websocket] = player_name
            
            # Starte Matchmaking-Loop, falls noch nicht gestartet
            if not self.matchmaking_task or self.matchmaking_task.done():
                self.matchmaking_task = asyncio.create_task(self.start_matchmaking_loop())
            
            return {
                "action": "searching_opponent",
                "message": "Searching for opponent..."
            }
        
        elif selection == "cancel_search":
            if websocket in self.searching_players:
                del self.searching_players[websocket]
            
            # Wenn keine Spieler mehr suchen, stoppe den Matchmaking-Loop
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
            
            if self.is_tournament:
                self.current_menu_stack.append("difficulty")
                return {"action": "show_submenu", "menu_items": self.tournament_size_items}
            return {"action": "start_game", "settings": game_settings}
        
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
                    self.is_tournament = False  # Reset tournament flag when going back to main
                    return {"action": "show_main_menu", "menu_items": self.menu_items}
                elif last_menu == "play_mode":
                    return {"action": "show_submenu", "menu_items": self.play_mode_items}
                elif last_menu in ["mode", "difficulty"]:
                    return {"action": "show_submenu", "menu_items": self.play_mode_items}
            self.is_tournament = False  # Reset tournament flag when going back to main
            return {"action": "show_main_menu", "menu_items": self.menu_items}

    async def update_settings(self, settings_data):
        print(f"Menu update_settings called with: {settings_data}")  # Debug
        return await self.game_settings.update_settings(settings_data)

    async def get_menu_items(self):
        return self.menu_items 

    def display_settings(self, settings):
        # This method is not provided in the original file or the code block
        # It's assumed to exist as it's called in the code block
        # Implementation of display_settings method
        pass 

    def get_current_settings(self):
        # Verwende die gespeicherten Spiel-Settings, falls vorhanden
        if self.current_game_settings is not None:
            print(f"Using current game settings: {self.current_game_settings}")
            return self.current_game_settings
        # Ansonsten Standard-Settings
        return self.game_settings.get_settings() 

    async def match_players(self):
        """Versucht, zwei suchende Spieler zu matchen"""
        print(f"Checking for matches... Current players: {len(self.searching_players)}")  # Debug print
        
        if len(self.searching_players) >= 2:
            # Nimm die ersten zwei Spieler
            player1_ws, player1_name = list(self.searching_players.items())[0]
            player2_ws, player2_name = list(self.searching_players.items())[1]

            print(f"Found match: {player1_name} vs {player2_name}")  # Debug print

            # Entferne sie aus der Suchliste
            del self.searching_players[player1_ws]
            del self.searching_players[player2_ws]

            # Erstelle ein neues Spiel
            game_id = str(uuid.uuid4())
            game_settings = self.game_settings.get_settings()
            game_settings.update({
                "mode": "online",
                "player1_name": player1_name,
                "player2_name": player2_name
            })

            # Informiere beide Spieler mit ihren spezifischen Rollen
            await player1_ws.send_json({
                "action": "game_found",
                "game_id": game_id,
                "settings": game_settings,
                "player1": player1_name,
                "player2": player2_name,
                "playerRole": "player1"  # WASD Controls
            })

            await player2_ws.send_json({
                "action": "game_found",
                "game_id": game_id,
                "settings": game_settings,
                "player1": player1_name,
                "player2": player2_name,
                "playerRole": "player2"  # WASD Controls
            })

            print(f"Game {game_id} created and players notified")  # Debug print 