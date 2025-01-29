from fastapi import FastAPI, WebSocket
import json
from settings import GameSettings

class Menu:
    def __init__(self):
        self.game_settings = GameSettings()
        self.current_menu_stack = []
        self.current_game_settings = None
        self.is_tournament = False  # Neuer Flag für Tournament-Modus
        
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
            return {"action": "show_leaderboard"}
        
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
            self.current_menu_stack.append("play_mode")
            return {"action": "show_submenu", "menu_items": self.online_mode_items}
        
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